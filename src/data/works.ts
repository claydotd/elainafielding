import { worksSeed, type WorkItem, type WorkPiece } from './works-seed'

export type { WorkItem, WorkPiece }

function withBase(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  if (!path.startsWith('/')) return `${base}${path}`
  if (base === '/') return path
  return `${base.replace(/\/$/, '')}${path}`
}

export const works: WorkItem[] = worksSeed.map((work) => ({
  ...work,
  image: withBase(work.image),
  images: work.images?.map(withBase),
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
