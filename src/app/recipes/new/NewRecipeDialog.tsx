"use client";

import { Plus } from "lucide-react";
import { NewRecipeForm } from "~/app/recipes/new/NewRecipeForm";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

export function NewRecipeDialog() {
  const formId = "create-recipe-form";
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New Recipe
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New Recipe</DialogTitle>
        </DialogHeader>

        <NewRecipeForm formId={formId} />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="submit" form={formId}>
            <Plus />
            Create Recipe!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
