import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { Footer } from './Footer'

export function Layout() {
  const { pathname, hash } = useLocation()
  const isHome = pathname === '/'

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (hash) {
        const target = document.getElementById(decodeURIComponent(hash.slice(1)))
        if (target) {
          const offset = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0
          const top = target.getBoundingClientRect().top + window.scrollY - offset
          window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'instant' })
          return
        }
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
