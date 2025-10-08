import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is authenticated
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized: Please log in', { status: 401 });
    }

    const ticketId = params.id;
    const userEmail = session.user.email;

    // First, get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get the ticket with project and member information
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        Project: {
          include: {
            creator: {
              select: { id: true }
            },
            members: {
              where: {
                userId: currentUser.id,
                role: { in: ['ADMIN', 'MAINTAINER'] }
              },
              select: { userId: true }
            }
          }
        }
      }
    });

    if (!ticket) {
      return new NextResponse('Ticket not found', { status: 404 });
    }

    // Check if user is the project creator or has admin/maintainer role
    const isProjectCreator = ticket.Project.creator?.id === currentUser.id;
    const isProjectAdmin = ticket.Project.members.length > 0;

    if (!isProjectCreator && !isProjectAdmin) {
      return new NextResponse('Forbidden: You do not have permission to delete this ticket', { status: 403 });
    }

    // Delete the ticket
    await prisma.ticket.delete({
      where: { id: ticketId }
    });

    // Log the activity
    await prisma.activity.create({
      data: {
        userId: currentUser.id,
        message: `Deleted ticket: ${ticket.title}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    });

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to delete ticket' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
