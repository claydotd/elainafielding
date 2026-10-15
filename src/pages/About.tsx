import { Seo } from '../components/Seo'
import { ContactForm } from '../components/Contact'

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
            <p>This is where your bio will go.</p>
          </div>
        </article>
        <ContactForm />
      </div>
    </>
  )
}
