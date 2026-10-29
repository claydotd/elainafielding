// Pushes local netlify dev blobs (works + work-images) into production Netlify Blobs.
// Overwrites matching remote keys and deletes remote keys that are not present locally.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getStore } from '@netlify/blobs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const blobsRoot = join(root, '.netlify/blobs-serve')
// Matches netlify dev when the folder is not linked, and scripts/pull-blobs.mjs.
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

function listLocalKeys(entriesRoot) {
  if (!existsSync(entriesRoot)) return []
  const keys = []
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      else keys.push(relative(entriesRoot, full).split('\\').join('/'))
    }
  }
  walk(entriesRoot)
  return keys
}

function readMetadata(metaPath) {
  if (!existsSync(metaPath)) return {}
  try {
    const value = JSON.parse(readFileSync(metaPath, 'utf8'))
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
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

let totalSet = 0
let totalDeleted = 0
for (const storeName of stores) {
  const paths = storePaths(storeName)
  const localKeys = listLocalKeys(paths.entries)
  if (localKeys.length === 0) {
    console.error(`No local blobs found for ${storeName} at ${paths.entries}.`)
    process.exit(1)
  }

  const store = getStore({
    name: storeName,
    siteID,
    token,
    consistency: 'strong',
  })

  await mapPool(localKeys, concurrency, async (key) => {
    const bytes = readFileSync(join(paths.entries, key))
    const metadata = readMetadata(join(paths.metadata, key))
    await store.set(key, bytes, Object.keys(metadata).length ? { metadata } : undefined)
  })

  const remoteKeys = await listKeys(store)
  const keep = new Set(localKeys)
  const remove = remoteKeys.filter((key) => !keep.has(key))
  await mapPool(remove, concurrency, async (key) => {
    await store.delete(key)
  })

  totalSet += localKeys.length
  totalDeleted += remove.length
  console.log(
    `Pushed ${localKeys.length} object${localKeys.length === 1 ? '' : 's'} to ${storeName}` +
      (remove.length ? ` (deleted ${remove.length} remote-only).` : '.'),
  )
}

console.log(`Synced ${totalSet} blobs to production` + (totalDeleted ? ` and removed ${totalDeleted} stale keys.` : '.'))
