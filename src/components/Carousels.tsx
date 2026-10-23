import { useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction, type TransitionEvent } from 'react'
import { Link } from 'react-router-dom'
import { useWorks } from '../context/useWorks'
import { carouselSizes, fittedImage } from '../lib/fitted-image'
import { Icon } from './Icon'

const AUTOPLAY_MS = 8000
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

/** Repeated so a wrap can keep moving onto a clone, then snap back with no animation. */
const LOOP_COPIES = 3

function mod(index: number, count: number) {
  if (count <= 0) return 0
  return ((index % count) + count) % count
}

function repeatSlides<T>(items: T[], copies: number) {
  if (copies <= 1) return items
  const slides: T[] = []
  for (let copy = 0; copy < copies; copy += 1) slides.push(...items)
  return slides
}

function useSeamlessTrack(
  count: number,
  loop: boolean,
  currentIndex: number,
  setCurrentIndex: Dispatch<SetStateAction<number>>,
  layoutKey: number,
) {
  const [position, setPosition] = useState(() => {
    const start = mod(currentIndex, count)
    return loop && count > 0 ? count + start : start
  })
  const [instant, setInstant] = useState(true)
  const [offsetPx, setOffsetPx] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const placedRef = useRef(false)
  const positionRef = useRef(position)
  positionRef.current = position
  const logical = mod(position, count)
  const layoutRef = useRef({ count, loop, layoutKey })
  if (
    layoutRef.current.count !== count ||
    layoutRef.current.loop !== loop ||
    layoutRef.current.layoutKey !== layoutKey
  ) {
    // Position points into the repeated track. Read it with the previous
    // count so a longer list does not turn the first slide into the last.
    const kept = mod(position, layoutRef.current.count)
    layoutRef.current = { count, loop, layoutKey }
    setInstant(true)
    setPosition(loop && count > 0 ? count + kept : kept)
  }

  useEffect(() => {
    if (count === 0 || currentIndex === logical) return
    setCurrentIndex(logical)
  }, [count, currentIndex, logical, setCurrentIndex])

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return

    const measure = () => {
      const index = loop ? positionRef.current : 0
      const slide = track.children.item(index) as HTMLElement | null
      const next = slide ? slide.offsetLeft - track.offsetLeft : 0
      setOffsetPx((current) => (current === next ? current : next))
    }

    measure()
    placedRef.current = true
    const width = track.clientWidth
    const observer = new ResizeObserver(() => {
      if (track.clientWidth === width) return
      setInstant(true)
      measure()
    })
    observer.observe(track)
    return () => observer.disconnect()
  }, [position, loop, layoutKey, count])

  useEffect(() => {
    if (!instant || !placedRef.current) return
    const id = requestAnimationFrame(() => setInstant(false))
    return () => cancelAnimationFrame(id)
  }, [instant, offsetPx])

  useEffect(() => {
    if (!loop || count <= 1) return

    const id = window.setInterval(() => {
      setInstant(false)
      setPosition((prev) => prev + 1)
    }, AUTOPLAY_MS)

    return () => window.clearInterval(id)
  }, [loop, count, logical])

  const shift = (delta: number) => {
    if (!loop || count <= 1 || delta === 0) return
    setInstant(false)
    setPosition((prev) => {
      const next = prev + delta
      const last = count * LOOP_COPIES - 1
      if (next < 0 || next > last) return count + mod(prev, count) + delta
      return next
    })
  }

  const goTo = (index: number) => {
    if (count === 0) return
    const target = mod(index, count)
    if (!loop) {
      setPosition(target)
      return
    }
    setInstant(false)
    setPosition((prev) => prev + (target - mod(prev, count)))
  }

  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform' || !loop || count <= 1) return
    const prev = positionRef.current
    const canonical = count + mod(prev, count)
    if (prev === canonical) return
    setInstant(true)
    setPosition(canonical)
  }

  return {
    position: loop ? position : 0,
    offsetPx,
    instant,
    logical,
    shift,
    goTo,
    onTransitionEnd,
    trackRef,
  }
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
  const { works } = useWorks()
  const count = images.length
  const loop = count > 1
  const track = useSeamlessTrack(count, loop, currentIndex, setCurrentIndex, 0)
  const slides = repeatSlides(images, loop ? LOOP_COPIES : 1)

  return (
    <div className="homepage-carousel">
      <button
        type="button"
        className="carousel-prev"
        onClick={() => track.shift(-1)}
        aria-label="Previous image"
      >
        <Icon name="chevron-left" />
      </button>
      <div className="carousel-inner">
        <div
          ref={track.trackRef}
          className={`carousel-track${track.instant ? ' carousel-track--instant' : ''}`}
          style={{ transform: `translate3d(-${track.offsetPx}px, 0, 0)` }}
          onTransitionEnd={track.onTransitionEnd}
        >
          {slides.map((image, index) => {
            const label = works.find((work) => work.slug === image.slug)?.name ?? `Work ${mod(index, count) + 1}`
            const hidden = index < track.position - 1 || index > track.position + 1
            const current = index === track.position
            return (
              <div className="carousel-item" key={`${image.src}-${image.slug}-${index}`} aria-hidden={hidden}>
                <Link to={`/work/${image.slug}`} className="carousel-link" tabIndex={hidden ? -1 : undefined}>
                  {hidden ? null : (
                    <img
                      {...fittedImage(image.src, 'hero')}
                      alt={label}
                      decoding="async"
                      loading="eager"
                      fetchPriority={current ? 'high' : 'low'}
                    />
                  )}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
      <button
        type="button"
        className="carousel-next"
        onClick={() => track.shift(1)}
        aria-label="Next image"
      >
        <Icon name="chevron-right" />
      </button>
      {count > 1 && (
        <div className="carousel-dots" role="tablist" aria-label="Carousel slides">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              className={`carousel-dot${index === track.logical ? ' is-active' : ''}`}
              aria-label={`Go to image ${index + 1}`}
              aria-selected={index === track.logical}
              onClick={() => track.goTo(index)}
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
  const canScroll = count > visibleCount
  const slotPercent = 100 / visibleCount
  const track = useSeamlessTrack(count, canScroll, currentIndex, setCurrentIndex, visibleCount)
  const slides = repeatSlides(images, canScroll ? LOOP_COPIES : 1)

  return (
    <div className="work-carousel">
      {canScroll && (
        <button
          type="button"
          className="carousel-prev"
          onClick={() => track.shift(-1)}
          aria-label="Previous image"
        >
          <Icon name="chevron-left" />
        </button>
      )}
      <div className="carousel-inner">
        <div
          ref={track.trackRef}
          className={`carousel-track${track.instant ? ' carousel-track--instant' : ''}`}
          style={{ transform: `translate3d(-${track.offsetPx}px, 0, 0)` }}
          onTransitionEnd={track.onTransitionEnd}
        >
          {slides.map((image, index) => {
            const hidden = index < track.position - 1 || index > track.position + visibleCount
            return (
              <div
                className="carousel-item"
                key={`${image}-${index}`}
                style={{ flex: `0 0 ${slotPercent}%`, maxWidth: `${slotPercent}%` }}
                aria-hidden={hidden}
              >
                {hidden ? null : (
                  <img
                    {...fittedImage(image, 'carousel', carouselSizes(visibleCount))}
                    alt={`Work ${mod(index, count) + 1}`}
                    decoding="async"
                    loading="eager"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
      {canScroll && (
        <button
          type="button"
          className="carousel-next"
          onClick={() => track.shift(1)}
          aria-label="Next image"
        >
          <Icon name="chevron-right" />
        </button>
      )}
      {canScroll && (
        <div className="carousel-dots" role="tablist" aria-label="Carousel slides">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              className={`carousel-dot${index === track.logical ? ' is-active' : ''}`}
              aria-label={`Go to image ${index + 1}`}
              aria-selected={index === track.logical}
              onClick={() => track.goTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
