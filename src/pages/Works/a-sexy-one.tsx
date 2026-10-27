import { useEffect, useRef, useState } from 'react'
import { WorkMeta } from '../../components/WorkGalleryItem'
import { BackToWork, WorkNeighbors } from '../../components/WorkDetailsTemplate'
import { Seo } from '../../components/Seo'
import { useWorks } from '../../context/useWorks'
import { workPieces, workSummary } from '../../data/works'
import { fittedImage } from '../../lib/fitted-image'
import './a-sexy-one.css'

type ScrollStep = {
  image: string
  alt: string
  paragraphs: string[]
}

const steps: ScrollStep[] = [
  {
    image: '/images/works/9b7b0d5e-c443-4d1d-ab27-ad5186576794.jpg',
    alt: 'A Sexy One, view 1',
    paragraphs: [
      'Scroll to rotate the object.'
    ],
  },
  {
    image: '/images/works/42f71881-df96-4ae9-a7cb-cd8683de113b.jpg',
    alt: 'A Sexy One, view 2',
    paragraphs: [
    ],
  },
  {
    image: '/images/works/780d8fd5-e6e6-41db-b389-b079853997de.jpg',
    alt: 'A Sexy One, view 3',
    paragraphs: [],
  },
  {
    image: '/images/works/f72afa14-6406-4f25-ba41-0a3de24a7075.jpg',
    alt: 'A Sexy One, view 4',
    paragraphs: [],
  },
  {
    image: '/images/works/392305a5-6789-449f-9c31-b97a2e55a200.jpg',
    alt: 'A Sexy One, view 5',
    paragraphs: [],
  },
  {
    image: '/images/works/eb064a6a-6375-40c6-8be8-1f231e0e74fc.jpg',
    alt: 'A Sexy One, view 6',
    paragraphs: [],
  },
]

const closingImage = {
  src: '/images/works/5fcc234c-26cb-4d7b-b9ae-3270dfd0923c.jpg',
  alt: 'A Sexy One, view 7',
}

export default function ASexyOnePage() {
  const { works } = useWorks()
  const work = works.find((item) => item.slug === 'a-sexy-one')
  const title = work?.name ?? 'A Sexy One'
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
  }, [])

  return (
    <>
      <Seo
        title={title}
        path="/work/a-sexy-one"
        description={work?.description ?? workSummary(work ?? { name: title, year: '', materials: '', dimensions: '' })}
      />
      <div className="page-container work-details-container">
        <BackToWork slug="a-sexy-one" />
        <article className="scroll-story">
          <div className="scroll-story__meta">
            <WorkMeta
              heading="h1"
              pieces={work ? workPieces(work) : [{ title, year: '', materials: '', dimensions: '' }]}
              location={work?.location}
            />
          </div>
          <div className="scroll-story__body">
            <div className="scroll-story__stage">
              <div className="scroll-story__frame">
                {steps.map((step, index) => (
                  <img
                    key={`${step.image}-${index}`}
                    {...fittedImage(step.image, 'hero', '(max-width: 640px) 66vw, 50vw')}
                    alt={step.alt}
                    className={index === activeIndex ? 'is-active' : undefined}
                    aria-hidden={index === activeIndex ? undefined : true}
                    decoding="async"
                    loading={index === activeIndex ? 'eager' : 'lazy'}
                  />
                ))}
              </div>
            </div>
            <div className="scroll-story__text">
              {steps.map((step, index) => (
                <section
                  key={step.alt}
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
          </div>
        </article>
        <div className="scroll-story__closing">
          <img
            {...fittedImage(closingImage.src, 'hero', '100vw')}
            alt={closingImage.alt}
            decoding="async"
            loading="lazy"
          />
        </div>
        <WorkNeighbors slug="a-sexy-one" />
      </div>
    </>
  )
}
