import { Resend } from 'resend';

type SendEmailParams = {
  to: string;
  subject: string;
  content: string;
  text?: string;
};

export async function sendEmail({ to, subject, content, text }: SendEmailParams): Promise<void> {
	const apiKey = process.env.RESEND_API_KEY;
	const configuredFrom = process.env.EMAIL_FROM;
	const defaultFrom = 'Acme <onboarding@resend.dev>';
	const from = configuredFrom ?? defaultFrom;
	if (!apiKey) {
		if (process.env.NODE_ENV !== 'production') {
			console.warn('RESEND_API_KEY missing; skipping email send in dev');
			return;
		}
		throw new Error('RESEND_API_KEY is missing');
	}
	const resend = new Resend(apiKey);
	const attempt = await resend.emails.send({ 
		from, 
		to, 
		subject, 
		html: content,
		text: text || content.replace(/<[^>]*>?/gm, '') 
	});
	
	if (!attempt.error) return;

	// If domain not verified, retry with onboarding sender automatically
	const e: any = attempt.error;
	const domainUnverified = e?.statusCode === 403 && typeof e?.message === 'string' && e.message.includes('domain is not verified');
	if (domainUnverified && from !== defaultFrom) {
		const retry = await resend.emails.send({ 
			from: defaultFrom, 
			to, 
			subject, 
			html: content,
			text: text || content.replace(/<[^>]*>?/gm, '')
		});
		if (!retry.error) return;
		console.error('Resend email error (retry with onboarding failed):', retry.error);
		throw new Error('Email send failed');
	}

	console.error('Resend email error:', attempt.error);
	throw new Error('Email send failed');
}


