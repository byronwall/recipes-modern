"use client";

import { api } from "~/trpc/react";

export function MigrateButtons() {
  const migrate = api.recipe.migrateRecipes.useMutation();
  return (
    <div>
      <button
        onClick={async () => {
          await migrate.mutateAsync();
        }}
      >
        Migrate Recipes
      </button>
    </div>
  );
}
