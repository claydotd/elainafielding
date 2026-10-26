import { ABOUT_BLOCK_LIMIT, type AboutAlign, type AboutBlock, type AboutImageSide, type AboutWidth } from '../../src/data/about.ts'
import { sanitizeHtml } from '../../src/lib/sanitize-html.ts'
import { isAllowedImage } from './works.ts'

const ALIGNS = new Set<AboutAlign>(['left', 'center', 'right'])
const WIDTHS = new Set<AboutWidth>(['full', 'medium', 'small'])
const SIDES = new Set<AboutImageSide>(['start', 'end'])
const MAX_HTML = 20_000
const MAX_HTML_INPUT = 100_000
const MAX_ALT = 300
const MAX_CAPTION = 400
const MAX_IMAGE = 240

export function parseAboutList(value: unknown): AboutBlock[] | null {
  if (!Array.isArray(value) || value.length > ABOUT_BLOCK_LIMIT) return null
  const blocks: AboutBlock[] = []
  for (const item of value) {
    const block = readBlock(item)
    if ('error' in block) return null
    blocks.push(block)
  }
  return blocks
}

export function parseAboutInput(value: unknown): AboutBlock[] | { error: string } {
  if (!value || typeof value !== 'object' || !('blocks' in value)) return { error: 'Send the about page.' }
  const blocks = (value as { blocks: unknown }).blocks
  if (!Array.isArray(blocks)) return { error: 'Send the about page.' }
  if (blocks.length > ABOUT_BLOCK_LIMIT) return { error: `The about page can have at most ${ABOUT_BLOCK_LIMIT} sections.` }
  const parsed: AboutBlock[] = []
  for (const item of blocks) {
    const block = readBlock(item)
    if ('error' in block) return block
    parsed.push(block)
  }
  return parsed
}

export function aboutImageUrls(blocks: AboutBlock[]) {
  const urls: string[] = []
  for (const block of blocks) {
    if (block.type !== 'text' && block.image) urls.push(block.image)
  }
  return urls
}

function readBlock(value: unknown): AboutBlock | { error: string } {
  if (!value || typeof value !== 'object') return { error: 'Check each section, then try again.' }
  const body = value as Record<string, unknown>
  if (body.type === 'text') return readText(body)
  if (body.type === 'image') return readImage(body)
  if (body.type === 'split') return readSplit(body)
  return { error: 'Check each section, then try again.' }
}

function readText(body: Record<string, unknown>): AboutBlock | { error: string } {
  const html = readHtml(body.html)
  if ('error' in html) return html
  const align = readChoice(body.align, ALIGNS)
  const width = readChoice(body.width, WIDTHS)
  if (!align) return { error: 'Choose left, center, or right for each text section.' }
  if (!width) return { error: 'Choose a width for each text section.' }
  return { type: 'text', html: html.html, align, width }
}

function readImage(body: Record<string, unknown>): AboutBlock | { error: string } {
  const image = readImageUrl(body.image)
  if (typeof image !== 'string') return image
  const alt = readPlain(body.alt, MAX_ALT, 'description')
  if (typeof alt !== 'string') return alt
  const caption = readPlain(body.caption, MAX_CAPTION, 'caption')
  if (typeof caption !== 'string') return caption
  if (!alt) return { error: 'Each image needs a description.' }
  return { type: 'image', image, alt, caption }
}

function readSplit(body: Record<string, unknown>): AboutBlock | { error: string } {
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
