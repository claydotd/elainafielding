import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { scrollToHash } from '../lib/scroll-to-hash'
import { Nav } from './Nav'
import { Footer } from './Footer'

export function Layout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (hash) {
        scrollToHash(hash)
        return
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    })

    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return (
    <div className="site">
      <Nav />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
