import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
	const activities = await prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
	return NextResponse.json(activities);
}

export async function POST(request: Request) {
	const { userId, message } = await request.json();
	if (!userId || !message) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
	const activity = await prisma.activity.create({ data: { userId, message } });
	// TODO: emit realtime notification via pusher/socket
	return NextResponse.json(activity, { status: 201 });
}


