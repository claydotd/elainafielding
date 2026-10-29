import type { AboutBlock } from './about'
import type { CarouselCrop } from './carousel'

export type WorkPiece = {
  title: string
  subtitle?: string
  year: string
  materials: string
  dimensions: string
}

export type WorkImage = {
  image: string
  caption?: string
}

export type WorkTemplate = 'standard' | 'scroll-story' | 'masthead'
export type MastheadText = 'dark' | 'med' | 'light'

export type ScrollStoryStep = {
  image: string
  alt: string
  paragraphs: string[]
}

export type ScrollClosingImage = {
  src: string
  alt: string
}

export type WorkItem = {
  slug: string
  image: string
  name: string
  dimensions: string
  materials: string
  year: string
  location?: string
  description?: string
  template?: WorkTemplate
  mastheadText?: MastheadText
  scrollSteps?: ScrollStoryStep[]
  scrollClosingImage?: ScrollClosingImage | null
  /** @deprecated Prefer a `carousel` content block. Kept for seed/API migration. */
  images?: WorkImage[]
  /** @deprecated Prefer a `carousel` content block. Kept for seed/API migration. */
  showCarousel?: boolean
  /** @deprecated Prefer a `carousel` content block. Kept for seed/API migration. */
  carouselCrop?: CarouselCrop
  blocks?: AboutBlock[]
  pieces?: WorkPiece[]
}

type SeedWork = Omit<WorkItem, 'images'> & {
  images?: string[]
}

const seedWorks: SeedWork[] = [
  {
    "slug": "a-household-item-2026",
    "image": "/images/works/04ebd76f-1812-4d5f-ada7-e085cb910ee2.jpg",
    "name": "A Household Item",
    "dimensions": "Approx. 169 x 20 x 3 cm (5ft 6)",
    "materials": "Cardboard, packing paper, newspaper, masking tape, PVA glue, wood glue",
    "year": "2026",
    "pieces": [
      {
        "title": "A Household Item",
        "year": "2026",
        "materials": "Cardboard, packing paper, newspaper, masking tape, PVA glue, wood glue",
        "dimensions": "Approx. 169 x 20 x 3 cm (5ft 6)"
      }
    ],
    "location": "Exhibited at Edinburgh Sculpture Workshop, 2026",
    "images": [
      "/images/works/cbf19762-5a36-4364-b3cc-43ecd2fdecc6.jpg",
      "/images/works/abc2662e-453a-4580-99cf-b5299924543c.jpg",
      "/images/works/03b11c45-4459-4a4a-9fd5-383ab9211da0.jpg",
      "/images/works/56ac7b5c-2dd8-46cc-bfdd-039fb9f08ef0.jpg",
      "/images/works/13f79353-e4a2-4830-ba73-32920ccf570f.jpg",
      "/images/works/58fb9df0-5642-4694-86ca-3907835f9f38.jpg"
    ]
  },
  {
    "slug": "fruitmarket-workshop-2026",
    "image": "/images/works/97d6eed5-b1f3-49eb-92cd-4e4216bbd1f0.jpg",
    "name": "Improper Objects: Fruitmarket Gallery Workshop Series",
    "dimensions": "",
    "materials": "",
    "year": "2026",
    "pieces": [
      {
        "title": "Improper Objects: Fruitmarket Gallery Workshop Series",
        "year": "2026",
        "materials": "",
        "dimensions": ""
      }
    ],
    "location": "Fresh Fruit / Germinate Programme, Fruitmarket Gallery, Edinburgh",
    "description": "In 2026, Elaina was selected by Fruitmarket Gallery to design and deliver a two-part\nworkshop series for their Fresh Fruit / Germinate young artists programme, responding\nto Eva Rothschild’s exhibition The Void Presses The Wall.\n\nImproper Objects I: Forming an Attachment invited participants to make sculptural\nforms from everyday materials, exploring the relationship between body and object\nthrough making pieces that attached, extended, complemented or interrupted the\nbody.\n\nImproper Objects II: Sitting With It brought participants back together to build on their\nwork and arrange their objects collectively in the gallery space, thinking about relations\nto space, the concept of absent presence, and how sculpture exists with and without\nthe body.\n\nThe workshops drew on Elaina’s interest in bodily relation, material confusions and the\ntheatrics of the everyday, opening these ideas up to collective and participatory\nmaking.",
    "images": [
      "/images/works/148739e8-160b-426b-b47a-2b4881d5bc4d.jpg",
      "/images/works/ddfe7bb7-715e-4bd7-a1da-a8ef043861e9.jpg",
      "/images/works/19a9d289-91e7-4c99-9a38-23b02c5e6cd1.jpg",
      "/images/works/2d19221e-2999-41c2-b573-96c7490ebb9e.jpg",
      "/images/works/55c4cb56-e365-4562-ae3c-9f679f39a089.jpg",
      "/images/works/acd742fc-3a5e-4609-bd96-524cf64a062d.jpg",
      "/images/works/cf0ef353-a520-464e-b1fe-e79cde39752f.jpg",
      "/images/works/e013a0ec-6e5a-4d76-be7d-9daef4421bbe.jpg",
      "/images/works/f1d5e466-cd73-4904-9ead-052969de1945.jpg",
      "/images/works/65b64ab6-8049-492d-9f1b-bfd6218c368c.jpg",
      "/images/works/bc2e0046-1ad9-4ed7-968e-dc2cfa048f38.jpg"
    ]
  },
  {
    "slug": "colony-of-artists-2026",
    "image": "/images/works/4d5513bd-1113-4421-a52d-7df4aff3bb9c.jpg",
    "name": "A Sudden Violent Twist or Pull",
    "dimensions": "Approx. 178 x 36 x 5 cm (5ft 10)",
    "materials": "Cardboard, newspaper, packing paper, masking tape, PVA glue, wood glue",
    "year": "2025",
    "pieces": [
      {
        "title": "A Sudden Violent Twist or Pull",
        "year": "2025",
        "materials": "Cardboard, newspaper, packing paper, masking tape, PVA glue, wood glue",
        "dimensions": "Approx. 178 x 36 x 5 cm (5ft 10)"
      },
      {
        "title": "A Household Item",
        "year": "2026",
        "materials": "Cardboard, packing paper, newspaper, masking tape, PVA glue",
        "dimensions": "Approx. 169 x 20 x 3 cm (5ft 6)"
      }
    ],
    "location": "Exhibited at Abbeyhill Colony of Artists, Edinburgh, 2026",
    "images": [
      "/images/works/b851809f-0753-49f9-9d3d-3992610c7a4c.jpg",
      "/images/works/e7931a67-1cf2-4a79-a255-1ec12de25784.jpg"
    ]
  },
  {
    "slug": "baby-teeth",
    "image": "/images/works/34a9e43a-0be3-45ba-a4a5-d61fe33eac52.jpg",
    "name": "Baby Teeth",
    "dimensions": "Approx. 16.5 x 9.5 cm",
    "materials": "Green foundry wax",
    "year": "2026",
    "pieces": [
      {
        "title": "Baby Teeth",
        "year": "2026",
        "materials": "Green foundry wax",
        "dimensions": "Approx. 16.5 x 9.5 cm"
      }
    ],
    "images": [
      "/images/works/bfc1256b-0bf6-426c-b776-dc62eb04b50b.jpg",
      "/images/works/ddd0b97c-7dc7-4056-9948-a6a5270c9cc1.jpg",
      "/images/works/ad1278a0-f597-48f9-8062-0911fbb4bfd5.jpg",
      "/images/works/af507599-6b4c-4f44-a6fe-80d01588eac2.jpg"
    ]
  },
  {
    "slug": "fly-off-the-handle",
    "image": "/images/works/0c81937d-cecb-42e1-8e15-b2666caff97c.jpg",
    "name": "Fly off the Handle",
    "dimensions": "Large form: 51 x 18 x 2 cm / Small form: 9 x 3 x 2 cm",
    "materials": "Cardboard box handle, black tape, newspaper, elastic string",
    "year": "2026",
    "pieces": [
      {
        "title": "Fly off the Handle",
        "year": "2026",
        "materials": "Cardboard box handle, black tape, newspaper, elastic string",
        "dimensions": "Large form: 51 x 18 x 2 cm / Small form: 9 x 3 x 2 cm"
      }
    ],
    "images": [
      "/images/works/ba0a1184-9bda-4332-862b-a4f32b7bd38d.jpg",
      "/images/works/de1b803f-77fe-4986-8451-501c018bb549.jpg"
    ]
  },
  {
    "slug": "a-sudden-violent-twist-or-pull",
    "image": "/images/works/cb9097f5-f27e-4893-a7ac-9071aee6d096.jpg",
    "name": "A Sudden Violent Twist or Pull",
    "dimensions": "Approx. 178 x 36 x 5 cm (5ft 10)",
    "materials": "Cardboard, newspaper, packing paper, masking tape, PVA glue, wood glue",
    "year": "2025",
    "pieces": [
      {
        "title": "A Sudden Violent Twist or Pull",
        "year": "2025",
        "materials": "Cardboard, newspaper, packing paper, masking tape, PVA glue, wood glue",
        "dimensions": "Approx. 178 x 36 x 5 cm (5ft 10)",
        "subtitle": "“Taking My Wrench Out For A Walk”"
      }
    ],
    "images": [
      "/images/works/95785340-3fbd-4967-aa9e-5e2a7d638c8c.jpg",
      "/images/works/7ca1d75a-caf5-4b68-b222-5b8f619dcab2.jpg",
      "/images/works/5cfeeee7-6935-4610-980f-06670eb96400.jpg"
    ]
  },
  {
    "slug": "the-arms",
    "image": "/images/works/435281f0-b33d-4e2c-9f3d-f7090b8d72bc.jpg",
    "name": "The Arms",
    "dimensions": "Approx. 86 x 25 cm",
    "materials": "Cardboard, packing paper, newspaper, masking tape, PVA glue, wood glue",
    "year": "2025",
    "pieces": [
      {
        "title": "The Arms",
        "year": "2025",
        "materials": "Cardboard, packing paper, newspaper, masking tape, PVA glue, wood glue",
        "dimensions": "Approx. 86 x 25 cm"
      }
    ],
    "description": "Work produced for live performance “The Arms”, Moon Kim Theatre Company\nExhibited at Brighton Fringe Festival, 2025",
    "images": [
      "/images/works/3ea0b518-09ce-4144-8c61-d017b2ba76b1.jpg",
      "/images/works/f8b032bb-55a0-41ee-92bb-d21458f1724f.jpg",
      "/images/works/44a8b1e2-28ea-43e1-b4f9-abb35a268af7.jpg",
      "/images/works/ab64935d-3611-43c5-aa81-167d86b6fd33.jpg",
      "/images/works/fff5908e-bef9-47f0-9476-027d4e3ffd5d.jpg"
    ]
  },
  {
    "slug": "sheep-spider",
    "image": "/images/works/6a46e034-5a9e-46dd-9c6c-9afa85692384.jpg",
    "name": "Sheep Spider",
    "dimensions": "Approx. 416 x 67 cm",
    "materials": "Packing wool (sheep)",
    "year": "2023",
    "pieces": [
      {
        "title": "Sheep Spider",
        "year": "2023",
        "materials": "Packing wool (sheep)",
        "dimensions": "Approx. 416 x 67 cm"
      }
    ],
    "images": [
      "/images/works/d7cd9635-f654-4ea2-86b0-bbbe0761a0e0.jpg",
      "/images/works/fabfe0c1-b717-480b-ad8f-3e51b45958cc.jpg",
      "/images/works/022acc85-e42c-4a57-9884-d20616eb961c.jpg",
      "/images/works/8940ab2f-96fa-49b0-bce0-083e01f13459.jpg",
      "/images/works/08cef39c-117a-4e3d-9f93-fa584a36b39a.jpg",
      "/images/works/1e653ad9-03ee-4540-8da5-c08932bf7568.jpg",
      "/images/works/8e667d18-ec82-4504-b66f-d4f3540f5a62.jpg"
    ]
  },
  {
    "slug": "elastic-worms",
    "image": "/images/works/7ae0c87c-d2aa-4d53-838a-9859a80ef0f0.jpg",
    "name": "Elastic Worms",
    "dimensions": "Approx. 41 x 15 cm",
    "materials": "Elastic bands, masking tape, cardboard tubing, newspaper",
    "year": "2023",
    "pieces": [
      {
        "title": "Elastic Worms",
        "year": "2023",
        "materials": "Elastic bands, masking tape, cardboard tubing, newspaper",
        "dimensions": "Approx. 41 x 15 cm"
      }
    ],
    "location": "Degree Show, Exhibited at Central Saint Martins, London, 2023",
    "images": [
      "/images/works/1636097b-5507-46ec-ac71-2e946125b9d8.jpg",
      "/images/works/0d7d79b6-c75a-4ab7-8aa1-f991c6cd3d92.jpg",
      "/images/works/48330a85-fadd-4de7-9cb3-41fb40ef183b.jpg",
      "/images/works/787987d8-1564-443e-9261-bacf60bd3de4.jpg",
      "/images/works/99e653e1-ce7e-4199-8a5d-38aa146a2ee9.jpg",
      "/images/works/574a0c47-2784-4d67-b6e1-e762066cb293.jpg",
      "/images/works/d42bea17-d3e0-43f7-8cfc-ea32699b929f.jpg",
      "/images/works/92915e99-d0b8-4b4e-b3c5-5f138ebba460.jpg"
    ]
  },
  {
    "slug": "getting-your-head-stuck-in-a-jumper",
    "image": "/images/works/e15c2c4c-b3d8-4cbf-b4ac-78bb8a1e798e.jpg",
    "name": "Getting Your Head Stuck in a Jumper",
    "dimensions": "Approx. 46 x 20 cm",
    "materials": "Plaster fabric, sewing pins, packing tape, cardboard, newspaper, metal screws",
    "year": "2023",
    "pieces": [
      {
        "title": "Getting Your Head Stuck in a Jumper",
        "year": "2023",
        "materials": "Plaster fabric, sewing pins, packing tape, cardboard, newspaper, metal screws",
        "dimensions": "Approx. 46 x 20 cm"
      }
    ],
    "images": [
      "/images/works/0b5c5e77-d14f-4f0b-a0f9-4c603a674138.jpg",
      "/images/works/c095b510-bb56-4976-83dc-a516e078779a.jpg",
      "/images/works/3368a8d0-97c6-447e-873d-83c92744080f.jpg",
      "/images/works/4e27ef1d-782a-4682-b432-f02b6ef7ad7a.jpg"
    ]
  },
  {
    "slug": "soft-innards",
    "image": "/images/works/0e9ff7df-04c3-43ae-9923-199ed2544ad3.jpg",
    "name": "Soft Innards",
    "dimensions": "Approx. 58 x 13 cm",
    "materials": "Cardboard, newspaper, black tape, elastic string",
    "year": "2023",
    "pieces": [
      {
        "title": "Soft Innards",
        "year": "2023",
        "materials": "Cardboard, newspaper, black tape, elastic string",
        "dimensions": "Approx. 58 x 13 cm"
      }
    ],
    "images": [
      "/images/works/7d3dad2e-58ff-4dfa-ba29-f9a4e31a83e6.jpg",
      "/images/works/34887b22-65d2-47f9-b7c2-06c2aec4407c.jpg"
    ]
  },
  {
    "slug": "a-sexy-one",
    "image": "/images/works/9b7b0d5e-c443-4d1d-ab27-ad5186576794.jpg",
    "name": "A Sexy One",
    "dimensions": "Approx. 41 x 15 cm",
    "materials": "Elastic bands, masking tape, cardboard, newspaper",
    "year": "2023",
    "template": "scroll-story",
    "pieces": [
      {
        "title": "A Sexy One",
        "year": "2023",
        "materials": "Elastic bands, masking tape, cardboard, newspaper",
        "dimensions": "Approx. 41 x 15 cm"
      }
    ],
    "scrollSteps": [
      {
        "image": "/images/works/9b7b0d5e-c443-4d1d-ab27-ad5186576794.jpg",
        "alt": "A Sexy One, view 1",
        "paragraphs": ["Scroll to rotate the object."]
      },
      {
        "image": "/images/works/42f71881-df96-4ae9-a7cb-cd8683de113b.jpg",
        "alt": "A Sexy One, view 2",
        "paragraphs": []
      },
      {
        "image": "/images/works/780d8fd5-e6e6-41db-b389-b079853997de.jpg",
        "alt": "A Sexy One, view 3",
        "paragraphs": []
      },
      {
        "image": "/images/works/f72afa14-6406-4f25-ba41-0a3de24a7075.jpg",
        "alt": "A Sexy One, view 4",
        "paragraphs": []
      },
      {
        "image": "/images/works/392305a5-6789-449f-9c31-b97a2e55a200.jpg",
        "alt": "A Sexy One, view 5",
        "paragraphs": []
      },
      {
        "image": "/images/works/eb064a6a-6375-40c6-8be8-1f231e0e74fc.jpg",
        "alt": "A Sexy One, view 6",
        "paragraphs": []
      }
    ],
    "blocks": [
      {
        "type": "image",
        "image": "/images/works/5fcc234c-26cb-4d7b-b9ae-3270dfd0923c.jpg",
        "alt": "A Sexy One, view 7",
        "caption": "",
        "size": "full",
        "align": "center"
      }
    ]
  },
  {
    "slug": "furcated",
    "image": "/images/works/4de0c677-ea9a-4025-8a22-57af64cfbf16.jpg",
    "name": "Furcated",
    "dimensions": "Approx. 155 x 20 cm",
    "materials": "Cardboard, newspaper, packing tape, packing paper, masking tape, food wrappers, PVA glue",
    "year": "2023",
    "pieces": [
      {
        "title": "Furcated",
        "year": "2023",
        "materials": "Cardboard, newspaper, packing tape, packing paper, masking tape, food wrappers, PVA glue",
        "dimensions": "Approx. 155 x 20 cm"
      }
    ],
    "description": "Dimensions variable",
    "images": [
      "/images/works/0bad05c2-1e5a-44ea-b18a-807ba2ad6e17.jpg",
      "/images/works/9e538204-df80-4a33-ba76-4909f7b767ef.jpg",
      "/images/works/4d0ede89-8c5b-4134-84d8-2912ea93dad6.jpg",
      "/images/works/804ea807-8c79-4068-ad9c-d0a6e13cb381.jpg",
      "/images/works/0cbf016e-55fb-490c-ae9d-d4de98f426c9.jpg",
      "/images/works/b4e062a9-ee75-45bb-86e7-66fc9fa126af.jpg"
    ]
  },
  {
    "slug": "knife-and-fork",
    "image": "/images/works/2437d812-e690-448d-9d71-56f3870ffea5.jpg",
    "name": "Knife and Fork",
    "dimensions": "Knife: 310 x 26 cm (10ft 2) / Fork: 396 x 30 cm (13ft)",
    "materials": "Cardboard, newspaper, packing paper, masking tape, wire, PVA glue, wood glue",
    "year": "2022",
    "pieces": [
      {
        "title": "Knife and Fork",
        "year": "2022",
        "materials": "Cardboard, newspaper, packing paper, masking tape, wire, PVA glue, wood glue",
        "dimensions": "Knife: 310 x 26 cm (10ft 2) / Fork: 396 x 30 cm (13ft)"
      }
    ],
    "images": [
      "/images/works/2d82b79e-3d11-4b73-886d-8cdb4e171002.jpg",
      "/images/works/8a3a16ef-aab5-4162-b0ff-ec9a238dc86e.jpg",
      "/images/works/31aa99c3-c633-48ce-adcd-2c55941a3376.jpg",
      "/images/works/44b9a9e5-a023-4938-92e4-c5e6ff573c93.jpg",
      "/images/works/593ef24a-e993-46ea-9e75-f6de4d0490d7.jpg"
    ]
  },
  {
    "slug": "knife-and-fork-a-london-commute",
    "image": "/images/works/8b69df39-a444-462b-bb1a-5162a4d13e20.jpg",
    "name": "Knife and Fork: A London Commute",
    "dimensions": "",
    "materials": "",
    "year": "2022",
    "pieces": [
      {
        "title": "Knife and Fork: A London Commute",
        "year": "2022",
        "materials": "",
        "dimensions": "",
        "subtitle": "Film stills"
      }
    ],
    "location": "East London and the London Overground",
    "images": [
      "/images/works/a2361db8-62d3-4f66-abcf-c1bc3ec663db.jpg",
      "/images/works/edc10717-8b73-4144-9894-eaae72a7415e.jpg",
      "/images/works/ce18e6ed-c67a-4c9e-bce1-439069f5696b.jpg"
    ]
  },
  {
    "slug": "knife-and-fork-permanent",
    "image": "/images/works/831a82d1-a105-4206-9aab-f5cb5d3eb5ca.jpg",
    "name": "Knife and Fork",
    "dimensions": "Knife: 310 x 26 cm (10ft 2) / Fork: 396 x 30 cm (13ft)",
    "materials": "Cardboard, newspaper, packing paper, masking tape, wire, PVA glue, wood glue",
    "year": "2022",
    "pieces": [
      {
        "title": "Knife and Fork",
        "year": "2022",
        "materials": "Cardboard, newspaper, packing paper, masking tape, wire, PVA glue, wood glue",
        "dimensions": "Knife: 310 x 26 cm (10ft 2) / Fork: 396 x 30 cm (13ft)"
      }
    ],
    "location": "Permanent installation, The Old Peanut Factory, London, 2022",
    "images": [
      "/images/works/7da4e218-f75e-465c-acf6-f36d54934adc.jpg",
      "/images/works/06ae17da-38c3-43e7-b83c-0cecb1919926.jpg"
    ]
  },
  {
    "slug": "social-distancing-in-tesco",
    "image": "/images/works/07b968c1-34e4-4110-8d90-6711331fd0af.jpg",
    "name": "Social Distancing in Tesco",
    "dimensions": "",
    "materials": "Run time: 55 secs",
    "year": "2021",
    "pieces": [
      {
        "title": "Social Distancing in Tesco",
        "year": "2021",
        "materials": "Run time: 55 secs",
        "dimensions": "",
        "subtitle": "Film"
      }
    ],
    "images": [
      "/images/works/d85cb2a5-5cc6-4b19-95e9-8f7ae60cf05b.jpg",
      "/images/works/bc41e48d-3970-4f78-95d0-a74c41697cad.jpg",
      "/images/works/31aa5f2c-b3da-48c3-9214-593a420b24e0.jpg",
      "/images/works/f436bc2c-d6ce-451c-8820-2da9c5618145.jpg"
    ]
  },
  {
    "slug": "sit-up-straight-and-don-t-play-with-your-food-ii",
    "image": "/images/works/a1053720-76e0-4668-85da-3b2a45accd77.jpg",
    "name": "Sit Up Straight and Don’t Play With Your Food II",
    "dimensions": "",
    "materials": "Silicone, wire, dining tray, chair",
    "year": "2019",
    "pieces": [
      {
        "title": "Sit Up Straight and Don’t Play With Your Food II",
        "year": "2019",
        "materials": "Silicone, wire, dining tray, chair",
        "dimensions": ""
      }
    ],
    "location": "Open Studios, Exhibited at Central Saint Martins, 2019",
    "images": [
      "/images/works/14c5c56d-4752-483b-8f1c-2a486807c2f3.jpg",
      "/images/works/088b8303-f8f7-4506-b118-91f017f80c7d.jpg",
      "/images/works/cc7b9922-5b86-4918-9f39-2dca328ecdea.jpg"
    ]
  },
  {
    "slug": "sit-up-straight-and-don-t-play-with-your-food",
    "image": "/images/works/0520d913-30ea-471c-8708-ab47f1d2e577.jpg",
    "name": "Sit Up Straight and Don’t Play With Your Food",
    "dimensions": "Run time: 8 mins 16 secs",
    "materials": "Warped steel cutlery, noodles, plaster, plastic bag",
    "year": "2018",
    "pieces": [
      {
        "title": "Sit Up Straight and Don’t Play With Your Food",
        "year": "2018",
        "materials": "Warped steel cutlery, noodles, plaster, plastic bag",
        "dimensions": "Run time: 8 mins 16 secs",
        "subtitle": "Film and mixed media"
      }
    ],
    "location": "Foundation Show, Exhibited at Wiltshire College, 2018",
    "images": [
      "/images/works/e99efe86-c42a-4d1b-ad5f-2c73f279f60a.jpg",
      "/images/works/063754bf-c84c-430a-94d3-5eeaf809b00e.jpg"
    ]
  }
]

export const worksSeed: WorkItem[] = seedWorks.map((work) => ({
  ...work,
  images: work.images?.map((image) => ({ image })),
}))
