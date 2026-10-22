export function json(body: unknown, status = 200, extra?: HeadersInit) {
  const headers = new Headers(extra)
  if (!headers.has('content-type')) headers.set('content-type', 'application/json; charset=utf-8')
  if (!headers.has('cache-control')) headers.set('cache-control', 'no-store')
  return new Response(JSON.stringify(body), { status, headers })
}

export function routePath(req: Request) {
  const { pathname } = new URL(req.url)
  const marker = '/.netlify/functions/api'
  let path = pathname
  if (pathname === marker) path = '/api'
  else if (pathname.startsWith(`${marker}/`)) path = `/api/${pathname.slice(marker.length + 1)}`
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path
}

export async function readJson(req: Request) {
  try {
    return await req.json()
  } catch {
    return null
  }
}
