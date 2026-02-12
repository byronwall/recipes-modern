import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

export type PurchaseStatusFilter = "all" | "added" | "attempted";

export function PurchasesFiltersPanel(props: {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: PurchaseStatusFilter;
  onStatusFilterChange: (value: PurchaseStatusFilter) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categoryOptions: string[];
}) {
  const {
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    categoryFilter,
    onCategoryFilterChange,
    categoryOptions,
  } = props;

  return (
    <div className="rounded-2xl border bg-card/70 p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <Label className="text-xs uppercase text-muted-foreground">Search</Label>
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, SKU, or product ID"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase text-muted-foreground">Status</Label>
            <ToggleGroup
              type="single"
              value={statusFilter}
              onValueChange={(value) => {
                if (value === "all" || value === "added" || value === "attempted") {
                  onStatusFilterChange(value);
                }
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
            <Label className="text-xs uppercase text-muted-foreground">Category</Label>
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
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
  );
}
