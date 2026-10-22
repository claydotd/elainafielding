import { json } from './http.ts'

const COOKIE = 'ef_admin'
const WEEK_SECONDS = 60 * 60 * 24 * 7

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  return secret && secret.length >= 16 ? secret : null
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return bytesToBase64Url(new Uint8Array(signature))
}

function signaturesMatch(left: string, right: string) {
  const a = new TextEncoder().encode(left)
  const b = new TextEncoder().encode(right)
  const length = Math.max(a.length, b.length, 1)
  let mismatch = a.length === b.length ? 0 : 1
  for (let index = 0; index < length; index += 1) mismatch |= (a[index] ?? 0) ^ (b[index] ?? 0)
  return mismatch === 0
}

export function passwordsMatch(input: string, expected: string) {
  const a = new TextEncoder().encode(input)
  const b = new TextEncoder().encode(expected)
  const length = Math.max(a.length, b.length, 1)
  let mismatch = a.length === b.length ? 0 : 1
  for (let index = 0; index < length; index += 1) mismatch |= (a[index] ?? 0) ^ (b[index] ?? 0)
  return mismatch === 0
}

function readCookie(req: Request) {
  const header = req.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    if (trimmed.slice(0, eq) === COOKIE) return trimmed.slice(eq + 1)
  }
  return null
}

export async function createSession() {
  const secret = sessionSecret()
  if (!secret) return null
  const payload = bytesToBase64Url(
    new TextEncoder().encode(JSON.stringify({ exp: Date.now() + WEEK_SECONDS * 1000 })),
  )
  const signature = await sign(payload, secret)
  return `${payload}.${signature}`
}

export async function hasSession(req: Request) {
  const secret = sessionSecret()
  const token = readCookie(req)
  if (!secret || !token) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  const expected = await sign(payload, secret)
  if (!signaturesMatch(signature, expected)) return false
  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as { exp?: unknown }
    return typeof parsed.exp === 'number' && parsed.exp > Date.now()
  } catch {
    return false
  }
}

function cookie(value: string, maxAge: number, secure: boolean) {
  const parts = [`${COOKIE}=${value}`, 'HttpOnly', 'Path=/', 'SameSite=Lax', `Max-Age=${maxAge}`]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function sessionCookie(token: string, secure: boolean) {
  return cookie(token, WEEK_SECONDS, secure)
}

export function clearedCookie(secure: boolean) {
  return cookie('', 0, secure)
}

export async function requireAdmin(req: Request) {
  if (await hasSession(req)) return null
  return json({ error: 'Log in to continue.' }, 401)
}
