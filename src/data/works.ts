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

// function workImage(file: string) {
//   return `${import.meta.env.BASE_URL}images/work/${file}`
// }

export const works: WorkItem[] = [
  {
    slug: 'untitled-1',
    image: homeImage('1.png'),
    name: 'Untitled 1',
    dimensions: '16in × 6in',
    materials: 'Elastic bands, card',
    year: '2023',
    description: 'This is an example description for the work. Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',
    images: [
      homeImage('1.png'),
      homeImage('2.png'),
      homeImage('3.png'),
      homeImage('1.png'),
      homeImage('2.png'),
      homeImage('3.png'),
      homeImage('1.png'),
      homeImage('2.png'),
      homeImage('3.png'),
      homeImage('1.png'),
    ],
  },
  {
    slug: 'untitled-2',
    image: homeImage('2.png'),
    name: 'Untitled 2',
    dimensions: '16in × 6in',
    materials: 'Elastic bands, card',
    year: '2023',
    description: 'Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',
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
