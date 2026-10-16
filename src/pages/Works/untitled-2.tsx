import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { WorkCarousel } from '../../components/Carousels'
import { Seo } from '../../components/Seo'
import { getWorkBySlug } from '../../data/works'

function homeImage(file: string) {
  return `${import.meta.env.BASE_URL}images/home/${file}`
}

type ScrollStep = {
  image: string
  alt: string
  paragraphs: string[]
}
const steps: ScrollStep[] = [
  {
    image: homeImage('2.png'),
    alt: 'Untitled 2, first view',
    paragraphs: [
      'Replace this text. It stays in the left column and scrolls with the page, while the image on the right holds until the next step.',
      'Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis.',

      'Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis.',

      'Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis.',

      'Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis.',

    ],
  },
  {
    image: homeImage('3.png'),
    alt: 'Untitled 2, second view',
    paragraphs: [
      'This second block swaps the image once its top reaches the middle of the screen.',
      'Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere.',
    ],
  },
  {
    image: homeImage('2.png'),
    alt: 'Untitled 2, third view',
    paragraphs: [
      'Add as many steps as you need. A short block still takes up most of the screen, so each image has room to register.',
      'Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',
    ],
  },
]

/** Images in the carousel below the scrolling text. */
const carouselImages = [homeImage('1.png'), homeImage('2.png'), homeImage('3.png')]

export default function UntitledTwoPage() {
  const work = getWorkBySlug('untitled-2')
  const title = work?.name ?? 'Untitled 2'
  const [activeIndex, setActiveIndex] = useState(0)
  const [carouselIndex, setCarouselIndex] = useState(0)
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
        path="/work/untitled-2"
        description={work?.description ?? `${title}, ${work?.year ?? ''}. ${work?.materials ?? ''}.`}
      />
      <div className="page-container work-details-container">
        <div className="back-link">
          <Link to="/work">← Back to work</Link>
        </div>
        <article className="scroll-story">
          <div className="scroll-story__text">
            <header className="work-gallery__meta">
              <h1 className="work-gallery__name">{title}</h1>
              {work ? (
                <>
                  <p className="work-gallery__materials">{work.materials}</p>
                  <p className="work-gallery__dimensions">{work.dimensions}</p>
                  <p className="work-gallery__year">{work.year}</p>
                </>
              ) : null}
            </header>
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
          <div className="scroll-story__stage">
            <div className="scroll-story__frame">
              {steps.map((step, index) => (
                <img
                  key={`${step.image}-${index}`}
                  src={step.image}
                  alt={step.alt}
                  className={index === activeIndex ? 'is-active' : undefined}
                  aria-hidden={index === activeIndex ? undefined : true}
                />
              ))}
            </div>
          </div>
        </article>
        {carouselImages.length > 0 ? (
          <div className="work-gallery scroll-story__carousel">
            <WorkCarousel
              images={carouselImages}
              currentIndex={carouselIndex}
              setCurrentIndex={setCarouselIndex}
            />
          </div>
        ) : null}
      </div>
    </>
  )
}
