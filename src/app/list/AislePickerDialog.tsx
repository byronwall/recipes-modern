"use client";

import { Edit, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { IconTextButton } from "~/components/ui/icon-text-button";

type Props = {
  ingredientId: number;
  currentAisle?: string | null;
};

export function AislePickerDialog({ ingredientId, currentAisle }: Props) {
  const [open, setOpen] = useState(false);
  const [newAisle, setNewAisle] = useState("");

  const aislesQuery = api.recipe.getDistinctAisles.useQuery(undefined, {
    enabled: open,
  });

  const updateMutation = api.recipe.updateIngredientAisle.useMutation();

  // create a sorted unique set with current aisle included
  const aisleOptions = useMemo(() => {
    const set = new Set<string>();
    if (currentAisle) set.add(currentAisle);
    if (aislesQuery.data) for (const a of aislesQuery.data) set.add(a);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [aislesQuery.data, currentAisle]);

  useEffect(() => {
    if (!open) setNewAisle("");
  }, [open]);

  async function applyAisle(value: string) {
    if (!value) return;
    await updateMutation.mutateAsync({ id: ingredientId, aisle: value });
    await aislesQuery.refetch();
    setOpen(false);
  }

  const title = useMemo(() => {
    if (currentAisle) return `Change aisle from ${currentAisle}`;
    return "Set aisle";
  }, [currentAisle]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <IconTextButton
          variant="secondary"
          size="sm"
          icon={<Edit className="h-4 w-4 shrink-0" />}
          label="Aisle"
        />
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Choose an existing aisle
            </p>
            <Command>
              <CommandInput placeholder="Search aisles..." />
              <CommandList className="h-48 overflow-y-auto">
                <CommandEmpty>No aisles found.</CommandEmpty>
                {aisleOptions.map((a) => (
                  <CommandItem
                    key={a}
                    value={a}
                    onSelect={() => void applyAisle(a)}
                  >
                    {a}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Or add a new aisle</p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Produce"
                value={newAisle}
                onChange={(e) => setNewAisle(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && newAisle.trim()) {
                    await applyAisle(newAisle.trim());
                  }
                }}
              />
              <IconTextButton
                onClick={async () => {
                  if (!newAisle.trim()) return;
                  await applyAisle(newAisle.trim());
                }}
                title="Add new aisle"
                icon={<Plus className="h-4 w-4 shrink-0" />}
                label="Add"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AislePickerDialog;
