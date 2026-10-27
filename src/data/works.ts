import type { AboutBlock } from './about'
import { worksSeed, type WorkImage, type WorkItem, type WorkPiece } from './works-seed'

export type { WorkImage, WorkItem, WorkPiece }

function withBase(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  if (!path.startsWith('/')) return `${base}${path}`
  if (base === '/') return path
  return `${base.replace(/\/$/, '')}${path}`
}

function withBaseBlock(block: AboutBlock): AboutBlock {
  if (block.type === 'text') return block
  return { ...block, image: withBase(block.image) }
}

export const works: WorkItem[] = worksSeed.map((work) => ({
  ...work,
  image: withBase(work.image),
  images: work.images?.map((item) => ({ ...item, image: withBase(item.image) })),
  blocks: work.blocks?.map(withBaseBlock),
}))

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
