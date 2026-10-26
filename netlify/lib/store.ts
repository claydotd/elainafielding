import { AsyncLocalStorage } from 'node:async_hooks'
import { createHash } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import { aboutSeed, type AboutBlock } from '../../src/data/about.ts'
import { homepageSeed, type HomepageDocument, type HomepageSlide } from '../../src/data/homepage.ts'
import { worksSeed, type WorkItem } from '../../src/data/works-seed.ts'
import { aboutImageUrls, parseAboutList } from './about.ts'
import { imageUrls, parseHomepageDocument } from './homepage.ts'
import { imageIdFromUrl, parseWorksList } from './works.ts'

const LIST_KEY = 'list'
const HOMEPAGE_KEY = 'homepage'
const ABOUT_KEY = 'about'
const SEED_VERSION_KEY = 'seed-version'
const SEED_VERSION = createHash('sha256').update(JSON.stringify(worksSeed)).update(JSON.stringify(homepageSeed)).digest('hex')

const requestContext = new AsyncLocalStorage<Request>()
let seeding: Promise<void> | null = null

export function runWithRequest<T>(req: Request, run: () => Promise<T>) {
  return requestContext.run(req, run)
}

function worksStore() {
  return getStore('works', { consistency: 'strong' })
}

function imageStore() {
  return getStore('work-images', { consistency: 'strong' })
}

export async function loadWorks() {
  await ensureSeed()
  const stored = await worksStore().get(LIST_KEY, { type: 'json' })
  if (stored == null) return worksSeed
  const works = parseWorksList(stored)
  if (!works) throw new Error('Stored works could not be read.')
  return works
}

export async function saveWorks(works: WorkItem[]) {
  await worksStore().setJSON(LIST_KEY, works)
}

export async function loadHomepage(): Promise<HomepageDocument> {
  await ensureSeed()
  const stored = await worksStore().get(HOMEPAGE_KEY, { type: 'json' })
  if (stored == null) return { slides: homepageSeed, showCaptions: false }
  const homepage = parseHomepageDocument(stored)
  if (!homepage) throw new Error('Stored homepage could not be read.')
  return homepage
}

export async function saveHomepage(homepage: HomepageDocument) {
  await worksStore().setJSON(HOMEPAGE_KEY, homepage)
}

export async function loadAbout() {
  await ensureSeed()
  const stored = await worksStore().get(ABOUT_KEY, { type: 'json' })
  if (stored == null) return aboutSeed
  const blocks = parseAboutList(stored)
  if (!blocks) throw new Error('Stored about page could not be read.')
  return blocks
}

export async function saveAbout(blocks: AboutBlock[]) {
  await worksStore().setJSON(ABOUT_KEY, blocks)
}

export function contentImageUrls(works: WorkItem[], slides: HomepageSlide[], about: AboutBlock[]) {
  return [...imageUrls(works, slides), ...aboutImageUrls(about)]
}

export async function saveImage(id: string, bytes: ArrayBuffer, contentType: string) {
  await imageStore().set(id, bytes, { metadata: { contentType } })
}

export async function readImage(id: string) {
  const result = await imageStore().getWithMetadata(id, { type: 'arrayBuffer' })
  if (!result?.data) return null
  const contentType = result.metadata.contentType
  return {
    bytes: result.data,
    contentType: typeof contentType === 'string' ? contentType : 'application/octet-stream',
  }
}

function ensureSeed() {
  if (seeding) return seeding
  seeding = applySeed().then((applied) => {
    if (!applied) seeding = null
  }).catch((error) => {
    seeding = null
    throw error
  })
  return seeding
}

async function applySeed() {
  const store = worksStore()
  const version = await store.get(SEED_VERSION_KEY, { type: 'text' })
  if (version === SEED_VERSION) return true

  const storedWorks = await store.get(LIST_KEY, { type: 'json' })
  const hasWorks = storedWorks != null
  const local = isLocalDev()
  // Deploy previews share this store with the live site, so only the live host may replace it.
  if (local ? hasWorks : !isProductionRequest()) return false

  const previousWorks = parseWorksList(storedWorks) ?? []
  const storedSlides = await store.get(HOMEPAGE_KEY, { type: 'json' })
  const previousSlides = parseHomepageDocument(storedSlides)?.slides ?? []
  const storedAbout = await store.get(ABOUT_KEY, { type: 'json' })
  const previousAbout = parseAboutList(storedAbout) ?? []
  await saveWorks(worksSeed)
  await saveHomepage({ slides: homepageSeed, showCaptions: false })
  await deleteUnusedImages(
    contentImageUrls(previousWorks, previousSlides, previousAbout),
    contentImageUrls(worksSeed, homepageSeed, previousAbout),
  )
  await store.set(SEED_VERSION_KEY, SEED_VERSION)
  console.log(local ? 'Seeded local works and homepage.' : 'Seeded live works and homepage.')
  return true
}

function isLocalDev() {
  if (process.env.NETLIFY_DEV === 'true') return true
  const host = requestHost()
  return host === 'localhost' || host === '127.0.0.1'
}

function isProductionRequest() {
  const host = requestHost()
  if (!host || isLocalDev()) return false
  return productionHosts().has(host)
}

function requestHost() {
  const req = requestContext.getStore()
  if (!req) return ''
  const forwarded = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const raw = (forwarded ?? new URL(req.url).host).split(',')[0]?.trim().toLowerCase() ?? ''
  return raw.replace(/:\d+$/, '')
}

function productionHosts() {
  const hosts = new Set<string>()
  const site = process.env.SITE_NAME?.trim().toLowerCase()
  if (site) hosts.add(`${site}.netlify.app`)
  const url = process.env.URL
  if (!url) return hosts
  try {
    const host = new URL(url).hostname.toLowerCase()
    hosts.add(host)
    hosts.add(host.startsWith('www.') ? host.slice(4) : `www.${host}`)
  } catch {
    // A malformed site URL cannot identify the live host.
  }
  return hosts
}

export async function deleteUnusedImages(previousUrls: string[], nextUrls: string[]) {
  const keep = new Set<string>()
  for (const url of nextUrls) {
    const id = imageIdFromUrl(url)
    if (id) keep.add(id)
  }
  const remove = new Set<string>()
  for (const url of previousUrls) {
    const id = imageIdFromUrl(url)
    if (id && !keep.has(id)) remove.add(id)
  }
  await Promise.all([...remove].map(async (id) => {
    try {
      await imageStore().delete(id)
    } catch {
      // A missing blob should not block saving the work.
    }
  }))
}
