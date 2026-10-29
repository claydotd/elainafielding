import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Seo } from '../../components/Seo'
import { Icon } from '../../components/Icon'
import { useWorks } from '../../context/useWorks'
import { isCarouselCrop, type CarouselCrop } from '../../data/carousel'
import type { WorkItem } from '../../data/works-seed'
import { ApiError, logout, saveHomepage, uploadImageFile, type UploadProgress } from '../../lib/admin-api'
import { formatBytes } from '../../lib/format-bytes'
import { fetchHomepage } from '../../lib/homepage'
import { moveItem } from '../../lib/reorder'
import { AdminGate } from './AdminGate'
import { AdminNav } from './AdminNav'

type SlideDraft = {
  id: string
  image: string
  slug: string
  caption: string
}

type UploadJob = {
  id: string
  name: string
  phase: 'waiting' | 'compressing' | 'uploading' | 'done' | 'error'
  originalBytes?: number
  compressedBytes?: number
  error?: string
}

export function AdminHomepage() {
  return (
    <AdminGate>
      <HomepageEditor />
    </AdminGate>
  )
}

function HomepageEditor() {
  const navigate = useNavigate()
  const { works, ready, fromApi } = useWorks()
  const [slides, setSlides] = useState<SlideDraft[] | null>(null)
  const [showCaptions, setShowCaptions] = useState(false)
  const [carouselCrop, setCarouselCrop] = useState<CarouselCrop>('none')
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [jobs, setJobs] = useState<UploadJob[]>([])
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const addInput = useRef<HTMLInputElement>(null)
  const replaceInput = useRef<HTMLInputElement>(null)
  const replaceId = useRef<string | null>(null)
  const dragFrom = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchHomepage().then((next) => {
      if (cancelled) return
      if (!next) {
        setLoadError('The homepage could not be loaded. Check that the site API is running.')
        return
      }
      setSlides(next.slides.map((slide) => ({
        id: crypto.randomUUID(),
        image: slide.image,
        slug: slide.slug,
        caption: slide.caption ?? '',
      })))
      setShowCaptions(next.showCaptions)
      setCarouselCrop(next.carouselCrop ?? 'none')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const busy = jobs.some((job) => job.phase === 'waiting' || job.phase === 'compressing' || job.phase === 'uploading')

  function patchJob(id: string, patch: Partial<UploadJob>) {
    setJobs((current) => current.map((job) => (job.id === id ? { ...job, ...patch } : job)))
  }

  function patchSlide(id: string, patch: Partial<SlideDraft>) {
    setSlides((current) => current?.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)) ?? current)
    setNotice('')
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

  function addWork(slug: string) {
    const work = works.find((item) => item.slug === slug)
    if (!work?.image || !slides) return
    setSlides([...slides, { id: crypto.randomUUID(), image: work.image, slug: work.slug, caption: '' }])
    setNotice('')
  }

  async function onSave() {
    if (!slides || busy || saving) return
    if (slides.some((slide) => !slide.image || !works.some((work) => work.slug === slide.slug))) {
      setError('Each image needs a file and a work to open.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const saved = await saveHomepage({
        showCaptions,
        carouselCrop,
        slides: slides.map(({ image, slug, caption }) => {
          const trimmed = caption.trim()
          return trimmed ? { image, slug, caption: trimmed } : { image, slug }
        }),
      })
      setSlides(saved.slides.map((slide) => ({
        id: crypto.randomUUID(),
        image: slide.image,
        slug: slide.slug,
        caption: slide.caption ?? '',
      })))
      setShowCaptions(saved.showCaptions)
      setCarouselCrop(saved.carouselCrop ?? 'none')
      setNotice('Saved.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not save the homepage.')
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
      <Seo title="Homepage" path="/admin/homepage" noIndex />
      <article className="page admin">
        <div className="admin-actions">
          <h1 className="sr-only">Homepage</h1>
          <AdminNav />
          <button className="admin-button admin-button--quiet" type="button" onClick={() => void onLogout()}>
            Log out
          </button>
        </div>
        <p>These images are the homepage carousel, in this order. Each one opens the work you choose.</p>
        {slides == null && !loadError ? <p className="admin-status">Loading homepage…</p> : null}
        {ready && !fromApi ? (
          <p className="admin-error" role="alert">Works could not be loaded. Check that the site API is running.</p>
        ) : null}
        {loadError ? <p className="admin-error" role="alert">{loadError}</p> : null}
        {error ? <p className="admin-error" role="alert">{error}</p> : null}
        {notice ? <p role="status">{notice}</p> : null}
        {slides && fromApi ? (
          <form
            className="admin-form"
            onSubmit={(event) => {
              event.preventDefault()
              void onSave()
            }}
          >
            <div className="admin-actions">
              <button className="admin-button" type="submit" disabled={busy || saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <label className="admin-field">
                <span>Crop</span>
                <select
                  value={carouselCrop}
                  disabled={busy || saving}
                  aria-label="Carousel image crop"
                  onChange={(event) => {
                    const next = event.target.value
                    if (!isCarouselCrop(next)) return
                    setCarouselCrop(next)
                    setNotice('')
                  }}
                >
                  <option value="none">None</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </label>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={showCaptions}
                  disabled={busy || saving}
                  onChange={(event) => {
                    setShowCaptions(event.target.checked)
                    setNotice('')
                  }}
                />
                <span>Show captions</span>
              </label>
            </div>
            {slides.length === 0 ? <p>No homepage images yet.</p> : null}
            {slides.length > 0 ? (
              <ol className="admin-list">
                {slides.map((slide, index) => {
                  const work = works.find((item) => item.slug === slide.slug)
                  const choices = pictureChoices(work)
                  const custom = !choices.some((choice) => choice.url === slide.image)
                  return (
                    <li
                      key={slide.id}
                      className={`admin-image${dropIndex === index ? ' is-drop-target' : ''}`}
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
                        setSlides((current) => (current ? moveItem(current, from, index) : current))
                        setNotice('')
                      }}
                    >
                      <button
                        type="button"
                        className="admin-drag"
                        draggable={!busy && !saving}
                        aria-label={`Drag homepage image ${index + 1}`}
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
                      {slide.image ? <img src={slide.image} alt="" /> : <span className="admin-thumb" />}
                      <div className="admin-slide-fields">
                        <label className="admin-field">
                          <span>Opens</span>
                          <select
                            value={slide.slug}
                            aria-label={`Work for image ${index + 1}`}
                            onChange={(event) => patchSlide(slide.id, { slug: event.target.value })}
                            required
                          >
                            <option value="" disabled>Choose a work</option>
                            {slide.slug && !work ? <option value={slide.slug}>Missing work</option> : null}
                            {works.map((item) => (
                              <option key={item.slug} value={item.slug}>{workLabel(item)}</option>
                            ))}
                          </select>
                        </label>
                        <label className="admin-field">
                          <span>Picture</span>
                          <select
                            value={custom ? '' : slide.image}
                            aria-label={`Picture for image ${index + 1}`}
                            onChange={(event) => {
                              if (!event.target.value) return
                              patchSlide(slide.id, { image: event.target.value })
                            }}
                          >
                            {custom ? <option value="">Uploaded image</option> : null}
                            {choices.map((choice) => (
                              <option key={choice.url} value={choice.url}>{choice.label}</option>
                            ))}
                          </select>
                        </label>
                        <label className="admin-field">
                          <span>Caption</span>
                          <input
                            value={slide.caption}
                            aria-label={`Caption for image ${index + 1}`}
                            maxLength={240}
                            onChange={(event) => patchSlide(slide.id, { caption: event.target.value })}
                          />
                        </label>
                      </div>
                      <div className="admin-inline">
                        <button
                          type="button"
                          className="admin-icon"
                          aria-label={`Move image ${index + 1} up`}
                          disabled={busy || saving || index === 0}
                          onClick={() => {
                            setSlides((current) => (current ? moveItem(current, index, index - 1) : current))
                            setNotice('')
                          }}
                        >
                          <Icon name="chevron-up" />
                        </button>
                        <button
                          type="button"
                          className="admin-icon"
                          aria-label={`Move image ${index + 1} down`}
                          disabled={busy || saving || index === slides.length - 1}
                          onClick={() => {
                            setSlides((current) => (current ? moveItem(current, index, index + 1) : current))
                            setNotice('')
                          }}
                        >
                          <Icon name="chevron-down" />
                        </button>
                        <button
                          type="button"
                          className="admin-button admin-button--quiet"
                          disabled={busy || saving}
                          onClick={() => {
                            replaceId.current = slide.id
                            replaceInput.current?.click()
                          }}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          className="admin-button admin-button--quiet"
                          disabled={busy || saving}
                          onClick={() => {
                            setSlides((current) => current?.filter((item) => item.id !== slide.id) ?? current)
                            setNotice('')
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            ) : null}
            <div className="admin-inline">
              <button className="admin-button admin-button--quiet" type="button" disabled={busy || saving} onClick={() => addInput.current?.click()}>
                Add images
              </button>
              <label className="admin-field admin-add-work">
                <span className="sr-only">Add a work</span>
                <select
                  value=""
                  aria-label="Add a work"
                  disabled={busy || saving || works.length === 0}
                  onChange={(event) => {
                    addWork(event.target.value)
                  }}
                >
                  <option value="">Add a work…</option>
                  {works.map((work) => (
                    <option key={work.slug} value={work.slug} disabled={!work.image}>
                      {workLabel(work)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <input
              ref={addInput}
              className="sr-only"
              type="file"
              accept="image/*"
              multiple
              aria-label="Upload homepage images"
              onChange={(event) => {
                const files = takeFiles(event.currentTarget)
                if (files.length === 0) return
                void runUploads(files, (url) => {
                  setSlides((current) => (current ? [...current, { id: crypto.randomUUID(), image: url, slug: '', caption: '' }] : current))
                  setNotice('')
                })
              }}
            />
            <input
              ref={replaceInput}
              className="sr-only"
              type="file"
              accept="image/*"
              aria-label="Replace homepage image"
              onChange={(event) => {
                const id = replaceId.current
                const files = takeFiles(event.currentTarget)
                if (!id || files.length === 0) return
                void runUploads(files.slice(0, 1), (url) => patchSlide(id, { image: url }))
              }}
            />
            {jobs.length > 0 ? (
              <section className="admin-section" aria-labelledby="homepage-uploads">
                <h2 id="homepage-uploads">Uploads</h2>
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

function pictureChoices(work: WorkItem | undefined) {
  if (!work) return []
  const choices: { url: string; label: string }[] = []
  const seen = new Set<string>()
  function add(url: string, label: string) {
    if (!url || seen.has(url)) return
    seen.add(url)
    choices.push({ url, label })
  }
  add(work.image, 'Lead image')
  let gallery = 0
  for (const item of work.images ?? []) {
    if (!item.image || seen.has(item.image)) continue
    gallery += 1
    add(item.image, `Gallery ${gallery}`)
  }
  return choices
}

function workLabel(work: WorkItem) {
  const name = work.name.trim() || work.slug
  return work.year ? `${name} (${work.year})` : name
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
