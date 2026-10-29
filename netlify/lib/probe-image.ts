import { imageSize } from 'image-size'

export function probeImage(bytes: ArrayBuffer | Uint8Array | Buffer) {
  const buffer = Buffer.isBuffer(bytes)
    ? bytes
    : Buffer.from(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes)
  try {
    const result = imageSize(buffer)
    if (!result.width || !result.height) return null
    if (!Number.isFinite(result.width) || !Number.isFinite(result.height)) return null
    if (result.width < 1 || result.height < 1) return null
    return { width: result.width, height: result.height }
  } catch {
    return null
  }
}

export function parseImageSizeHeaders(req: Request) {
  const width = Number(req.headers.get('x-image-width'))
  const height = Number(req.headers.get('x-image-height'))
  if (!Number.isInteger(width) || !Number.isInteger(height)) return null
  if (width < 1 || height < 1 || width > 20000 || height > 20000) return null
  return { width, height }
}
