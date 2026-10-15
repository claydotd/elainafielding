import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

const AUTOPLAY_MS = 4000
const MAX_IMAGES_DISPLAYED = 2
const MIN_IMAGES_DISPLAYED = 1
/** Preferred minimum width per visible image; drives how many fit between the arrows. */
const MIN_ITEM_WIDTH_PX = 360

function visibleCountForWidth(width: number, imageCount: number) {
  if (imageCount <= 0) return MIN_IMAGES_DISPLAYED
  const fitted = Math.floor(width / MIN_ITEM_WIDTH_PX)
  const clamped = Math.min(
    MAX_IMAGES_DISPLAYED,
    Math.max(MIN_IMAGES_DISPLAYED, fitted),
  )
  return Math.min(clamped, imageCount)
}

type HomepageCarouselProps = {
  images: string[]
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
          {images.map((image, index) => (
            <div className="carousel-item" key={image}>
              <img
                src={image}
                alt={`Homepage work ${index + 1}`}
              />
            </div>
          ))}
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
  const innerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(MIN_IMAGES_DISPLAYED)

  useEffect(() => {
    const el = innerRef.current
    if (!el) return

    const update = () => {
      setVisibleCount(visibleCountForWidth(el.clientWidth, count))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [count])

  const maxStartIndex = Math.max(0, count - visibleCount)
  const safeIndex = count === 0 ? 0 : Math.min(Math.max(0, currentIndex), maxStartIndex)

  const goTo = (index: number) => {
    if (count === 0) return
    setCurrentIndex(((index % count) + count) % count)
  }

  useEffect(() => {
    if (currentIndex !== safeIndex) {
      setCurrentIndex(safeIndex)
    }
  }, [currentIndex, safeIndex, setCurrentIndex])

  const goPrev = () => {
    if (count <= visibleCount) return
    setCurrentIndex(safeIndex <= 0 ? maxStartIndex : safeIndex - 1)
  }

  const goNext = () => {
    if (count <= visibleCount) return
    setCurrentIndex(safeIndex >= maxStartIndex ? 0 : safeIndex + 1)
  }

  useEffect(() => {
    if (count <= visibleCount) return

    const id = window.setInterval(() => {
      setCurrentIndex((prev) => {
        const clamped = Math.min(Math.max(0, prev), maxStartIndex)
        return clamped >= maxStartIndex ? 0 : clamped + 1
      })
    }, AUTOPLAY_MS)

    return () => window.clearInterval(id)
  }, [count, visibleCount, maxStartIndex, safeIndex, setCurrentIndex])

  const trackWidthPercent = count === 0 ? 100 : (count / visibleCount) * 100
  const itemWidthPercent = count === 0 ? 100 : 100 / count
  const translatePercent = count === 0 ? 0 : (safeIndex * 100) / count

  return (
    <div className="work-carousel">
      <button
        type="button"
        className="carousel-prev"
        onClick={goPrev}
        aria-label="Previous image"
        disabled={count <= visibleCount}
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <div className="carousel-inner" ref={innerRef}>
        <div
          className="carousel-track"
          style={{
            width: `${trackWidthPercent}%`,
            transform: `translateX(-${translatePercent}%)`,
          }}
        >
          {images.map((image, index) => (
            <div
              className="carousel-item"
              key={image}
              style={{ flex: `0 0 ${itemWidthPercent}%` }}
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
        disabled={count <= visibleCount}
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
