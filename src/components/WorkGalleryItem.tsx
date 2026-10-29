import { Link } from 'react-router-dom'
import type { WorkPiece } from '../data/works'
import { fittedImage } from '../lib/fitted-image'
import { FadeImage } from './FadeImage'

type WorkMetaProps = {
  pieces: WorkPiece[]
  location?: string
  heading?: 'h1' | 'h2'
}

export function WorkMeta({ pieces, location, heading = 'h2' }: WorkMetaProps) {
  const Heading = heading
  const visible = pieces.filter((piece) => piece.title || piece.subtitle || piece.materials || piece.dimensions || piece.year)
  if (visible.length === 0 && !location) return null

  return (
    <div className="work-gallery__meta">
      {visible.map((piece, index) => (
        <div className="work-gallery__piece" key={`${piece.title}-${piece.year}-${index}`}>
          {piece.title || piece.year ? (
            index === 0
              ? <Heading className="work-gallery__name">{pieceLabel(piece)}</Heading>
              : <p className="work-gallery__name">{pieceLabel(piece)}</p>
          ) : null}
          {piece.subtitle ? <p className="work-gallery__subtitle">{piece.subtitle}</p> : null}
          {piece.materials ? <p className="work-gallery__materials">{piece.materials}</p> : null}
          {piece.dimensions ? <p className="work-gallery__dimensions">{piece.dimensions}</p> : null}
        </div>
      ))}
      {/* {location ? <p className="work-gallery__location">{location}</p> : null} */}
    </div>
  )
}

function pieceLabel(piece: WorkPiece) {
  if (piece.title && piece.year) return `${piece.title} (${piece.year})`
  if (piece.title) return piece.title
  return `(${piece.year})`
}

type WorkGalleryItemProps = {
  id?: string
  image: string
  name: string
  pieces: WorkPiece[]
  location?: string
  to: string
  alt?: string
  priority?: boolean
}

export function WorkGalleryItem({
  id,
  image,
  name,
  pieces,
  location,
  to,
  alt,
  priority = false,
}: WorkGalleryItemProps) {
  return (
    <Link to={to} id={id} className="work-gallery__item">
      <div className="work-gallery__media">
        {image ? (
          <FadeImage
            {...fittedImage(image, 'gallery')}
            alt={alt ?? name}
            decoding="async"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
          />
        ) : (
          <div className="work-gallery__fallback" role="img" aria-label={alt ?? name} />
        )}
      </div>
      <WorkMeta pieces={pieces} location={location} />
    </Link>
  )
}
