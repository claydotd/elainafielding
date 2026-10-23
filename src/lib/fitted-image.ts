const QUALITY = 75

export type ImageUse = 'gallery' | 'hero' | 'carousel' | 'about'

const widthsFor: Record<ImageUse, readonly number[]> = {
  gallery: [480, 800, 1200],
  hero: [800, 1200, 1600, 2000],
  carousel: [480, 800, 1200],
  about: [800, 1200, 1600],
}

const sizesFor: Record<ImageUse, string> = {
  gallery: 'min(66vw, max(300px, 50vh))',
  hero: '80vw',
  carousel: '80vw',
  about: 'min(80vw, 50vh)',
}

/** Each carousel cell is an equal slice of the 80%-wide track. */
export function carouselSizes(visibleCount: number) {
  return `calc(80vw / ${Math.max(1, visibleCount)})`
}

export function fittedImage(src: string, use: ImageUse, sizes = sizesFor[use]) {
  const path = optimizablePath(src)
  if (!path) return { src }

  const widths = widthsFor[use]
  return {
    src: cdnUrl(path, widths[widths.length - 1]),
    srcSet: widths.map((width) => `${cdnUrl(path, width)} ${width}w`).join(', '),
    sizes,
  }
}

function cdnUrl(path: string, width: number) {
  const params = new URLSearchParams({
    url: path,
    w: String(width),
    q: String(QUALITY),
    fm: 'webp',
  })
  return `/.netlify/images?${params.toString()}`
}

function optimizablePath(src: string) {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return null

  let pathname = src
  if (/^https?:\/\//i.test(src)) {
    try {
      const url = new URL(src)
      if (typeof window !== 'undefined' && url.origin !== window.location.origin) return null
      pathname = url.pathname
    } catch {
      return null
    }
  }

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  if (base && pathname.startsWith(`${base}/`)) pathname = pathname.slice(base.length)
  if (!pathname.startsWith('/')) pathname = `/${pathname}`

  if (pathname.startsWith('/images/') || pathname.startsWith('/api/images/')) return pathname
  return null
}
