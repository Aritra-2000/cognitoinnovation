"use client";
import { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, closestCenter, useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProjectPusher } from '@/hooks/useSocket';
import { useSuperUserStore } from '../store/useSuperUserStore';
import { toast } from 'react-hot-toast';

type UserUpdate = {
  email: string;
  timestamp: string;
  status: string;
};

type Ticket = { 
  id: string; 
  title: string; 
  status: string; 
  description: string;
  updatedAt: string;
  updatedBy?: string;
  updateHistory?: UserUpdate[];
};

const columns = [
  { id: 'proposed', title: 'Proposed', color: 'bg-pink-100 text-pink-800' },
  { id: 'todo', title: 'Todo', color: 'bg-purple-100 text-purple-800' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { id: 'done', title: 'Done', color: 'bg-green-100 text-green-800' },
  { id: 'deployed', title: 'Deployed', color: 'bg-gray-100 text-gray-800' }
];

// Sortable item component
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 'auto',
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
    >
      {children}
    </div>
  );
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef} className="h-full">
      {children}
    </div>
  );
}

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [showNewTicketForm, setShowNewTicketForm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { pusher } = useProjectPusher(projectId);
  const isSuperUser = useSuperUserStore((state: any) => state.enabled);

  async function loadTickets() {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/tickets?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTickets();
  }, [projectId]);

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      // Get the user's email from session or local storage
      const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') || 'user@example.com' : 'user@example.com';
      
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: ticketId, 
          status: newStatus,
          updatedBy: userEmail
        })
      });

      if (res.ok) {
        // Update the local state to reflect the change
        setTickets(prevTickets =>
          prevTickets.map(ticket =>
            ticket.id === ticketId
              ? { ...ticket, status: newStatus }
              : ticket
          )
        );
      } else {
        console.error('Failed to update ticket status');
        // Optionally, you could show an error message to the user here
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      // Handle any errors that occur during the fetch
    }
  };

  // Handle drag end event
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Find the ticket being dragged
    const activeTicket = tickets.find(t => t.id === active.id);
    if (!activeTicket) return;

    // Get the new status from the drop target
    const newStatus = over.id as string;
    
    // Update the ticket status
    await updateTicketStatus(activeTicket.id, newStatus);
  }

  async function createTicket(status: string) {
    if (!newTicketTitle.trim()) return;
    
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        projectId, 
        title: newTicketTitle, 
        description: newTicketDescription,
        status 
      })
    });
    
    if (res.ok) {
      setNewTicketTitle('');
      setNewTicketDescription('');
      setShowNewTicketForm(null);
      loadTickets(); // Reload tickets to show the new one
    }
  }

  // Function to delete a ticket
  const deleteTicket = async (ticketId: string) => {
    const ticketToDelete = tickets.find(t => t.id === ticketId);
    if (!ticketToDelete) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      toast.custom((t) => (
        <div className="bg-white rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Delete Task</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete "{ticketToDelete.title}"? This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
              disabled={isDeleting === ticketId}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  setIsDeleting(ticketId);
                  const res = await fetch(`/api/tickets/${ticketId}`, {
                    method: 'DELETE',
                  });

                  if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || 'Failed to delete task');
                  }

                  // Remove the ticket from local state
                  setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== ticketId));
                  toast.success('Task deleted successfully');
                  toast.dismiss(t.id);
                  resolve(true);
                } catch (error) {
                  console.error('Error deleting ticket:', error);
                  const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
                  toast.error(errorMessage);
                  toast.dismiss(t.id);
                  resolve(false);
                } finally {
                  setIsDeleting(null);
                }
              }}
              className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDeleting === ticketId}
            >
              {isDeleting === ticketId ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      ), {
        duration: 10000, // 10 seconds
        position: 'top-center'
      });
    });

    if (!confirmed) return;
  };

  // Function to filter tickets by status
  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Project Board</h1>
          <span className="text-gray-600">Tasks: {tickets.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {columns.map((column) => {
            const columnTickets = getTicketsByStatus(column.id);
            
            return (
              <DroppableColumn key={column.id} id={column.id}>
                <div className="min-w-0 flex flex-col h-full">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded-t">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${column.color}`}>
                        {column.title}
                      </span>
                      <span className="text-xs text-gray-500 bg-white rounded-full w-5 h-5 flex items-center justify-center">
                        {columnTickets.length}
                      </span>
                    </div>
                  </div>

                  {/* Tickets List */}
                  <div className="flex-1 bg-gray-50 p-2 rounded-b min-h-[100px]">
                    <SortableContext 
                      items={columnTickets.map((t: Ticket) => t.id)} 
                      strategy={rectSortingStrategy}
                    >
                      <div className="space-y-2">
                        {columnTickets.map((ticket: Ticket) => (
                          <SortableItem key={ticket.id} id={ticket.id}>
                            <div className="bg-white p-2 rounded border border-gray-200 shadow-sm hover:shadow transition-all">
                              <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                                {ticket.title}
                              </h3>
                              {ticket.description?.trim() && (
                                <ul className="mt-1 space-y-1 text-xs text-gray-500">
                                  {ticket.description.trim()
                                    .split('\n')
                                    .filter((line: string) => line.trim() !== '')
                                    .map((line: string, index: number) => (
                                      <li key={index} className="flex items-start">
                                        <span className="mr-1">•</span>
                                        <span className="flex-1 line-clamp-1">{line.trim()}</span>
                                      </li>
                                    ))}
                                </ul>
                              )}
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    {new Date(ticket.updatedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                {isSuperUser && ticket.updatedBy && (
                                  <div className="group relative">
                                    <div className="flex items-center cursor-pointer">
                                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xs mr-1">
                                        {ticket.updatedBy.split('@')[0].charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-xs text-gray-700">
                                        {ticket.updatedBy.split('@')[0]}
                                      </span>
                                    </div>
                                    {ticket.updateHistory && ticket.updateHistory.length > 1 && (
                                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block border border-gray-200">
                                        <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100">Update History</div>
                                        {[...ticket.updateHistory]
                                          .sort((a: UserUpdate, b: UserUpdate) => 
                                            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                                          )
                                          .map((update: UserUpdate, idx: number) => (
                                            <div key={idx} className="px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">
                                              <div className="flex items-center">
                                                <div className="w-3 h-3 rounded-full bg-blue-400 flex items-center justify-center text-white text-2xs mr-2 text-[8px]">
                                                  {update.email.split('@')[0].charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                  <div className="font-medium">{update.email.split('@')[0]}</div>
                                                  <div className="text-gray-400">
                                                    {new Date(update.timestamp).toLocaleString()}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </SortableItem>
                        ))}
                      </div>
                    </SortableContext>

                    {/* Add Ticket Button */}
                    <button
                      onClick={() => setShowNewTicketForm(column.id)}
                      className="mt-2 w-full text-xs text-gray-500 hover:text-blue-600 flex items-center justify-center py-1.5 border border-dashed border-gray-300 rounded hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Task
                    </button>
                  </div>
                </div>
              </DroppableColumn>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}