export type CarouselCrop = 'none' | 'portrait' | 'landscape'

export function isCarouselCrop(value: unknown): value is CarouselCrop {
  return value === 'none' || value === 'portrait' || value === 'landscape'
}

export function readCarouselCrop(value: unknown): CarouselCrop {
  return isCarouselCrop(value) ? value : 'none'
}

export function carouselCropClass(
  prefix: 'homepage-carousel' | 'work-carousel',
  crop: CarouselCrop = 'none',
) {
  if (crop === 'portrait') return `${prefix}--crop-portrait`
  if (crop === 'landscape') return `${prefix}--crop-landscape`
  return ''
}
