import { useEffect, useId, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

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

function LinkList({
  items,
  className,
  onNavigate,
}: {
  items: typeof links
  className: string
  onNavigate?: () => void
}) {
  return (
    <ul className={className}>
      {items.map(({ to, label, end }) => (
        <li key={`${className}-${to}`}>
          <NavLink to={to} end={end} className="nav-link" onClick={onNavigate}>
            {label}
          </NavLink>
        </li>
      ))}
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

export function Nav() {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const { pathname, hash } = useLocation()

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
        <LinkList items={leftLinks} className="nav-links nav-links-left" />
        <NavLink to="/" className="nav-brand" end onClick={closeMenu}>
          Elaina Fielding
        </NavLink>
        <div className="nav-bar-end">
          <LinkList items={rightLinks} className="nav-links nav-links-right" />
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
          <LinkList items={links} className="nav-links" />
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
            />
          </div>
        </div>
      </nav>
    </header>
  )
}
