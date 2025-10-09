"use client";

import { useEffect, useState } from "react";
import { apiPatch, apiPost } from "@/lib/api-client";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useProjectPusher } from "@/hooks/useSocket";
import { useSuperUserStore } from "../store/useSuperUserStore";
import { toast } from "react-hot-toast";
import Loading from "@/app/loading";

// ---------------- Types ----------------

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

// ---------------- Columns ----------------

const columns = [
  { id: "proposed", title: "Proposed", color: "bg-pink-100 text-pink-700", gradient: "from-pink-500 to-rose-500", badge: "bg-pink-500" },
  { id: "todo", title: "Todo", color: "bg-purple-100 text-purple-700", gradient: "from-purple-500 to-indigo-500", badge: "bg-purple-500" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-100 text-blue-700", gradient: "from-blue-500 to-cyan-500", badge: "bg-blue-500" },
  { id: "done", title: "Done", color: "bg-green-100 text-green-700", gradient: "from-green-500 to-emerald-500", badge: "bg-green-500" },
  { id: "deployed", title: "Deployed", color: "bg-gray-100 text-gray-700", gradient: "from-gray-500 to-slate-500", badge: "bg-gray-500" },
];

// ---------------- Sortable / Droppable ----------------

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : "auto",
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

// ---------------- Main Component ----------------

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDescription, setNewTicketDescription] = useState("");
  const [showNewTicketForm, setShowNewTicketForm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { pusher } = useProjectPusher(projectId);
  const isSuperUser = useSuperUserStore((state) => state.enabled);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ---------------- Load Tickets ----------------

  async function loadTickets() {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/tickets?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        // Normalize backend `updates` relation into `updateHistory` the UI expects
        const normalized = (data || []).map((t: any) => ({
          ...t,
          updateHistory: Array.isArray(t.updates)
            ? t.updates.map((u: any) => ({
                email: u.user?.email || t.updatedBy || 'unknown',
                timestamp: u.timestamp || u.updatedAt || t.updatedAt,
                status: typeof u.changes === 'string' ? u.changes : (u.changes?.status || 'updated'),
              }))
            : t.updateHistory || [],
        }));
        setTickets(normalized);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTickets();
  }, [projectId]);

  // ---------------- Update Status ----------------

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      setUpdatingId(ticketId);
      const updatedTicket = await apiPatch<Ticket>("/api/tickets", { 
        id: ticketId, 
        status: newStatus 
      });
      
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: newStatus,
                updateHistory: [
                  {
                    email: updatedTicket?.updatedBy || 'you',
                    timestamp: new Date().toISOString(),
                    status: newStatus,
                  },
                  ...(t.updateHistory || []),
                ],
              }
            : t
        )
      );
      
      return updatedTicket;
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Error updating ticket status");
      throw error;
    } finally {
      setUpdatingId(null);
    }
  };

  // ---------------- Drag End ----------------

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTicket = tickets.find((t) => t.id === active.id);
    if (!activeTicket) return;

    await updateTicketStatus(activeTicket.id, over.id as string);
  }

  // ---------------- Create Ticket ----------------

  async function createTicket(status: string) {
    if (!newTicketTitle.trim()) {
      toast.error("Ticket title cannot be empty");
      return;
    }

    try {
      const data = await apiPost<any>("/api/tickets", {
        projectId,
        title: newTicketTitle,
        description: newTicketDescription,
        status,
      });

      setNewTicketTitle("");
      setNewTicketDescription("");
      setShowNewTicketForm(null);

      setTickets((prev) => [
        { ...data, updateHistory: [] },
        ...prev,
      ]);

      toast.success("Ticket created successfully!");
    } catch (err) {
      console.error("Error creating ticket:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create ticket");
    }
  }

  // ---------------- Helpers ----------------

  const getTicketsByStatus = (status: string) =>
    (tickets || []).filter((t) => t.status === status);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ---------------- Render ----------------

  if (isLoading) {
    return <Loading />;
  }

  if (!isLoading && tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">No tickets yet</h3>
        <p className="text-gray-500 mb-6">Get started by creating your first ticket</p>
        {isSuperUser && (
          <button
            onClick={() => setShowNewTicketForm('proposed')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ticket
          </button>
        )}
      </div>
    );
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        {/* Columns */}
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {columns.map((column) => {
            const columnTickets = getTicketsByStatus(column.id);
            return (
              <DroppableColumn key={column.id} id={column.id}>
                <div className="min-w-0 flex flex-col h-full">
                  {/* Column Header */}
                  <div className={`bg-gradient-to-r ${column.gradient} p-4 rounded-t-2xl shadow-md`}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                        {column.title}
                      </h2>
                      <span className="bg-white/30 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                        {columnTickets.length}
                      </span>
                    </div>
                  </div>

                  {/* Tickets */}
                  <div className={`flex-1 ${column.color} bg-opacity-30 backdrop-blur-sm p-3 rounded-b-2xl border-2 border-gray-200 min-h-[200px]`}>
                    <SortableContext
                      items={columnTickets.map((t) => t.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="space-y-3">
                        {columnTickets.map((ticket) => (
                          <SortableItem key={ticket.id} id={ticket.id}>
                            <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-200 relative group">
                              {updatingId === ticket.id && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                                  <div className="flex items-center space-x-2 text-sm text-gray-700 bg-white px-4 py-2 rounded-lg shadow-md">
                                    <span className="inline-block h-4 w-4 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin"></span>
                                    <span className="font-medium">Updating...</span>
                                  </div>
                                </div>
                              )}
                              <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                                {ticket.title}
                              </h3>

                              {/* Description */}
                              {ticket.description?.trim() && (
                                <ul className="mt-2 space-y-1 text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  {ticket.description
                                    .trim()
                                    .split("\n")
                                    .filter((line) => line.trim() !== "")
                                    .map((line, i) => (
                                      <li key={i} className="flex items-start">
                                        <span className="text-blue-500 mr-2 font-bold">•</span>
                                        <span className="flex-1 line-clamp-1">{line.trim()}</span>
                                      </li>
                                    ))}
                                </ul>
                              )}

                              {/* Meta Info */}
                              <div className="mt-3 pt-3 border-t-2 border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formatDate(ticket.updatedAt)}
                                </div>

                                {/* SuperUser Update History */}
                                {isSuperUser && ticket.updatedBy && (
                                  <div className="group/history relative">
                                    <div className="flex items-center cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 px-2 py-1 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all border border-blue-200">
                                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${column.gradient} flex items-center justify-center text-white text-[10px] font-bold mr-1.5 shadow-sm`}>
                                        {ticket.updatedBy.split("@")[0].charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-xs font-medium text-gray-700">
                                        {ticket.updatedBy.split("@")[0]}
                                      </span>
                                    </div>

                                    {ticket.updateHistory &&
                                      ticket.updateHistory.length > 1 && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-2 z-20 hidden group-hover/history:block border-2 border-gray-200">
                                          <div className="px-4 py-2 text-xs font-bold text-gray-700 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                                            Update History
                                          </div>
                                          <div className="max-h-48 overflow-y-auto">
                                            {[...ticket.updateHistory]
                                              .sort(
                                                (a, b) =>
                                                  new Date(b.timestamp).getTime() -
                                                  new Date(a.timestamp).getTime()
                                              )
                                              .map((update, idx) => {
                                                const name = update.email.split("@")[0];
                                                return (
                                                  <div
                                                    key={idx}
                                                    className="px-4 py-3 text-xs hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                                                  >
                                                    <div className="flex items-start gap-2">
                                                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${column.gradient} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm`}>
                                                        {name.charAt(0).toUpperCase()}
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-800 capitalize">
                                                          {update.status.replace('_', ' ')}
                                                        </div>
                                                        <div className="text-gray-600 font-medium">
                                                          {name}
                                                        </div>
                                                        <div className="text-gray-400 text-[10px] mt-0.5">
                                                          {new Date(update.timestamp).toLocaleString()}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                          </div>
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

                    {/* New Ticket Form */}
                    {showNewTicketForm === column.id ? (
                      <div className="mt-3 p-4 bg-white rounded-xl border-2 border-gray-200 shadow-lg">
                        <input
                          type="text"
                          value={newTicketTitle}
                          onChange={(e) => setNewTicketTitle(e.target.value)}
                          placeholder="Task title"
                          className="w-full px-3 py-2 mb-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all outline-none"
                        />
                        <textarea
                          value={newTicketDescription}
                          onChange={(e) => setNewTicketDescription(e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full px-3 py-2 mb-3 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all outline-none resize-none"
                          rows={2}
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setShowNewTicketForm(null);
                              setNewTicketTitle("");
                              setNewTicketDescription("");
                            }}
                            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => createTicket(column.id)}
                            className={`px-4 py-2 text-sm text-white bg-gradient-to-r ${column.gradient} rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={!newTicketTitle.trim()}
                          >
                            Add Task
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNewTicketForm(column.id)}
                        className="mt-3 w-full text-sm text-gray-600 hover:text-blue-600 flex items-center justify-center py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all font-medium group"
                      >
                        <svg
                          className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add Task
                      </button>
                    )}
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