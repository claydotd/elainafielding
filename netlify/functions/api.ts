import type { Config } from '@netlify/functions'
import type { WorkItem } from '../../src/data/works-seed.ts'
import { clearedCookie, createSession, hasSession, passwordsMatch, requireAdmin, sessionCookie } from '../lib/auth.ts'
import { parseAboutInput } from '../lib/about.ts'
import { parseHomepageInput, retargetSlides } from '../lib/homepage.ts'
import { json, readJson, routePath } from '../lib/http.ts'
import { parseImageSizeHeaders, probeImage } from '../lib/probe-image.ts'
import { backfillImageSizes, contentImageUrls, deleteUnusedImages, loadAbout, loadHomepage, loadImageSizes, loadWorks, readImage, runWithRequest, saveAbout, saveHomepage, saveImage, saveWorks } from '../lib/store.ts'
import { insertionIndex, parseWorkInput } from '../lib/works.ts'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const IMAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function handler(req: Request) {
  return runWithRequest(req, () => route(req))
}

async function route(req: Request) {
  const path = routePath(req)
  try {
    if (path === '/api/works' && req.method === 'GET') return listWorks()
    if (path === '/api/homepage' && req.method === 'GET') return listHomepage()
    if (path === '/api/about' && req.method === 'GET') return listAbout()
    if (path === '/api/image-sizes' && req.method === 'GET') return listImageSizes()
    if (path === '/api/admin/homepage' && req.method === 'PUT') return updateHomepage(req)
    if (path === '/api/admin/about' && req.method === 'PUT') return updateAbout(req)
    if (path === '/api/admin/login' && req.method === 'POST') return login(req)
    if (path === '/api/admin/logout' && req.method === 'POST') return logout(req)
    if (path === '/api/admin/session' && req.method === 'GET') return session(req)
    if (path === '/api/admin/uploads' && req.method === 'POST') return upload(req)
    if (path === '/api/admin/image-sizes/backfill' && req.method === 'POST') return backfillSizes(req)
    if (path === '/api/admin/works' && req.method === 'POST') return createWork(req)
    if (path === '/api/admin/works-order' && req.method === 'PUT') return reorderWorks(req)

    const image = path.match(/^\/api\/images\/([^/]+)$/)
    if (image && req.method === 'GET') return serveImage(image[1])

    const work = path.match(/^\/api\/admin\/works\/([^/]+)$/)
    if (work && req.method === 'PUT') return updateWork(req, decodeURIComponent(work[1]))
    if (work && req.method === 'DELETE') return deleteWork(req, decodeURIComponent(work[1]))

    return json({ error: 'Not found.' }, 404)
  } catch (error) {
    console.error(error)
    return json({ error: 'Something went wrong.' }, 500)
  }
}

export const config: Config = {
  path: '/api/*',
}

async function listWorks() {
  const works = await loadWorks()
  return json({ works }, 200, { 'cache-control': 'no-store' })
}

async function listHomepage() {
  const homepage = await loadHomepage()
  return json(homepage, 200, { 'cache-control': 'no-store' })
}

async function listAbout() {
  const blocks = await loadAbout()
  return json({ blocks }, 200, { 'cache-control': 'no-store' })
}

async function listImageSizes() {
  const sizes = await loadImageSizes()
  return json({ sizes }, 200, { 'cache-control': 'no-store' })
}

async function backfillSizes(req: Request) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  const result = await backfillImageSizes()
  return json({
    total: result.total,
    updated: result.updated,
    skipped: result.skipped,
    failed: result.failed,
    sizes: result.sizes,
  })
}

async function updateHomepage(req: Request) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  const works = await loadWorks()
  const parsed = parseHomepageInput(await readJson(req), new Set(works.map((work) => work.slug)))
  if ('error' in parsed) return json(parsed, 400)
  const previous = await loadHomepage()
  const about = await loadAbout()
  await saveHomepage(parsed)
  await deleteUnusedImages(contentImageUrls(works, previous.slides, about), contentImageUrls(works, parsed.slides, about))
  return json(parsed)
}

async function updateAbout(req: Request) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  const parsed = parseAboutInput(await readJson(req))
  if ('error' in parsed) return json(parsed, 400)
  const works = await loadWorks()
  const homepage = await loadHomepage()
  const previous = await loadAbout()
  await saveAbout(parsed)
  await deleteUnusedImages(contentImageUrls(works, homepage.slides, previous), contentImageUrls(works, homepage.slides, parsed))
  return json({ blocks: parsed })
}

async function login(req: Request) {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return json({ error: 'Admin password is not configured.' }, 500)
  const body = await readJson(req)
  const submitted = body && typeof body === 'object' ? (body as { password?: unknown }).password : null
  if (typeof submitted !== 'string' || submitted.length === 0 || submitted.length > 200 || !passwordsMatch(submitted, password)) {
    return json({ error: 'That password is not correct.' }, 401)
  }
  const token = await createSession()
  if (!token) return json({ error: 'Admin session secret is not configured.' }, 500)
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(token, secure(req)) })
}

async function logout(req: Request) {
  return json({ ok: true }, 200, { 'set-cookie': clearedCookie(secure(req)) })
}

async function session(req: Request) {
  if (!(await hasSession(req))) return json({ error: 'Log in to continue.' }, 401)
  return json({ ok: true })
}

async function upload(req: Request) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  const contentType = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (contentType !== 'image/webp' && contentType !== 'image/jpeg') {
    return json({ error: 'Upload a WebP or JPEG image.' }, 415)
  }
  const bytes = await req.arrayBuffer()
  if (bytes.byteLength === 0) return json({ error: 'This image is empty.' }, 400)
  if (bytes.byteLength > MAX_IMAGE_BYTES) return json({ error: 'This image is over the 4 MB upload limit.' }, 413)
  const size = probeImage(bytes) ?? parseImageSizeHeaders(req)
  if (!size) return json({ error: 'Could not read this image’s dimensions.' }, 400)
  const id = crypto.randomUUID()
  await saveImage(id, bytes, contentType, size)
  return json({ url: `/api/images/${id}`, width: size.width, height: size.height })
}

async function createWork(req: Request) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  const parsed = parseWorkInput(await readJson(req))
  if ('error' in parsed) return json(parsed, 400)
  const works = await loadWorks()
  if (works.some((work) => work.slug === parsed.slug)) return json({ error: 'A work with this slug already exists.' }, 409)
  const index = insertionIndex(works, parsed.year)
  const next = works.slice()
  next.splice(index, 0, parsed)
  await saveWorks(next)
  return json({ work: parsed }, 201)
}

async function updateWork(req: Request, slug: string) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  const parsed = parseWorkInput(await readJson(req))
  if ('error' in parsed) return json(parsed, 400)
  const works = await loadWorks()
  const index = works.findIndex((work) => work.slug === slug)
  if (index === -1) return json({ error: 'This work could not be found.' }, 404)
  if (parsed.slug !== slug && works.some((work) => work.slug === parsed.slug)) {
    return json({ error: 'A work with this slug already exists.' }, 409)
  }
  const homepage = await loadHomepage()
  const about = await loadAbout()
  const nextSlides = retargetSlides(homepage.slides, slug, parsed.slug)
  const next = works.slice()
  next[index] = parsed
  await saveWorks(next)
  if (nextSlides !== homepage.slides) await saveHomepage({ ...homepage, slides: nextSlides })
  await deleteUnusedImages(contentImageUrls(works, homepage.slides, about), contentImageUrls(next, nextSlides, about))
  return json({ work: parsed })
}

async function deleteWork(req: Request, slug: string) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  const works = await loadWorks()
  const existing = works.find((work) => work.slug === slug)
  if (!existing) return json({ error: 'This work could not be found.' }, 404)
  const homepage = await loadHomepage()
  const about = await loadAbout()
  const nextSlides = homepage.slides.filter((slide) => slide.slug !== slug)
  const next = works.filter((work) => work.slug !== slug)
  await saveWorks(next)
  if (nextSlides.length !== homepage.slides.length) await saveHomepage({ ...homepage, slides: nextSlides })
  await deleteUnusedImages(contentImageUrls(works, homepage.slides, about), contentImageUrls(next, nextSlides, about))
  return json({ ok: true })
}

async function reorderWorks(req: Request) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  const body = await readJson(req)
  const slugs = body && typeof body === 'object' ? (body as { slugs?: unknown }).slugs : null
  if (!Array.isArray(slugs) || slugs.some((slug) => typeof slug !== 'string')) {
    return json({ error: 'Send the works in their new order.' }, 400)
  }
  const works = await loadWorks()
  if (slugs.length !== works.length || new Set(slugs).size !== slugs.length) {
    return json({ error: 'The order does not match the saved works.' }, 400)
  }
  const bySlug = new Map(works.map((work) => [work.slug, work]))
  const next: WorkItem[] = []
  for (const slug of slugs) {
    const work = bySlug.get(slug)
    if (!work) return json({ error: 'The order does not match the saved works.' }, 400)
    next.push(work)
  }
  await saveWorks(next)
  return json({ works: next })
}

async function serveImage(id: string) {
  if (!IMAGE_ID.test(id)) return json({ error: 'Image not found.' }, 404)
  const image = await readImage(id)
  if (!image) return json({ error: 'Image not found.' }, 404)
  return new Response(image.bytes, {
    headers: {
      'content-type': image.contentType,
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}

function secure(req: Request) {
  return new URL(req.url).protocol === 'https:'
}
