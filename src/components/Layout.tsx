import { Outlet, useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { Footer } from './Footer'

export function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className="site">
      <Nav />
      <main className="site-main">
        <Outlet />
      </main>
      {!isHome && <Footer />}
    </div>
  )
}
