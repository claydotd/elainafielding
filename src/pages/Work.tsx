import { Seo } from '../components/Seo'
import { WorkGalleryItem } from '../components/WorkGalleryItem'
import { works } from '../data/works'

export function Work() {
  return (
    <>
      <Seo
        title="Work"
        path="/work"
        description="Selected works by Elaina Fielding."
      />
      <div className="page-container">
        <article className="page">
          <div className="work-gallery">
            {works.map((work) => (
              <WorkGalleryItem
                key={work.slug}
                to={`/work/${work.slug}`}
                image={work.image}
                name={work.name}
                dimensions={work.dimensions}
                materials={work.materials}
                year={work.year}
              />
            ))}
          </div>
        </article>
      </div>
    </>
  )
}
