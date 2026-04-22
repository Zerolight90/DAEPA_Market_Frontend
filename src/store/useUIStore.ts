import { create } from "zustand";
import type { ViewMode } from "@/types";

interface UIState {
    view: ViewMode;
    setView: (view: ViewMode) => void;
}

export const useUIStore = create<UIState>((set) => ({
    view: "grid",
    setView: (view: ViewMode) => set({ view }),
}));
