"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { formatMoney } from "../list/formatMoney";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Search } from "lucide-react";

export function PurchasesList() {
  const { data, isLoading, error } = api.purchases.list.useQuery();
  const purchases = data ?? [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading purchases</p>;

  if (!purchases || purchases.length === 0) return <p>No purchases yet.</p>;

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
        if (!categories.some((c) => c.toLowerCase() === categoryFilter.toLowerCase())) {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border bg-card/70 p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase text-muted-foreground">
              Search
            </Label>
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, SKU, or product ID"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase text-muted-foreground">
                Status
              </Label>
              <ToggleGroup
                type="single"
                value={statusFilter}
                onValueChange={(value) => {
                  if (value) setStatusFilter(value);
                }}
                variant="outline"
                size="sm"
                className="flex flex-wrap justify-start gap-2"
              >
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="added">Added</ToggleGroupItem>
                <ToggleGroupItem value="attempted">Attempted</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase text-muted-foreground">
                Category
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card/70 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[48%]">Item</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedPurchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={purchase.imageUrl}
                      alt={purchase.krogerName}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                    <div>
                      <div className="font-semibold">
                        {purchase.krogerName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[purchase.krogerBrand, purchase.krogerSku, purchase.krogerProductId, purchase.itemSize]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                      {purchase.ingredient && (
                        <div className="text-xs text-muted-foreground">
                          From ingredient: {purchase.ingredient.ingredient}
                        </div>
                      )}
                      {purchase.note && (
                        <div className="text-xs text-destructive">
                          Note: {purchase.note}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-sm">
                  <div className="font-semibold">
                    {formatMoney(purchase.price)} × {purchase.quantity}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total {formatMoney(purchase.price * purchase.quantity)}
                  </div>
                </TableCell>
                <TableCell className="py-3 text-sm">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      purchase.wasAddedToCart
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {purchase.wasAddedToCart ? "Added" : "Attempted"}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-xs text-muted-foreground">
                  {purchase.krogerCategories?.[0] ?? "—"}
                </TableCell>
                <TableCell className="py-3 text-right text-xs text-muted-foreground">
                  {new Date(purchase.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredPurchases.length === 0 && (
          <div className="border-t p-6 text-sm text-muted-foreground">
            No purchases match your filters.
          </div>
        )}
        {filteredPurchases.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm">
            <div className="text-muted-foreground">
              Showing {(safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filteredPurchases.length)} of{" "}
              {filteredPurchases.length}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["10", "25", "50", "100"].map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <button
                  className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  Prev
                </button>
                <span className="px-2 text-xs text-muted-foreground">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
