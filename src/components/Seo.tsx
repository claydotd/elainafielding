import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Elaina Fielding'
const SITE_URL = 'https://elainafielding.com'
const DEFAULT_DESCRIPTION =
  'Elaina Fielding — portfolio and selected work.'

type SeoProps = {
  title?: string
  description?: string
  path?: string
  noIndex?: boolean
}

export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  noIndex = false,
}: SeoProps) {
  const pageTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME
  const url = `${SITE_URL}${path}`

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  )
}
