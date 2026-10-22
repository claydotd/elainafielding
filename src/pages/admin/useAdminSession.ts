import { useEffect, useState } from 'react'
import { adminSession } from '../../lib/admin-api'

export function useAdminSession() {
  const [state, setState] = useState<'checking' | 'in' | 'out'>('checking')

  useEffect(() => {
    let cancelled = false
    adminSession()
      .then((ok) => {
        if (!cancelled) setState(ok ? 'in' : 'out')
      })
      .catch(() => {
        if (!cancelled) setState('out')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
