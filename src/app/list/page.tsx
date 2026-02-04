import { helpers } from "~/trpc/helpers";
import { useEnforceAuth } from "../useEnforceAuth";
import { ShoppingListActions } from "./ShoppingAddLoose";
import { ShoppingList } from "./ShoppingList";
import { PageHeaderCard } from "~/components/layout/PageHeaderCard";
import { H1 } from "~/components/ui/typography";

export default async function ListPage() {
  await useEnforceAuth();

  await (await helpers()).shoppingList.getShoppingList.prefetch();

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeaderCard className="p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground">
              Shopping
            </p>
            <H1>Shopping list</H1>
          </div>
        </div>
      </PageHeaderCard>

      <ShoppingList actions={<ShoppingListActions layout="column" />} />
    </div>
  );
}
