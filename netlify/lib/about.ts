import {
  ABOUT_BLOCK_LIMIT,
  CAROUSEL_IMAGE_LIMIT,
  type AboutAlign,
  type AboutBlock,
  type AboutCarouselBlock,
  type AboutCarouselSlide,
  type AboutImageAlign,
  type AboutImageSide,
  type AboutImageSize,
  type AboutPageBlock,
  type AboutWidth,
} from '../../src/data/about.ts'
import { isCarouselCrop } from '../../src/data/carousel.ts'
import { isImageCrop, readImageCrop } from '../../src/data/image-crop.ts'
import { sanitizeHtml } from '../../src/lib/sanitize-html.ts'
import { isAllowedImage } from './works.ts'

const ALIGNS = new Set<AboutAlign>(['left', 'center', 'right', 'justify'])
const WIDTHS = new Set<AboutWidth>(['full', 'medium', 'small'])
const IMAGE_ALIGNS = new Set<AboutImageAlign>(['left', 'center', 'right'])
const IMAGE_SIZES = new Set<AboutImageSize>(['small', 'medium', 'large', 'full'])
const SIDES = new Set<AboutImageSide>(['start', 'end'])
const MAX_HTML = 20_000
const MAX_HTML_INPUT = 100_000
const MAX_ALT = 300
const MAX_CAPTION = 400
const MAX_IMAGE = 240
const MAX_CAROUSEL_CAPTION = 240

export function parseAboutList(value: unknown): AboutPageBlock[] | null {
  if (!Array.isArray(value) || value.length > ABOUT_BLOCK_LIMIT) return null
  const blocks: AboutPageBlock[] = []
  for (const item of value) {
    const block = readAboutPageBlock(item)
    if ('error' in block) return null
    blocks.push(block)
  }
  return blocks
}

export function parseAboutInput(value: unknown): AboutPageBlock[] | { error: string } {
  if (!value || typeof value !== 'object' || !('blocks' in value)) return { error: 'Send the about page.' }
  const blocks = (value as { blocks: unknown }).blocks
  if (!Array.isArray(blocks)) return { error: 'Send the about page.' }
  if (blocks.length > ABOUT_BLOCK_LIMIT) return { error: `The about page can have at most ${ABOUT_BLOCK_LIMIT} sections.` }
  const parsed: AboutPageBlock[] = []
  for (const item of blocks) {
    const block = readAboutPageBlock(item)
    if ('error' in block) return block
    parsed.push(block)
  }
  return parsed
}

export function parseWorkBlockList(value: unknown): AboutBlock[] | null {
  if (!Array.isArray(value) || value.length > ABOUT_BLOCK_LIMIT) return null
  const blocks: AboutBlock[] = []
  for (const item of value) {
    const block = readWorkBlock(item)
    if ('error' in block) return null
    blocks.push(block)
  }
  return blocks
}

export function parseWorkBlocksInput(value: unknown): AboutBlock[] | { error: string } {
  if (!value || typeof value !== 'object' || !('blocks' in value)) return { error: 'Check each section, then try again.' }
  const blocks = (value as { blocks: unknown }).blocks
  if (!Array.isArray(blocks)) return { error: 'Check each section, then try again.' }
  if (blocks.length > ABOUT_BLOCK_LIMIT) return { error: `A work can have at most ${ABOUT_BLOCK_LIMIT} sections.` }
  const parsed: AboutBlock[] = []
  for (const item of blocks) {
    const block = readWorkBlock(item)
    if ('error' in block) return block
    parsed.push(block)
  }
  return parsed
}

export function aboutImageUrls(blocks: AboutBlock[]) {
  const urls: string[] = []
  for (const block of blocks) {
    if (block.type === 'text') continue
    if (block.type === 'carousel') {
      for (const slide of block.images) {
        if (slide.image) urls.push(slide.image)
      }
      continue
    }
    if (block.image) urls.push(block.image)
  }
  return urls
}

function readAboutPageBlock(value: unknown): AboutPageBlock | { error: string } {
  if (!value || typeof value !== 'object') return { error: 'Check each section, then try again.' }
  const body = value as Record<string, unknown>
  if (body.type === 'text') return readText(body)
  if (body.type === 'image') return readImage(body)
  if (body.type === 'split') return readSplit(body)
  if (body.type === 'carousel') return { error: 'The about page cannot include a carousel.' }
  return { error: 'Check each section, then try again.' }
}

function readWorkBlock(value: unknown): AboutBlock | { error: string } {
  if (!value || typeof value !== 'object') return { error: 'Check each section, then try again.' }
  const body = value as Record<string, unknown>
  if (body.type === 'text') return readText(body)
  if (body.type === 'image') return readImage(body)
  if (body.type === 'split') return readSplit(body)
  if (body.type === 'carousel') return readCarousel(body)
  return { error: 'Check each section, then try again.' }
}

function readCarousel(body: Record<string, unknown>): AboutCarouselBlock | { error: string } {
  if (!Array.isArray(body.images) || body.images.length > CAROUSEL_IMAGE_LIMIT) {
    return { error: 'Check each carousel, then try again.' }
  }
  const images: AboutCarouselSlide[] = []
  for (const item of body.images) {
    if (!item || typeof item !== 'object') return { error: 'Check each carousel, then try again.' }
    const slide = item as Record<string, unknown>
    const image = readImageUrl(slide.image)
    if (typeof image !== 'string') return image
    if (slide.caption != null && typeof slide.caption !== 'string') {
      return { error: 'Check each carousel, then try again.' }
    }
    const caption = typeof slide.caption === 'string' ? slide.caption.trim() : ''
    if (caption.length > MAX_CAROUSEL_CAPTION) return { error: 'A carousel caption is too long.' }
    images.push({ image, caption })
  }
  const crop = body.crop == null ? 'none' : body.crop
  if (!isCarouselCrop(crop)) return { error: 'Choose none, portrait, or landscape for each carousel.' }
  return { type: 'carousel', images, crop }
}

function readText(body: Record<string, unknown>): AboutPageBlock | { error: string } {
  const html = readHtml(body.html)
  if ('error' in html) return html
  const align = readChoice(body.align, ALIGNS)
  const width = readChoice(body.width, WIDTHS)
  if (!align) return { error: 'Choose left, center, right, or justify for each text section.' }
  if (!width) return { error: 'Choose a width for each text section.' }
  return { type: 'text', html: html.html, align, width }
}

function readImage(body: Record<string, unknown>): AboutPageBlock | { error: string } {
  const image = readImageUrl(body.image)
  if (typeof image !== 'string') return image
  const alt = readPlain(body.alt, MAX_ALT, 'description')
  if (typeof alt !== 'string') return alt
  const caption = readPlain(body.caption, MAX_CAPTION, 'caption')
  if (typeof caption !== 'string') return caption
  const size = body.size == null ? 'full' : readChoice(body.size, IMAGE_SIZES)
  const align = body.align == null ? 'center' : readChoice(body.align, IMAGE_ALIGNS)
  const crop = body.crop == null ? 'original' : body.crop
  if (!alt) return { error: 'Each image needs a description.' }
  if (!size) return { error: 'Choose small, medium, large, or full for each image section.' }
  if (!align) return { error: 'Choose left, center, or right for each image section.' }
  if (!isImageCrop(crop)) return { error: 'Choose original, portrait, landscape, or square for each image section.' }
  return { type: 'image', image, alt, caption, size, align, crop: readImageCrop(crop) }
}

function readSplit(body: Record<string, unknown>): AboutPageBlock | { error: string } {
  const html = readHtml(body.html)
  if ('error' in html) return html
  const image = readImageUrl(body.image)
  if (typeof image !== 'string') return image
  const alt = readPlain(body.alt, MAX_ALT, 'description')
  if (typeof alt !== 'string') return alt
  const caption = readPlain(body.caption, MAX_CAPTION, 'caption')
  if (typeof caption !== 'string') return caption
  const imageSide = readChoice(body.imageSide, SIDES)
  if (!imageSide) return { error: 'Choose which side the image sits on.' }
  if (!alt) return { error: 'Each image needs a description.' }
  return { type: 'split', html: html.html, image, alt, caption, imageSide }
}

function readHtml(value: unknown): { html: string } | { error: string } {
  if (typeof value !== 'string') return { error: 'Check each section, then try again.' }
  if (value.length > MAX_HTML_INPUT) return { error: 'A text section is too long.' }
  const html = sanitizeHtml(value)
  if (html.length > MAX_HTML) return { error: 'A text section is too long.' }
  return { html }
}

function readImageUrl(value: unknown): string | { error: string } {
  if (typeof value !== 'string') return { error: 'Each image needs a file from this site.' }
  const image = value.trim()
  if (!image) return { error: 'Each image needs a file.' }
  if (image.length > MAX_IMAGE || !isAllowedImage(image)) return { error: 'Each image needs a file from this site.' }
  return image
}

function readPlain(value: unknown, max: number, label: string): string | { error: string } {
  if (typeof value !== 'string') return { error: 'Check each section, then try again.' }
  const text = value.trim()
  if (text.length > max) return { error: `An image ${label} is too long.` }
  return text
}

function readChoice<T extends string>(value: unknown, allowed: ReadonlySet<T>): T | null {
  if (typeof value !== 'string') return null
  return allowed.has(value as T) ? value as T : null
}
