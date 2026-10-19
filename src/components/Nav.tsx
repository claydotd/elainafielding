import { useEffect, useId, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

/** Flip this to demo nav layouts: 'stacked' | 'logo-centered' | 'standard' */
const navVariant: 'stacked' | 'logo-centered' | 'standard' = 'logo-centered'

const links: { to: string; label: string; end?: boolean }[] = [
  { to: '/work', label: 'Work' },
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/about#contact', label: 'Contact' },
]

{/*
  const links: { to: string; label: string; end?: boolean }[] = [
  { to: '/work', label: 'Work' },
  // { to: '/about', label: 'About' },
  { to: '/', label: 'Shop' },
  { to: '/about', label: 'About + Contact' },
]
  
  */}

const leftLinks = links.slice(0, 2)
const rightLinks = links.slice(2)

function isCurrent(
  to: string,
  pathname: string,
  end: boolean | undefined,
  contactActive: boolean,
) {
  if (to === '/about#contact') return pathname === '/about' && contactActive
  if (to === '/about') return pathname === '/about' && !contactActive

  const path = to.split('#')[0]
  if (end || path === '/') return pathname === path
  return pathname === path || pathname.startsWith(`${path}/`)
}

function LinkList({
  items,
  className,
  onNavigate,
  pathname,
  contactActive,
}: {
  items: typeof links
  className: string
  onNavigate?: () => void
  pathname: string
  contactActive: boolean
}) {
  return (
    <ul className={className}>
      {items.map(({ to, label, end }) => {
        const current = isCurrent(to, pathname, end, contactActive)
        return (
          <li key={`${className}-${to}`}>
            <Link
              to={to}
              className="nav-link"
              aria-current={current ? 'page' : undefined}
              onClick={onNavigate}
            >
              {label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function MenuButton({
  open,
  controlsId,
  onClick,
}: {
  open: boolean
  controlsId: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="nav-toggle"
      aria-expanded={open}
      aria-controls={controlsId}
      onClick={onClick}
    >
      <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
      <span className="nav-toggle-icon" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  )
}

function useContactActive(pathname: string, hash: string) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (pathname !== '/about') {
      setActive(false)
      return
    }

    const contact = document.getElementById('contact')
    if (!contact) return

    function update() {
      if (!contact) return
      // The form only needs to reach the upper half of the viewport.
      // On tall screens it never scrolls as far as the nav.
      const line = window.innerHeight * 0.5
      setActive(contact.getBoundingClientRect().top <= line)
    }

    update()
    let cancelled = false
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) update()
      })
    })

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [pathname, hash])

  return active
}

export function Nav() {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const { pathname, hash } = useLocation()
  const contactActive = useContactActive(pathname, hash)

  useEffect(() => {
    setOpen(false)
  }, [pathname, hash])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 641px)')

    function closeOnDesktop() {
      if (desktop.matches) setOpen(false)
    }

    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  function closeMenu() {
    setOpen(false)
  }

  const bar =
    navVariant === 'logo-centered' ? (
      <>
        <LinkList
          items={leftLinks}
          className="nav-links nav-links-left"
          pathname={pathname}
          contactActive={contactActive}
        />
        <NavLink to="/" className="nav-brand" end onClick={closeMenu}>
          Elaina Fielding
        </NavLink>
        <div className="nav-bar-end">
          <LinkList
            items={rightLinks}
            className="nav-links nav-links-right"
            pathname={pathname}
            contactActive={contactActive}
          />
          <MenuButton
            open={open}
            controlsId={menuId}
            onClick={() => setOpen((value) => !value)}
          />
        </div>
      </>
    ) : (
      <>
        <NavLink to="/" className="nav-brand" end onClick={closeMenu}>
          Elaina Fielding
        </NavLink>
        <div className="nav-bar-end">
          <LinkList
            items={links}
            className="nav-links"
            pathname={pathname}
            contactActive={contactActive}
          />
          <MenuButton
            open={open}
            controlsId={menuId}
            onClick={() => setOpen((value) => !value)}
          />
        </div>
      </>
    )

  return (
    <header className="site-header">
      <nav className={`nav nav--${navVariant}${open ? ' is-open' : ''}`} aria-label="Primary">
        <div className="nav-bar">{bar}</div>
        <div id={menuId} className="nav-menu" inert={!open}>
          <div className="nav-menu-inner">
            <LinkList
              items={links}
              className="nav-links nav-links-menu"
              onNavigate={closeMenu}
              pathname={pathname}
              contactActive={contactActive}
            />
          </div>
        </div>
      </nav>
    </header>
  )
}
