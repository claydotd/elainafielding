import type { AboutAlign, AboutBlock, AboutWidth } from '../data/about'

const ALIGNS = new Set<AboutAlign>(['left', 'center', 'right'])
const WIDTHS = new Set<AboutWidth>(['full', 'medium', 'small'])
const SIDES = new Set(['start', 'end'])

export function aboutTextClass(align?: AboutAlign, width?: AboutWidth) {
  return [
    'bio-text',
    align === 'left' ? 'left-aligned' : '',
    align === 'center' ? 'center-aligned' : '',
    align === 'right' ? 'right-aligned' : '',
    width === 'medium' ? 'width-medium' : '',
    width === 'small' ? 'width-small' : '',
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
  if (block.type === 'image') return true
  return typeof block.html === 'string' && typeof block.imageSide === 'string' && SIDES.has(block.imageSide)
}
