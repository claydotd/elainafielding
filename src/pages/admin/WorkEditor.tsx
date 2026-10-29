import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Seo } from '../../components/Seo'
import { Icon } from '../../components/Icon'
import { useWorks } from '../../context/useWorks'
import type { MastheadText, WorkItem, WorkTemplate } from '../../data/works-seed'
import { MASTHEAD_TEXT_OPTIONS, workContentBlocks, workPieces } from '../../data/works'
import { ApiError, createWork, deleteWork, updateWork, uploadImageFile, type UploadProgress } from '../../lib/admin-api'
import { formatBytes } from '../../lib/format-bytes'
import { moveItem } from '../../lib/reorder'
import { isSlug, slugify, slugInput } from '../../lib/slug'
import { AdminGate } from './AdminGate'
import {
  ContentBlocksEditor,
  draftsFromBlocks,
  storedBlocks,
  validateBlocks,
  type ContentBlockDraft,
} from './ContentBlocksEditor'

type PieceDraft = {
  id: string
  title: string
  subtitle: string
  year: string
  materials: string
  dimensions: string
}

type ScrollStepDraft = {
  id: string
  image: string
  alt: string
  paragraphs: string
}

type Draft = {
  name: string
  slug: string
  location: string
  description: string
  image: string
  template: WorkTemplate
  mastheadText: MastheadText
  scrollSteps: ScrollStepDraft[]
  blocks: ContentBlockDraft[]
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

const customDetailModules = import.meta.glob('../Works/*.tsx', { eager: true })
const CUSTOM_DETAIL_SLUGS = new Set(
  Object.keys(customDetailModules)
    .map((path) => path.match(/Works\/([^/]+)\.tsx$/i)?.[1]?.toLowerCase())
    .filter((slug): slug is string => Boolean(slug)),
)

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
  const [pieceDropIndex, setPieceDropIndex] = useState<number | null>(null)
  const [closedPieces, setClosedPieces] = useState<Set<string>>(new Set())
  const leadInput = useRef<HTMLInputElement>(null)
  const scrollStepInputs = useRef<Record<string, HTMLInputElement | null>>({})
  const pieceDragFrom = useRef<number | null>(null)
  const scrollDragFrom = useRef<number | null>(null)
  const [scrollDropIndex, setScrollDropIndex] = useState<number | null>(null)
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

  function applyScrollSteps(scrollSteps: ScrollStepDraft[]) {
    updateDraft({ scrollSteps })
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft || busy || saving) return
    const invalidBlocks = validateBlocks(draft.blocks)
    if (invalidBlocks) {
      setError(invalidBlocks)
      return
    }
    if (draft.template === 'scroll-story') {
      const missingStep = draft.scrollSteps.findIndex(
        (step) => !step.image.trim() && (step.alt.trim() || step.paragraphs.trim()),
      )
      if (missingStep >= 0) {
        setError(`Scroll chapter ${missingStep + 1} needs an image.`)
        return
      }
    }
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
                This work has a custom page file, which overrides the CMS template below. Piece details and location still come from these fields.
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
              <span>Template</span>
              <select
                value={draft.template}
                onChange={(event) => updateDraft({ template: event.target.value as WorkTemplate })}
              >
                <option value="standard">Standard</option>
                <option value="scroll-story">Scroll-story</option>
                <option value="masthead">Masthead</option>
              </select>
            </label>
            {draft.template === 'masthead' ? (
              <label className="admin-field">
                <span>Text colour</span>
                <select
                  value={draft.mastheadText}
                  onChange={(event) => updateDraft({ mastheadText: event.target.value as MastheadText })}
                >
                  {MASTHEAD_TEXT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === 'med' ? 'Med' : option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
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

            {draft.template === 'scroll-story' ? (
              <section className="admin-section" aria-labelledby="scroll-chapters">
                <h2 id="scroll-chapters">Scroll chapters</h2>
                <ol className="admin-list">
                  {draft.scrollSteps.map((step, index) => (
                    <li
                      key={step.id}
                      className={`admin-piece${scrollDropIndex === index ? ' is-drop-target' : ''}`}
                      onDragOver={(event) => {
                        event.preventDefault()
                        setScrollDropIndex(index)
                      }}
                      onDragLeave={() => setScrollDropIndex((current) => (current === index ? null : current))}
                      onDrop={(event) => {
                        event.preventDefault()
                        const from = scrollDragFrom.current
                        scrollDragFrom.current = null
                        setScrollDropIndex(null)
                        if (from == null) return
                        applyScrollSteps(moveItem(draft.scrollSteps, from, index))
                      }}
                    >
                      <div className="admin-piece__bar">
                        <button
                          type="button"
                          className="admin-drag"
                          draggable
                          aria-label={`Drag chapter ${index + 1}`}
                          onDragStart={() => {
                            scrollDragFrom.current = index
                          }}
                          onDragEnd={() => {
                            scrollDragFrom.current = null
                            setScrollDropIndex(null)
                          }}
                        >
                          <Icon name="grip" />
                        </button>
                        <span>Chapter {index + 1}</span>
                        <div className="admin-inline">
                          <button
                            className="admin-button admin-button--quiet"
                            type="button"
                            disabled={draft.scrollSteps.length <= 1}
                            onClick={() => applyScrollSteps(draft.scrollSteps.filter((item) => item.id !== step.id))}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="admin-piece__details">
                        <div className="admin-field">
                          <span>Image</span>
                          {step.image ? <img className="admin-lead" src={step.image} alt="" /> : <span className="admin-thumb" />}
                          <div className="admin-inline">
                            <button
                              className="admin-button admin-button--quiet"
                              type="button"
                              disabled={busy}
                              onClick={() => scrollStepInputs.current[step.id]?.click()}
                            >
                              {step.image ? 'Replace' : 'Upload'}
                            </button>
                            {step.image ? (
                              <button
                                className="admin-button admin-button--quiet"
                                type="button"
                                onClick={() => {
                                  applyScrollSteps(
                                    draft.scrollSteps.map((item) => (item.id === step.id ? { ...item, image: '' } : item)),
                                  )
                                }}
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>
                          <input
                            ref={(node) => {
                              scrollStepInputs.current[step.id] = node
                            }}
                            className="sr-only"
                            type="file"
                            accept="image/*"
                            aria-label={`Upload chapter ${index + 1} image`}
                            onChange={(event) => {
                              const input = event.currentTarget
                              const files = takeFiles(input)
                              if (files.length === 0) return
                              const stepId = step.id
                              void runUploads(files.slice(0, 1), (url) => {
                                setDraft((current) => {
                                  if (!current) return current
                                  return {
                                    ...current,
                                    scrollSteps: current.scrollSteps.map((item) => (
                                      item.id === stepId ? { ...item, image: url } : item
                                    )),
                                  }
                                })
                                setNotice('')
                              })
                            }}
                          />
                        </div>
                        <label className="admin-field">
                          <span>Alt text</span>
                          <input
                            value={step.alt}
                            onChange={(event) => {
                              const alt = event.target.value
                              applyScrollSteps(
                                draft.scrollSteps.map((item) => (item.id === step.id ? { ...item, alt } : item)),
                              )
                            }}
                          />
                        </label>
                        <label className="admin-field">
                          <span>Chapter text</span>
                          <textarea
                            rows={4}
                            value={step.paragraphs}
                            placeholder="One paragraph per blank line. Leave empty for an image-only beat."
                            onChange={(event) => {
                              const paragraphs = event.target.value
                              applyScrollSteps(
                                draft.scrollSteps.map((item) => (item.id === step.id ? { ...item, paragraphs } : item)),
                              )
                            }}
                          />
                        </label>
                      </div>
                    </li>
                  ))}
                </ol>
                <button
                  className="admin-button admin-button--quiet"
                  type="button"
                  onClick={() => applyScrollSteps([...draft.scrollSteps, emptyScrollStep()])}
                >
                  Add chapter
                </button>
                <p>Extra images after the story belong in content blocks below.</p>
              </section>
            ) : null}

            <ContentBlocksEditor
              blocks={draft.blocks}
              disabled={busy || saving}
              heading="Content"
              headingId="work-blocks"
              allowCarousel
              onChange={(blocks) => updateDraft({ blocks })}
              onError={(message) => {
                setError(message)
                if (!message) setNotice('')
              }}
            />

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

function emptyScrollStep(): ScrollStepDraft {
  return { id: crypto.randomUUID(), image: '', alt: '', paragraphs: '' }
}

function paragraphsToText(paragraphs: string[]) {
  return paragraphs.join('\n\n')
}

function textToParagraphs(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function emptyDraft(): Draft {
  return {
    name: '',
    slug: '',
    location: '',
    description: '',
    image: '',
    template: 'standard',
    mastheadText: 'light',
    scrollSteps: [emptyScrollStep()],
    blocks: [],
    pieces: [emptyPiece()],
  }
}

function toDraft(work: WorkItem): Draft {
  const blocks = draftsFromBlocks(workContentBlocks(work))
  const closing = work.scrollClosingImage
  if (closing?.src && !blocks.some((block) => block.type === 'image' && block.image === closing.src)) {
    blocks.push({
      id: crypto.randomUUID(),
      type: 'image',
      image: closing.src,
      alt: closing.alt,
      caption: '',
      size: 'full',
      align: 'center',
      crop: 'original',
    })
  }

  return {
    name: work.name,
    slug: work.slug,
    location: work.location ?? '',
    description: work.description ?? '',
    image: work.image,
    template: work.template ?? 'standard',
    mastheadText: work.mastheadText ?? 'light',
    scrollSteps: work.scrollSteps?.length
      ? work.scrollSteps.map((step) => ({
          id: crypto.randomUUID(),
          image: step.image,
          alt: step.alt,
          paragraphs: paragraphsToText(step.paragraphs),
        }))
      : [emptyScrollStep()],
    blocks,
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
  const blocks = storedBlocks(draft.blocks)
  const work: WorkItem = {
    name: first.title,
    slug: draft.slug.trim(),
    year: first.year,
    location: draft.location.trim(),
    dimensions: first.dimensions,
    materials: first.materials,
    description: draft.description.trim(),
    image: draft.image,
    pieces,
    template: draft.template,
  }
  if (!work.location) delete work.location
  if (!work.description) delete work.description
  if (draft.template === 'standard') delete work.template
  if (draft.template === 'masthead') work.mastheadText = draft.mastheadText
  if (draft.template === 'scroll-story') {
    const scrollSteps = draft.scrollSteps
      .filter((step) => step.image.trim())
      .map((step) => ({
        image: step.image.trim(),
        alt: step.alt.trim(),
        paragraphs: textToParagraphs(step.paragraphs),
      }))
    if (scrollSteps.length > 0) work.scrollSteps = scrollSteps
    work.scrollClosingImage = null
  }
  if (blocks.length > 0) work.blocks = blocks
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
