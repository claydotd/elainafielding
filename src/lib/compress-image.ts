const MAX_BYTES = 4 * 1024 * 1024
const START_EDGE = 2400
const MIN_EDGE = 800
const START_QUALITY = 0.82
const MIN_QUALITY = 0.5

export type PreparedImage = {
  blob: Blob
  contentType: string
  width: number
  height: number
  originalBytes: number
  compressedBytes: number
}

let webpSupport: Promise<boolean> | null = null

function supportsWebp() {
  if (!webpSupport) {
    webpSupport = new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      canvas.toBlob((blob) => resolve(blob?.type === 'image/webp'), 'image/webp', 0.8)
    })
  }
  return webpSupport
}

function fitted(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height)
  const scale = longest > maxEdge ? maxEdge / longest : 1
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function render(bitmap: ImageBitmap, maxEdge: number, quality: number, type: string) {
  const size = fitted(bitmap.width, bitmap.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('This image could not be prepared.'))
  context.drawImage(bitmap, 0, 0, size.width, size.height)
  return new Promise<{ blob: Blob; width: number; height: number }>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('This image could not be compressed.'))
      else resolve({ blob, width: size.width, height: size.height })
    }, type, quality)
  })
}

export async function compressImage(file: File): Promise<PreparedImage> {
  const looksLikeImage = file.type.startsWith('image/') || /\.(avif|bmp|gif|heic|heif|jpe?g|png|webp)$/i.test(file.name)
  if (!looksLikeImage) throw new Error('Choose an image file.')

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This image could not be read. Use a JPEG, PNG, or WebP.')
  }

  try {
    const type = (await supportsWebp()) ? 'image/webp' : 'image/jpeg'
    let edge = START_EDGE
    let quality = START_QUALITY
    let prepared = await render(bitmap, edge, quality, type)
    // Prefer a file no larger than the original when that original is already a real image.
    const sizeTarget = file.size > 100 * 1024 ? Math.min(MAX_BYTES, file.size) : MAX_BYTES

    while (prepared.blob.size > sizeTarget && quality > MIN_QUALITY) {
      quality = Math.round((quality - 0.08) * 100) / 100
      const next = await render(bitmap, edge, quality, type)
      if (next.blob.size < prepared.blob.size) prepared = next
    }

    while (prepared.blob.size > MAX_BYTES && edge > MIN_EDGE) {
      edge = Math.max(MIN_EDGE, Math.round(edge * 0.85))
      const next = await render(bitmap, edge, quality, type)
      if (next.blob.size < prepared.blob.size) prepared = next
      else if (edge === MIN_EDGE) break
    }

    if (prepared.blob.size > MAX_BYTES) throw new Error('Could not compress this image under 4 MB.')

    return {
      blob: prepared.blob,
      contentType: prepared.blob.type || type,
      width: prepared.width,
      height: prepared.height,
      originalBytes: file.size,
      compressedBytes: prepared.blob.size,
    }
  } finally {
    bitmap.close()
  }
}
