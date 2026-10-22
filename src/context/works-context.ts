import { createContext } from 'react'
import type { WorkItem, WorkPiece } from '../data/works-seed'

export type WorksContextValue = {
  works: WorkItem[]
  ready: boolean
  fromApi: boolean
  refresh: () => Promise<boolean>
}

export const WorksContext = createContext<WorksContextValue | null>(null)

export function isWorkItem(value: unknown): value is WorkItem {
  if (!value || typeof value !== 'object') return false
  const work = value as WorkItem
  return typeof work.slug === 'string'
    && typeof work.name === 'string'
    && typeof work.image === 'string'
    && typeof work.dimensions === 'string'
    && typeof work.materials === 'string'
    && typeof work.year === 'string'
    && (work.location == null || typeof work.location === 'string')
    && (work.description == null || typeof work.description === 'string')
    && (work.images == null || (Array.isArray(work.images) && work.images.every((image) => typeof image === 'string')))
    && (work.pieces == null || (Array.isArray(work.pieces) && work.pieces.every(isWorkPiece)))
}

function isWorkPiece(value: unknown): value is WorkPiece {
  if (!value || typeof value !== 'object') return false
  const piece = value as WorkPiece
  return typeof piece.title === 'string'
    && (piece.subtitle == null || typeof piece.subtitle === 'string')
    && typeof piece.year === 'string'
    && typeof piece.materials === 'string'
    && typeof piece.dimensions === 'string'
}

export async function fetchWorks() {
  try {
    const response = await fetch('/api/works', { cache: 'no-store' })
    if (!response.ok) return null
    const data: unknown = await response.json()
    if (!data || typeof data !== 'object' || !('works' in data) || !Array.isArray(data.works)) return null
    if (!data.works.every(isWorkItem)) return null
    return data.works
  } catch {
    return null
  }
}
