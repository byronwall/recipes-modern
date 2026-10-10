import { PageHeader } from "~/components/layout/PageHeader";
import { useEnforceAuth } from "../useEnforceAuth";
import { helpers } from "~/trpc/helpers";
import { IngredientsClient } from "./IngredientsClient";

export default async function IngredientsPage() {
  await useEnforceAuth();
  await (await helpers()).purchases.ingredientsCatalog.prefetch();

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Ingredients"
        description="Every ingredient across your recipes, with Kroger purchase history."
      />

      <IngredientsClient />
    </div>
  );
}
