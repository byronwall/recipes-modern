import { helpers } from "~/trpc/helpers";
import { useEnforceAuth } from "../useEnforceAuth";
import { ShoppingList } from "./ShoppingList";

export default async function ListPage() {
  await useEnforceAuth();

  await (await helpers()).shoppingList.getShoppingList.prefetch();

  return (
    <div className="flex w-full flex-col gap-6">
      <ShoppingList />
    </div>
  );
}
