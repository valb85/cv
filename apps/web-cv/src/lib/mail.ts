import { createTransport, type Transporter } from 'nodemailer';

let cached: Transporter | null = null;

const transporter = (): Transporter => {
  if (cached) {
    return cached;
  }

  const host = process.env.SMTP_HOST;

  if (!host) {
    throw new Error('SMTP_HOST is not set');
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT ?? 587);

  cached = createTransport({
    host,
    port,
    // mailhog and most relays on 587 use STARTTLS rather than implicit TLS.
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
    // mailhog presents a self-signed certificate.
    tls: { rejectUnauthorized: process.env.ENVIRONMENT === 'prod' },
  });

  return cached;
};

export type ContactMail = {
  name: string;
  email: string;
  body: string;
};

export const sendContactMail = async (message: ContactMail): Promise<void> => {
  const to = process.env.EMAIL_RECIPIENT;

  if (!to) {
    throw new Error('EMAIL_RECIPIENT is not set');
  }

  await transporter().sendMail({
    to,
    from: process.env.EMAIL_SENDER ?? to,
    // The visitor's address goes in Reply-To, never in From: sending mail
    // claiming to be from their domain is what gets a relay blocked.
    replyTo: `${message.name} <${message.email}>`,
    subject: `Contact form: ${message.name}`,
    text: `From: ${message.name} <${message.email}>\n\n${message.body}\n`,
  });
};
