import type { ComponentType } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { WorkDetailsTemplate } from '../components/WorkDetailsTemplate'
import { useWorks } from '../context/useWorks'
import { workPieces, workSummary } from '../data/works'

type WorkPageModule = {
  default?: ComponentType
}

/**
 * A file at src/pages/Works/<slug>.tsx replaces the shared template.
 * Default-export the page component. Example: Works/untitled-1.tsx.
 */
const customWorkPages = import.meta.glob<WorkPageModule>('./Works/*.tsx', {
  eager: true,
})

function customPageForSlug(slug: string) {
  const expected = `./Works/${slug}.tsx`.toLowerCase()
  const page = Object.entries(customWorkPages).find(
    ([path]) => path.toLowerCase() === expected,
  )?.[1]
  if (typeof page?.default === 'function') return page.default

  const named = Object.values(page ?? {}).find(
    (value): value is ComponentType => typeof value === 'function',
  )
  return named
}

export function WorkDetail() {
  const { slug = '' } = useParams()
  const { works } = useWorks()
  const CustomPage = customPageForSlug(slug)

  if (CustomPage) {
    return <CustomPage />
  }

  const work = works.find((item) => item.slug === slug)

  if (!work) {
    return (
      <>
        <Seo title="Work" path={`/work/${slug}`} noIndex />
        <div className="page-container work-details-container">
          <article className="page">
            <p>This work could not be found.</p>
            <p>
              <Link to="/work">Back to work</Link>
            </p>
          </article>
        </div>
      </>
    )
  }

  return (
    <>
      <Seo
        title={work.name}
        path={`/work/${work.slug}`}
        description={work.description ?? workSummary(work)}
      />
      <div className="page-container">
        <WorkDetailsTemplate
          slug={work.slug}
          title={work.name}
          pieces={workPieces(work)}
          location={work.location}
          description={work.description ?? ''}
          image={work.image}
          images={work.images ?? []}
        />
      </div>
    </>
  )
}
