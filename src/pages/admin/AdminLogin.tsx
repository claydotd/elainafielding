import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Seo } from '../../components/Seo'
import { ApiError, login } from '../../lib/admin-api'
import { useAdminSession } from './useAdminSession'

export function AdminLogin() {
  const session = useAdminSession()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(password)
      setDone(true)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not log in.')
    } finally {
      setSubmitting(false)
    }
  }

  if (session === 'in' || done) return <Navigate to="/admin" replace />

  return (
    <div className="page-container">
      <Seo title="Admin log in" path="/admin/login" noIndex />
      <article className="page admin">
        <h1>Admin</h1>
        <form className="admin-form" onSubmit={onSubmit}>
          <label className="admin-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="admin-error" role="alert">{error}</p> : null}
          <button className="admin-button" type="submit" disabled={submitting || session === 'checking'}>
            {submitting ? 'Checking…' : 'Log in'}
          </button>
        </form>
      </article>
    </div>
  )
}
