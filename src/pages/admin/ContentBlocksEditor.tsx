import { useRef, useState, type ChangeEvent } from 'react'
import { Icon } from '../../components/Icon'
import { ABOUT_BLOCK_LIMIT, type AboutAlign, type AboutBlock, type AboutImageSide, type AboutWidth } from '../../data/about'
import { aboutTextClass } from '../../lib/about'
import { uploadImageFile } from '../../lib/admin-api'
import { plainText } from '../../lib/sanitize-html'
import { moveItem } from '../../lib/reorder'
import { HtmlEditor } from './HtmlEditor'

export type ContentBlockDraft = AboutBlock & { id: string }

type ContentBlocksEditorProps = {
  blocks: ContentBlockDraft[]
  onChange: (blocks: ContentBlockDraft[]) => void
  disabled?: boolean
  heading?: string
  headingId?: string
  onError?: (message: string) => void
}

export function ContentBlocksEditor({
  blocks,
  onChange,
  disabled = false,
  heading,
  headingId = 'content-blocks',
  onError,
}: ContentBlocksEditorProps) {
  const [closed, setClosed] = useState<Set<string>>(() => new Set())
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const fileTarget = useRef<string | null>(null)
  const dragFrom = useRef<number | null>(null)
  const blocksRef = useRef(blocks)
  blocksRef.current = blocks
  const busy = disabled || uploadingId != null
  const atLimit = blocks.length >= ABOUT_BLOCK_LIMIT

  function update(next: ContentBlockDraft) {
    onChange(blocksRef.current.map((block) => (block.id === next.id ? next : block)))
  }

  function addBlock(type: ContentBlockDraft['type']) {
    if (atLimit) return
    const block = createBlock(type)
    onChange([...blocksRef.current, block])
    requestAnimationFrame(() => {
      document.getElementById(`content-block-${block.id}`)?.scrollIntoView({ block: 'nearest' })
    })
  }

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const id = fileTarget.current
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!id || !file) return
    setUploadingId(id)
    onError?.('')
    try {
      const saved = await uploadImageFile(file, () => undefined)
      onChange(blocksRef.current.map((block) => {
        if (block.id !== id || block.type === 'text') return block
        return { ...block, image: saved.url }
      }))
    } catch (caught) {
      onError?.(caught instanceof Error ? caught.message : 'Could not upload this image.')
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <section className="admin-section" aria-labelledby={heading ? headingId : undefined}>
      {heading ? <h2 id={headingId}>{heading}</h2> : null}
      {blocks.length === 0 ? <p>No sections yet.</p> : null}
      {blocks.length > 0 ? (
        <ol className="admin-list">
          {blocks.map((block, index) => {
            const collapsed = closed.has(block.id)
            const detailsId = `content-details-${block.id}`
            return (
              <li
                key={block.id}
                id={`content-block-${block.id}`}
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
                  onChange(moveItem(blocks, from, index))
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
                      onClick={() => onChange(moveItem(blocks, index, index - 1))}
                    >
                      <Icon name="chevron-up" />
                    </button>
                    <button
                      type="button"
                      className="admin-icon"
                      aria-label={`Move section ${index + 1} down`}
                      disabled={busy || index === blocks.length - 1}
                      onClick={() => onChange(moveItem(blocks, index, index + 1))}
                    >
                      <Icon name="chevron-down" />
                    </button>
                    <button
                      type="button"
                      className="admin-button admin-button--quiet"
                      disabled={busy}
                      onClick={() => onChange(blocks.filter((item) => item.id !== block.id))}
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
        aria-label="Upload content image"
        onChange={(event) => void onUpload(event)}
      />
    </section>
  )
}

export function draftsFromBlocks(blocks: AboutBlock[]): ContentBlockDraft[] {
  return blocks.map((block) => ({ ...block, id: crypto.randomUUID() }))
}

export function storedBlocks(drafts: ContentBlockDraft[]): AboutBlock[] {
  return drafts.map(storedBlock)
}

export function validateBlocks(blocks: ContentBlockDraft[]) {
  for (const block of blocks) {
    if (block.type === 'text') continue
    if (!block.image) return 'Each image needs a file.'
    if (!block.alt.trim()) return 'Each image needs a description.'
  }
  return ''
}

function TextSection({ block, disabled, onChange }: { block: Extract<ContentBlockDraft, { type: 'text' }>; disabled: boolean; onChange: (block: ContentBlockDraft) => void }) {
  const labelId = `content-text-${block.id}`
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
  block: Extract<ContentBlockDraft, { type: 'split' }>
  uploading: boolean
  disabled: boolean
  onChange: (block: ContentBlockDraft) => void
  onPick: () => void
}) {
  const labelId = `content-text-${block.id}`
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
  block: Extract<ContentBlockDraft, { type: 'image' }>
  uploading: boolean
  disabled: boolean
  onChange: (block: ContentBlockDraft) => void
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

function createBlock(type: ContentBlockDraft['type']): ContentBlockDraft {
  const id = crypto.randomUUID()
  if (type === 'text') return { id, type, html: '', align: 'left', width: 'full' }
  if (type === 'image') return { id, type, image: '', alt: '', caption: '' }
  return { id, type, html: '', image: '', alt: '', caption: '', imageSide: 'end' }
}

function storedBlock(draft: ContentBlockDraft): AboutBlock {
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

function blockName(block: ContentBlockDraft) {
  if (block.type === 'text') return 'Text'
  if (block.type === 'image') return 'Image'
  return 'Text and image'
}

function blockSummary(block: ContentBlockDraft) {
  if (block.type === 'image') return block.caption.trim() || block.alt.trim() || 'Image'
  const text = plainText(block.html)
  if (block.type === 'text') return text || 'Text'
  return text || block.caption.trim() || 'Text and image'
}
