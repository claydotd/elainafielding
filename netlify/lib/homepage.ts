import type { HomepageSlide } from '../../src/data/homepage.ts'
import type { WorkItem } from '../../src/data/works-seed.ts'
import { isAllowedImage } from './works.ts'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_SLIDES = 40
const MAX_URL = 240
const MAX_SLUG = 80

export function parseHomepageList(value: unknown): HomepageSlide[] | null {
  if (!Array.isArray(value)) return null
  const slides: HomepageSlide[] = []
  for (const item of value) {
    const slide = readSlide(item)
    if (!slide) return null
    slides.push(slide)
  }
  return slides
}

export function parseHomepageInput(value: unknown, slugs: ReadonlySet<string>): HomepageSlide[] | { error: string } {
  if (!value || typeof value !== 'object' || !('slides' in value)) return { error: 'Send the homepage images.' }
  const slides = (value as { slides: unknown }).slides
  if (!Array.isArray(slides)) return { error: 'Send the homepage images.' }
  if (slides.length > MAX_SLIDES) return { error: `The homepage can have at most ${MAX_SLIDES} images.` }
  const parsed: HomepageSlide[] = []
  for (const item of slides) {
    const slide = readSlide(item)
    if (!slide) return { error: 'Each homepage image needs a valid file and a work.' }
    if (!slugs.has(slide.slug)) return { error: 'Each homepage image needs to open a work.' }
    parsed.push(slide)
  }
  return parsed
}

export function retargetSlides(slides: HomepageSlide[], from: string, to: string) {
  if (from === to || !slides.some((slide) => slide.slug === from)) return slides
  return slides.map((slide) => (slide.slug === from ? { ...slide, slug: to } : slide))
}

export function imageUrls(works: WorkItem[], slides: HomepageSlide[]) {
  return [
    ...works.flatMap((work) => [work.image, ...(work.images ?? [])]),
    ...slides.map((slide) => slide.image),
  ]
}

function readSlide(value: unknown): HomepageSlide | null {
  if (!value || typeof value !== 'object') return null
  const body = value as Record<string, unknown>
  if (typeof body.image !== 'string' || typeof body.slug !== 'string') return null
  const image = body.image.trim()
  const slug = body.slug.trim()
  if (!image || image.length > MAX_URL || !isAllowedImage(image)) return null
  if (!slug || slug.length > MAX_SLUG || !SLUG.test(slug)) return null
  return { image, slug }
}
