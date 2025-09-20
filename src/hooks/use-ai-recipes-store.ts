"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeneratedRecipe } from "~/types/ai";

export type GeneratedResultItem = {
  recipe: GeneratedRecipe;
  warnings: string[];
};

type AiRecipesState = {
  prompt: string;
  servings?: number;
  timeLimitMinutes?: number;
  count: number;
  results: GeneratedResultItem[];
  selectedIndices: number[]; // keep simple for serialization
  setPrompt: (prompt: string) => void;
  setServings: (servings: number | undefined) => void;
  setTimeLimitMinutes: (minutes: number | undefined) => void;
  setCount: (count: number) => void;
  setResults: (results: GeneratedResultItem[]) => void;
  clearResults: () => void;
  selectToggle: (index: number) => void;
  selectAll: (flag: boolean) => void;
  clearSelection: () => void;
};

export const useAiRecipesStore = create<AiRecipesState>()(
  persist(
    (set, get) => ({
      prompt: "",
      servings: undefined,
      timeLimitMinutes: undefined,
      count: 3,
      results: [],
      selectedIndices: [],
      setPrompt: (prompt) => set({ prompt }),
      setServings: (servings) => set({ servings }),
      setTimeLimitMinutes: (timeLimitMinutes) => set({ timeLimitMinutes }),
      setCount: (count) => set({ count }),
      setResults: (results) => set({ results }),
      clearResults: () => set({ results: [], selectedIndices: [] }),
      selectToggle: (index) =>
        set(() => {
          const current = new Set<number>(get().selectedIndices);
          if (current.has(index)) current.delete(index);
          else current.add(index);
          return {
            selectedIndices: Array.from(current.values()).sort((a, b) => a - b),
          };
        }),
      selectAll: (flag) =>
        set(() => {
          if (!flag) return { selectedIndices: [] };
          const indices = get().results.map((_, i) => i);
          return { selectedIndices: indices };
        }),
      clearSelection: () => set({ selectedIndices: [] }),
    }),
    {
      name: "ai-recipes-store",
      version: 1,
      partialize: (state) => ({
        prompt: state.prompt,
        servings: state.servings,
        timeLimitMinutes: state.timeLimitMinutes,
        count: state.count,
        results: state.results,
        selectedIndices: state.selectedIndices,
      }),
    },
  ),
);
