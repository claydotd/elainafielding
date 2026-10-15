import { Seo } from '../components/Seo'
import { WorkGalleryItem } from '../components/WorkGalleryItem'

const works = [
  {
    image: `${import.meta.env.BASE_URL}images/home/1.png`,
    name: "Untitled",
    dimensions: "16in × 6in",
    materials: "Elastic bands, card",
    year: "2023"
  },
  {
    image: `${import.meta.env.BASE_URL}images/home/2.png`,
    name: "Untitled",
    dimensions: "16in × 6in",
    materials: "Elastic bands, card",
    year: "2023"
  },
  {
    image: `${import.meta.env.BASE_URL}images/home/3.png`,
    name: "Untitled",
    dimensions: "16in × 6in",
    materials: "Elastic bands, card",
    year: "2023"
  }
]

export function Work() {
  return (
    <>
      <Seo
        title="Work"
        path="/work"
        description="Selected work by Elaina Fielding."
      />
      <div className="page-container">
        <article className="page">
          <div className="work-gallery">
            {works.map((work) => (
              <WorkGalleryItem
                key={work.image}
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
