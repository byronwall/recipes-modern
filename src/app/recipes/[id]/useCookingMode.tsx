"use client";
import { produce } from "immer";
import { create } from "zustand";

type IngredientId = number;
type StepId = string; // groupIdx-stepIdx

type CookingTimer = {
  id: number; // will be a +Date.now() value
  startTime: number;
  endTime: number;
  description: string;
};

type CookingModeStore = {
  cookingMode: boolean;
  ingredients: Record<IngredientId, boolean>;
  steps: Record<StepId, boolean>;
  timers: CookingTimer[];
};

type CookingModeActions = {
  toggleCookingMode: () => void;

  toggleIngredientStatus: (ingredientId: IngredientId) => void;
  toggleStepStatus: (stepId: StepId) => void;

  addTimer: (timer: CookingTimer) => void;
  removeTimer: (timerId: number) => void;
};

export const useCookingMode = create<CookingModeStore & CookingModeActions>(
  (set, get) => ({
    cookingMode: false,
    toggleCookingMode: () => {
      set(
        produce((draft: CookingModeStore) => {
          draft.cookingMode = !draft.cookingMode;
        }),
      );
    },

    addTimer: (timer) => {
      set(
        produce((draft: CookingModeStore) => {
          draft.timers.push(timer);
        }),
      );
    },
    removeTimer: (timerId) => {
      set(
        produce((draft: CookingModeStore) => {
          draft.timers = draft.timers.filter((timer) => timer.id !== timerId);
        }),
      );
    },

    toggleIngredientStatus: (ingredientId) => {
      set(
        produce((draft: CookingModeStore) => {
          draft.ingredients[ingredientId] = !draft.ingredients[ingredientId];
        }),
      );
    },
    toggleStepStatus: (stepId) => {
      set(
        produce((draft: CookingModeStore) => {
          draft.steps[stepId] = !draft.steps[stepId];
        }),
      );
    },
    ingredients: {},
    steps: {},
    timers: [],
  }),
);
