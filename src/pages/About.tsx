import { Seo } from '../components/Seo'
import { ContactForm } from '../components/Contact'
import { fittedImage } from '../lib/fitted-image'

export function About() {
  return (
    <>
      <Seo
        title="About"
        path="/about"
        description="About Elaina Fielding."
      />
      <div className="page-container page-container--about">
        <article className="page">
          <div className="about-content">
            <p>Elaina Fielding (she/her) is a sculpture artist based in Scotland. She graduated with a
            First Class BA in Fine Art from Central Saint Martins in 2023, and was shortlisted in her
            final year for the LVMH / Maison 0 Award for Sustainable Practice. She received the Bird
            and Blend Sustainabilitea Bursary Award for her creation of sustainable sculpture for
            the Brighton Fringe, and has made performative sculptural work for the Moon Kim
            Theatre Company. In 2026 she was selected to deliver her own workshop series with
            Fruitmarket Gallery, as part of the Fresh Fruit / Germinate young artists programme.
            She is a current studio holder at Edinburgh Sculpture Workshop, where she is using
            VACMA funding to expand her practice into foundry work and stone carving.</p>
                        <p>Elaina works with discarded and salvaged materials to create sculptural forms that are
            awkward, humorous and somewhat surreal. Her work plays with scale, dysfunction and
            anthropomorphism to shift everyday objects into moments of relation and recognition.
            Material-led, her practice frequently explores the physical qualities and expressive
            potential of consumer waste. Using waste materials in new contexts, she works to
            produce a sense of tension, creating material confusions which disrupt habitual ways
            of responding to the everyday.</p>
            <p>She is interested in the theatrics of the ordinary, often using recognisable imagery to
            explore how the commonplace can tip to the strange and unfamiliar. Curious about the
            merging of body and object, she is increasingly drawn to tools, physical and digital, as
            uniquely human artefacts, exploring them as layered objects with their own
            evolutionary and bodily potential.</p>
            <img {...fittedImage(`${import.meta.env.BASE_URL}images/about/about.jpg`, 'about')} alt="Elaina Fielding is a Sculpture Artist who plays with the oddity of the everyday" decoding="async" />
            <p>Elaina Fielding is a Sculpture Artist who plays with the oddity of the everyday</p>
            <img {...fittedImage(`${import.meta.env.BASE_URL}images/about/KnifeandForkSelfPortrait.jpg`, 'about')} alt="Self Portrait with Knife and Fork (2022)" className="portrait-image" decoding="async" />
          </div>
        </article>
        <ContactForm />
      </div>
    </>
  )
}
