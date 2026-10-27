import { createContext } from 'react'
import type { AboutBlock } from '../data/about'
import type { WorkImage, WorkItem, WorkPiece } from '../data/works-seed'

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
    && (work.showCarousel == null || typeof work.showCarousel === 'boolean')
    && (work.images == null || (Array.isArray(work.images) && work.images.every(isWorkImage)))
    && (work.blocks == null || (Array.isArray(work.blocks) && work.blocks.every(isAboutBlock)))
    && (work.pieces == null || (Array.isArray(work.pieces) && work.pieces.every(isWorkPiece)))
}

function isWorkImage(value: unknown): value is WorkImage {
  if (!value || typeof value !== 'object') return false
  const image = value as WorkImage
  return typeof image.image === 'string'
    && (image.caption == null || typeof image.caption === 'string')
}

function isAboutBlock(value: unknown): value is AboutBlock {
  if (!value || typeof value !== 'object') return false
  const block = value as AboutBlock
  if (block.type === 'text') {
    return typeof block.html === 'string'
      && (block.align === 'left' || block.align === 'center' || block.align === 'right')
      && (block.width === 'full' || block.width === 'medium' || block.width === 'small')
  }
  if (block.type === 'image') {
    return typeof block.image === 'string'
      && typeof block.alt === 'string'
      && typeof block.caption === 'string'
  }
  if (block.type === 'split') {
    return typeof block.html === 'string'
      && typeof block.image === 'string'
      && typeof block.alt === 'string'
      && typeof block.caption === 'string'
      && (block.imageSide === 'start' || block.imageSide === 'end')
  }
  return false
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
