import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Seo } from '../../components/Seo'
import { useWorks } from '../../context/useWorks'
import type { WorkItem } from '../../data/works-seed'
import { workPieces } from '../../data/works'
import { ApiError, logout, reorderWorks } from '../../lib/admin-api'
import { moveItem } from '../../lib/reorder'
import { AdminGate } from './AdminGate'
import { AdminNav } from './AdminNav'

export function AdminWorks() {
  return (
    <AdminGate>
      <WorksList />
    </AdminGate>
  )
}

function WorksList() {
  const navigate = useNavigate()
  const { works, ready, fromApi, refresh } = useWorks()
  const [order, setOrder] = useState<WorkItem[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const dragFrom = useRef<number | null>(null)
  const items = order ?? (ready && fromApi ? works : null)

  async function commit(next: WorkItem[]) {
    setOrder(next)
    setSaving(true)
    setError('')
    try {
      await reorderWorks(next.map((work) => work.slug))
      const saved = await refresh()
      if (saved) setOrder(null)
    } catch (caught) {
      setOrder(null)
      setError(caught instanceof ApiError ? caught.message : 'Could not save the new order.')
    } finally {
      setSaving(false)
    }
  }

  function move(from: number, to: number) {
    if (!items || saving) return
    const next = moveItem(items, from, to)
    if (next === items) return
    void commit(next)
  }

  async function onLogout() {
    await logout().catch(() => undefined)
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="page-container">
      <Seo title="Admin" path="/admin" noIndex />
      <article className="page admin">
        <div className="admin-actions">
          <h1 className="sr-only">Works</h1>
          <AdminNav />
          <Link className="admin-button" to="/admin/works/new">New work</Link>
          <button className="admin-button admin-button--quiet" type="button" onClick={() => void onLogout()}>
            Log out
          </button>
        </div>
        <p>The order here is the order on the works page.</p>
        {!ready || (fromApi && !items) ? <p className="admin-status">Loading works…</p> : null}
        {ready && !fromApi ? (
          <p className="admin-error" role="alert">
            Works could not be loaded. Check that the site API is running.
          </p>
        ) : null}
        {error ? <p className="admin-error" role="alert">{error}</p> : null}
        {items && items.length === 0 ? <p>No works yet.</p> : null}
        {items && items.length > 0 ? (
          <ol className="admin-list">
            {items.map((work, index) => (
              <li
                key={work.slug}
                className={`admin-work${dropIndex === index ? ' is-drop-target' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDropIndex(index)
                }}
                onDragLeave={() => setDropIndex((current) => (current === index ? null : current))}
                onDrop={(event) => {
                  event.preventDefault()
                  const from = dragFrom.current
                  dragFrom.current = null
                  setDropIndex(null)
                  if (from == null) return
                  move(from, index)
                }}
              >
                <button
                  type="button"
                  className="admin-drag"
                  draggable={!saving}
                  aria-label={`Drag ${work.name}`}
                  onDragStart={() => {
                    dragFrom.current = index
                  }}
                  onDragEnd={() => {
                    dragFrom.current = null
                    setDropIndex(null)
                  }}
                >
                  <i className="fa-solid fa-grip-lines" aria-hidden="true" />
                </button>
                {work.image ? <img src={work.image} alt="" /> : <span className="admin-thumb" />}
                <Link to={`/admin/works/${work.slug}`}>
                  <span className="admin-work__name">{work.name}</span>
                  <span className="admin-work__meta">{workMeta(work)}</span>
                </Link>
                <div className="admin-inline">
                  <button
                    type="button"
                    className="admin-icon"
                    aria-label={`Move ${work.name} up`}
                    disabled={saving || index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <i className="fa-solid fa-chevron-up" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="admin-icon"
                    aria-label={`Move ${work.name} down`}
                    disabled={saving || index === items.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <i className="fa-solid fa-chevron-down" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </article>
    </div>
  )
}

function workMeta(work: WorkItem) {
  const pieces = workPieces(work)
  const count = pieces.length > 1 ? `${pieces.length} pieces` : ''
  return [work.year, work.location, work.materials, count].filter(Boolean).join(' · ')
}
