export type ImageCrop = 'original' | 'portrait' | 'landscape' | 'square'

export function isImageCrop(value: unknown): value is ImageCrop {
  return value === 'original' || value === 'portrait' || value === 'landscape' || value === 'square'
}

export function readImageCrop(value: unknown): ImageCrop {
  return isImageCrop(value) ? value : 'original'
}

export function imageCropClass(crop: ImageCrop = 'original') {
  if (crop === 'portrait') return 'about-content__image--crop-portrait'
  if (crop === 'landscape') return 'about-content__image--crop-landscape'
  if (crop === 'square') return 'about-content__image--crop-square'
  return ''
}
