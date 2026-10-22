import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/admin', label: 'Works', end: true },
  { to: '/admin/homepage', label: 'Homepage', end: true },
]

export function AdminNav() {
  return (
    <nav className="admin-tabs" aria-label="Admin">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className="admin-tab">
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
