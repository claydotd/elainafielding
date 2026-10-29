import type { AboutAlign, AboutBlock, AboutImageAlign, AboutImageSize, AboutWidth } from '../data/about'
import { imageCropClass, isImageCrop, type ImageCrop } from '../data/image-crop'

const ALIGNS = new Set<AboutAlign>(['left', 'center', 'right', 'justify'])
const WIDTHS = new Set<AboutWidth>(['full', 'medium', 'small'])
const IMAGE_ALIGNS = new Set<AboutImageAlign>(['left', 'center', 'right'])
const IMAGE_SIZES = new Set<AboutImageSize>(['small', 'medium', 'large', 'full'])
const SIDES = new Set(['start', 'end'])

export function aboutTextClass(align?: AboutAlign, width?: AboutWidth) {
  return [
    'bio-text',
    align === 'left' ? 'left-aligned' : '',
    align === 'center' ? 'center-aligned' : '',
    align === 'right' ? 'right-aligned' : '',
    align === 'justify' ? 'justify-aligned' : '',
    width === 'medium' ? 'width-medium' : '',
    width === 'small' ? 'width-small' : '',
  ].filter(Boolean).join(' ')
}

export function aboutImageClass(align?: AboutImageAlign, size?: AboutImageSize, crop?: ImageCrop) {
  const resolvedAlign = align ?? 'center'
  const resolvedSize = size ?? 'full'
  return [
    'about-content__image',
    resolvedAlign === 'left' ? 'left-aligned' : '',
    resolvedAlign === 'center' ? 'center-aligned' : '',
    resolvedAlign === 'right' ? 'right-aligned' : '',
    resolvedSize === 'small' ? 'image-size-small' : '',
    resolvedSize === 'medium' ? 'image-size-medium' : '',
    resolvedSize === 'large' ? 'image-size-large' : '',
    imageCropClass(crop),
  ].filter(Boolean).join(' ')
}

export async function fetchAbout(): Promise<AboutBlock[] | null> {
  try {
    const response = await fetch('/api/about', { cache: 'no-store' })
    if (!response.ok) return null
    const data: unknown = await response.json()
    if (!data || typeof data !== 'object' || !('blocks' in data) || !Array.isArray(data.blocks)) return null
    if (!data.blocks.every(isAboutBlock)) return null
    return data.blocks
  } catch {
    return null
  }
}

function isAboutBlock(value: unknown): value is AboutBlock {
  if (!value || typeof value !== 'object') return false
  const block = value as Record<string, unknown>
  if (block.type === 'text') {
    return typeof block.html === 'string'
      && typeof block.align === 'string' && ALIGNS.has(block.align as AboutAlign)
      && typeof block.width === 'string' && WIDTHS.has(block.width as AboutWidth)
  }
  if (block.type !== 'image' && block.type !== 'split') return false
  if (typeof block.image !== 'string' || typeof block.alt !== 'string' || typeof block.caption !== 'string') return false
  if (block.type === 'image') {
    const sizeOk = block.size == null || (typeof block.size === 'string' && IMAGE_SIZES.has(block.size as AboutImageSize))
    const alignOk = block.align == null || (typeof block.align === 'string' && IMAGE_ALIGNS.has(block.align as AboutImageAlign))
    const cropOk = block.crop == null || isImageCrop(block.crop)
    return sizeOk && alignOk && cropOk
  }
  return typeof block.html === 'string' && typeof block.imageSide === 'string' && SIDES.has(block.imageSide)
}
