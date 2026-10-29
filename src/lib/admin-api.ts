import type { AboutBlock } from '../data/about'
import type { HomepageDocument } from '../data/homepage'
import { rememberImageSize } from '../data/image-sizes'
import type { WorkItem } from '../data/works-seed'
import { compressImage } from './compress-image'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type UploadProgress = {
  phase: 'compressing' | 'uploading'
  originalBytes?: number
  compressedBytes?: number
}

async function send<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, { credentials: 'include', cache: 'no-store', ...init })
  } catch {
    throw new ApiError(0, 'The admin API is not running.')
  }
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
      ? data.error
      : 'Request failed.'
    throw new ApiError(response.status, message)
  }
  return data as T
}

export function adminSession() {
  return fetch('/api/admin/session', { credentials: 'include', cache: 'no-store' })
    .then((response) => response.ok)
    .catch(() => false)
}

export function login(password: string) {
  return send<{ ok: true }>('/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  })
}

export function logout() {
  return send<{ ok: true }>('/api/admin/logout', { method: 'POST' })
}

export function createWork(work: WorkItem) {
  return send<{ work: WorkItem }>('/api/admin/works', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(work),
  })
}

export function updateWork(slug: string, work: WorkItem) {
  return send<{ work: WorkItem }>(`/api/admin/works/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(work),
  })
}

export function deleteWork(slug: string) {
  return send<{ ok: true }>(`/api/admin/works/${encodeURIComponent(slug)}`, { method: 'DELETE' })
}

export function saveAbout(blocks: AboutBlock[]) {
  return send<{ blocks: AboutBlock[] }>('/api/admin/about', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ blocks }),
  })
}

export function saveHomepage(homepage: HomepageDocument) {
  return send<HomepageDocument>('/api/admin/homepage', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(homepage),
  })
}

export function reorderWorks(slugs: string[]) {
  return send<{ works: WorkItem[] }>('/api/admin/works-order', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slugs }),
  })
}

export async function uploadImageFile(file: File, onProgress: (progress: UploadProgress) => void) {
  onProgress({ phase: 'compressing' })
  const prepared = await compressImage(file)
  onProgress({
    phase: 'uploading',
    originalBytes: prepared.originalBytes,
    compressedBytes: prepared.compressedBytes,
  })
  const saved = await send<{ url: string; width: number; height: number }>('/api/admin/uploads', {
    method: 'POST',
    headers: {
      'content-type': prepared.contentType,
      'x-image-width': String(prepared.width),
      'x-image-height': String(prepared.height),
    },
    body: prepared.blob,
  })
  rememberImageSize(saved.url, saved.width, saved.height)
  return {
    url: saved.url,
    width: saved.width,
    height: saved.height,
    originalBytes: prepared.originalBytes,
    compressedBytes: prepared.compressedBytes,
  }
}

export function backfillImageSizes() {
  return send<{
    total: number
    updated: number
    skipped: number
    failed: number
    sizes: Record<string, [number, number]>
  }>('/api/admin/image-sizes/backfill', { method: 'POST' })
}
