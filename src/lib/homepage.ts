import type { HomepageDocument, HomepageSlide } from '../data/homepage'

export async function fetchHomepage(): Promise<HomepageDocument | null> {
  try {
    const response = await fetch('/api/homepage', { cache: 'no-store' })
    if (!response.ok) return null
    const data: unknown = await response.json()
    if (!data || typeof data !== 'object' || !('slides' in data) || !Array.isArray(data.slides)) return null
    if (!data.slides.every(isHomepageSlide)) return null
    return { slides: data.slides, showCaptions: 'showCaptions' in data && data.showCaptions === true }
  } catch {
    return null
  }
}

function isHomepageSlide(value: unknown): value is HomepageSlide {
  if (!value || typeof value !== 'object') return false
  const slide = value as HomepageSlide
  if (typeof slide.image !== 'string' || slide.image.length === 0) return false
  if (typeof slide.slug !== 'string' || slide.slug.length === 0) return false
  return slide.caption == null || typeof slide.caption === 'string'
}
