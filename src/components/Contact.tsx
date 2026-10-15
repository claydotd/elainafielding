export function ContactForm() {
  return (
    <section id="contact" className="contact-form" aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="contact-form__title">
        Contact
      </h2>
      <form>
        <label className="contact-form__field">
          <span className="contact-form__label">Name</span>
          <input type="text" name="name" autoComplete="name" required />
        </label>
        <label className="contact-form__field">
          <span className="contact-form__label">Email</span>
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label className="contact-form__field">
          <span className="contact-form__label">What is your message about?</span>
          <select name="message-about" required defaultValue="">
            <option value="" disabled>
              Please select an option
            </option>
            <option value="commission">Commission</option>
            <option value="collaboration">Collaboration</option>
            <option value="workshop">Workshop</option>
            <option value="shop-order">Shop Order</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="contact-form__field">
          <span className="contact-form__label">Message</span>
          <textarea name="message" rows={5} required />
        </label>
        <button type="submit">Send</button>
      </form>
    </section>
  )
}
