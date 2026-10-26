export type HomepageSlide = {
  image: string
  /** Work this image opens, for example `a-household-item-2026` → `/work/a-household-item-2026`. */
  slug: string
  caption?: string
}

export type HomepageDocument = {
  slides: HomepageSlide[]
  showCaptions: boolean
}

export const homepageSeed: HomepageSlide[] = [
  {
    "image": "/images/works/04ebd76f-1812-4d5f-ada7-e085cb910ee2.jpg",
    "slug": "a-household-item-2026"
  },
  {
    "image": "/images/works/7ae0c87c-d2aa-4d53-838a-9859a80ef0f0.jpg",
    "slug": "elastic-worms"
  },
  {
    "image": "/images/works/e15c2c4c-b3d8-4cbf-b4ac-78bb8a1e798e.jpg",
    "slug": "getting-your-head-stuck-in-a-jumper"
  },
  {
    "image": "/images/works/08cef39c-117a-4e3d-9f93-fa584a36b39a.jpg",
    "slug": "sheep-spider"
  }
]
