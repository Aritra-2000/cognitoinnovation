"use client";
import { create } from "zustand";

export type SuperUserState = {
  enabled: boolean;
  enable: (password: string) => Promise<boolean>;
  disable: () => void;
};

export const useSuperUserStore = create<SuperUserState>((set) => ({
  enabled: typeof window !== "undefined" && localStorage.getItem("superuser") === "true",

  enable: async (password: string) => {
    try {
      const res = await fetch("/api/superuser/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.ok) {
        set({ enabled: true });
        localStorage.setItem("superuser", "true");
        return true;
      } else {
        set({ enabled: false });
        localStorage.removeItem("superuser");
        return false;
      }
    } catch (err) {
      console.error("SuperUser verification failed:", err);
      set({ enabled: false });
      return false;
    }
  },

  disable: () => {
    set({ enabled: false });
    localStorage.removeItem("superuser");
  },
}));
