"use client";
import { create } from 'zustand';

export type SuperUserState = {
	enabled: boolean;
	enable: (password: string) => Promise<boolean>;
	disable: () => void;
};

export const useSuperUserStore = create<SuperUserState>((set) => ({
	enabled: false,
	enable: async (password: string) => {
		const res = await fetch('/api/superuser/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password })
		});
		const ok = res.ok;
		set({ enabled: ok });
		return ok;
	},
	disable: () => set({ enabled: false })
}));


