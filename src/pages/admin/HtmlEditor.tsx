import { useEffect, useLayoutEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { htmlFromPlainText, sanitizeHtml, sanitizeUrl } from '../../lib/sanitize-html'

type HtmlEditorProps = {
  value: string
  onChange: (html: string) => void
  labelledBy: string
  previewClassName?: string
  disabled?: boolean
}

export function HtmlEditor({ value, onChange, labelledBy, previewClassName, disabled = false }: HtmlEditorProps) {
  const [mode, setMode] = useState<'preview' | 'code'>('preview')
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const codeRef = useRef<HTMLTextAreaElement>(null)
  const linkRef = useRef<HTMLInputElement>(null)
  const savedRange = useRef<Range | null>(null)
  const focusOnMode = useRef(false)

  useLayoutEffect(() => {
    const node = previewRef.current
    if (!node) return
    if (!sameHtml(node, value)) node.innerHTML = value
    markEmpty(node)
  }, [value, mode])

  useEffect(() => {
    if (!focusOnMode.current) return
    focusOnMode.current = false
    if (mode === 'preview') previewRef.current?.focus()
    else codeRef.current?.focus()
  }, [mode])

  useEffect(() => {
    if (linkOpen) linkRef.current?.focus()
  }, [linkOpen])

  function commit() {
    const node = previewRef.current
    if (!node) return
    onChange(node.innerHTML)
    markEmpty(node)
  }

  function refreshMarks() {
    try {
      setBold(document.queryCommandState('bold'))
      setItalic(document.queryCommandState('italic'))
    } catch {
      setBold(false)
      setItalic(false)
    }
  }

  function showPreview() {
    if (mode === 'preview') return
    const clean = sanitizeHtml(value)
    if (clean !== value) onChange(clean)
    focusOnMode.current = true
    setMode('preview')
  }

  function showCode() {
    if (mode === 'code') return
    const clean = sanitizeHtml(previewRef.current?.innerHTML ?? value)
    if (clean !== value) onChange(clean)
    setLinkOpen(false)
    focusOnMode.current = true
    setMode('code')
  }

  function format(command: 'bold' | 'italic') {
    if (disabled) return
    previewRef.current?.focus()
    try {
      document.execCommand(command)
    } catch {
      return
    }
    commit()
    refreshMarks()
  }

  function rememberSelection() {
    const preview = previewRef.current
    const selection = window.getSelection()
    if (!preview || !selection || selection.rangeCount === 0) {
      savedRange.current = null
      return
    }
    const range = selection.getRangeAt(0)
    savedRange.current = preview.contains(range.commonAncestorContainer) ? range.cloneRange() : null
  }

  function restoreSelection() {
    const range = savedRange.current
    const selection = window.getSelection()
    if (!range || !selection) return
    selection.removeAllRanges()
    try {
      selection.addRange(range)
    } catch {
      savedRange.current = null
    }
  }

  function applyLink() {
    const href = sanitizeUrl(linkUrl)
    if (!href) {
      setLinkError('Use a web address, email, or site path.')
      return
    }
    const preview = previewRef.current
    if (!preview) return
    preview.focus()
    restoreSelection()
    const selection = window.getSelection()
    try {
      if (selection && !selection.isCollapsed) document.execCommand('createLink', false, href)
      else document.execCommand('insertHTML', false, `<a href="${escapeAttr(href)}">${escapeText(href)}</a>`)
    } catch {
      setLinkError('Could not add that link.')
      return
    }
    commit()
    setLinkOpen(false)
    setLinkUrl('')
    setLinkError('')
  }

  function onPaste(event: ClipboardEvent<HTMLDivElement>) {
    if (disabled) return
    event.preventDefault()
    const html = event.clipboardData.getData('text/html')
    const text = event.clipboardData.getData('text/plain')
    const clean = html.trim() ? sanitizeHtml(html) : htmlFromPlainText(text)
    if (!clean) return
    try {
      document.execCommand('insertHTML', false, clean)
    } catch {
      return
    }
    commit()
  }

  function keepSelection(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
  }

  const previewClass = ['html-editor__preview', previewClassName].filter(Boolean).join(' ')

  return (
    <div className="html-editor">
      <div className="html-editor__bar">
        <div role="tablist" aria-label="Text editor">
          <button
            type="button"
            className="html-editor__mode"
            role="tab"
            aria-selected={mode === 'preview'}
            disabled={disabled}
            onClick={showPreview}
          >
            Preview
          </button>
          <button
            type="button"
            className="html-editor__mode"
            role="tab"
            aria-selected={mode === 'code'}
            disabled={disabled}
            onClick={showCode}
          >
            Code
          </button>
        </div>
        {mode === 'preview' ? (
          <div className="html-editor__tools">
            <button
              type="button"
              className="html-editor__tool"
              aria-pressed={bold}
              aria-label="Bold"
              disabled={disabled}
              onMouseDown={keepSelection}
              onClick={() => format('bold')}
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className="html-editor__tool"
              aria-pressed={italic}
              aria-label="Italic"
              disabled={disabled}
              onMouseDown={keepSelection}
              onClick={() => format('italic')}
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className="html-editor__tool html-editor__tool--text"
              aria-expanded={linkOpen}
              disabled={disabled}
              onMouseDown={keepSelection}
              onClick={() => {
                rememberSelection()
                setLinkError('')
                setLinkOpen((open) => !open)
              }}
            >
              Link
            </button>
          </div>
        ) : null}
      </div>
      {linkOpen && mode === 'preview' ? (
        <div className="html-editor__link">
          <input
            ref={linkRef}
            value={linkUrl}
            placeholder="https://"
            aria-label="Link address"
            disabled={disabled}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setLinkUrl(event.target.value)
              setLinkError('')
            }}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                applyLink()
              }
              if (event.key === 'Escape') setLinkOpen(false)
            }}
          />
          <button type="button" className="admin-button admin-button--quiet" disabled={disabled} onClick={applyLink}>
            Apply
          </button>
          <button type="button" className="admin-button admin-button--quiet" onClick={() => setLinkOpen(false)}>
            Cancel
          </button>
          {linkError ? <p className="admin-error" role="alert">{linkError}</p> : null}
        </div>
      ) : null}
      {mode === 'preview' ? (
        <div
          ref={previewRef}
          className={previewClass}
          contentEditable={!disabled}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={labelledBy}
          data-placeholder="Write here"
          suppressContentEditableWarning
          onInput={commit}
          onPaste={onPaste}
          onKeyUp={refreshMarks}
          onMouseUp={refreshMarks}
          onClick={(event) => {
            if (event.target instanceof HTMLAnchorElement) event.preventDefault()
          }}
        />
      ) : (
        <textarea
          ref={codeRef}
          className="html-editor__code"
          value={value}
          aria-labelledby={labelledBy}
          spellCheck={false}
          disabled={disabled}
          placeholder="<p>Write here.</p>"
          autoCapitalize="off"
          autoCorrect="off"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  )
}

function sameHtml(node: HTMLElement, value: string) {
  if (node.innerHTML === value) return true
  return sanitizeHtml(node.innerHTML) === sanitizeHtml(value)
}

function markEmpty(node: HTMLElement) {
  const empty = !(node.textContent ?? '').replace(/\u00a0/g, ' ').trim()
  node.classList.toggle('is-empty', empty)
}

function escapeText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(value: string) {
  return escapeText(value).replace(/"/g, '&quot;')
}
