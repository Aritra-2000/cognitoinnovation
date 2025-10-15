import nodemailer from 'nodemailer';

type SendEmailParams = {
  to: string;
  subject: string;
  content: string;
  text?: string;
};

export async function sendEmail({ to, subject, content, text }: SendEmailParams): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5,
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: text || content.replace(/<[^>]*>?/gm, ''),
      html: content,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  } finally {
    transporter.close();
  }
}