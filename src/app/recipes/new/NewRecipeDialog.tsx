"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { NewRecipeForm } from "~/app/recipes/new/NewRecipeForm";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

export function NewRecipeDialog() {
  const formId = "create-recipe-form";
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New Recipe
        </Button>
      </DialogTrigger>

      <DialogContent className="grid max-h-[90vh] max-w-4xl grid-rows-[auto,1fr,auto] gap-3 overflow-hidden p-5">
        <DialogHeader>
          <DialogTitle>Create New Recipe</DialogTitle>
          <DialogDescription>
            Add details, tags, ingredients, and steps.
          </DialogDescription>
        </DialogHeader>

        <NewRecipeForm
          formId={formId}
          onSubmittingChange={(val) => setIsSubmitting(val)}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form={formId} isLoading={isSubmitting}>
            <Plus />
            Create recipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
