import { NextResponse } from 'next/server';
import { getCurrentUserFromHeaders } from '@/lib/auth';
import {prisma} from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUserFromHeaders(request.headers);
    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const projectId = params.id;
    if (!projectId) {
      return new NextResponse(
        JSON.stringify({ error: 'Project ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // First, delete all tickets associated with the project
    await prisma.ticket.deleteMany({
      where: { projectId }
    });

    // Then delete the project
    const deletedProject = await prisma.project.delete({
      where: { id: projectId }
    });

    return new NextResponse(
      JSON.stringify({ success: true, project: deletedProject }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting project:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to delete project' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
