export type WorkItem = {
  slug: string
  image: string
  name: string
  dimensions: string
  materials: string
  year: string
  description?: string
  images?: string[]
}

function homeImage(file: string) {
  return `${import.meta.env.BASE_URL}images/home/${file}`
}

export const works: WorkItem[] = [
  {
    slug: 'untitled-1',
    image: homeImage('1.png'),
    name: 'Untitled 1',
    dimensions: '16in × 6in',
    materials: 'Elastic bands, card',
    year: '2023',
    description: 'This is an example description for the work',
    images: [
      homeImage('1-1.png'),
      homeImage('1-2.png'),
      homeImage('1-3.png'),
      homeImage('1-4.png'),
      homeImage('1-5.png'),
      homeImage('1-6.png'),
      homeImage('1-7.png'),
      homeImage('1-8.png'),
      homeImage('1-9.png'),
      homeImage('1-10.png'),
    ],
  },
  {
    slug: 'untitled-2',
    image: homeImage('2.png'),
    name: 'Untitled 2',
    dimensions: '16in × 6in',
    materials: 'Elastic bands, card',
    year: '2023',
  },
  {
    slug: 'untitled-3',
    image: homeImage('3.png'),
    name: 'Untitled 3',
    dimensions: '16in × 6in',
    materials: 'Elastic bands, card',
    year: '2023',
  },
]

export function getWorkBySlug(slug: string) {
  return works.find((work) => work.slug === slug)
}
