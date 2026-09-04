import type { BlockDataMap } from '@/lib/blocks';

export const ContactFormBlock = ({ data }: { data: BlockDataMap['contact_form'] }) => (
  <section className="block contact">
    {data.intro ? <p>{data.intro}</p> : null}
    <form className="contact-form" method="post" action="/api/contact">
      <label>
        Name
        <input name="name" type="text" required maxLength={120} autoComplete="name" />
      </label>
      <label>
        E-mail
        <input name="email" type="email" required maxLength={200} autoComplete="email" />
      </label>
      <label>
        Message
        <textarea name="message" required rows={6} maxLength={5000} />
      </label>
      <button type="submit">Send message</button>
    </form>
  </section>
);
