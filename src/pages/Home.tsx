import { useEffect, useState } from 'react'
import { HomepageCarousel, type HomepageImage } from '../components/Carousels'
import { Seo } from '../components/Seo'
import { homepageSeed } from '../data/homepage'
import { fetchHomepage } from '../lib/homepage'

const fallback: HomepageImage[] = homepageSeed.map((slide) => ({
  src: slide.image,
  slug: slide.slug,
}))

export function Home() {
  const [images, setImages] = useState<HomepageImage[] | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchHomepage().then((slides) => {
      if (cancelled) return
      setImages(slides ? slides.map((slide) => ({ src: slide.image, slug: slide.slug })) : fallback)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <Seo
        path="/"
        description="Elaina Fielding | Artist"
      />
      <article className="page">
        {images == null ? <div className="homepage-carousel" aria-hidden="true" /> : null}
        {images && images.length > 0 ? (
          <HomepageCarousel images={images} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />
        ) : null}
      </article>
    </>
  )
}
