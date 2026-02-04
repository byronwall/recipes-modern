import type { RouterOutputs } from "~/trpc/react";

export type Recipe = NonNullable<RouterOutputs["recipe"]["getRecipe"]>;
