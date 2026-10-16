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
            <p>Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.</p>
            <img src={`${import.meta.env.BASE_URL}images/about/london.jpeg`} alt="example image for about page" />
          </div>
        </article>
        <ContactForm />
      </div>
    </>
  )
}
