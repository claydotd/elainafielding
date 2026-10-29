import type { ComponentType } from 'react'
import { useParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { WorkDetailsTemplate } from '../components/WorkDetailsTemplate'
import { useWorks } from '../context/useWorks'
import { mastheadText, workContentBlocks, workPieces, workSummary, workTemplate } from '../data/works'
import { NotFound } from './NotFound'

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
    return <NotFound message="This work could not be found." />
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
          blocks={workContentBlocks(work)}
          template={workTemplate(work)}
          mastheadText={mastheadText(work)}
          scrollSteps={work.scrollSteps}
        />
      </div>
    </>
  )
}
