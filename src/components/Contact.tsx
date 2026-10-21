import { useState, type FormEvent } from 'react'

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setStatus('sending')

    try {
      const params = new URLSearchParams()
      new FormData(form).forEach((value, key) => {
        params.append(key, String(value))
      })
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })

      if (!response.ok) throw new Error('Form submission failed')

      form.reset()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="contact-form" aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="contact-form__title">
        Contact
      </h2>
      <p>For all inquiries, please use the form below or email me at <a href="mailto:hello@elainafielding.co.uk">hello@elainafielding.co.uk</a></p>
      <form
        name="contact"
        method="POST"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        onSubmit={handleSubmit}
      >
        <input type="hidden" name="form-name" value="contact" />
        <p hidden>
          <label>
            Don’t fill this out if you’re human: <input name="bot-field" />
          </label>
        </p>
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
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send'}
        </button>
        {status === 'sent' ? (
          <p role="status">Thanks, your message has been sent.</p>
        ) : null}
        {status === 'error' ? (
          <p role="alert">
            Something went wrong. Please email hello@elainafielding.co.uk instead.
          </p>
        ) : null}
      </form>
    </section>
  )
}
