import { useEffect, useLayoutEffect, useRef } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { WorkGalleryItem } from '../components/WorkGalleryItem'
import { useWorks } from '../context/useWorks'
import { workPieces } from '../data/works'
import { scrollToHash } from '../lib/scroll-to-hash'
import { WORKS_PER_PAGE } from '../lib/work-list'

function requestedPage(value: string | null) {
  if (!value) return 1
  const page = Number(value)
  if (!Number.isInteger(page) || page < 1) return 1
  return page
}

function pageHref(page: number) {
  return page <= 1 ? '/work' : `/work?page=${page}`
}

function pageSequence(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = [1, total, current - 1, current, current + 1]
    .filter((page, index, all) => page >= 1 && page <= total && all.indexOf(page) === index)
    .sort((a, b) => a - b)

  const sequence: Array<number | 'gap'> = []
  for (const page of pages) {
    const previous = sequence.at(-1)
    if (typeof previous === 'number' && page - previous > 1) sequence.push('gap')
    sequence.push(page)
  }
  return sequence
}

function WorkPagination({ page, pageCount }: { page: number; pageCount: number }) {
  return (
    <nav className="work-pagination" aria-label="Pages">
      {page > 1 ? (
        <Link to={pageHref(page - 1)} rel="prev">Previous</Link>
      ) : (
        <span aria-disabled="true">Previous</span>
      )}
      <ol>
        {pageSequence(page, pageCount).map((item, index) => (
          <li key={typeof item === 'number' ? item : `gap-${index}`}>
            {item === 'gap' ? (
              <span aria-hidden="true">…</span>
            ) : item === page ? (
              <span aria-current="page">{item}</span>
            ) : (
              <Link to={pageHref(item)}>{item}</Link>
            )}
          </li>
        ))}
      </ol>
      {page < pageCount ? (
        <Link to={pageHref(page + 1)} rel="next">Next</Link>
      ) : (
        <span aria-disabled="true">Next</span>
      )}
    </nav>
  )
}

export function Work() {
  const { works, ready } = useWorks()
  const { hash } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = requestedPage(searchParams.get('page'))
  const pageCount = Math.max(1, Math.ceil(works.length / WORKS_PER_PAGE))
  const page = ready ? Math.min(requested, pageCount) : requested
  const inRange = page <= pageCount
  const visible = inRange ? works.slice((page - 1) * WORKS_PER_PAGE, page * WORKS_PER_PAGE) : []
  const pageRef = useRef(page)

  useEffect(() => {
    if (!ready) return
    const raw = searchParams.get('page')
    if (page === 1) {
      if (raw === null) return
      const next = new URLSearchParams(searchParams)
      next.delete('page')
      setSearchParams(next, { replace: true })
      return
    }
    if (raw === String(page)) return
    const next = new URLSearchParams(searchParams)
    next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [ready, page, searchParams, setSearchParams])

  useEffect(() => {
    if (pageRef.current === page) return
    pageRef.current = page
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [page, hash])

  useLayoutEffect(() => {
    if (!hash) return
    let stopped = false
    let attempts = 0
    let frame = 0

    const scroll = () => {
      if (stopped || attempts > 12) return
      attempts += 1
      scrollToHash(hash)
    }

    const schedule = () => {
      if (stopped || frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        scroll()
      })
    }

    const stop = () => {
      stopped = true
    }

    scroll()
    document.fonts?.ready.then(schedule)

    const gallery = document.querySelector('.page .work-gallery')
    const observer = gallery ? new ResizeObserver(schedule) : null
    if (gallery) observer?.observe(gallery)
    gallery?.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', schedule)
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) stop()
    }

    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchmove', stop, { passive: true })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      stopped = true
      if (frame) cancelAnimationFrame(frame)
      observer?.disconnect()
      gallery?.querySelectorAll('img').forEach((img) => img.removeEventListener('load', schedule))
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchmove', stop)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [hash, page, ready, works])

  return (
    <>
      <Seo
        title="Work"
        path="/work"
        description="Selected works by Elaina Fielding."
      />
      <div className="page-container">
        <article className="page">
          {page > 1 && inRange ? <p className="work-page-label">page {page}</p> : null}
          <div className="work-gallery">
            {visible.map((work) => (
              <WorkGalleryItem
                key={work.slug}
                id={work.slug}
                to={`/work/${work.slug}`}
                image={work.image}
                name={work.name}
                pieces={workPieces(work)}
                location={work.location}
              />
            ))}
          </div>
          {inRange && pageCount > 1 ? <WorkPagination page={page} pageCount={pageCount} /> : null}
        </article>
      </div>
    </>
  )
}
