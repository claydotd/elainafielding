import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorks } from '../context/useWorks'
import type { WorkItem, WorkPiece } from '../data/works'
import { workListHref } from '../lib/work-list'
import { fittedImage } from '../lib/fitted-image'
import { WorkCarousel } from './Carousels'
import { WorkMeta } from './WorkGalleryItem'

type WorkDetailsTemplateProps = {
  slug: string
  title: string
  pieces: WorkPiece[]
  location?: string
  description: string
  image: string
  images: string[]
}

export function BackToWork({ slug }: { slug: string }) {
  const { works } = useWorks()

  return (
    <div className="back-link">
      <Link to={workListHref(works, slug)}>← Back to work</Link>
    </div>
  )
}

export function WorkNeighbors({ slug }: { slug: string }) {
  const { works } = useWorks()
  const index = works.findIndex((work) => work.slug === slug)
  const previous = index > 0 ? works[index - 1] : null
  const next = index >= 0 && index < works.length - 1 ? works[index + 1] : null
  if (!previous && !next) return null

  return (
    <nav className="work-neighbors" aria-label="Other works">
      {previous ? <WorkNeighborLink work={previous} direction="previous" /> : null}
      {next ? <WorkNeighborLink work={next} direction="next" /> : null}
    </nav>
  )
}

export function WorkDetailsTemplate({ slug, title, pieces, location, description, image, images }: WorkDetailsTemplateProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <div className="work-details-container">
      <BackToWork slug={slug} />
      <article className="work-details">
        {image ? (
          <div className="work-details__media">
            <img
              {...fittedImage(image, 'hero', '(max-width: 640px) 66vw, 55vw')}
              alt={title}
              decoding="async"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        ) : null}
        <div className="work-details__text">
          <WorkMeta pieces={pieces} location={location} />
          {description ? (
            <div className="work-details__description">
              <p>{description}</p>
            </div>
          ) : null}
        </div>
        {images.length > 0 ? (
          <div className="work-gallery">
            <WorkCarousel images={images} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />
          </div>
        ) : null}
      </article>
      <WorkNeighbors slug={slug} />
    </div>
  )
}

function WorkNeighborLink({ work, direction }: { work: WorkItem; direction: 'previous' | 'next' }) {
  const label = direction === 'previous' ? '← Previous' : 'Next →'

  return (
    <Link
      to={`/work/${work.slug}`}
      className={direction === 'next' ? 'work-neighbor work-neighbor--next' : 'work-neighbor'}
      rel={direction === 'previous' ? 'prev' : 'next'}
    >
      <span className="work-neighbor__direction">{label}</span>
      <span className="work-neighbor__details">
        {work.name ? <span className="work-neighbor__title">{work.name}</span> : null}
        {work.year ? <span className="work-neighbor__year">{work.year}</span> : null}
      </span>
    </Link>
  )
}
