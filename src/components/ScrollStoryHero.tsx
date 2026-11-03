import { useEffect, useRef, useState } from 'react'
import { readImageCrop, scrollCropClass, type ImageCrop } from '../data/image-crop'
import type { ScrollStoryStep, WorkPiece } from '../data/works-seed'
import { fittedImage } from '../lib/fitted-image'
import { FadeImage } from './FadeImage'
import { WorkDescription } from './WorkDescription'
import { WorkMeta } from './WorkGalleryItem'
import '../pages/Works/scroll-story.css'

type ScrollStoryHeroProps = {
  pieces: WorkPiece[]
  location?: string
  description?: string
  steps: ScrollStoryStep[]
  crop?: ImageCrop
  fallbackTitle: string
}

export function ScrollStoryHero({
  pieces,
  location,
  description = '',
  steps,
  crop = 'original',
  fallbackTitle,
}: ScrollStoryHeroProps) {
  const frames = steps
  const resolvedCrop = readImageCrop(crop)
  const cropped = resolvedCrop !== 'original'
  const [activeIndex, setActiveIndex] = useState(0)
  const chaptersRef = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const marker = window.innerHeight * 0.42
      let next = 0

      chaptersRef.current.forEach((chapter, index) => {
        if (!chapter) return
        if (chapter.getBoundingClientRect().top <= marker) next = index
      })

      setActiveIndex((current) => (current === next ? current : next))
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [frames.length])

  return (
    <article className="scroll-story">
      <div className="scroll-story__meta">
        <WorkMeta heading="h1" pieces={pieces} location={location} />
        <WorkDescription description={description} />
      </div>

      <div className="scroll-story__stage">
        <div className={['scroll-story__frame', scrollCropClass(resolvedCrop)].filter(Boolean).join(' ')}>
          {frames.map((step, index) => {
            const imageProps = {
              ...fittedImage(step.image, 'hero', '(max-width: 640px) 66vw, 50vw'),
              alt: step.alt || fallbackTitle,
              className: index === activeIndex ? 'is-active' : undefined,
              'aria-hidden': index === activeIndex ? undefined : true,
              decoding: 'async' as const,
              loading: (index === activeIndex ? 'eager' : 'lazy') as 'eager' | 'lazy',
              fetchPriority: index === 0 ? 'high' as const : undefined,
              style: { aspectRatio: 'unset' },
            }

            if (!cropped) {
              return <FadeImage key={`${step.image}-${index}`} {...imageProps} />
            }

            return (
              <div
                key={`${step.image}-${index}`}
                className={['scroll-story__crop', index === activeIndex ? 'is-active' : ''].filter(Boolean).join(' ')}
              >
                <FadeImage {...imageProps} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="scroll-story__text">
        {frames.map((step, index) => (
          <section
            key={`${step.alt}-${index}`}
            className="scroll-story__chapter"
            ref={(node) => {
              chaptersRef.current[index] = node
            }}
            aria-current={index === activeIndex ? 'true' : undefined}
          >
            {step.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </article>
  )
}
