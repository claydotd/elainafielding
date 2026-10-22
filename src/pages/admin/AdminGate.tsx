import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminSession } from './useAdminSession'

export function AdminGate({ children }: { children: ReactNode }) {
  const session = useAdminSession()

  if (session === 'checking') {
    return (
      <div className="page-container">
        <p className="admin-status">Checking access…</p>
      </div>
    )
  }

  if (session === 'out') return <Navigate to="/admin/login" replace />
  return children
}
