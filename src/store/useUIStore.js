import { create } from "zustand";

export const useUIStore = create((set) => ({
    view: "grid",
    setView: (view) => set({ view }),
}));
