import { PageHeaderCard } from "~/components/layout/PageHeaderCard";
import { H1 } from "~/components/ui/typography";
import { useEnforceAuth } from "../useEnforceAuth";
import { helpers } from "~/trpc/helpers";
import { IngredientsClient } from "./IngredientsClient";

export default async function IngredientsPage() {
  await useEnforceAuth();
  await (await helpers()).purchases.ingredientsCatalog.prefetch();

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeaderCard className="border-0 bg-transparent p-0 shadow-none">
        <div className="flex flex-col">
          <H1 className="leading-tight">Ingredients</H1>
        </div>
      </PageHeaderCard>

      <IngredientsClient />
    </div>
  );
}
