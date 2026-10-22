export function scrollToHash(hash: string) {
  const id = hashId(hash)
  if (!id) return false
  const target = document.getElementById(id)
  if (!target) return false

  const header = document.querySelector('.site-header')
  const headerHeight = header instanceof HTMLElement ? header.getBoundingClientRect().height : 0
  const styleOffset = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0
  const offset = Math.max(styleOffset, headerHeight + 16)
  const top = target.getBoundingClientRect().top + window.scrollY - offset
  const root = document.documentElement
  const previous = root.style.scrollBehavior
  root.style.scrollBehavior = 'auto'
  window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'instant' })
  root.style.scrollBehavior = previous
  return true
}

function hashId(hash: string) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
