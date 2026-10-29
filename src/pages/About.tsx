import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { ContactForm } from '../components/Contact'
import { AboutContent } from '../components/AboutContent'
import { aboutSeed, type AboutBlock } from '../data/about'
import { fetchAbout } from '../lib/about'
import { scrollToHash } from '../lib/scroll-to-hash'

export function About() {
  const [blocks, setBlocks] = useState<AboutBlock[] | null>(null)
  const { hash } = useLocation()

  useEffect(() => {
    let cancelled = false
    fetchAbout().then((next) => {
      if (!cancelled) setBlocks(next ?? aboutSeed)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Contact only mounts after about content loads; retry hash scroll then.
  useEffect(() => {
    if (!blocks || !hash) return
    const frame = requestAnimationFrame(() => {
      scrollToHash(hash)
    })
    return () => cancelAnimationFrame(frame)
  }, [blocks, hash])

  return (
    <>
      <Seo
        title="About"
        path="/about"
        description="About Elaina Fielding, Sculpture Artist, Edinburgh"
      />
      <div className="page-container page-container--about">
        {blocks ? (
          <>
            <article className="about-page">
              <AboutContent blocks={blocks} />
            </article>
            <ContactForm />
          </>
        ) : (
          <article className="page" aria-busy="true" />
        )}
      </div>
    </>
  )
}
