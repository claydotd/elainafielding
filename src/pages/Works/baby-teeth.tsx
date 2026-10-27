import { BackToWork, WorkNeighbors } from '../../components/WorkDetailsTemplate'
import { FadeImage } from '../../components/FadeImage'
import { Seo } from '../../components/Seo'
import { WorkMeta } from '../../components/WorkGalleryItem'
import { useWorks } from '../../context/useWorks'
import { workPieces, workSummary } from '../../data/works'
import { fittedImage } from '../../lib/fitted-image'
import './baby-teeth.css'

type Align = 'left' | 'center' | 'right'

type StackImage = {
  src: string
  alt: string
  /** Horizontal placement within the full-width stack. */
  align: Align
}

/** Edit `align` on each entry: 'left' | 'center' | 'right'. */
const stackImages: StackImage[] = [
  {
    src: '/images/works/bfc1256b-0bf6-426c-b776-dc62eb04b50b.jpg',
    alt: 'Baby Teeth, view 1',
    align: 'right',
  },
  {
    src: '/images/works/34a9e43a-0be3-45ba-a4a5-d61fe33eac52.jpg',
    alt: 'Baby Teeth, view 2',
    align: 'left',
  },
  {
    src: '/images/works/ddd0b97c-7dc7-4056-9948-a6a5270c9cc1.jpg',
    alt: 'Baby Teeth, view 3',
    align: 'center',
  },
  {
    src: '/images/works/ad1278a0-f597-48f9-8062-0911fbb4bfd5.jpg',
    alt: 'Baby Teeth, view 4',
    align: 'left',
  },
  {
    src: '/images/works/af507599-6b4c-4f44-a6fe-80d01588eac2.jpg',
    alt: 'Baby Teeth, view 5',
    align: 'right',
  },
]

function StackItem({
  item,
  index,
}: {
  item: StackImage
  index: number
}) {
  return (
    <div className={`baby-teeth__item baby-teeth__item--${item.align}`}>
      <FadeImage
        {...fittedImage(item.src, 'hero', '(max-width: 800px) 100vw, 90vw')}
        alt={item.alt}
        decoding="async"
        loading={index === 0 ? 'eager' : 'lazy'}
        fetchPriority={index === 0 ? 'high' : undefined}
      />
    </div>
  )
}

export default function BabyTeethPage() {
  const { works } = useWorks()
  const work = works.find((item) => item.slug === 'baby-teeth')
  const title = work?.name ?? 'Baby Teeth'
  const [first, ...rest] = stackImages

  return (
    <>
      <Seo
        title={title}
        path="/work/baby-teeth"
        description={work?.description ?? workSummary(work ?? { name: title, year: '', materials: '', dimensions: '' })}
      />
      <div className="page-container work-details-container">
        <BackToWork slug="baby-teeth" />
        <article className="baby-teeth">
          <div className="baby-teeth__hero">
            <div className="baby-teeth__meta">
              <WorkMeta
                heading="h1"
                pieces={work ? workPieces(work) : [{ title, year: '', materials: '', dimensions: '' }]}
                location={work?.location}
              />
            </div>
            {first ? <StackItem item={first} index={0} /> : null}
          </div>
          <div className="baby-teeth__stack">
            {rest.map((item, index) => (
              <StackItem key={`${item.src}-${index + 1}`} item={item} index={index + 1} />
            ))}
          </div>
        </article>
        <WorkNeighbors slug="baby-teeth" />
      </div>
    </>
  )
}
