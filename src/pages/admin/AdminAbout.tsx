import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Seo } from '../../components/Seo'
import { Icon } from '../../components/Icon'
import { ABOUT_BLOCK_LIMIT, type AboutAlign, type AboutBlock, type AboutImageSide, type AboutWidth } from '../../data/about'
import { aboutTextClass, fetchAbout } from '../../lib/about'
import { ApiError, logout, saveAbout, uploadImageFile } from '../../lib/admin-api'
import { plainText } from '../../lib/sanitize-html'
import { moveItem } from '../../lib/reorder'
import { AdminGate } from './AdminGate'
import { AdminNav } from './AdminNav'
import { HtmlEditor } from './HtmlEditor'

type Draft = AboutBlock & { id: string }

export function AdminAbout() {
  return (
    <AdminGate>
      <AboutEditor />
    </AdminGate>
  )
}

function AboutEditor() {
  const navigate = useNavigate()
  const [blocks, setBlocks] = useState<Draft[] | null>(null)
  const [closed, setClosed] = useState<Set<string>>(() => new Set())
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const fileTarget = useRef<string | null>(null)
  const dragFrom = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchAbout().then((next) => {
      if (cancelled) return
      if (!next) {
        setLoadError('The about page could not be loaded. Check that the site API is running.')
        return
      }
      setBlocks(next.map((block) => ({ ...block, id: crypto.randomUUID() })))
    })
    return () => {
      cancelled = true
    }
  }, [])

  function update(next: Draft) {
    setBlocks((current) => current?.map((block) => (block.id === next.id ? next : block)) ?? null)
    setNotice('')
    setError('')
  }

  function addBlock(type: Draft['type']) {
    const block = createBlock(type)
    setBlocks((current) => (current && current.length < ABOUT_BLOCK_LIMIT ? [...current, block] : current))
    setNotice('')
    setError('')
    requestAnimationFrame(() => {
      document.getElementById(`about-block-${block.id}`)?.scrollIntoView({ block: 'nearest' })
    })
  }

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const id = fileTarget.current
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!id || !file) return
    setUploadingId(id)
    setError('')
    try {
      const saved = await uploadImageFile(file, () => undefined)
      setBlocks((current) => current?.map((block) => {
        if (block.id !== id || block.type === 'text') return block
        return { ...block, image: saved.url }
      }) ?? null)
      setNotice('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not upload this image.')
    } finally {
      setUploadingId(null)
    }
  }

  async function onSave() {
    if (!blocks || saving || uploadingId) return
    const invalid = validate(blocks)
    if (invalid) {
      setError(invalid)
      return
    }
    setSaving(true)
    setError('')
    try {
      const saved = await saveAbout(blocks.map(storedBlock))
      setBlocks((current) => saved.blocks.map((block, index) => ({
        ...block,
        id: current?.[index]?.id ?? crypto.randomUUID(),
      })))
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

  const busy = saving || uploadingId != null
  const atLimit = (blocks?.length ?? 0) >= ABOUT_BLOCK_LIMIT

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
              <button className="admin-button" type="submit" disabled={busy}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            {blocks.length === 0 ? <p>No sections yet.</p> : null}
            {blocks.length > 0 ? (
              <ol className="admin-list">
                {blocks.map((block, index) => {
                  const collapsed = closed.has(block.id)
                  const detailsId = `about-details-${block.id}`
                  return (
                    <li
                      key={block.id}
                      id={`about-block-${block.id}`}
                      className={`admin-piece${dropIndex === index ? ' is-drop-target' : ''}`}
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
                          setBlocks((current) => (current ? moveItem(current, from, index) : current))
                          setNotice('')
                        }}
                    >
                      <div className="admin-piece__bar">
                        <button
                          type="button"
                          className="admin-drag"
                          draggable={!busy}
                          aria-label={`Drag section ${index + 1}`}
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
                        <button
                          type="button"
                          className="admin-icon"
                          aria-expanded={!collapsed}
                          aria-controls={detailsId}
                          aria-label={collapsed ? `Expand section ${index + 1}` : `Collapse section ${index + 1}`}
                          onClick={() => {
                            setClosed((current) => {
                              const next = new Set(current)
                              if (next.has(block.id)) next.delete(block.id)
                              else next.add(block.id)
                              return next
                            })
                          }}
                        >
                          {collapsed ? '+' : '−'}
                        </button>
                        <span>{collapsed ? blockSummary(block) : blockName(block)}</span>
                        <div className="admin-inline">
                          <button
                            type="button"
                            className="admin-icon"
                            aria-label={`Move section ${index + 1} up`}
                            disabled={busy || index === 0}
                            onClick={() => {
                              setBlocks((current) => (current ? moveItem(current, index, index - 1) : current))
                              setNotice('')
                            }}
                          >
                            <Icon name="chevron-up" />
                          </button>
                          <button
                            type="button"
                            className="admin-icon"
                            aria-label={`Move section ${index + 1} down`}
                            disabled={busy || index === blocks.length - 1}
                            onClick={() => {
                              setBlocks((current) => (current ? moveItem(current, index, index + 1) : current))
                              setNotice('')
                            }}
                          >
                            <Icon name="chevron-down" />
                          </button>
                          <button
                            type="button"
                            className="admin-button admin-button--quiet"
                            disabled={busy}
                            onClick={() => {
                              setBlocks((current) => current?.filter((item) => item.id !== block.id) ?? null)
                              setNotice('')
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {collapsed ? null : (
                        <div id={detailsId} className="admin-piece__details">
                          {block.type === 'text' ? (
                            <TextSection block={block} disabled={busy} onChange={update} />
                          ) : null}
                          {block.type === 'image' ? (
                            <ImageSection
                              block={block}
                              uploading={uploadingId === block.id}
                              disabled={busy}
                              onChange={update}
                              onPick={() => {
                                fileTarget.current = block.id
                                fileInput.current?.click()
                              }}
                            />
                          ) : null}
                          {block.type === 'split' ? (
                            <SplitSection
                              block={block}
                              uploading={uploadingId === block.id}
                              disabled={busy}
                              onChange={update}
                              onPick={() => {
                                fileTarget.current = block.id
                                fileInput.current?.click()
                              }}
                            />
                          ) : null}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ol>
            ) : null}
            <div className="admin-inline">
              <button className="admin-button admin-button--quiet" type="button" disabled={busy || atLimit} onClick={() => addBlock('text')}>
                Add text
              </button>
              <button className="admin-button admin-button--quiet" type="button" disabled={busy || atLimit} onClick={() => addBlock('image')}>
                Add image
              </button>
              <button className="admin-button admin-button--quiet" type="button" disabled={busy || atLimit} onClick={() => addBlock('split')}>
                Add text and image
              </button>
            </div>
            <input
              ref={fileInput}
              className="sr-only"
              type="file"
              accept="image/*"
              aria-label="Upload about image"
              onChange={(event) => void onUpload(event)}
            />
          </form>
        ) : null}
      </article>
    </div>
  )
}

function TextSection({ block, disabled, onChange }: { block: Extract<Draft, { type: 'text' }>; disabled: boolean; onChange: (block: Draft) => void }) {
  const labelId = `about-text-${block.id}`
  return (
    <>
      <div className="admin-choices">
        <label className="admin-field">
          <span>Alignment</span>
          <select
            value={block.align}
            disabled={disabled}
            aria-label={`Alignment for ${blockName(block)}`}
            onChange={(event) => {
              const align = event.target.value as AboutAlign
              if (align !== 'left' && align !== 'center' && align !== 'right') return
              onChange({ ...block, align })
            }}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label className="admin-field">
          <span>Width</span>
          <select
            value={block.width}
            disabled={disabled}
            aria-label={`Width for ${blockName(block)}`}
            onChange={(event) => {
              const width = event.target.value as AboutWidth
              if (width !== 'full' && width !== 'medium' && width !== 'small') return
              onChange({ ...block, width })
            }}
          >
            <option value="full">Full</option>
            <option value="medium">Medium</option>
            <option value="small">Narrow</option>
          </select>
        </label>
      </div>
      <div className="admin-field">
        <span id={labelId}>Text</span>
        <HtmlEditor
          value={block.html}
          labelledBy={labelId}
          previewClassName={aboutTextClass(block.align, block.width)}
          disabled={disabled}
          onChange={(html) => onChange({ ...block, html })}
        />
      </div>
    </>
  )
}

function SplitSection({
  block,
  uploading,
  disabled,
  onChange,
  onPick,
}: {
  block: Extract<Draft, { type: 'split' }>
  uploading: boolean
  disabled: boolean
  onChange: (block: Draft) => void
  onPick: () => void
}) {
  const labelId = `about-text-${block.id}`
  const imageFirst = block.imageSide === 'start'
  const text = (
    <div className="admin-field">
      <span id={labelId}>Text</span>
      <HtmlEditor
        value={block.html}
        labelledBy={labelId}
        previewClassName={aboutTextClass()}
        disabled={disabled}
        onChange={(html) => onChange({ ...block, html })}
      />
    </div>
  )
  const image = (
    <ImageFields
      image={block.image}
      alt={block.alt}
      caption={block.caption}
      uploading={uploading}
      disabled={disabled}
      onAlt={(alt) => onChange({ ...block, alt })}
      onCaption={(caption) => onChange({ ...block, caption })}
      onPick={onPick}
      onClear={() => onChange({ ...block, image: '' })}
    />
  )
  return (
    <>
      <label className="admin-field">
        <span>Image position</span>
        <select
          value={block.imageSide}
          disabled={disabled}
          onChange={(event) => {
            const imageSide = event.target.value as AboutImageSide
            if (imageSide !== 'start' && imageSide !== 'end') return
            onChange({ ...block, imageSide })
          }}
        >
          <option value="start">Left</option>
          <option value="end">Right</option>
        </select>
      </label>
      {imageFirst ? image : text}
      {imageFirst ? text : image}
    </>
  )
}

function ImageSection({
  block,
  uploading,
  disabled,
  onChange,
  onPick,
}: {
  block: Extract<Draft, { type: 'image' }>
  uploading: boolean
  disabled: boolean
  onChange: (block: Draft) => void
  onPick: () => void
}) {
  return (
    <ImageFields
      image={block.image}
      alt={block.alt}
      caption={block.caption}
      uploading={uploading}
      disabled={disabled}
      onAlt={(alt) => onChange({ ...block, alt })}
      onCaption={(caption) => onChange({ ...block, caption })}
      onPick={onPick}
      onClear={() => onChange({ ...block, image: '' })}
    />
  )
}

function ImageFields({
  image,
  alt,
  caption,
  uploading,
  disabled,
  onAlt,
  onCaption,
  onPick,
  onClear,
}: {
  image: string
  alt: string
  caption: string
  uploading: boolean
  disabled: boolean
  onAlt: (alt: string) => void
  onCaption: (caption: string) => void
  onPick: () => void
  onClear: () => void
}) {
  return (
    <div className="admin-piece__details">
      {image ? <img className="admin-about-image" src={image} alt="" /> : <span className="admin-thumb" />}
      <div className="admin-inline">
        <button className="admin-button admin-button--quiet" type="button" disabled={disabled} onClick={onPick}>
          {uploading ? 'Uploading…' : image ? 'Replace image' : 'Upload image'}
        </button>
        {image ? (
          <button className="admin-button admin-button--quiet" type="button" disabled={disabled} onClick={onClear}>
            Remove image
          </button>
        ) : null}
      </div>
      <label className="admin-field">
        <span>Description</span>
        <input
          value={alt}
          disabled={disabled}
          autoComplete="off"
          maxLength={300}
          onChange={(event) => onAlt(event.target.value)}
        />
      </label>
      <label className="admin-field">
        <span>Caption</span>
        <input
          value={caption}
          disabled={disabled}
          autoComplete="off"
          maxLength={400}
          onChange={(event) => onCaption(event.target.value)}
        />
      </label>
    </div>
  )
}

function createBlock(type: Draft['type']): Draft {
  const id = crypto.randomUUID()
  if (type === 'text') return { id, type, html: '', align: 'left', width: 'full' }
  if (type === 'image') return { id, type, image: '', alt: '', caption: '' }
  return { id, type, html: '', image: '', alt: '', caption: '', imageSide: 'end' }
}

function storedBlock(draft: Draft): AboutBlock {
  if (draft.type === 'text') return { type: 'text', html: draft.html, align: draft.align, width: draft.width }
  if (draft.type === 'image') {
    return { type: 'image', image: draft.image, alt: draft.alt.trim(), caption: draft.caption.trim() }
  }
  return {
    type: 'split',
    html: draft.html,
    image: draft.image,
    alt: draft.alt.trim(),
    caption: draft.caption.trim(),
    imageSide: draft.imageSide,
  }
}

function validate(blocks: Draft[]) {
  for (const block of blocks) {
    if (block.type === 'text') continue
    if (!block.image) return 'Each image needs a file.'
    if (!block.alt.trim()) return 'Each image needs a description.'
  }
  return ''
}

function blockName(block: Draft) {
  if (block.type === 'text') return 'Text'
  if (block.type === 'image') return 'Image'
  return 'Text and image'
}

function blockSummary(block: Draft) {
  if (block.type === 'image') return block.caption.trim() || block.alt.trim() || 'Image'
  const text = plainText(block.html)
  if (block.type === 'text') return text || 'Text'
  return text || block.caption.trim() || 'Text and image'
}
