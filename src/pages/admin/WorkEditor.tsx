import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Seo } from '../../components/Seo'
import { Icon } from '../../components/Icon'
import { useWorks } from '../../context/useWorks'
import type { WorkItem } from '../../data/works-seed'
import { workPieces } from '../../data/works'
import { ApiError, createWork, deleteWork, updateWork, uploadImageFile, type UploadProgress } from '../../lib/admin-api'
import { formatBytes } from '../../lib/format-bytes'
import { moveItem } from '../../lib/reorder'
import { isSlug, slugify, slugInput } from '../../lib/slug'
import { AdminGate } from './AdminGate'

type PieceDraft = {
  id: string
  title: string
  subtitle: string
  year: string
  materials: string
  dimensions: string
}

type Draft = {
  name: string
  slug: string
  location: string
  description: string
  image: string
  images: string[]
  pieces: PieceDraft[]
}

type UploadJob = {
  id: string
  name: string
  phase: 'waiting' | 'compressing' | 'uploading' | 'done' | 'error'
  originalBytes?: number
  compressedBytes?: number
  error?: string
}

const CUSTOM_DETAIL_SLUGS = new Set(['untitled-2'])

export function WorkEditor() {
  return (
    <AdminGate>
      <Editor />
    </AdminGate>
  )
}

function Editor() {
  const { slug: routeSlug = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isNew = location.pathname.endsWith('/works/new')
  const { works, ready, fromApi, refresh } = useWorks()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [seed, setSeed] = useState('')
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [jobs, setJobs] = useState<UploadJob[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [seenSave, setSeenSave] = useState('')
  const [saving, setSaving] = useState(false)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [pieceDropIndex, setPieceDropIndex] = useState<number | null>(null)
  const [closedPieces, setClosedPieces] = useState<Set<string>>(new Set())
  const leadInput = useRef<HTMLInputElement>(null)
  const addInput = useRef<HTMLInputElement>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const replaceAt = useRef<number | null>(null)
  const dragFrom = useRef<number | null>(null)
  const pieceDragFrom = useRef<number | null>(null)
  const savedFlag = Boolean((location.state as { saved?: boolean } | null)?.saved)
  const saveToken = savedFlag ? location.key : ''
  const seedKey = !ready || !fromApi ? '' : isNew ? 'new' : routeSlug

  if (saveToken && saveToken !== seenSave) {
    setSeenSave(saveToken)
    setNotice('Saved.')
  }

  if (seedKey && seedKey !== seed) {
    setSeed(seedKey)
    setClosedPieces(new Set())
    setSlugTouched(!isNew)
    if (isNew) setDraft(emptyDraft())
    else {
      const work = works.find((item) => item.slug === routeSlug)
      setDraft(work ? toDraft(work) : null)
    }
  }

  const busy = jobs.some((job) => job.phase === 'waiting' || job.phase === 'compressing' || job.phase === 'uploading')
  const customPage = CUSTOM_DETAIL_SLUGS.has(routeSlug) || CUSTOM_DETAIL_SLUGS.has(draft?.slug ?? '')

  function patchJob(id: string, patch: Partial<UploadJob>) {
    setJobs((current) => current.map((job) => (job.id === id ? { ...job, ...patch } : job)))
  }

  async function runUploads(files: File[], onUrl: (url: string) => void) {
    const starting: UploadJob[] = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name || 'Image',
      phase: 'waiting',
    }))
    setJobs((current) => [...starting, ...current])
    for (let index = 0; index < files.length; index += 1) {
      const job = starting[index]
      const file = files[index]
      patchJob(job.id, { phase: 'compressing' })
      try {
        const saved = await uploadImageFile(file, (progress: UploadProgress) => {
          patchJob(job.id, progress)
        })
        patchJob(job.id, {
          phase: 'done',
          originalBytes: saved.originalBytes,
          compressedBytes: saved.compressedBytes,
        })
        onUrl(saved.url)
      } catch (caught) {
        patchJob(job.id, {
          phase: 'error',
          error: caught instanceof Error ? caught.message : 'Could not upload this image.',
        })
      }
    }
  }

  function takeFiles(input: HTMLInputElement) {
    const files = [...(input.files ?? [])]
    input.value = ''
    return files
  }

  function updateDraft(patch: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current))
    setNotice('')
  }

  function applyPieces(pieces: PieceDraft[]) {
    const name = pieces[0]?.title ?? ''
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        pieces,
        name,
        slug: isNew && !slugTouched ? slugify(name) : current.slug,
      }
    })
    setNotice('')
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft || busy || saving) return
    const work = toWork(draft)
    if (!work.name) {
      setError('Title is required.')
      return
    }
    if (!isSlug(work.slug)) {
      setError('Use a slug made of lowercase letters, numbers, and hyphens.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isNew) {
        const created = await createWork(work)
        await refresh()
        navigate(`/admin/works/${created.work.slug}`, { replace: true, state: { saved: true } })
        return
      }
      const updated = await updateWork(routeSlug, work)
      await refresh()
      if (updated.work.slug !== routeSlug) {
        navigate(`/admin/works/${updated.work.slug}`, { replace: true, state: { saved: true } })
        return
      }
      setDraft(toDraft(updated.work))
      setNotice('Saved.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not save this work.')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!draft || isNew || saving) return
    if (!window.confirm(`Delete ${editorTitle(isNew, draft)}?`)) return
    setSaving(true)
    setError('')
    try {
      await deleteWork(routeSlug)
      await refresh()
      navigate('/admin', { replace: true })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not delete this work.')
      setSaving(false)
    }
  }

  const missing = ready && fromApi && !isNew && !works.some((work) => work.slug === routeSlug)
  const title = editorTitle(isNew, draft)

  function togglePiece(id: string) {
    setClosedPieces((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function onSlugChange(input: HTMLInputElement, value: string) {
    const slug = slugInput(value)
    input.setCustomValidity(slug === 'new' ? 'Choose a different slug.' : '')
    setSlugTouched(true)
    updateDraft({ slug })
  }

  return (
    <div className="page-container">
      <Seo title={title} path={isNew ? '/admin/works/new' : `/admin/works/${routeSlug}`} noIndex />
      <article className="page admin">
        <h1>{title}</h1>
        {!ready ? <p className="admin-status">Loading work…</p> : null}
        {ready && !fromApi ? (
          <p className="admin-error" role="alert">Works could not be loaded. Check that the site API is running.</p>
        ) : null}
        {missing ? (
          <p>
            This work could not be found. <Link to="/admin">Back to works</Link>
          </p>
        ) : null}
        {draft ? (
          <form className="admin-form" onSubmit={(event) => void onSave(event)}>
            {customPage ? (
              <p className="admin-note">
                This work has a custom page, which controls the detail layout. The piece details and location on that page still come from these fields.
              </p>
            ) : null}
            {error ? <p className="admin-error" role="alert">{error}</p> : null}
            {notice ? <p role="status">{notice}</p> : null}
            <Link to="/admin">&larr; Back to works</Link>
            <div className="admin-actions">
              <button className="admin-button" type="submit" disabled={busy || saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              {isNew ? null : (
                <button className="admin-button admin-button--danger" type="button" onClick={() => void onDelete()} disabled={saving || busy}>
                  Delete
                </button>
              )}
            </div>
            <label className="admin-field">
              <span>Slug</span>
              <input
                value={draft.slug}
                onChange={(event) => onSlugChange(event.currentTarget, event.target.value)}
                onBlur={(event) => {
                  const slug = slugify(event.currentTarget.value)
                  event.currentTarget.setCustomValidity(slug === 'new' ? 'Choose a different slug.' : '')
                  if (slug === draft.slug) return
                  setSlugTouched(true)
                  updateDraft({ slug })
                }}
                required
                maxLength={80}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                title="Use lowercase letters, numbers, and hyphens."
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
            </label>
            <section className="admin-section" aria-labelledby="pieces">
              <h2 id="pieces">Pieces</h2>
              <ol className="admin-list">
                {draft.pieces.map((piece, index) => {
                  const collapsed = closedPieces.has(piece.id)
                  const detailsId = `piece-${piece.id}`
                  return (
                  <li
                    key={piece.id}
                    className={`admin-piece${pieceDropIndex === index ? ' is-drop-target' : ''}`}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setPieceDropIndex(index)
                    }}
                    onDragLeave={() => setPieceDropIndex((current) => (current === index ? null : current))}
                    onDrop={(event) => {
                      event.preventDefault()
                      const from = pieceDragFrom.current
                      pieceDragFrom.current = null
                      setPieceDropIndex(null)
                      if (from == null) return
                      applyPieces(moveItem(draft.pieces, from, index))
                    }}
                  >
                    <div className="admin-piece__bar">
                      <button
                        type="button"
                        className="admin-drag"
                        draggable
                        aria-label={`Drag piece ${index + 1}`}
                        onDragStart={() => {
                          pieceDragFrom.current = index
                        }}
                        onDragEnd={() => {
                          pieceDragFrom.current = null
                          setPieceDropIndex(null)
                        }}
                      >
                        <Icon name="grip" />
                      </button>
                      <button
                        type="button"
                        className="admin-icon"
                        aria-expanded={!collapsed}
                        aria-controls={detailsId}
                        aria-label={collapsed ? `Expand piece ${index + 1}` : `Collapse piece ${index + 1}`}
                        onClick={() => togglePiece(piece.id)}
                      >
                        {collapsed ? '+' : '−'}
                      </button>
                      <span>{collapsed && (piece.title.trim() || piece.subtitle.trim()) ? piece.title.trim() || piece.subtitle.trim() : `Piece ${index + 1}`}</span>
                      <div className="admin-inline">
                        <button
                          type="button"
                          className="admin-icon"
                          aria-label={`Move piece ${index + 1} up`}
                          disabled={index === 0}
                          onClick={() => applyPieces(moveItem(draft.pieces, index, index - 1))}
                        >
                          <Icon name="chevron-up" />
                        </button>
                        <button
                          type="button"
                          className="admin-icon"
                          aria-label={`Move piece ${index + 1} down`}
                          disabled={index === draft.pieces.length - 1}
                          onClick={() => applyPieces(moveItem(draft.pieces, index, index + 1))}
                        >
                          <Icon name="chevron-down" />
                        </button>
                        {draft.pieces.length > 1 ? (
                          <button
                            type="button"
                            className="admin-button admin-button--quiet"
                            onClick={() => applyPieces(draft.pieces.filter((item) => item.id !== piece.id))}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {collapsed ? null : (
                    <div id={detailsId} className="admin-piece__details">
                    <label className="admin-field">
                      <span>Title</span>
                      <input
                        value={piece.title}
                        onChange={(event) => {
                          const title = event.target.value
                          applyPieces(draft.pieces.map((item) => (item.id === piece.id ? { ...item, title } : item)))
                        }}
                        required={index === 0}
                      />
                    </label>
                    <label className="admin-field">
                      <span>Subtitle</span>
                      <input
                        value={piece.subtitle}
                        onChange={(event) => {
                          const subtitle = event.target.value
                          applyPieces(draft.pieces.map((item) => (item.id === piece.id ? { ...item, subtitle } : item)))
                        }}
                      />
                    </label>
                    <label className="admin-field">
                      <span>Year</span>
                      <input
                        value={piece.year}
                        onChange={(event) => {
                          const year = event.target.value
                          applyPieces(draft.pieces.map((item) => (item.id === piece.id ? { ...item, year } : item)))
                        }}
                      />
                    </label>
                    <label className="admin-field">
                      <span>Materials</span>
                      <input
                        value={piece.materials}
                        onChange={(event) => {
                          const materials = event.target.value
                          applyPieces(draft.pieces.map((item) => (item.id === piece.id ? { ...item, materials } : item)))
                        }}
                      />
                    </label>
                    <label className="admin-field">
                      <span>Dimensions</span>
                      <input
                        value={piece.dimensions}
                        onChange={(event) => {
                          const dimensions = event.target.value
                          applyPieces(draft.pieces.map((item) => (item.id === piece.id ? { ...item, dimensions } : item)))
                        }}
                      />
                    </label>
                    </div>
                    )}
                  </li>
                  )
                })}
              </ol>
              <button
                className="admin-button admin-button--quiet"
                type="button"
                onClick={() => applyPieces([...draft.pieces, emptyPiece()])}
              >
                Add piece
              </button>
            </section>
            <label className="admin-field">
              <span>Location</span>
              <input value={draft.location} onChange={(event) => updateDraft({ location: event.target.value })} />
            </label>
            <label className="admin-field">
              <span>Description</span>
              <textarea rows={8} value={draft.description} onChange={(event) => updateDraft({ description: event.target.value })} />
            </label>

            <section className="admin-section" aria-labelledby="lead-image">
              <h2 id="lead-image">Lead image</h2>
              {draft.image ? <img className="admin-lead" src={draft.image} alt="" /> : <p>No lead image yet.</p>}
              <div className="admin-inline">
                <button className="admin-button admin-button--quiet" type="button" disabled={busy} onClick={() => leadInput.current?.click()}>
                  {draft.image ? 'Replace' : 'Upload'}
                </button>
                {draft.image ? (
                  <button className="admin-button admin-button--quiet" type="button" onClick={() => updateDraft({ image: '' })}>
                    Remove
                  </button>
                ) : null}
              </div>
              <input
                ref={leadInput}
                className="sr-only"
                type="file"
                accept="image/*"
                aria-label="Upload lead image"
                onChange={(event) => {
                  const input = event.currentTarget
                  const files = takeFiles(input)
                  if (files.length === 0) return
                  void runUploads(files.slice(0, 1), (url) => updateDraft({ image: url }))
                }}
              />
            </section>

            <section className="admin-section" aria-labelledby="carousel-images">
              <h2 id="carousel-images">Carousel images</h2>
              {draft.images.length === 0 ? <p>No carousel images yet.</p> : null}
              {draft.images.length > 0 ? (
                <ol className="admin-list">
                  {draft.images.map((image, index) => (
                    <li
                      key={`${image}-${index}`}
                      className={`admin-image${dropIndex === index ? ' is-drop-target' : ''}`}
                      onDragOver={(event) => {
                        event.preventDefault()
                        setDropIndex(index)
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        const from = dragFrom.current
                        dragFrom.current = null
                        setDropIndex(null)
                        if (from == null || !draft) return
                        updateDraft({ images: moveItem(draft.images, from, index) })
                      }}
                    >
                      <button
                        type="button"
                        className="admin-drag"
                        draggable={!busy}
                        aria-label={`Drag carousel image ${index + 1}`}
                        onDragStart={() => {
                          dragFrom.current = index
                        }}
                        onDragEnd={() => {
                          dragFrom.current = null
                          setDropIndex(null)
                        }}
                      >
                        <Icon name="grip" />
                      </button>
                      <img src={image} alt="" />
                      <span>Image {index + 1}</span>
                      <div className="admin-inline">
                        <button
                          type="button"
                          className="admin-icon"
                          aria-label={`Move image ${index + 1} up`}
                          disabled={busy || index === 0}
                          onClick={() => updateDraft({ images: moveItem(draft.images, index, index - 1) })}
                        >
                          <Icon name="chevron-up" />
                        </button>
                        <button
                          type="button"
                          className="admin-icon"
                          aria-label={`Move image ${index + 1} down`}
                          disabled={busy || index === draft.images.length - 1}
                          onClick={() => updateDraft({ images: moveItem(draft.images, index, index + 1) })}
                        >
                          <Icon name="chevron-down" />
                        </button>
                        <button
                          type="button"
                          className="admin-button admin-button--quiet"
                          disabled={busy}
                          onClick={() => {
                            replaceAt.current = index
                            replaceInput.current?.click()
                          }}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          className="admin-button admin-button--quiet"
                          disabled={busy}
                          onClick={() => updateDraft({ images: draft.images.filter((_, imageIndex) => imageIndex !== index) })}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}
              <button className="admin-button admin-button--quiet" type="button" disabled={busy} onClick={() => addInput.current?.click()}>
                Add images
              </button>
              <input
                ref={addInput}
                className="sr-only"
                type="file"
                accept="image/*"
                multiple
                aria-label="Upload carousel images"
                onChange={(event) => {
                  const files = takeFiles(event.currentTarget)
                  if (files.length === 0) return
                  void runUploads(files, (url) => {
                    setDraft((current) => (current ? { ...current, images: [...current.images, url] } : current))
                    setNotice('')
                  })
                }}
              />
              <input
                ref={replaceInput}
                className="sr-only"
                type="file"
                accept="image/*"
                aria-label="Replace carousel image"
                onChange={(event) => {
                  const index = replaceAt.current
                  const files = takeFiles(event.currentTarget)
                  if (index == null || files.length === 0) return
                  void runUploads(files.slice(0, 1), (url) => {
                    setDraft((current) => {
                      if (!current) return current
                      const images = current.images.slice()
                      images[index] = url
                      return { ...current, images }
                    })
                    setNotice('')
                  })
                }}
              />
            </section>

            {jobs.length > 0 ? (
              <section className="admin-section" aria-labelledby="upload-status">
                <h2 id="upload-status">Uploads</h2>
                <ul className="admin-list" aria-live="polite">
                  {jobs.map((job) => (
                    <li key={job.id} className={`admin-upload admin-upload--${job.phase}`}>
                      <span>{job.name}</span>
                      <span>{uploadDetail(job)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </form>
        ) : null}
      </article>
    </div>
  )
}

function editorTitle(isNew: boolean, draft: Draft | null) {
  const multiple = (draft?.pieces.length ?? 0) > 1
  if (multiple) return draft?.slug || (isNew ? 'New work' : 'Edit work')
  if (isNew) return 'New work'
  return draft?.name || 'Edit work'
}

function emptyPiece(): PieceDraft {
  return { id: crypto.randomUUID(), title: '', subtitle: '', year: '', materials: '', dimensions: '' }
}

function emptyDraft(): Draft {
  return {
    name: '',
    slug: '',
    location: '',
    description: '',
    image: '',
    images: [],
    pieces: [emptyPiece()],
  }
}

function toDraft(work: WorkItem): Draft {
  return {
    name: work.name,
    slug: work.slug,
    location: work.location ?? '',
    description: work.description ?? '',
    image: work.image,
    images: work.images ?? [],
    pieces: workPieces(work).map((piece) => ({
      id: crypto.randomUUID(),
      title: piece.title,
      subtitle: piece.subtitle ?? '',
      year: piece.year,
      materials: piece.materials,
      dimensions: piece.dimensions,
    })),
  }
}

function toWork(draft: Draft): WorkItem {
  const pieces = draft.pieces.map((piece) => {
    const subtitle = piece.subtitle.trim()
    return {
      title: piece.title.trim(),
      ...(subtitle ? { subtitle } : {}),
      year: piece.year.trim(),
      materials: piece.materials.trim(),
      dimensions: piece.dimensions.trim(),
    }
  })
  const first = pieces[0] ?? { title: '', year: '', materials: '', dimensions: '' }
  const work: WorkItem = {
    name: first.title,
    slug: draft.slug.trim(),
    year: first.year,
    location: draft.location.trim(),
    dimensions: first.dimensions,
    materials: first.materials,
    description: draft.description.trim(),
    image: draft.image,
    images: draft.images,
    pieces,
  }
  if (!work.location) delete work.location
  if (!work.description) delete work.description
  if (!work.images?.length) delete work.images
  return work
}

function uploadDetail(job: UploadJob) {
  if (job.phase === 'waiting') return 'Waiting'
  if (job.phase === 'compressing') return 'Compressing'
  if (job.phase === 'uploading') return 'Uploading'
  if (job.phase === 'error') return job.error ?? 'Could not upload this image.'
  if (job.originalBytes != null && job.compressedBytes != null) {
    return `Done. Original ${formatBytes(job.originalBytes)}, compressed ${formatBytes(job.compressedBytes)}.`
  }
  return 'Done'
}
