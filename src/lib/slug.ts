const SLUG_MAX = 80

export function slugify(value: string) {
  return slugInput(value).replace(/^-+|-+$/g, '')
}

export function slugInput(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, SLUG_MAX)
}

export function isSlug(value: string) {
  return value.length <= SLUG_MAX && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value !== 'new'
}
