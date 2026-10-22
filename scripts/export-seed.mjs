// Copies the local Netlify dev works, homepage, and images into the committed seed.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const blobs = join(root, '.netlify/blobs-serve/entries/unlinked/site:works')
const imageBlobs = join(root, '.netlify/blobs-serve/entries/unlinked/site:work-images')
const imageDir = join(root, 'public/images/works')
const staticImage = /^\/images\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.[A-Za-z0-9]+$/
const uploadedImage = /^\/api\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

const listPath = join(blobs, 'list')
const homepagePath = join(blobs, 'homepage')
if (!existsSync(listPath) || !existsSync(homepagePath)) {
  console.error('Local works were not found. Run npm run dev and save the site first.')
  process.exit(1)
}

const works = JSON.parse(readFileSync(listPath, 'utf8'))
const slides = JSON.parse(readFileSync(homepagePath, 'utf8'))
const ids = new Set()

function rewrite(url) {
  if (typeof url !== 'string') return url
  const uploaded = uploadedImage.exec(url)
  if (uploaded) {
    const id = uploaded[1].toLowerCase()
    ids.add(id)
    return `/images/works/${id}.jpg`
  }
  return url
}

if (!Array.isArray(works) || !Array.isArray(slides)) {
  console.error('Local works or homepage could not be read.')
  process.exit(1)
}

for (const work of works) {
  work.image = rewrite(work.image)
  if (Array.isArray(work.images)) work.images = work.images.map(rewrite)
}
for (const slide of slides) slide.image = rewrite(slide.image)

const urls = [
  ...works.flatMap((work) => [work.image, ...(work.images ?? [])]),
  ...slides.map((slide) => slide.image),
]
for (const url of urls) {
  if (!staticImage.test(url)) {
    console.error(`Image path cannot be deployed: ${url}`)
    process.exit(1)
  }
}

const worksTypes = `export type WorkPiece = {
  title: string
  subtitle?: string
  year: string
  materials: string
  dimensions: string
}

export type WorkItem = {
  slug: string
  image: string
  name: string
  dimensions: string
  materials: string
  year: string
  location?: string
  description?: string
  images?: string[]
  pieces?: WorkPiece[]
}

`

const homepageTypes = `export type HomepageSlide = {
  image: string
  /** Work this image opens, for example \`a-household-item-2026\` → \`/work/a-household-item-2026\`. */
  slug: string
}

`

rmSync(imageDir, { recursive: true, force: true })
mkdirSync(imageDir, { recursive: true })
for (const id of ids) {
  const source = join(imageBlobs, id)
  if (!existsSync(source)) {
    console.error(`Missing local image ${id}`)
    process.exit(1)
  }
  copyFileSync(source, join(imageDir, `${id}.jpg`))
}

writeFileSync(join(root, 'src/data/works-seed.ts'), `${worksTypes}export const worksSeed: WorkItem[] = ${JSON.stringify(works, null, 2)}\n`)
writeFileSync(join(root, 'src/data/homepage.ts'), `${homepageTypes}export const homepageSeed: HomepageSlide[] = ${JSON.stringify(slides, null, 2)}\n`)
console.log(`Exported ${works.length} works, ${slides.length} homepage slides, and ${ids.size} images.`)
