import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const projectId = new URL(req.url).searchParams.get('projectId') || undefined;
  const tickets = await prisma.ticket.findMany({ where: { projectId }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const { projectId, title, description } = await req.json();
  if (!projectId || !title) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const ticket = await prisma.ticket.create({ data: { projectId, title, description: description ?? '' } });
  return NextResponse.json(ticket, { status: 201 });
}

export async function PATCH(req: Request) {
  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const ticket = await prisma.ticket.update({ where: { id }, data: updates });
  return NextResponse.json(ticket);
}