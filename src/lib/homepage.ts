import type { HomepageSlide } from '../data/homepage'

export async function fetchHomepage(): Promise<HomepageSlide[] | null> {
  try {
    const response = await fetch('/api/homepage', { cache: 'no-store' })
    if (!response.ok) return null
    const data: unknown = await response.json()
    if (!data || typeof data !== 'object' || !('slides' in data) || !Array.isArray(data.slides)) return null
    if (!data.slides.every(isHomepageSlide)) return null
    return data.slides
  } catch {
    return null
  }
}

function isHomepageSlide(value: unknown): value is HomepageSlide {
  if (!value || typeof value !== 'object') return false
  const slide = value as HomepageSlide
  return typeof slide.image === 'string' && slide.image.length > 0
    && typeof slide.slug === 'string' && slide.slug.length > 0
}
