import { useState, type ReactNode } from 'react'
import type {
  AboutBlock,
  AboutCarouselBlock,
  AboutImageAlign,
  AboutImageBlock,
  AboutImageSize,
  AboutSplitBlock,
  AboutTextBlock,
} from '../data/about'
import { readImageCrop, type ImageCrop } from '../data/image-crop'
import { aboutImageClass, aboutTextClass } from '../lib/about'
import { fittedImage } from '../lib/fitted-image'
import { sanitizeHtml } from '../lib/sanitize-html'
import { WorkCarousel } from './Carousels'
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
  if (block.type === 'image') {
    return (
      <AboutFigure
        image={block.image}
        alt={block.alt}
        caption={block.caption}
        size={block.size}
        align={block.align}
        crop={block.crop}
      />
    )
  }
  if (block.type === 'carousel') return <CarouselBlock block={block} />
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

function CarouselBlock({ block }: { block: AboutCarouselBlock }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  if (block.images.length === 0) return null
  return (
    <div className="work-gallery">
      <WorkCarousel
        images={block.images}
        carouselCrop={block.crop}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />
    </div>
  )
}

function Bio({ html, className }: { html: string; className: string }) {
  const clean = sanitizeHtml(html)
  if (!clean) return null
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />
}

function AboutFigure({
  image,
  alt,
  caption,
  size,
  align,
  crop,
}: Pick<AboutImageBlock, 'image' | 'alt' | 'caption'> & {
  size?: AboutImageSize
  align?: AboutImageAlign
  crop?: ImageCrop
}) {
  if (!image) return null
  const resolvedCrop = readImageCrop(crop)
  return (
    <div className={aboutImageClass(align, size, resolvedCrop)}>
      <ImageCropFrame crop={resolvedCrop}>
        <FadeImage
          {...fittedImage(image, 'about')}
          alt={alt}
          decoding="async"
          style={resolvedCrop === 'original' ? undefined : { aspectRatio: 'unset' }}
        />
      </ImageCropFrame>
      {caption ? <p className="about-content__image-caption">{caption}</p> : null}
    </div>
  )
}

function ImageCropFrame({ crop, children }: { crop: ImageCrop; children: ReactNode }) {
  if (crop === 'original') return children
  return <div className="about-content__image-crop">{children}</div>
}
