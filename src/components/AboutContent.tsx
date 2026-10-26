import type { AboutBlock, AboutImageBlock, AboutSplitBlock, AboutTextBlock } from '../data/about'
import { aboutTextClass } from '../lib/about'
import { fittedImage } from '../lib/fitted-image'
import { sanitizeHtml } from '../lib/sanitize-html'
import { FadeImage } from './FadeImage'

export function AboutContent({ blocks }: { blocks: AboutBlock[] }) {
  return (
    <div className="about-content">
      {blocks.map((block, index) => (
        <AboutBlockView key={index} block={block} />
      ))}
    </div>
  )
}

function AboutBlockView({ block }: { block: AboutBlock }) {
  if (block.type === 'text') return <TextBlock block={block} />
  if (block.type === 'image') return <AboutFigure image={block.image} alt={block.alt} caption={block.caption} />
  return <SplitBlock block={block} />
}

function TextBlock({ block }: { block: AboutTextBlock }) {
  return <Bio html={block.html} className={aboutTextClass(block.align, block.width)} />
}

function SplitBlock({ block }: { block: AboutSplitBlock }) {
  const html = sanitizeHtml(block.html)
  const image = block.image
    ? <AboutFigure image={block.image} alt={block.alt} caption={block.caption} />
    : null
  if (!html) return image
  const text = <Bio html={html} className={aboutTextClass()} />
  if (!image) return text
  return (
    <div className={`about-split about-split--image-${block.imageSide}`}>
      {block.imageSide === 'start' ? image : text}
      {block.imageSide === 'start' ? text : image}
    </div>
  )
}

function Bio({ html, className }: { html: string; className: string }) {
  const clean = sanitizeHtml(html)
  if (!clean) return null
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
}

function AboutFigure({ image, alt, caption }: Pick<AboutImageBlock, 'image' | 'alt' | 'caption'>) {
  if (!image) return null
  return (
    <div className="about-content__image">
      <FadeImage {...fittedImage(image, 'about')} alt={alt} decoding="async" />
      {caption ? <p className="about-content__image-caption">{caption}</p> : null}
    </div>
  )
}
