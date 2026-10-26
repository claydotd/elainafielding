import { useEffect, useState } from 'react'
import { HomepageCarousel, type HomepageImage } from '../components/Carousels'
import { Seo } from '../components/Seo'
import { homepageSeed } from '../data/homepage'
import { fetchHomepage } from '../lib/homepage'

export function Home() {
  const [images, setImages] = useState<HomepageImage[] | null>(null)
  const [showCaptions, setShowCaptions] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchHomepage().then((homepage) => {
      if (cancelled) return
      const slides = homepage?.slides ?? homepageSeed
      setShowCaptions(homepage?.showCaptions === true)
      setImages(slides.map((slide) => ({ src: slide.image, slug: slide.slug, caption: slide.caption })))
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
          <HomepageCarousel images={images} showCaptions={showCaptions} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />
        ) : null}
      </article>
    </>
  )
}
