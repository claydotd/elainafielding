import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'

type NotFoundProps = {
  /** Optional context when a known route exists but the resource does not. */
  message?: string
}

export function NotFound({
  message = 'This page could not be found.',
}: NotFoundProps) {
  return (
    <>
      <Seo title="Page not found" path="/404" noIndex />
      <div className="page-container page-container--not-found">
        <article className="page not-found">
          <p className="not-found__code" aria-hidden="true">
            404
          </p>
          <h1 className="not-found__title">Page not found</h1>
          <p className="not-found__message">{message}</p>
          <p className="not-found__actions">
            <Link to="/">Home</Link>
            <Link to="/work">Work</Link>
            <Link to="/about">About</Link>
          </p>
        </article>
      </div>
    </>
  )
}
