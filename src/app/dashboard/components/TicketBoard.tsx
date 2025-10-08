"use client";
import { useEffect, useState } from 'react';

type Ticket = { id: string; title: string; status: string; description: string };

export default function TicketBoard({ projectId }: { projectId: string }) {
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	async function load() {
		const res = await fetch(`/api/tickets?projectId=${projectId}`);
		if (res.ok) setTickets(await res.json());
	}

	useEffect(() => {
		void load();
	}, [projectId]);

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
		}
	}

	async function updateStatus(id: string, status: string) {
		const res = await fetch('/api/tickets', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id, status })
		});
		if (res.ok) await load();
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


