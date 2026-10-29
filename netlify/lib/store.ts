import { AsyncLocalStorage } from 'node:async_hooks'
import { createHash } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import { aboutSeed, type AboutBlock } from '../../src/data/about.ts'
import { homepageSeed, type HomepageDocument, type HomepageSlide } from '../../src/data/homepage.ts'
import { worksSeed, type WorkItem } from '../../src/data/works-seed.ts'
import { aboutImageUrls, parseAboutList } from './about.ts'
import { imageUrls, parseHomepageDocument } from './homepage.ts'
import { probeImage } from './probe-image.ts'
import { imageIdFromUrl, parseWorksList } from './works.ts'

const LIST_KEY = 'list'
const HOMEPAGE_KEY = 'homepage'
const ABOUT_KEY = 'about'
const IMAGE_SIZES_KEY = 'image-sizes'
const SEED_VERSION_KEY = 'seed-version'
const SEED_VERSION = createHash('sha256').update(JSON.stringify(worksSeed)).update(JSON.stringify(homepageSeed)).digest('hex')

export type ImageSizeMap = Record<string, [number, number]>

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
  const migrated = migrateWorksFromSeed(works)
  if (migrated !== works) await saveWorks(migrated)
  return migrated
}

/**
 * Apply template fields from seed when a stored work is still on the pre-template shape.
 * Prefer the work's own lead/gallery images for scroll-story chapters so uploaded assets stay put.
 */
function migrateWorksFromSeed(works: WorkItem[]) {
  const seedBySlug = new Map(worksSeed.map((work) => [work.slug, work]))
  let changed = false
  const next = works.map((work) => {
    if (work.template) return work
    const seed = seedBySlug.get(work.slug)
    if (!seed?.template) return work
    changed = true
    if (seed.template === 'scroll-story') {
      return {
        ...work,
        template: 'scroll-story' as const,
        ...scrollStoryFromWork(work, seed),
      }
    }
    const migrated: WorkItem = { ...work, template: seed.template }
    if (seed.mastheadText) migrated.mastheadText = seed.mastheadText
    return migrated
  })
  return changed ? next : works
}

function scrollStoryFromWork(work: WorkItem, seed: WorkItem) {
  const frames = [
    work.image,
    ...(work.images ?? []).map((item) => item.image),
  ].filter(Boolean)

  if (frames.length === 0 && seed.scrollSteps?.length) {
    return {
      scrollSteps: seed.scrollSteps,
      blocks: seed.blocks ?? work.blocks,
      scrollClosingImage: null,
    }
  }

  const seedParagraphs = seed.scrollSteps?.[0]?.paragraphs ?? []
  const seedClosing = seed.scrollClosingImage
  const closingBlock = seedClosing?.src
    ? [{
        type: 'image' as const,
        image: seedClosing.src,
        alt: seedClosing.alt || `${work.name}, closing view`,
        caption: '',
        size: 'full' as const,
        align: 'center' as const,
      }]
    : []

  return {
    scrollSteps: frames.map((image, index) => ({
      image,
      alt: `${work.name}, view ${index + 1}`,
      paragraphs: index === 0 ? seedParagraphs : [],
    })),
    blocks: [...(work.blocks ?? []), ...closingBlock],
    scrollClosingImage: null,
  }
}

export async function saveWorks(works: WorkItem[]) {
  await worksStore().setJSON(LIST_KEY, works)
}

export async function loadHomepage(): Promise<HomepageDocument> {
  await ensureSeed()
  const stored = await worksStore().get(HOMEPAGE_KEY, { type: 'json' })
  if (stored == null) return { slides: homepageSeed, showCaptions: false, carouselCrop: 'none' }
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

export async function saveImage(
  id: string,
  bytes: ArrayBuffer,
  contentType: string,
  size?: { width: number; height: number },
) {
  const metadata: Record<string, string> = { contentType }
  if (size) {
    metadata.width = String(size.width)
    metadata.height = String(size.height)
  }
  await imageStore().set(id, bytes, { metadata })
  if (size) await Promise.resolve(registerImageSize(`/api/images/${id}`, size.width, size.height))
}

export async function readImage(id: string) {
  const result = await imageStore().getWithMetadata(id, { type: 'arrayBuffer' })
  if (!result?.data) return null
  const contentType = result.metadata.contentType
  return {
    bytes: result.data,
    contentType: typeof contentType === 'string' ? contentType : 'application/octet-stream',
    width: intMeta(result.metadata.width),
    height: intMeta(result.metadata.height),
  }
}

export async function loadImageSizes(): Promise<ImageSizeMap> {
  const stored = await worksStore().get(IMAGE_SIZES_KEY, { type: 'json' })
  return parseImageSizeMap(stored) ?? {}
}

let imageSizeWrite: Promise<void> = Promise.resolve()

export function registerImageSize(url: string, width: number, height: number) {
  imageSizeWrite = imageSizeWrite.then(async () => {
    const sizes = await loadImageSizes()
    sizes[url] = [width, height]
    await worksStore().setJSON(IMAGE_SIZES_KEY, sizes)
  })
  return imageSizeWrite
}

export async function saveImageSizes(sizes: ImageSizeMap) {
  imageSizeWrite = imageSizeWrite.then(async () => {
    await worksStore().setJSON(IMAGE_SIZES_KEY, sizes)
  })
  return imageSizeWrite
}

export async function listImageIds() {
  const keys: string[] = []
  for await (const page of imageStore().list({ paginate: true })) {
    for (const blob of page.blobs ?? []) keys.push(blob.key)
  }
  return keys
}

export async function backfillImageSizes() {
  const sizes = await loadImageSizes()
  const keys = await listImageIds()
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const id of keys) {
    const url = `/api/images/${id}`
    const existing = sizes[url]
    if (existing) {
      skipped += 1
      continue
    }

    const result = await imageStore().getWithMetadata(id, { type: 'arrayBuffer' })
    if (!result?.data) {
      failed += 1
      continue
    }

    const contentType = typeof result.metadata.contentType === 'string'
      ? result.metadata.contentType
      : 'application/octet-stream'
    let width = intMeta(result.metadata.width)
    let height = intMeta(result.metadata.height)

    if (!width || !height) {
      const probed = probeImage(result.data)
      if (!probed) {
        failed += 1
        continue
      }
      width = probed.width
      height = probed.height
      await imageStore().set(id, result.data, {
        metadata: {
          contentType,
          width: String(width),
          height: String(height),
        },
      })
    }

    sizes[url] = [width, height]
    updated += 1
  }

  await saveImageSizes(sizes)
  return { total: keys.length, updated, skipped, failed, sizes }
}

function intMeta(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const n = Number(value)
    if (n > 0) return n
  }
  return undefined
}

function parseImageSizeMap(value: unknown): ImageSizeMap | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const sizes: ImageSizeMap = {}
  for (const [key, entry] of Object.entries(value)) {
    if (!Array.isArray(entry) || entry.length !== 2) continue
    const width = entry[0]
    const height = entry[1]
    if (typeof width !== 'number' || typeof height !== 'number') continue
    if (!Number.isInteger(width) || !Number.isInteger(height)) continue
    if (width < 1 || height < 1) continue
    sizes[key] = [width, height]
  }
  return sizes
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
  if (remove.size === 0) return

  await Promise.all([...remove].map(async (id) => {
    try {
      await imageStore().delete(id)
    } catch {
      // A missing blob should not block saving the work.
    }
  }))

  imageSizeWrite = imageSizeWrite.then(async () => {
    const sizes = await loadImageSizes()
    let changed = false
    for (const id of remove) {
      const key = `/api/images/${id}`
      if (key in sizes) {
        delete sizes[key]
        changed = true
      }
    }
    if (changed) await worksStore().setJSON(IMAGE_SIZES_KEY, sizes)
  })
  await imageSizeWrite
}
