"use client";

import { api } from "~/trpc/react";
import { formatMoney } from "../list/formatMoney";

export function PurchasesList() {
  const { data, isLoading, error } = api.purchases.list.useQuery();
  const purchases = data ?? [];

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading purchases</p>;

  if (!purchases || purchases.length === 0) return <p>No purchases yet.</p>;

  return (
    <div className="flex flex-col gap-2">
      {purchases.map((p) => (
        <div key={p.id} className="flex items-center gap-3 border p-2">
          <img
            src={p.imageUrl}
            alt={p.krogerName}
            className="h-16 w-16 object-cover"
          />
          <div className="flex flex-col">
            <span className="font-semibold">{p.krogerName}</span>
            <span className="text-sm text-gray-600">
              {p.krogerSku} • {p.krogerProductId} • {p.itemSize}
            </span>
            <span>
              {formatMoney(p.price)} × {p.quantity}
            </span>
            {p.ingredient && (
              <span className="text-sm text-gray-600">
                From ingredient: {p.ingredient.ingredient}
              </span>
            )}
            <span className="text-sm">
              Status: {p.wasAddedToCart ? "Added to cart" : "Attempted"}
            </span>
            {p.note && (
              <span className="text-xs text-red-600">Note: {p.note}</span>
            )}
          </div>
          <span className="ml-auto text-sm text-gray-500">
            {new Date(p.createdAt).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
