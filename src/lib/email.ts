import nodemailer from 'nodemailer';

type SendEmailParams = {
  to: string;
  subject: string;
  content: string;
  text?: string;
};

export async function sendEmail({ to, subject, content, text }: SendEmailParams): Promise<void> {
  // Debug: Log configuration (without exposing full password)
  console.log('📧 SMTP Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    passConfigured: !!process.env.SMTP_PASS,
    passLength: process.env.SMTP_PASS?.length,
    from: process.env.EMAIL_FROM
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // use STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Add connection pooling to prevent auth issues
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5,
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: text || content.replace(/<[^>]*>?/gm, ''),
      html: content,
    });

    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP sendMail failed:', error);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('💡 Dev mode: Check console for OTP or fix SMTP config');
    }
    
    // Always throw in production, let dev mode continue
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  } finally {
    // Close the connection after sending
    transporter.close();
  }
}