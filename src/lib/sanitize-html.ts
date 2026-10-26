const INLINE = new Set(['br', 'strong', 'em', 'u', 'a'])
const ROOT_BLOCKS = new Set(['p', 'h2', 'h3', 'blockquote', 'ul', 'ol'])
const ALLOWED = new Set(['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'blockquote'])
const DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'textarea', 'svg', 'math'])

const RENAME: Record<string, string> = {
  b: 'strong',
  i: 'em',
  h1: 'h2',
  h4: 'h3',
  h5: 'h3',
  h6: 'h3',
  div: 'p',
}

export function sanitizeHtml(value: string) {
  const writer = new Writer()
  for (const token of tokenize(value)) writer.push(token)
  return writer.finish()
}

export function plainText(value: string) {
  return decodeEntities(sanitizeHtml(value).replace(/<br>/g, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function htmlFromPlainText(value: string) {
  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!normalized.trim()) return ''
  const html = normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeText(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')
  return sanitizeHtml(html)
}

export function sanitizeUrl(value: string) {
  const href = decodeEntities(value).trim()
  if (!href || href.length > 2000) return null
  const probe = stripAsciiSpaces(href).toLowerCase()
  if (probe.startsWith('javascript:') || probe.startsWith('data:') || probe.startsWith('vbscript:')) return null
  if (href.startsWith('#') && isSafePath(href)) return href
  if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/\\') && isSafePath(href)) return href
  if (/^mailto:[^\s<>"]+$/i.test(href)) return href
  if (!/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith('//') && isSafePath(href)) return href
  try {
    const url = new URL(href)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    return url.href
  } catch {
    return null
  }
}

type Token =
  | { kind: 'text'; value: string }
  | { kind: 'open'; name: string; attrs: string; selfClosing: boolean }
  | { kind: 'close'; name: string }

function tokenize(value: string) {
  const tokens: Token[] = []
  let index = 0
  while (index < value.length) {
    if (value.startsWith('<!--', index)) {
      const end = value.indexOf('-->', index + 4)
      index = end === -1 ? value.length : end + 3
      continue
    }
    if (value[index] !== '<') {
      const next = value.indexOf('<', index)
      const text = next === -1 ? value.slice(index) : value.slice(index, next)
      tokens.push({ kind: 'text', value: text })
      index = next === -1 ? value.length : next
      continue
    }
    const end = value.indexOf('>', index + 1)
    if (end === -1) {
      tokens.push({ kind: 'text', value: value.slice(index) })
      break
    }
    const raw = value.slice(index + 1, end).trim()
    index = end + 1
    if (!raw || raw.startsWith('!') || raw.startsWith('?')) continue
    const closing = raw.startsWith('/')
    const body = (closing ? raw.slice(1) : raw).trim()
    const nameMatch = /^([a-zA-Z][\w:-]*)([\s\S]*)$/.exec(body)
    if (!nameMatch) {
      tokens.push({ kind: 'text', value: `<${raw}>` })
      continue
    }
    const name = nameMatch[1].toLowerCase()
    const rest = nameMatch[2].trim()
    if (closing) {
      tokens.push({ kind: 'close', name })
      continue
    }
    const selfClosing = rest.endsWith('/') || name === 'br'
    tokens.push({
      kind: 'open',
      name,
      attrs: rest.replace(/\/$/, '').trim(),
      selfClosing,
    })
  }
  return tokens
}

class Writer {
  private readonly stack: string[] = []
  private readonly skipping: string[] = []
  private out = ''

  push(token: Token) {
    if (this.skipping.length > 0) {
      const current = this.skipping[this.skipping.length - 1]
      if (token.kind === 'open' && token.name === current && !token.selfClosing) this.skipping.push(token.name)
      else if (token.kind === 'close' && token.name === current) this.skipping.pop()
      return
    }
    if (token.kind === 'text') {
      this.text(token.value)
      return
    }
    if (token.kind === 'close') {
      const tag = rename(token.name)
      if (tag) this.close(tag)
      return
    }
    if (DROP.has(token.name)) {
      if (!token.selfClosing) this.skipping.push(token.name)
      return
    }
    const tag = rename(token.name)
    if (!tag) return
    if (tag === 'a') {
      const attrs = anchorAttrs(token.attrs)
      if (!attrs) return
      this.open('a', attrs)
      return
    }
    this.open(tag, '')
  }

  finish() {
    while (this.stack.length > 0) this.closeTop()
    return stripEmpty(tidy(this.out))
  }

  private text(raw: string) {
    const decoded = normalizeSpaces(decodeEntities(raw))
    if (!decoded) return
    const blank = decoded.replace(/\u00a0/g, ' ').trim() === ''
    if (blank) {
      if (acceptsText(this.top()) && this.out.endsWith('>')) this.out += ' '
      return
    }
    if (!acceptsText(this.top())) {
      if (this.top() === 'ul' || this.top() === 'ol') {
        if (!this.open('li', '')) return
      } else if (!this.open('p', '')) return
    }
    this.out += escapeText(decoded)
  }

  private open(tag: string, attrs: string) {
    if (tag === 'br') {
      if (!acceptsText(this.top())) {
        if (this.top() === 'ul' || this.top() === 'ol') return false
        if (!this.open('p', '')) return false
      }
      this.out += '<br>'
      return true
    }
    if (!this.ensureParent(tag)) return false
    this.out += `<${tag}${attrs}>`
    this.stack.push(tag)
    return true
  }

  private ensureParent(tag: string) {
    let guard = 0
    while (!canContain(this.top(), tag)) {
      if (guard++ > 40) return false
      if (this.stack.length === 0) {
        if (tag === 'li') {
          if (!this.open('ul', '')) return false
          continue
        }
        if (INLINE.has(tag)) {
          if (!this.open('p', '')) return false
          continue
        }
        return false
      }
      this.closeTop()
    }
    return true
  }

  private close(tag: string) {
    if (tag === 'br') return
    const index = this.stack.lastIndexOf(tag)
    if (index === -1) return
    while (this.stack.length > index) this.closeTop()
  }

  private closeTop() {
    const tag = this.stack.pop()
    if (tag) this.out += `</${tag}>`
  }

  private top() {
    return this.stack[this.stack.length - 1] ?? null
  }
}

function rename(name: string) {
  const tag = RENAME[name] ?? name
  return ALLOWED.has(tag) ? tag : null
}

function canContain(parent: string | null, child: string) {
  if (parent === 'ul' || parent === 'ol') return child === 'li'
  if (parent === 'p' || parent === 'h2' || parent === 'h3' || parent === 'strong' || parent === 'em' || parent === 'u' || parent === 'a') {
    return INLINE.has(child) && !(parent === 'a' && child === 'a')
  }
  if (parent === 'li' || parent === 'blockquote') return child !== 'li'
  return ROOT_BLOCKS.has(child)
}

function acceptsText(parent: string | null) {
  return parent === 'p' || parent === 'h2' || parent === 'h3' || parent === 'li'
    || parent === 'blockquote' || parent === 'strong' || parent === 'em' || parent === 'u' || parent === 'a'
}

function anchorAttrs(source: string) {
  const href = sanitizeUrl(attrValue(source, 'href') ?? '')
  if (!href) return null
  const blank = attrValue(source, 'target') === '_blank'
  const target = blank ? ' target="_blank"' : ''
  const rel = blank ? ' rel="noopener noreferrer"' : ''
  return ` href="${escapeAttr(href)}"${target}${rel}`
}

function attrValue(source: string, wanted: string) {
  const pattern = /([^\s"'=<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source))) {
    if (match[1].toLowerCase() !== wanted) continue
    return decodeEntities(match[2] ?? match[3] ?? match[4] ?? '')
  }
  return null
}

function tidy(html: string) {
  return html
    .replace(/<(p|h2|h3|li|blockquote)> +/g, '<$1>')
    .replace(/ +<\/(p|h2|h3|li|blockquote)>/g, '</$1>')
    .replace(/<(p|h2|h3|li|blockquote)>(?:<br>)+/g, '<$1>')
    .replace(/(?:<br>)+<\/(p|h2|h3|li|blockquote)>/g, '</$1>')
}

function stripEmpty(html: string) {
  let current = html
  for (let pass = 0; pass < 8; pass += 1) {
    const next = current
      .replace(/<(strong|em|u|a|h2|h3|li|ul|ol|blockquote)\b[^>]*>(?:\s|<br>)*<\/\1>/gi, '')
      .replace(/<p>(?:\s|<br>)*<\/p>/gi, '')
    if (next === current) return current
    current = next
  }
  return current
}

function normalizeSpaces(value: string) {
  let cleaned = ''
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if (code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31)) continue
    cleaned += char
  }
  return cleaned.replace(/[ \t\r\n\f]+/g, ' ')
}

function stripAsciiSpaces(value: string) {
  let out = ''
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if (code <= 32) continue
    out += char
  }
  return out
}

function decodeEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|nbsp|quot|apos|#39|lt|gt|amp);/gi, (entity) => {
    const body = entity.slice(1, -1).toLowerCase()
    if (body === 'nbsp') return '\u00a0'
    if (body === 'quot') return '"'
    if (body === 'apos' || body === '#39') return "'"
    if (body === 'lt') return '<'
    if (body === 'gt') return '>'
    if (body === 'amp') return '&'
    if (body.startsWith('#x')) return fromCode(Number.parseInt(body.slice(2), 16))
    if (body.startsWith('#')) return fromCode(Number.parseInt(body.slice(1), 10))
    return entity
  })
}

function fromCode(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 0x10ffff) return ''
  if (value >= 0xd800 && value <= 0xdfff) return ''
  if (value <= 8 || value === 11 || value === 12 || (value >= 14 && value <= 31)) return ''
  return String.fromCodePoint(value)
}

function escapeText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\u00a0/g, '&nbsp;')
}

function escapeAttr(value: string) {
  return escapeText(value).replace(/"/g, '&quot;')
}

function isSafePath(value: string) {
  return !/[\s<>"\\]/.test(value)
}
