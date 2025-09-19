"use client";

import { create } from "zustand";

export type AddTagDialogResult = { slug: string; name: string };

export type AddTagDialogOptions = {
  defaultName?: string;
  recipeId?: number;
  existingTagSlugs?: string[];
  onSuccess?: (result: AddTagDialogResult) => void;
  onClose?: () => void;
};

type AddTagDialogState = {
  isOpen: boolean;
  name: string;
  options: AddTagDialogOptions | null;
  open: (opts: AddTagDialogOptions) => void;
  close: () => void;
  setName: (val: string) => void;
};

export const useAddTagDialogStore = create<AddTagDialogState>((set) => ({
  isOpen: false,
  name: "",
  options: null,
  open: (opts) =>
    set({
      isOpen: true,
      name: opts.defaultName ?? "",
      options: opts,
    }),
  close: () =>
    set((state) => {
      state.options?.onClose?.();
      return { isOpen: false, name: "", options: null };
    }),
  setName: (val) => set({ name: val }),
}));

export function openAddTagDialog(options: AddTagDialogOptions) {
  useAddTagDialogStore.getState().open(options);
}
