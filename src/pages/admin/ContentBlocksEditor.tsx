import { useRef, useState, type ChangeEvent } from 'react'
import { Icon } from '../../components/Icon'
import {
  ABOUT_BLOCK_LIMIT,
  CAROUSEL_IMAGE_LIMIT,
  type AboutAlign,
  type AboutBlock,
  type AboutCarouselSlide,
  type AboutImageAlign,
  type AboutImageSide,
  type AboutImageSize,
  type AboutWidth,
} from '../../data/about'
import { isCarouselCrop, type CarouselCrop } from '../../data/carousel'
import { isImageCrop, type ImageCrop } from '../../data/image-crop'
import { aboutTextClass } from '../../lib/about'
import { uploadImageFile } from '../../lib/admin-api'
import { plainText } from '../../lib/sanitize-html'
import { moveItem } from '../../lib/reorder'
import { HtmlEditor } from './HtmlEditor'

type CarouselSlideDraft = AboutCarouselSlide & { id: string }

export type ContentBlockDraft =
  | (Extract<AboutBlock, { type: 'text' | 'split' }> & { id: string })
  | (Extract<AboutBlock, { type: 'image' }> & { id: string; crop: ImageCrop })
  | { id: string; type: 'carousel'; images: CarouselSlideDraft[]; crop: CarouselCrop }

type ContentBlocksEditorProps = {
  blocks: ContentBlockDraft[]
  onChange: (blocks: ContentBlockDraft[]) => void
  disabled?: boolean
  heading?: string
  headingId?: string
  allowCarousel?: boolean
  onError?: (message: string) => void
}

export function ContentBlocksEditor({
  blocks,
  onChange,
  disabled = false,
  heading,
  headingId = 'content-blocks',
  allowCarousel = false,
  onError,
}: ContentBlocksEditorProps) {
  const [closed, setClosed] = useState<Set<string>>(() => new Set())
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const fileTarget = useRef<string | null>(null)
  const carouselAddInput = useRef<HTMLInputElement>(null)
  const carouselReplaceInput = useRef<HTMLInputElement>(null)
  const carouselTarget = useRef<string | null>(null)
  const carouselReplaceAt = useRef<number | null>(null)
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
        if (block.id !== id || block.type === 'text' || block.type === 'carousel') return block
        return { ...block, image: saved.url }
      }))
    } catch (caught) {
      onError?.(caught instanceof Error ? caught.message : 'Could not upload this image.')
    } finally {
      setUploadingId(null)
    }
  }

  async function onCarouselAdd(event: ChangeEvent<HTMLInputElement>) {
    const id = carouselTarget.current
    const files = [...(event.target.files ?? [])]
    event.target.value = ''
    if (!id || files.length === 0) return
    const block = blocksRef.current.find((item) => item.id === id)
    if (!block || block.type !== 'carousel') return
    const room = CAROUSEL_IMAGE_LIMIT - block.images.length
    if (room <= 0) {
      onError?.(`A carousel can have at most ${CAROUSEL_IMAGE_LIMIT} images.`)
      return
    }
    setUploadingId(id)
    onError?.('')
    try {
      for (const file of files.slice(0, room)) {
        const saved = await uploadImageFile(file, () => undefined)
        onChange(blocksRef.current.map((item) => {
          if (item.id !== id || item.type !== 'carousel') return item
          if (item.images.length >= CAROUSEL_IMAGE_LIMIT) return item
          return {
            ...item,
            images: [...item.images, { id: crypto.randomUUID(), image: saved.url, caption: '' }],
          }
        }))
      }
    } catch (caught) {
      onError?.(caught instanceof Error ? caught.message : 'Could not upload this image.')
    } finally {
      setUploadingId(null)
    }
  }

  async function onCarouselReplace(event: ChangeEvent<HTMLInputElement>) {
    const id = carouselTarget.current
    const index = carouselReplaceAt.current
    const file = event.target.files?.[0]
    event.target.value = ''
    carouselReplaceAt.current = null
    if (!id || index == null || !file) return
    setUploadingId(id)
    onError?.('')
    try {
      const saved = await uploadImageFile(file, () => undefined)
      onChange(blocksRef.current.map((item) => {
        if (item.id !== id || item.type !== 'carousel') return item
        const images = item.images.slice()
        const existing = images[index]
        if (!existing) return item
        images[index] = { ...existing, image: saved.url }
        return { ...item, images }
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
                    {block.type === 'carousel' ? (
                      <CarouselSection
                        block={block}
                        uploading={uploadingId === block.id}
                        disabled={busy}
                        onChange={update}
                        onAdd={() => {
                          carouselTarget.current = block.id
                          carouselAddInput.current?.click()
                        }}
                        onReplace={(slideIndex) => {
                          carouselTarget.current = block.id
                          carouselReplaceAt.current = slideIndex
                          carouselReplaceInput.current?.click()
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
        {allowCarousel ? (
          <button className="admin-button admin-button--quiet" type="button" disabled={busy || atLimit} onClick={() => addBlock('carousel')}>
            Add carousel
          </button>
        ) : null}
      </div>
      <input
        ref={fileInput}
        className="sr-only"
        type="file"
        accept="image/*"
        aria-label="Upload content image"
        onChange={(event) => void onUpload(event)}
      />
      {allowCarousel ? (
        <>
          <input
            ref={carouselAddInput}
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            aria-label="Upload carousel images"
            onChange={(event) => void onCarouselAdd(event)}
          />
          <input
            ref={carouselReplaceInput}
            className="sr-only"
            type="file"
            accept="image/*"
            aria-label="Replace carousel image"
            onChange={(event) => void onCarouselReplace(event)}
          />
        </>
      ) : null}
    </section>
  )
}

export function draftsFromBlocks(blocks: AboutBlock[]): ContentBlockDraft[] {
  return blocks.map((block) => {
    if (block.type === 'image') {
      return {
        ...block,
        id: crypto.randomUUID(),
        size: block.size ?? 'full',
        align: block.align ?? 'center',
        crop: block.crop ?? 'original',
      }
    }
    if (block.type === 'carousel') {
      return {
        id: crypto.randomUUID(),
        type: 'carousel',
        crop: block.crop ?? 'none',
        images: block.images.map((slide) => ({
          id: crypto.randomUUID(),
          image: slide.image,
          caption: slide.caption ?? '',
        })),
      }
    }
    return { ...block, id: crypto.randomUUID() }
  })
}

export function storedBlocks(drafts: ContentBlockDraft[]): AboutBlock[] {
  return drafts.map(storedBlock)
}

export function validateBlocks(blocks: ContentBlockDraft[]) {
  for (const block of blocks) {
    if (block.type === 'text') continue
    if (block.type === 'carousel') {
      if (block.images.length === 0) return 'Each carousel needs at least one image.'
      for (const slide of block.images) {
        if (!slide.image) return 'Each carousel image needs a file.'
      }
      continue
    }
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
              if (align !== 'left' && align !== 'center' && align !== 'right' && align !== 'justify') return
              onChange({ ...block, align })
            }}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
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
    <>
      <div className="admin-choices">
        <label className="admin-field">
          <span>Alignment</span>
          <select
            value={block.align ?? 'center'}
            disabled={disabled}
            aria-label={`Alignment for ${blockName(block)}`}
            onChange={(event) => {
              const align = event.target.value as AboutImageAlign
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
          <span>Size</span>
          <select
            value={block.size ?? 'full'}
            disabled={disabled}
            aria-label={`Size for ${blockName(block)}`}
            onChange={(event) => {
              const size = event.target.value as AboutImageSize
              if (size !== 'small' && size !== 'medium' && size !== 'large' && size !== 'full') return
              onChange({ ...block, size })
            }}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="full">Full</option>
          </select>
        </label>
        <label className="admin-field">
          <span>Crop</span>
          <select
            value={block.crop ?? 'original'}
            disabled={disabled}
            aria-label={`Crop for ${blockName(block)}`}
            onChange={(event) => {
              const crop = event.target.value
              if (!isImageCrop(crop)) return
              onChange({ ...block, crop })
            }}
          >
            <option value="original">Original</option>
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
            <option value="square">Square</option>
          </select>
        </label>
      </div>
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
    </>
  )
}

function CarouselSection({
  block,
  uploading,
  disabled,
  onChange,
  onAdd,
  onReplace,
}: {
  block: Extract<ContentBlockDraft, { type: 'carousel' }>
  uploading: boolean
  disabled: boolean
  onChange: (block: ContentBlockDraft) => void
  onAdd: () => void
  onReplace: (index: number) => void
}) {
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const dragFrom = useRef<number | null>(null)
  const atLimit = block.images.length >= CAROUSEL_IMAGE_LIMIT

  return (
    <>
      <label className="admin-field">
        <span>Crop</span>
        <select
          value={block.crop}
          disabled={disabled}
          aria-label="Carousel image crop"
          onChange={(event) => {
            const crop = event.target.value
            if (!isCarouselCrop(crop)) return
            onChange({ ...block, crop })
          }}
        >
          <option value="none">None</option>
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </label>
      {block.images.length === 0 ? <p>No carousel images yet.</p> : null}
      {block.images.length > 0 ? (
        <ol className="admin-list">
          {block.images.map((image, index) => (
            <li
              key={image.id}
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
                if (from == null) return
                onChange({ ...block, images: moveItem(block.images, from, index) })
              }}
            >
              <button
                type="button"
                className="admin-drag"
                draggable={!disabled}
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
              <img src={image.image} alt="" />
              <div className="admin-slide-fields">
                <span>Image {index + 1}</span>
                <label className="admin-field">
                  <span>Caption</span>
                  <input
                    value={image.caption}
                    aria-label={`Caption for carousel image ${index + 1}`}
                    maxLength={240}
                    disabled={disabled}
                    onChange={(event) => {
                      const caption = event.target.value
                      onChange({
                        ...block,
                        images: block.images.map((item) => (item.id === image.id ? { ...item, caption } : item)),
                      })
                    }}
                  />
                </label>
              </div>
              <div className="admin-inline">
                <button
                  type="button"
                  className="admin-icon"
                  aria-label={`Move image ${index + 1} up`}
                  disabled={disabled || index === 0}
                  onClick={() => onChange({ ...block, images: moveItem(block.images, index, index - 1) })}
                >
                  <Icon name="chevron-up" />
                </button>
                <button
                  type="button"
                  className="admin-icon"
                  aria-label={`Move image ${index + 1} down`}
                  disabled={disabled || index === block.images.length - 1}
                  onClick={() => onChange({ ...block, images: moveItem(block.images, index, index + 1) })}
                >
                  <Icon name="chevron-down" />
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--quiet"
                  disabled={disabled}
                  onClick={() => onReplace(index)}
                >
                  Replace
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--quiet"
                  disabled={disabled}
                  onClick={() => onChange({
                    ...block,
                    images: block.images.filter((item) => item.id !== image.id),
                  })}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      <button
        className="admin-button admin-button--quiet"
        type="button"
        disabled={disabled || atLimit}
        onClick={onAdd}
      >
        {uploading ? 'Uploading…' : 'Add images'}
      </button>
    </>
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
  if (type === 'image') return { id, type, image: '', alt: '', caption: '', size: 'full', align: 'center', crop: 'original' }
  if (type === 'carousel') return { id, type, images: [], crop: 'none' }
  return { id, type, html: '', image: '', alt: '', caption: '', imageSide: 'end' }
}

function storedBlock(draft: ContentBlockDraft): AboutBlock {
  if (draft.type === 'text') return { type: 'text', html: draft.html, align: draft.align, width: draft.width }
  if (draft.type === 'image') {
    return {
      type: 'image',
      image: draft.image,
      alt: draft.alt.trim(),
      caption: draft.caption.trim(),
      size: draft.size ?? 'full',
      align: draft.align ?? 'center',
      crop: draft.crop ?? 'original',
    }
  }
  if (draft.type === 'carousel') {
    return {
      type: 'carousel',
      crop: draft.crop,
      images: draft.images.map((slide) => {
        const caption = slide.caption.trim()
        return caption ? { image: slide.image, caption } : { image: slide.image, caption: '' }
      }),
    }
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
  if (block.type === 'carousel') return 'Carousel'
  return 'Text and image'
}

function blockSummary(block: ContentBlockDraft) {
  if (block.type === 'image') return block.caption.trim() || block.alt.trim() || 'Image'
  if (block.type === 'carousel') {
    const count = block.images.length
    if (count === 0) return 'Carousel'
    return `Carousel · ${count} image${count === 1 ? '' : 's'}`
  }
  const text = plainText(block.html)
  if (block.type === 'text') return text || 'Text'
  return text || block.caption.trim() || 'Text and image'
}
