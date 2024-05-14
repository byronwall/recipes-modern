import { H2 } from "~/components/ui/typography";
import { helpers } from "~/trpc/helpers";
import { useEnforceAuth } from "../useEnforceAuth";
import { ShoppingListActions } from "./ShoppingAddLoose";
import { ShoppingList } from "./ShoppingList";

export default async function ListPage() {
  await useEnforceAuth();

  await (await helpers()).shoppingList.getShoppingList.prefetch();

  return (
    <div>
      <H2>Actions</H2>
      <div className="flex gap-2">
        <ShoppingListActions />
      </div>

      <ShoppingList />
    </div>
  );
}
