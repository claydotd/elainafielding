import { useEffect, useState } from 'react'
import { HomepageCarousel, type HomepageImage } from '../components/Carousels'
import { Seo } from '../components/Seo'
import type { CarouselCrop } from '../data/carousel'
import { homepageSeed } from '../data/homepage'
import { fetchHomepage } from '../lib/homepage'

export function Home() {
  const [images, setImages] = useState<HomepageImage[] | null>(null)
  const [showCaptions, setShowCaptions] = useState(false)
  const [carouselCrop, setCarouselCrop] = useState<CarouselCrop>('none')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchHomepage().then((homepage) => {
      if (cancelled) return
      const slides = homepage?.slides ?? homepageSeed
      setShowCaptions(homepage?.showCaptions === true)
      setCarouselCrop(homepage?.carouselCrop ?? 'none')
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
          <HomepageCarousel
            images={images}
            showCaptions={showCaptions}
            carouselCrop={carouselCrop}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />
        ) : null}
      </article>
    </>
  )
}
