"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProjectList() {
	const [projects, setProjects] = useState<any[]>([]);
	const [name, setName] = useState("");

	useEffect(() => {
		void fetch('/api/projects').then((r) => r.json()).then(setProjects).catch(() => setProjects([]));
	}, []);

	async function createProject() {
		if (!name) return;
		const res = await fetch('/api/projects', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, createdBy: 'anonymous' })
		});
		if (res.ok) {
			const p = await res.json();
			setProjects((prev) => [p, ...prev]);
			setName('');
		}
	}

	return (
		<div className="space-y-3">
			<div className="flex gap-2">
				<input className="border rounded px-2 py-1" placeholder="New project name" value={name} onChange={(e) => setName(e.target.value)} />
				<button className="border rounded px-3" onClick={createProject}>Create</button>
			</div>
			<div className="grid gap-2">
				{projects.map((p) => (
					<Link key={p.id} href={`/dashboard/${p.id}`} className="border rounded px-3 py-2 hover:bg-gray-50">{p.name}</Link>
				))}
			</div>
		</div>
	);
}


