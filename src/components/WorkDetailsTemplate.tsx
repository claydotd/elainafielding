import { Link } from 'react-router-dom'
import { useWorks } from '../context/useWorks'
import type { AboutAlign, AboutBlock, AboutImageAlign, AboutWidth } from '../data/about'
import {
  leadImageClass,
  type MastheadFit,
  type MastheadText,
  type ScrollStoryStep,
  type WorkImageSize,
  type WorkItem,
  type WorkPiece,
  type WorkTemplate,
} from '../data/works'
import { workListHref } from '../lib/work-list'
import { fittedImage } from '../lib/fitted-image'
import { AboutContent } from './AboutContent'
import { FadeImage } from './FadeImage'
import { ScrollStoryHero } from './ScrollStoryHero'
import { WorkDescription } from './WorkDescription'
import { WorkMeta } from './WorkGalleryItem'

type WorkDetailsTemplateProps = {
  slug: string
  title: string
  pieces: WorkPiece[]
  location?: string
  description: string
  descriptionAlign?: AboutAlign
  descriptionWidth?: AboutWidth
  descriptionPlacement?: AboutImageAlign
  image: string
  imageSize?: WorkImageSize
  imageAlign?: AboutImageAlign
  blocks?: AboutBlock[]
  template?: WorkTemplate
  mastheadText?: MastheadText
  mastheadFit?: MastheadFit
  scrollSteps?: ScrollStoryStep[]
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

export function WorkDetailsTemplate({
  slug,
  title,
  pieces,
  location,
  description,
  descriptionAlign = 'justify',
  descriptionWidth = 'medium',
  descriptionPlacement = 'left',
  image,
  imageSize = 'default',
  imageAlign = 'left',
  blocks = [],
  template = 'standard',
  mastheadText = 'light',
  mastheadFit = 'frame',
  scrollSteps = [],
}: WorkDetailsTemplateProps) {
  const mediaClass = leadImageClass(imageSize, imageAlign)

  return (
    <div className="work-details-container">
      <BackToWork slug={slug} />
      {template === 'scroll-story' ? (
        <ScrollStoryHero
          pieces={pieces}
          location={location}
          description={description}
          steps={scrollSteps}
          fallbackTitle={title}
        />
      ) : template === 'masthead' ? (
        <MastheadHero
          title={title}
          pieces={pieces}
          location={location}
          image={image}
          imageSize={imageSize}
          imageAlign={imageAlign}
          text={mastheadText}
          fit={mastheadFit}
        />
      ) : template === 'column' ? (
        <ColumnHero
          title={title}
          pieces={pieces}
          location={location}
          description={description}
          descriptionAlign={descriptionAlign}
          descriptionWidth={descriptionWidth}
          descriptionPlacement={descriptionPlacement}
          image={image}
        />
      ) : (
        <article className="work-details">
          <div className="work-details__text">
            <div className="work-details__meta">
              <WorkMeta pieces={pieces} location={location} />
            </div>
            <WorkDescription description={description} />
          </div>

          {image ? (
            <div className={['work-details__media', mediaClass].filter(Boolean).join(' ')}>
              <FadeImage
                {...fittedImage(image, 'hero', '(max-width: 640px) 66vw, 55vw')}
                alt={title}
                decoding="async"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          ) : null}
        </article>
      )}

      {template === 'masthead' ? (
        <WorkDescription
          description={description}
          align={descriptionAlign}
          width={descriptionWidth}
          placement={descriptionPlacement}
          className="work-details__description--after-hero"
        />
      ) : null}

      {blocks.length > 0 ? (
        <div className="work-details__blocks">
          <AboutContent blocks={blocks} />
        </div>
      ) : null}

      <WorkNeighbors slug={slug} />
    </div>
  )
}

function MastheadHero({
  title,
  pieces,
  location,
  image,
  imageSize = 'default',
  imageAlign = 'left',
  text,
  fit,
}: {
  title: string
  pieces: WorkPiece[]
  location?: string
  image: string
  imageSize?: WorkImageSize
  imageAlign?: AboutImageAlign
  text: MastheadText
  fit: MastheadFit
}) {
  const mediaClass = leadImageClass(imageSize, imageAlign)

  return (
    <section className={`work-masthead work-masthead--${text} work-masthead--fit-${fit}`}>
      <div className="work-masthead__column">
        {image ? (
          <div className={['work-masthead__media', mediaClass].filter(Boolean).join(' ')}>
            <FadeImage
              {...fittedImage(image, 'hero', '100vw')}
              alt={title}
              decoding="async"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        ) : null}
        <div className="work-masthead__overlay">
          <div className="work-masthead__meta">
            <WorkMeta heading="h1" pieces={pieces} location={location} />
          </div>
        </div>
        {/* Scroll room while the lead stays sticky and unobstructed, then blocks begin. */}
        <div className="work-masthead__runway" aria-hidden="true" />
      </div>
    </section>
  )
}

function ColumnHero({
  title,
  pieces,
  location,
  description,
  descriptionAlign,
  descriptionWidth,
  descriptionPlacement,
  image,
}: {
  title: string
  pieces: WorkPiece[]
  location?: string
  description: string
  descriptionAlign: AboutAlign
  descriptionWidth: AboutWidth
  descriptionPlacement: AboutImageAlign
  image: string
}) {
  const widthClass =
    descriptionWidth === 'medium' ? 'width-medium'
      : descriptionWidth === 'small' ? 'width-small'
        : ''
  const placeClass =
    descriptionPlacement === 'center' ? 'place-center'
      : descriptionPlacement === 'right' ? 'place-right'
        : 'place-left'

  return (
    <article className={['work-column', widthClass, placeClass].filter(Boolean).join(' ')}>
      {image ? (
        <div className="work-column__media">
          <FadeImage
            {...fittedImage(image, 'hero', '(max-width: 640px) 100vw, 50rem')}
            alt={title}
            decoding="async"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      ) : null}
      <div className="work-column__details">
        <div className="work-column__meta">
          <WorkMeta heading="h1" pieces={pieces} location={location} />
        </div>
        <WorkDescription
          description={description}
          align={descriptionAlign}
          width="full"
          className="work-column__description"
        />
      </div>
    </article>
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
