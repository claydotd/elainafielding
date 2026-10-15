import { NavLink } from 'react-router-dom'

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
}: {
  items: typeof links
  className: string
}) {
  return (
    <ul className={className}>
      {items.map(({ to, label, end }) => (
        <li key={`${className}-${to}`}>
          <NavLink to={to} end={end} className="nav-link">
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function Nav() {
  return (
    <header className="site-header">
      <nav className={`nav nav--${navVariant}`} aria-label="Primary">
        {navVariant === 'logo-centered' ? (
          <>
            <LinkList items={leftLinks} className="nav-links nav-links-left" />
            <NavLink to="/" className="nav-brand" end>
              Elaina Fielding
            </NavLink>
            <LinkList items={rightLinks} className="nav-links nav-links-right" />
          </>
        ) : (
          <>
            <NavLink to="/" className="nav-brand" end>
              Elaina Fielding
            </NavLink>
            <LinkList items={links} className="nav-links" />
          </>
        )}
      </nav>
    </header>
  )
}
