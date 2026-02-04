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
      <PageHeaderCard className="border-0 bg-transparent p-0 shadow-none">
        <div className="flex flex-col">
          <H1 className="leading-tight">Shopping list</H1>
        </div>
      </PageHeaderCard>

      <ShoppingList actions={<ShoppingListActions layout="row" />} />
    </div>
  );
}
