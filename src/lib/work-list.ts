export const WORKS_PER_PAGE = 6

export function workListHref(works: readonly { slug: string }[], slug: string) {
  const index = works.findIndex((work) => work.slug === slug)
  if (index < 0) return '/work'
  const page = Math.floor(index / WORKS_PER_PAGE) + 1
  const path = page <= 1 ? '/work' : `/work?page=${page}`
  return `${path}#${encodeURIComponent(slug)}`
}
