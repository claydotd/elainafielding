// Probes uploaded work-images and writes width/height into the image-sizes registry.
//
// Local (default): reads/writes .netlify/blobs-serve used by `netlify dev`.
// Remote:          npm run backfill-image-sizes -- --remote
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getStore } from '@netlify/blobs'
import { imageSize } from 'image-size'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const blobsRoot = join(root, '.netlify/blobs-serve')
const localSiteId = 'unlinked'
const remote = process.argv.includes('--remote')
const concurrency = 6

function resolveToken() {
  const fromEnv = process.env.NETLIFY_AUTH_TOKEN?.trim()
  if (fromEnv) return fromEnv

  const candidates = [
    join(homedir(), 'Library/Preferences/netlify/config.json'),
    join(homedir(), '.config/netlify/config.json'),
    join(homedir(), '.netlify/config.json'),
  ]
  for (const path of candidates) {
    if (!existsSync(path)) continue
    try {
      const config = JSON.parse(readFileSync(path, 'utf8'))
      const users = config?.users
      if (!users || typeof users !== 'object') continue
      const preferred = config.userId && users[config.userId]
      const user = preferred ?? Object.values(users)[0]
      const auth = user?.auth
      const token = (typeof auth === 'string' ? auth : auth?.token)?.trim()
      if (token) return token
    } catch {
      // Try the next known CLI config location.
    }
  }
  return ''
}

function resolveSiteId() {
  const fromEnv = process.env.NETLIFY_SITE_ID?.trim()
  if (fromEnv) return fromEnv
  const statePath = join(root, '.netlify/state.json')
  if (!existsSync(statePath)) return ''
  try {
    const state = JSON.parse(readFileSync(statePath, 'utf8'))
    return typeof state.siteId === 'string' ? state.siteId.trim() : ''
  } catch {
    return ''
  }
}

function probe(bytes) {
  try {
    const result = imageSize(Buffer.from(bytes))
    if (!result?.width || !result?.height) return null
    return { width: result.width, height: result.height }
  } catch {
    return null
  }
}

function intMeta(value) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const n = Number(value)
    if (n > 0) return n
  }
  return undefined
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length)
  let next = 0
  async function run() {
    while (next < items.length) {
      const index = next++
      results[index] = await worker(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}

async function backfillRemote() {
  const token = resolveToken()
  const siteID = resolveSiteId()
  if (!token) {
    console.error('No Netlify auth token found. Run `netlify login` or set NETLIFY_AUTH_TOKEN.')
    process.exit(1)
  }
  if (!siteID) {
    console.error('No linked Netlify site. Run `netlify link` or set NETLIFY_SITE_ID.')
    process.exit(1)
  }

  const works = getStore({ name: 'works', siteID, token, consistency: 'strong' })
  const images = getStore({ name: 'work-images', siteID, token, consistency: 'strong' })
  const existing = (await works.get('image-sizes', { type: 'json' })) ?? {}
  const sizes = typeof existing === 'object' && existing && !Array.isArray(existing) ? { ...existing } : {}

  const keys = []
  for await (const page of images.list({ paginate: true })) {
    for (const blob of page.blobs ?? []) keys.push(blob.key)
  }

  let updated = 0
  let skipped = 0
  let failed = 0

  await mapPool(keys, concurrency, async (id) => {
    const url = `/api/images/${id}`
    if (Array.isArray(sizes[url]) && sizes[url].length === 2) {
      skipped += 1
      return
    }

    const result = await images.getWithMetadata(id, { type: 'arrayBuffer' })
    if (!result?.data) {
      failed += 1
      return
    }

    const contentType = typeof result.metadata?.contentType === 'string'
      ? result.metadata.contentType
      : 'application/octet-stream'
    let width = intMeta(result.metadata?.width)
    let height = intMeta(result.metadata?.height)

    if (!width || !height) {
      const probed = probe(result.data)
      if (!probed) {
        failed += 1
        return
      }
      width = probed.width
      height = probed.height
      await images.set(id, result.data, {
        metadata: { contentType, width: String(width), height: String(height) },
      })
    }

    sizes[url] = [width, height]
    updated += 1
  })

  await works.setJSON('image-sizes', sizes)
  console.log(`Remote backfill: ${updated} updated, ${skipped} skipped, ${failed} failed (${keys.length} images).`)
}

function storePaths(storeName) {
  const encoded = `site:${storeName}`
  return {
    entries: join(blobsRoot, 'entries', localSiteId, encoded),
    metadata: join(blobsRoot, 'metadata', localSiteId, encoded),
  }
}

function backfillLocal() {
  const imagePaths = storePaths('work-images')
  const worksPaths = storePaths('works')
  if (!existsSync(imagePaths.entries)) {
    console.error('Local work-images were not found. Run npm run pull-blobs first.')
    process.exit(1)
  }

  mkdirSync(worksPaths.entries, { recursive: true })
  mkdirSync(worksPaths.metadata, { recursive: true })

  const sizesPath = join(worksPaths.entries, 'image-sizes')
  const existing = existsSync(sizesPath) ? JSON.parse(readFileSync(sizesPath, 'utf8')) : {}
  const sizes = typeof existing === 'object' && existing && !Array.isArray(existing) ? { ...existing } : {}

  const keys = readdirSync(imagePaths.entries).filter((name) => !name.startsWith('.'))
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const id of keys) {
    const url = `/api/images/${id}`
    if (Array.isArray(sizes[url]) && sizes[url].length === 2) {
      skipped += 1
      continue
    }

    const entryPath = join(imagePaths.entries, id)
    const metaPath = join(imagePaths.metadata, id)
    const bytes = readFileSync(entryPath)
    let metadata = {}
    if (existsSync(metaPath)) {
      try {
        metadata = JSON.parse(readFileSync(metaPath, 'utf8')) || {}
      } catch {
        metadata = {}
      }
    }

    let width = intMeta(metadata.width)
    let height = intMeta(metadata.height)
    if (!width || !height) {
      const probed = probe(bytes)
      if (!probed) {
        failed += 1
        console.warn(`Could not probe ${id}`)
        continue
      }
      width = probed.width
      height = probed.height
      metadata = {
        ...metadata,
        contentType: typeof metadata.contentType === 'string' ? metadata.contentType : 'application/octet-stream',
        width: String(width),
        height: String(height),
      }
      mkdirSync(dirname(metaPath), { recursive: true })
      writeFileSync(metaPath, JSON.stringify(metadata))
    }

    sizes[url] = [width, height]
    updated += 1
  }

  writeFileSync(sizesPath, JSON.stringify(sizes))
  writeFileSync(join(worksPaths.metadata, 'image-sizes'), JSON.stringify({}))
  console.log(`Local backfill: ${updated} updated, ${skipped} skipped, ${failed} failed (${keys.length} images).`)
  console.log(`Wrote ${Object.keys(sizes).length} sizes to works/image-sizes.`)
}

if (remote) await backfillRemote()
else backfillLocal()
