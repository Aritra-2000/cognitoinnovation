import nodemailer from 'nodemailer';

type SendEmailParams = {
	to: string;
	subject: string;
	bodyText: string;
};

export async function sendEmail({ to, subject, bodyText }: SendEmailParams): Promise<void> {
	const host = process.env.SMTP_HOST;
	const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	const from = process.env.EMAIL_FROM ?? 'no-reply@example.com';

	if (!host || !port || !user || !pass) {
		throw new Error('SMTP configuration is missing');
	}

	const transporter = nodemailer.createTransport({
		host,
		port,
		secure: port === 465, // true for 465, false for others
		auth: { user, pass },
	});

	await transporter.sendMail({ from, to, subject, text: bodyText });
}


