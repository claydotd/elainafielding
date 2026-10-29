import type { AboutBlock } from '../../src/data/about.ts'
import type {
  MastheadText,
  ScrollClosingImage,
  ScrollStoryStep,
  WorkImage,
  WorkItem,
  WorkPiece,
  WorkTemplate,
} from '../../src/data/works-seed.ts'
import { aboutImageUrls, parseWorkBlockList, parseWorkBlocksInput } from './about.ts'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const UPLOADED_IMAGE = /^\/api\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
const STATIC_IMAGE = /^\/images\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.[A-Za-z0-9]+$/

const LIMITS = {
  name: 200,
  subtitle: 200,
  slug: 80,
  year: 20,
  location: 200,
  dimensions: 120,
  materials: 300,
  description: 8000,
  caption: 240,
  alt: 240,
  paragraph: 4000,
  images: 40,
  pieces: 30,
  scrollSteps: 40,
  paragraphs: 20,
}

const WORK_TEMPLATES = new Set<WorkTemplate>(['standard', 'scroll-story', 'masthead'])
const MASTHEAD_TEXT = new Set<MastheadText>(['dark', 'med', 'light'])

export function insertionIndex(works: WorkItem[], year: string) {
  const nextYear = yearNumber(year)
  const index = works.findIndex((work) => yearNumber(work.year) <= nextYear)
  return index === -1 ? works.length : index
}

export function imageIdFromUrl(url: string) {
  const match = UPLOADED_IMAGE.exec(url)
  return match ? match[1].toLowerCase() : null
}

export function parseWorksList(value: unknown): WorkItem[] | null {
  if (!Array.isArray(value)) return null
  const works: WorkItem[] = []
  for (const item of value) {
    const work = parseWork(item, { requireSlugShape: false })
    if (!work) return null
    works.push(work)
  }
  return works
}

export function parseWorkInput(value: unknown): WorkItem | { error: string } {
  if (value && typeof value === 'object' && 'blocks' in value) {
    const blocks = (value as { blocks: unknown }).blocks
    if (blocks != null) {
      const parsed = parseWorkBlocksInput({ blocks })
      if ('error' in parsed) return parsed
    }
  }
  const work = parseWork(value, { requireSlugShape: true })
  if (!work) return { error: 'Check the work details and image files, then try again.' }
  if (!work.name) return { error: 'Title is required.' }
  if (!work.slug) return { error: 'Slug is required.' }
  if (work.slug === 'new') return { error: 'Choose a different slug.' }
  if (!SLUG.test(work.slug)) return { error: 'Use a slug made of lowercase letters, numbers, and hyphens.' }
  return work
}

export function workContentImageUrls(works: WorkItem[]) {
  return works.flatMap((work) => [
    work.image,
    ...(work.images ?? []).map((item) => item.image),
    ...(work.scrollSteps ?? []).map((step) => step.image),
    ...(work.scrollClosingImage?.src ? [work.scrollClosingImage.src] : []),
    ...aboutImageUrls(work.blocks ?? []),
  ])
}

function parseWork(value: unknown, options: { requireSlugShape: boolean }): WorkItem | null {
  if (!value || typeof value !== 'object') return null
  const body = value as Record<string, unknown>
  const name = clip(body.name, LIMITS.name)
  const slug = clip(body.slug, LIMITS.slug)
  const year = clip(body.year, LIMITS.year)
  const location = clip(body.location, LIMITS.location)
  const dimensions = clip(body.dimensions, LIMITS.dimensions)
  const materials = clip(body.materials, LIMITS.materials)
  const description = clip(body.description, LIMITS.description)
  const image = clip(body.image, 240)
  if (name == null || slug == null || year == null || location == null || dimensions == null || materials == null || description == null || image == null) {
    return null
  }
  if (options.requireSlugShape && image && !isAllowedImage(image)) return null
  if (!options.requireSlugShape && image && !isAllowedImage(image) && !image.startsWith('/')) return null
  if (body.showCarousel != null && typeof body.showCarousel !== 'boolean') return null
  if (body.carouselCrop != null
    && body.carouselCrop !== 'none'
    && body.carouselCrop !== 'portrait'
    && body.carouselCrop !== 'landscape') {
    return null
  }

  const images = parseImages(body.images)
  if (!images) return null

  const blocks = parseBlocks(body.blocks)
  if (!blocks) return null

  const pieces = parsePieces(body.pieces)
  if (!pieces) return null
  const explicitPieces = pieces.length > 0
  const resolved = explicitPieces ? pieces : [{ title: name, year, materials, dimensions }]
  const first = resolved[0]

  const work: WorkItem = {
    slug,
    image,
    name: explicitPieces ? first.title : name || first.title,
    dimensions: first.dimensions,
    materials: first.materials,
    year: first.year,
    pieces: resolved,
  }
  if (location) work.location = location
  if (description) work.description = description
  if (images.length > 0) work.images = images
  if (typeof body.showCarousel === 'boolean') work.showCarousel = body.showCarousel
  if (body.carouselCrop === 'portrait' || body.carouselCrop === 'landscape' || body.carouselCrop === 'none') {
    work.carouselCrop = body.carouselCrop
  }
  if (blocks.length > 0) work.blocks = blocks

  const template = parseTemplate(body.template)
  if (template === false) return null
  if (template) work.template = template

  const masthead = parseMastheadText(body.mastheadText)
  if (masthead === false) return null
  if (masthead) work.mastheadText = masthead

  const scrollSteps = parseScrollSteps(body.scrollSteps, options)
  if (!scrollSteps) return null
  if (scrollSteps.length > 0) work.scrollSteps = scrollSteps

  if ('scrollClosingImage' in body) {
    const closing = parseScrollClosingImage(body.scrollClosingImage, options)
    if (closing === false) return null
    work.scrollClosingImage = closing
  }

  return work
}

function parseTemplate(value: unknown): WorkTemplate | null | false {
  if (value == null || value === '') return null
  if (typeof value !== 'string' || !WORK_TEMPLATES.has(value as WorkTemplate)) return false
  return value as WorkTemplate
}

function parseMastheadText(value: unknown): MastheadText | null | false {
  if (value == null || value === '') return null
  if (typeof value !== 'string' || !MASTHEAD_TEXT.has(value as MastheadText)) return false
  return value as MastheadText
}

function parseScrollSteps(
  value: unknown,
  options: { requireSlugShape: boolean },
): ScrollStoryStep[] | null {
  if (value == null) return []
  if (!Array.isArray(value) || value.length > LIMITS.scrollSteps) return null
  const steps: ScrollStoryStep[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const body = item as Record<string, unknown>
    const image = clip(body.image, 240)
    const alt = clip(body.alt, LIMITS.alt)
    if (image == null || alt == null) return null
    if (!image) return null
    if (options.requireSlugShape && !isAllowedImage(image)) return null
    if (!options.requireSlugShape && !isAllowedImage(image) && !image.startsWith('/')) return null
    if (body.paragraphs == null) {
      steps.push({ image, alt, paragraphs: [] })
      continue
    }
    if (!Array.isArray(body.paragraphs) || body.paragraphs.length > LIMITS.paragraphs) return null
    const paragraphs: string[] = []
    for (const paragraph of body.paragraphs) {
      if (typeof paragraph !== 'string') return null
      const trimmed = paragraph.trim()
      if (trimmed.length > LIMITS.paragraph) return null
      if (trimmed) paragraphs.push(trimmed)
    }
    steps.push({ image, alt, paragraphs })
  }
  return steps
}

function parseScrollClosingImage(
  value: unknown,
  options: { requireSlugShape: boolean },
): ScrollClosingImage | null | false {
  if (value == null) return null
  if (!value || typeof value !== 'object') return false
  const body = value as Record<string, unknown>
  const src = clip(body.src, 240)
  const alt = clip(body.alt, LIMITS.alt)
  if (src == null || alt == null) return false
  if (!src) return null
  if (options.requireSlugShape && !isAllowedImage(src)) return false
  if (!options.requireSlugShape && !isAllowedImage(src) && !src.startsWith('/')) return false
  return { src, alt }
}

function parseImages(value: unknown): WorkImage[] | null {
  if (value == null) return []
  if (!Array.isArray(value) || value.length > LIMITS.images) return null
  const images: WorkImage[] = []
  for (const item of value) {
    if (typeof item === 'string') {
      if (!isAllowedImage(item)) return null
      images.push({ image: item })
      continue
    }
    if (!item || typeof item !== 'object') return null
    const body = item as Record<string, unknown>
    if (typeof body.image !== 'string') return null
    const image = body.image.trim()
    if (!image || !isAllowedImage(image)) return null
    if (body.caption != null && typeof body.caption !== 'string') return null
    const caption = typeof body.caption === 'string' ? body.caption.trim() : ''
    if (caption.length > LIMITS.caption) return null
    const entry: WorkImage = { image }
    if (caption) entry.caption = caption
    images.push(entry)
  }
  return images
}

function parseBlocks(value: unknown): AboutBlock[] | null {
  if (value == null) return []
  return parseWorkBlockList(value)
}

function parsePieces(value: unknown): WorkPiece[] | null {
  if (value == null) return []
  if (!Array.isArray(value) || value.length > LIMITS.pieces) return null
  const pieces: WorkPiece[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const body = item as Record<string, unknown>
    const title = clip(body.title, LIMITS.name)
    const subtitle = clip(body.subtitle, LIMITS.subtitle)
    const year = clip(body.year, LIMITS.year)
    const materials = clip(body.materials, LIMITS.materials)
    const dimensions = clip(body.dimensions, LIMITS.dimensions)
    if (title == null || subtitle == null || year == null || materials == null || dimensions == null) return null
    const piece: WorkPiece = { title, year, materials, dimensions }
    if (subtitle) piece.subtitle = subtitle
    pieces.push(piece)
  }
  return pieces
}

function clip(value: unknown, max: number) {
  if (value == null) return ''
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length > max) return null
  return trimmed
}

export function isAllowedImage(url: string) {
  if (url.includes('..') || url.includes('\\')) return false
  return UPLOADED_IMAGE.test(url) || STATIC_IMAGE.test(url)
}

function yearNumber(year: string) {
  const value = Number(year)
  return Number.isFinite(value) ? value : 0
}
