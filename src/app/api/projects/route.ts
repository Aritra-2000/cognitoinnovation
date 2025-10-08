import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserFromHeaders } from '@/lib/auth';

export async function GET() {
  const projects = await prisma.project.findMany({ 
    orderBy: { createdAt: 'desc' } 
  });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUserFromHeaders(request.headers);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Get or create the user in the database
    const dbUser = await prisma.user.upsert({
      where: { email: user.email },
      create: { email: user.email },
      update: {}
    });

    const project = await prisma.project.create({ 
      data: { 
        name, 
        createdBy: dbUser.id 
      } 
    });
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' }, 
      { status: 500 }
    );
  }
}