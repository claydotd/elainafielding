import { Seo } from '../components/Seo'
import { HomepageCarousel, type HomepageImage } from '../components/Carousels'
import { useState } from 'react'

const images: HomepageImage[] = [
  { src: `${import.meta.env.BASE_URL}images/home/1.png`, slug: 'untitled-1' },
  { src: `${import.meta.env.BASE_URL}images/home/2.png`, slug: 'untitled-2' },
  { src: `${import.meta.env.BASE_URL}images/home/3.png`, slug: 'untitled-3' },
]

export function Home() {
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <>
      <Seo
        path="/"
        description="Elaina Fielding | Artist"
      />
      <article className="page">
        {/* Image Carousel */}
        <HomepageCarousel images={images} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />
      </article>
    </>
  )
}
