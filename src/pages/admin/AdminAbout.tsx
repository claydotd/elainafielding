import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Seo } from '../../components/Seo'
import { fetchAbout } from '../../lib/about'
import { ApiError, logout, saveAbout } from '../../lib/admin-api'
import { AdminGate } from './AdminGate'
import { AdminNav } from './AdminNav'
import {
  ContentBlocksEditor,
  draftsFromBlocks,
  storedBlocks,
  validateBlocks,
  type ContentBlockDraft,
} from './ContentBlocksEditor'

export function AdminAbout() {
  return (
    <AdminGate>
      <AboutEditor />
    </AdminGate>
  )
}

function AboutEditor() {
  const navigate = useNavigate()
  const [blocks, setBlocks] = useState<ContentBlockDraft[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchAbout().then((next) => {
      if (cancelled) return
      if (!next) {
        setLoadError('The about page could not be loaded. Check that the site API is running.')
        return
      }
      setBlocks(draftsFromBlocks(next))
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function onSave() {
    if (!blocks || saving) return
    const invalid = validateBlocks(blocks)
    if (invalid) {
      setError(invalid)
      return
    }
    setSaving(true)
    setError('')
    try {
      const saved = await saveAbout(storedBlocks(blocks))
      setBlocks(draftsFromBlocks(saved.blocks))
      setNotice('Saved.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not save the about page.')
    } finally {
      setSaving(false)
    }
  }

  async function onLogout() {
    await logout().catch(() => undefined)
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="page-container">
      <Seo title="About" path="/admin/about" noIndex />
      <article className="page admin">
        <div className="admin-actions">
          <h1 className="sr-only">About</h1>
          <AdminNav />
          <button className="admin-button admin-button--quiet" type="button" onClick={() => void onLogout()}>
            Log out
          </button>
        </div>
        <p>Build the about page in sections. Edit the writing in the preview, or switch to Code for the HTML.</p>
        {blocks == null && !loadError ? <p className="admin-status">Loading about page…</p> : null}
        {loadError ? <p className="admin-error" role="alert">{loadError}</p> : null}
        {error ? <p className="admin-error" role="alert">{error}</p> : null}
        {notice ? <p role="status">{notice}</p> : null}
        {blocks ? (
          <form
            className="admin-form"
            onSubmit={(event) => {
              event.preventDefault()
              void onSave()
            }}
          >
            <div className="admin-actions">
              <button className="admin-button" type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            <ContentBlocksEditor
              blocks={blocks}
              disabled={saving}
              onChange={(next) => {
                setBlocks(next)
                setNotice('')
                setError('')
              }}
              onError={(message) => {
                setError(message)
                if (!message) setNotice('')
              }}
            />
          </form>
        ) : null}
      </article>
    </div>
  )
}
