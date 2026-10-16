import type { ComponentType } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { WorkDetailsTemplate } from '../components/WorkDetailsTemplate'
import { getWorkBySlug } from '../data/works'

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
  const page = customWorkPages[`./Works/${slug}.tsx`]
  if (typeof page?.default === 'function') return page.default

  const named = Object.values(page ?? {}).find(
    (value): value is ComponentType => typeof value === 'function',
  )
  return named
}

export function WorkDetail() {
  const { slug = '' } = useParams()
  const CustomPage = customPageForSlug(slug)

  if (CustomPage) {
    return <CustomPage />
  }

  const work = getWorkBySlug(slug)

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
        description={
          work.description ??
          `${work.name}, ${work.year}. ${work.materials}.`
        }
      />
      <div className="page-container">
        <WorkDetailsTemplate
          title={work.name}
          dimensions={work.dimensions}
          materials={work.materials}
          year={work.year}
          description={work.description ?? ''}
          image={work.image}
          images={work.images ?? []}
        />
      </div>
    </>
  )
}
