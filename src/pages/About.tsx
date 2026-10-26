import { useEffect, useState } from 'react'
import { Seo } from '../components/Seo'
import { ContactForm } from '../components/Contact'
import { AboutContent } from '../components/AboutContent'
import { aboutSeed, type AboutBlock } from '../data/about'
import { fetchAbout } from '../lib/about'

export function About() {
  const [blocks, setBlocks] = useState<AboutBlock[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchAbout().then((next) => {
      if (!cancelled) setBlocks(next ?? aboutSeed)
    })
    return () => {
      cancelled = true
    }
  }, [])

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
            <article className="page">
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
