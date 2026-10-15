type WorkGalleryItemProps = {
  image: string
  name: string
  dimensions: string
  materials: string
  year: string
  alt?: string
}

export function WorkGalleryItem({
  image,
  name,
  dimensions,
  materials,
  year,
  alt,
}: WorkGalleryItemProps) {
  return (
    <article className="work-gallery__item">
      <div className="work-gallery__media">
        <img src={image} alt={alt ?? name} />
      </div>
      <div className="work-gallery__meta">
        <h2 className="work-gallery__name">{name}</h2>
        <p className="work-gallery__materials">{materials}</p>
        <p className="work-gallery__dimensions">{dimensions}</p>
        <p className="work-gallery__year">{year}</p>
      </div>
    </article>
  )
}
