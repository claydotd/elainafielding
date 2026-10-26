import { useLayoutEffect, useRef, useState, type ImgHTMLAttributes } from 'react'
import { imageSize } from '../data/image-sizes'

type FadeImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
}

export function FadeImage({
  className,
  src,
  alt = '',
  width,
  height,
  style,
  onLoad,
  onError,
  ...props
}: FadeImageProps) {
  const ref = useRef<HTMLImageElement>(null)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const size = imageSize(src)
  const loaded = loadedSrc === src

  useLayoutEffect(() => {
    const image = ref.current
    if (image?.complete && image.naturalWidth > 0) setLoadedSrc(src)
  }, [src])

  return (
    <img
      {...props}
      ref={ref}
      src={src}
      alt={alt}
      width={width ?? size?.width}
      height={height ?? size?.height}
      className={['fade-image', loaded ? 'is-loaded' : '', className].filter(Boolean).join(' ')}
      style={size ? { ...style, aspectRatio: `${size.width} / ${size.height}` } : style}
      onLoad={(event) => {
        setLoadedSrc(src)
        onLoad?.(event)
      }}
      onError={(event) => {
        setLoadedSrc(src)
        onError?.(event)
      }}
    />
  )
}
