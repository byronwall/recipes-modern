"use client";

import { useMemo } from "react";
import { api } from "~/trpc/react";
import { PurchasesFiltersPanel } from "./PurchasesFiltersPanel";
import { type PurchaseStatusFilter } from "./PurchasesFiltersPanel";
import { PurchasesTable } from "./PurchasesTable";
import {
  urlStateCodecs,
  useReplaceUrlParams,
  useUrlState,
} from "~/hooks/use-url-state";

const purchaseStatusCodec = urlStateCodecs.enum<PurchaseStatusFilter>(
  ["all", "added", "attempted"],
  "all",
);
const purchaseSearchCodec = urlStateCodecs.string();
const purchaseCategoryCodec = urlStateCodecs.string("all");
const purchasePageCodec = urlStateCodecs.number(1);
const purchasePageSizeCodec = urlStateCodecs.number(25, {
  allowedValues: [10, 25, 50, 100],
});

export function PurchasesList() {
  const { data, isLoading, error } = api.purchases.list.useQuery();
  const replaceUrlParams = useReplaceUrlParams();
  const [search] = useUrlState("q", purchaseSearchCodec);
  const [statusFilter] = useUrlState("status", purchaseStatusCodec);
  const [categoryFilter] = useUrlState("category", purchaseCategoryCodec);
  const [page, setPage] = useUrlState("page", purchasePageCodec);
  const [pageSize] = useUrlState("pageSize", purchasePageSizeCodec);
  const purchases = useMemo(() => data ?? [], [data]);

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    for (const purchase of purchases) {
      for (const category of purchase.krogerCategories ?? []) {
        if (category?.trim()) categories.add(category);
      }
    }
    return Array.from(categories).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();

    return purchases.filter((purchase) => {
      if (statusFilter === "added" && !purchase.wasAddedToCart) return false;
      if (statusFilter === "attempted" && purchase.wasAddedToCart) return false;

      if (categoryFilter !== "all") {
        const categories = purchase.krogerCategories ?? [];
        if (
          !categories.some(
            (c) => c.toLowerCase() === categoryFilter.toLowerCase(),
          )
        ) {
          return false;
        }
      }

      if (!query) return true;

      return (
        purchase.krogerName.toLowerCase().includes(query) ||
        (purchase.krogerBrand ?? "").toLowerCase().includes(query) ||
        purchase.krogerSku.toLowerCase().includes(query) ||
        purchase.krogerProductId.toLowerCase().includes(query)
      );
    });
  }, [purchases, search, statusFilter, categoryFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPurchases.length / pageSize),
  );
  const safePage = Math.min(page, totalPages);
  const pagedPurchases = filteredPurchases.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading purchases</p>;

  if (!purchases || purchases.length === 0) return <p>No purchases yet.</p>;

  return (
    <div className="flex flex-col gap-4">
      <PurchasesFiltersPanel
        search={search}
        onSearchChange={(value) => replaceUrlParams({ q: value, page: null })}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) =>
          replaceUrlParams({
            status: value === "all" ? null : value,
            page: null,
          })
        }
        categoryFilter={categoryFilter}
        onCategoryFilterChange={(value) =>
          replaceUrlParams({
            category: value === "all" ? null : value,
            page: null,
          })
        }
        categoryOptions={categoryOptions}
      />

      <PurchasesTable
        purchases={pagedPurchases}
        filteredCount={filteredPurchases.length}
        safePage={safePage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageSizeChange={(value) => {
          replaceUrlParams({
            pageSize:
              value === purchasePageSizeCodec.defaultValue
                ? null
                : String(value),
            page: null,
          });
        }}
        onPreviousPage={() => setPage(Math.max(1, safePage - 1))}
        onNextPage={() => setPage(Math.min(totalPages, safePage + 1))}
      />
    </div>
  );
}
