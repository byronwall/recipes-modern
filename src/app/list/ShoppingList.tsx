"use client";

import { H2 } from "~/components/ui/typography";

import { ShoppingListCard } from "./ShoppingListCard";
import { api } from "~/trpc/react";

export function ShoppingList() {
  const { data: shoppingList = [] } =
    api.shoppingList.getShoppingList.useQuery();

  return (
    <>
      <H2>List</H2>
      <div>
        {shoppingList.map((item) => (
          <ShoppingListCard key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}
