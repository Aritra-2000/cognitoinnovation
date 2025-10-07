import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const { name, createdBy } = await request.json();
  if (!name || !createdBy) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const project = await prisma.project.create({ data: { name, createdBy } });
  return NextResponse.json(project, { status: 201 });
}