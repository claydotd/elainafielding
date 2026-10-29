// Pulls production Netlify Blobs (works + work-images) into the local netlify dev sandbox.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getStore } from '@netlify/blobs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const blobsRoot = join(root, '.netlify/blobs-serve')
// Matches netlify dev when the folder is not linked, and scripts/export-seed.mjs.
const localSiteId = 'unlinked'
const stores = ['works', 'work-images']
const concurrency = 8

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

async function listKeys(store) {
  const keys = []
  for await (const page of store.list({ paginate: true })) {
    for (const blob of page.blobs ?? []) keys.push(blob.key)
  }
  return keys
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

function storePaths(storeName) {
  const encoded = `site:${storeName}`
  return {
    entries: join(blobsRoot, 'entries', localSiteId, encoded),
    metadata: join(blobsRoot, 'metadata', localSiteId, encoded),
  }
}

function writeBlob(storeName, key, bytes, metadata) {
  const paths = storePaths(storeName)
  const entryPath = join(paths.entries, key)
  const metaPath = join(paths.metadata, key)
  mkdirSync(dirname(entryPath), { recursive: true })
  mkdirSync(dirname(metaPath), { recursive: true })
  writeFileSync(entryPath, Buffer.from(bytes))
  writeFileSync(metaPath, JSON.stringify(metadata && Object.keys(metadata).length ? metadata : {}))
}

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

mkdirSync(blobsRoot, { recursive: true })

let total = 0
for (const storeName of stores) {
  const paths = storePaths(storeName)
  rmSync(paths.entries, { recursive: true, force: true })
  rmSync(paths.metadata, { recursive: true, force: true })
  mkdirSync(paths.entries, { recursive: true })
  mkdirSync(paths.metadata, { recursive: true })

  const store = getStore({
    name: storeName,
    siteID,
    token,
    consistency: 'strong',
  })

  const keys = await listKeys(store)
  await mapPool(keys, concurrency, async (key) => {
    const result = await store.getWithMetadata(key, { type: 'arrayBuffer' })
    if (!result?.data) throw new Error(`Missing blob ${storeName}/${key}`)
    writeBlob(storeName, key, result.data, result.metadata ?? {})
  })

  total += keys.length
  console.log(`Pulled ${keys.length} object${keys.length === 1 ? '' : 's'} from ${storeName}.`)
}

console.log(`Wrote ${total} blobs into .netlify/blobs-serve for local netlify dev.`)
