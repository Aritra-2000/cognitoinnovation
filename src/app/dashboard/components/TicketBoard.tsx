"use client";
import { useEffect, useState } from 'react';
import { useProjectPusher } from '@/hooks/useSocket';

type Ticket = { id: string; title: string; status: string; description: string };

export default function TicketBoard({ projectId }: { projectId: string }) {
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const { pusher } = useProjectPusher(projectId);

	async function load() {
		const res = await fetch(`/api/tickets?projectId=${projectId}`);
		if (res.ok) setTickets(await res.json());
	}

	useEffect(() => {
		void load();
	}, [projectId]);

	// Listen for real-time updates
	useEffect(() => {
		if (!pusher) return;

		const channel = pusher.subscribe(`project-${projectId}`);

		const handleTicketCreated = (ticket: Ticket) => {
			setTickets(prev => [ticket, ...prev]);
		};

		const handleTicketUpdated = (updatedTicket: Ticket) => {
			setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
		};

		channel.bind('ticket-created', handleTicketCreated);
		channel.bind('ticket-updated', handleTicketUpdated);

		return () => {
			channel.unbind('ticket-created', handleTicketCreated);
			channel.unbind('ticket-updated', handleTicketUpdated);
			pusher.unsubscribe(`project-${projectId}`);
		};
	}, [pusher, projectId]);

	async function createTicket() {
		if (!title) return;
		const res = await fetch('/api/tickets', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ projectId, title, description })
		});
		if (res.ok) {
			await load();
			setTitle(''); setDescription('');
		} else {
			const error = await res.json();
			console.error('Failed to create ticket:', error);
		}
	}

	async function updateStatus(id: string, status: string) {
		// Get the user's email from session or local storage
		const userEmail = localStorage.getItem('userEmail') || 'user@example.com'; // Fallback to example.com if not found
		
		const res = await fetch('/api/tickets', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ 
				id, 
				status, 
				updatedBy: userEmail 
			})
		});
		if (res.ok) {
			await load();
		} else {
			const error = await res.json();
			console.error('Failed to update ticket:', error);
		}
	}

	return (
		<div className="space-y-4">
			<div className="grid gap-2">
				<input className="border rounded px-2 py-1" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
				<textarea className="border rounded px-2 py-1" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
				<button className="border rounded px-3 py-1" onClick={createTicket}>Add Ticket</button>
			</div>
			<div className="grid md:grid-cols-3 gap-4">
				{['todo','in_progress','done'].map((col) => (
					<div key={col}>
						<h2 className="font-medium mb-2 uppercase text-sm">{col.replace('_',' ')}</h2>
						{tickets.filter(t => t.status === col).map(t => (
							<div key={t.id} className="border rounded px-3 py-2 mb-2 flex items-center justify-between">
								<span>{t.title}</span>
								<select className="border rounded px-2 py-1 text-sm" value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}>
									<option value="todo">Todo</option>
									<option value="in_progress">In Progress</option>
									<option value="done">Done</option>
								</select>
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}


