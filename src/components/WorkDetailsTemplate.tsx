import { useState } from 'react'
import { WorkCarousel } from './Carousels'
import { Link } from 'react-router-dom'

type WorkDetailsTemplateProps = {
  title: string
  dimensions: string
  materials: string
  year: string
  description: string
  image: string
  images: string[]
}

export function WorkDetailsTemplate({ title, dimensions, materials, year, description, image, images }: WorkDetailsTemplateProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <div className="work-details-container">
      <div className="back-link">
        <Link to="/work">← Back to work</Link>
      </div>
    <article className="work-details">
      <div className="work-details__media">
        {/* hig high quality image of work on left */}
        <img src={image} alt={title} />
      </div>
      <div className="work-details__text">
        <div className="work-gallery__meta">
          {/* text on right with title, dimensions, materials, and year */}
          <h2 className="work-gallery__name">{title}</h2>
          <p className="work-gallery__materials">{materials}</p>
          <p className="work-gallery__dimensions">{dimensions}</p>
          <p className="work-gallery__year">{year}</p>
        </div>
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
    </div>
  )
}