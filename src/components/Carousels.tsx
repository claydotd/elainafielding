import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import { getWorkBySlug } from '../data/works'

const AUTOPLAY_MS = 4000
/** Images visible on a wide page. */
const MAX_IMAGES_DISPLAYED = 4
/** Images visible at mobile page widths. */
const MIN_IMAGES_DISPLAYED = 1
/** Mobile breakpoint */
const MOBILE_BREAKPOINT_PX = 640
/** Extra page width required before another image is shown. */
const WIDTH_PER_EXTRA_IMAGE_PX = 280

function visibleCountForPageWidth(pageWidth: number, imageCount: number) {
  if (imageCount <= 0) return MIN_IMAGES_DISPLAYED

  const widest = Math.min(MAX_IMAGES_DISPLAYED, imageCount)
  const narrowest = Math.min(Math.max(MIN_IMAGES_DISPLAYED, 1), widest)

  if (pageWidth <= MOBILE_BREAKPOINT_PX) return narrowest

  const steps = widest - narrowest
  if (steps === 0) return widest

  const desktopWidth = MOBILE_BREAKPOINT_PX + steps * WIDTH_PER_EXTRA_IMAGE_PX
  if (pageWidth >= desktopWidth) return widest

  const progress = (pageWidth - MOBILE_BREAKPOINT_PX) / (desktopWidth - MOBILE_BREAKPOINT_PX)
  return narrowest + Math.ceil(progress * steps)
}

export type HomepageImage = {
  src: string
  /** Work slug this image opens, for example `untitled-1` → `/work/untitled-1`. */
  slug: string
}

type HomepageCarouselProps = {
  images: HomepageImage[]
  currentIndex: number
  setCurrentIndex: Dispatch<SetStateAction<number>>
}

export function HomepageCarousel({ images, currentIndex, setCurrentIndex }: HomepageCarouselProps) {
  const count = images.length
  const safeIndex = count === 0 ? 0 : ((currentIndex % count) + count) % count

  const goTo = (index: number) => {
    if (count === 0) return
    setCurrentIndex(((index % count) + count) % count)
  }

  const goPrev = () => goTo(safeIndex - 1)
  const goNext = () => goTo(safeIndex + 1)

  useEffect(() => {
    if (count <= 1) return

    const id = window.setInterval(() => {
      setCurrentIndex((prev) => ((prev % count) + 1) % count)
    }, AUTOPLAY_MS)

    return () => window.clearInterval(id)
  }, [count, safeIndex, setCurrentIndex])

  return (
    <div className="homepage-carousel">
      <button
        type="button"
        className="carousel-prev"
        onClick={goPrev}
        aria-label="Previous image"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <div className="carousel-inner">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {images.map((image, index) => {
            const label = getWorkBySlug(image.slug)?.name ?? `Work ${index + 1}`
            return (
              <div className="carousel-item" key={`${image.src}-${image.slug}`}>
                <Link to={`/work/${image.slug}`} className="carousel-link">
                  <img src={image.src} alt={label} />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
      <button
        type="button"
        className="carousel-next"
        onClick={goNext}
        aria-label="Next image"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
      {count > 1 && (
        <div className="carousel-dots" role="tablist" aria-label="Carousel slides">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              className={`carousel-dot${index === safeIndex ? ' is-active' : ''}`}
              aria-label={`Go to image ${index + 1}`}
              aria-selected={index === safeIndex}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type WorkCarouselProps = {
  images: string[]
  currentIndex: number
  setCurrentIndex: Dispatch<SetStateAction<number>>
}

export function WorkCarousel({ images, currentIndex, setCurrentIndex }: WorkCarouselProps) {
  const count = images.length
  const [pageWidth, setPageWidth] = useState(() =>
    typeof window === 'undefined' ? MOBILE_BREAKPOINT_PX + WIDTH_PER_EXTRA_IMAGE_PX : window.innerWidth,
  )

  useEffect(() => {
    const update = () => setPageWidth(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const visibleCount = visibleCountForPageWidth(pageWidth, count)
  const maxStartIndex = Math.max(0, count - visibleCount)
  const safeIndex = count === 0 ? 0 : Math.min(Math.max(0, currentIndex), maxStartIndex)
  const slotPercent = 100 / visibleCount

  const goTo = (index: number) => {
    if (count === 0) return
    const wrapped = ((index % count) + count) % count
    setCurrentIndex(Math.min(wrapped, maxStartIndex))
  }

  const goPrev = () => {
    if (maxStartIndex === 0) return
    goTo(safeIndex <= 0 ? maxStartIndex : safeIndex - 1)
  }

  const goNext = () => {
    if (maxStartIndex === 0) return
    goTo(safeIndex >= maxStartIndex ? 0 : safeIndex + 1)
  }

  useEffect(() => {
    if (currentIndex !== safeIndex) setCurrentIndex(safeIndex)
  }, [currentIndex, safeIndex, setCurrentIndex])

  useEffect(() => {
    if (maxStartIndex === 0) return

    const id = window.setInterval(() => {
      setCurrentIndex((prev) => {
        const start = Math.min(Math.max(0, prev), maxStartIndex)
        return start >= maxStartIndex ? 0 : start + 1
      })
    }, AUTOPLAY_MS)

    return () => window.clearInterval(id)
  }, [maxStartIndex, safeIndex, setCurrentIndex])

  return (
    <div className="work-carousel">
      <button
        type="button"
        className="carousel-prev"
        onClick={goPrev}
        aria-label="Previous image"
        disabled={maxStartIndex === 0}
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <div className="carousel-inner">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${safeIndex * slotPercent}%)` }}
        >
          {images.map((image, index) => (
            <div
              className="carousel-item"
              key={`${image}-${index}`}
              style={{ flex: `0 0 ${slotPercent}%`, maxWidth: `${slotPercent}%` }}
            >
              <img src={image} alt={`Work ${index + 1}`} />
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="carousel-next"
        onClick={goNext}
        aria-label="Next image"
        disabled={maxStartIndex === 0}
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
      {maxStartIndex > 0 && (
        <div className="carousel-dots" role="tablist" aria-label="Carousel slides">
          {Array.from({ length: maxStartIndex + 1 }, (_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              className={`carousel-dot${index === safeIndex ? ' is-active' : ''}`}
              aria-label={`Go to image ${index + 1}`}
              aria-selected={index === safeIndex}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
