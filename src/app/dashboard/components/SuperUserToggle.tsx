"use client";
import { useState } from 'react';
import { useSuperUserStore } from '../store/useSuperUserStore';
import type { SuperUserState } from '../store/useSuperUserStore';

export default function SuperUserToggle() {
	const enabled = useSuperUserStore((s: SuperUserState) => s.enabled);
	const enable = useSuperUserStore((s: SuperUserState) => s.enable);
	const disable = useSuperUserStore((s: SuperUserState) => s.disable);
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string|null>(null);

	async function onToggle() {
		setError(null);
		if (enabled) return disable();
		const ok = await enable(password);
		if (!ok) setError('Invalid password');
	}

	return (
		<div className="flex items-center gap-2">
			<input
				type="password"
				placeholder="Super user password"
				className="border rounded px-2 py-1"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				disabled={enabled}
			/>
			<button onClick={onToggle} className="px-3 py-1 rounded border">
				{enabled ? 'Disable' : 'Enable'} Super User
			</button>
			{error && <span className="text-sm text-red-600">{error}</span>}
		</div>
	);
}


