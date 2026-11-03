import type { AboutAlign, AboutImageAlign, AboutWidth } from '../data/about'
import { aboutTextClass } from '../lib/about'
import { storedRichText } from '../lib/sanitize-html'

type WorkDescriptionProps = {
  description: string
  className?: string
  align?: AboutAlign
  width?: AboutWidth
  placement?: AboutImageAlign
}

export function WorkDescription({ description, className, align, width, placement }: WorkDescriptionProps) {
  const html = storedRichText(description)
  if (!html) return null
  const layout = align != null && width != null ? aboutTextClass(align, width, placement) : ''
  const classes = ['work-details__description', layout, className].filter(Boolean).join(' ')
  return <div className={classes} dangerouslySetInnerHTML={{ __html: html }} />
}
