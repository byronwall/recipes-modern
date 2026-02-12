"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { PurchasesFiltersPanel } from "./PurchasesFiltersPanel";
import { type PurchaseStatusFilter } from "./PurchasesFiltersPanel";
import { PurchasesTable } from "./PurchasesTable";

export function PurchasesList() {
  const { data, isLoading, error } = api.purchases.list.useQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
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

  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / pageSize));
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
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categoryOptions={categoryOptions}
      />

      <PurchasesTable
        purchases={pagedPurchases}
        filteredCount={filteredPurchases.length}
        safePage={safePage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
        onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
        onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
    </div>
  );
}
