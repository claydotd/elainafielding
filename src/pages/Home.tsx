import { Seo } from '../components/Seo'
import { HomepageCarousel } from '../components/Carousels'
import { useState } from 'react'

const images: string[] = [
  `${import.meta.env.BASE_URL}images/home/1.png`,
  `${import.meta.env.BASE_URL}images/home/2.png`,
  `${import.meta.env.BASE_URL}images/home/3.png`,
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
