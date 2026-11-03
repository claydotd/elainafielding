import type { AboutAlign, AboutBlock, AboutCarouselBlock, AboutImageAlign, AboutWidth } from './about'
import { readImageCrop, type ImageCrop } from './image-crop'
import {
  worksSeed,
  type MastheadFit,
  type MastheadText,
  type ScrollClosingImage,
  type WorkImageSize,
  type ScrollStoryStep,
  type WorkImage,
  type WorkItem,
  type WorkPiece,
  type WorkTemplate,
} from './works-seed'

export type {
  MastheadFit,
  MastheadText,
  ScrollClosingImage,
  ScrollStoryStep,
  WorkImage,
  WorkImageSize,
  WorkItem,
  WorkPiece,
  WorkTemplate,
}

export type { ImageCrop }

export const WORK_TEMPLATES: WorkTemplate[] = ['standard', 'scroll-story', 'masthead', 'column']
export const MASTHEAD_TEXT_OPTIONS: MastheadText[] = ['dark', 'med', 'light']
export const MASTHEAD_FIT_OPTIONS: MastheadFit[] = ['full', 'frame']
export const DESCRIPTION_ALIGN_OPTIONS: AboutAlign[] = ['left', 'center', 'right', 'justify']
export const DESCRIPTION_WIDTH_OPTIONS: AboutWidth[] = ['full', 'medium', 'small']
export const DESCRIPTION_PLACEMENT_OPTIONS: AboutImageAlign[] = ['left', 'center', 'right']
export const IMAGE_SIZE_OPTIONS: WorkImageSize[] = ['default', 'large', 'medium', 'small']
export const IMAGE_ALIGN_OPTIONS: AboutImageAlign[] = ['left', 'center', 'right']
export const SCROLL_CROP_OPTIONS: ImageCrop[] = ['original', 'portrait', 'landscape', 'square']

export function workTemplate(work: Pick<WorkItem, 'template'>): WorkTemplate {
  return work.template ?? 'standard'
}

export function mastheadText(work: Pick<WorkItem, 'mastheadText'>): MastheadText {
  return work.mastheadText ?? 'light'
}

export function mastheadFit(work: Pick<WorkItem, 'mastheadFit'>): MastheadFit {
  return work.mastheadFit ?? 'frame'
}

export function scrollCrop(work: Pick<WorkItem, 'scrollCrop'>): ImageCrop {
  return readImageCrop(work.scrollCrop)
}

export function workImageSize(work: Pick<WorkItem, 'imageSize'>): WorkImageSize {
  const size = work.imageSize as WorkImageSize | 'full' | undefined
  if (!size || size === 'full') return 'default'
  return size
}

export function workImageAlign(work: Pick<WorkItem, 'imageAlign'>): AboutImageAlign {
  return work.imageAlign ?? 'left'
}

export function leadImageClass(size?: WorkImageSize, align?: AboutImageAlign) {
  const resolvedSize = size ?? 'default'
  const resolvedAlign = align ?? 'left'
  return [
    resolvedSize === 'small' ? 'image-size-small' : '',
    resolvedSize === 'medium' ? 'image-size-medium' : '',
    resolvedSize === 'large' ? 'image-size-large' : '',
    resolvedAlign === 'center' ? 'image-align-center' : '',
    resolvedAlign === 'right' ? 'image-align-right' : '',
    resolvedAlign === 'left' ? 'image-align-left' : '',
  ].filter(Boolean).join(' ')
}

export function descriptionAlign(work: Pick<WorkItem, 'descriptionAlign'>): AboutAlign {
  return work.descriptionAlign ?? 'justify'
}

export function descriptionWidth(work: Pick<WorkItem, 'descriptionWidth'>): AboutWidth {
  return work.descriptionWidth ?? 'medium'
}

export function descriptionPlacement(work: Pick<WorkItem, 'descriptionPlacement'>): AboutImageAlign {
  return work.descriptionPlacement ?? 'left'
}

function withBase(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  if (!path.startsWith('/')) return `${base}${path}`
  if (base === '/') return path
  return `${base.replace(/\/$/, '')}${path}`
}

function withBaseBlock(block: AboutBlock): AboutBlock {
  if (block.type === 'text') return block
  if (block.type === 'carousel') {
    return {
      ...block,
      images: block.images.map((item) => ({ ...item, image: withBase(item.image) })),
    }
  }
  return { ...block, image: withBase(block.image) }
}

export const works: WorkItem[] = worksSeed.map((work) => ({
  ...work,
  image: withBase(work.image),
  images: work.images?.map((item) => ({ ...item, image: withBase(item.image) })),
  blocks: work.blocks?.map(withBaseBlock),
  scrollSteps: work.scrollSteps?.map((step) => ({
    ...step,
    image: withBase(step.image),
  })),
  scrollClosingImage: work.scrollClosingImage
    ? { ...work.scrollClosingImage, src: withBase(work.scrollClosingImage.src) }
    : work.scrollClosingImage,
}))

/**
 * Content blocks for a work page, including a synthetic carousel block when
 * older stored works still keep carousel images on the work itself.
 */
export function workContentBlocks(
  work: Pick<WorkItem, 'images' | 'showCarousel' | 'carouselCrop' | 'blocks' | 'scrollClosingImage'>,
): AboutBlock[] {
  let blocks = work.blocks ?? []
  if (!blocks.some((block) => block.type === 'carousel') && work.showCarousel !== false) {
    const images = work.images ?? []
    if (images.length > 0) {
      const carousel: AboutCarouselBlock = {
        type: 'carousel',
        images: images.map((item) => ({
          image: item.image,
          caption: item.caption ?? '',
        })),
        crop: work.carouselCrop ?? 'none',
      }
      blocks = [carousel, ...blocks]
    }
  }

  const closing = work.scrollClosingImage
  if (
    closing?.src
    && !blocks.some((block) => block.type === 'image' && block.image === closing.src)
  ) {
    blocks = [
      ...blocks,
      {
        type: 'image',
        image: closing.src,
        alt: closing.alt,
        caption: '',
        size: 'full',
        align: 'center',
      },
    ]
  }

  return blocks
}

export function getWorkBySlug(slug: string) {
  return works.find((work) => work.slug === slug)
}

export function workPieces(work: Pick<WorkItem, 'name' | 'year' | 'materials' | 'dimensions' | 'pieces'>): WorkPiece[] {
  if (work.pieces && work.pieces.length > 0) return work.pieces
  return [{
    title: work.name,
    year: work.year,
    materials: work.materials,
    dimensions: work.dimensions,
  }]
}

export function workSummary(work: Pick<WorkItem, 'name' | 'year' | 'materials' | 'dimensions' | 'location' | 'pieces'>) {
  const pieces = workPieces(work).map((piece) => {
    const title = piece.title && piece.year ? `${piece.title} (${piece.year})` : piece.title || (piece.year ? `(${piece.year})` : '')
    const head = [title, piece.subtitle].filter(Boolean).join(', ')
    return [head, piece.materials, piece.dimensions].filter(Boolean).join('. ')
  })
  const text = [...pieces, work.location].filter(Boolean).join('. ')
  return text ? `${text}.` : ''
}
