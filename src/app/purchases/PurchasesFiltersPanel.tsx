import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

export type PurchaseStatusFilter = "all" | "added" | "attempted";

const STATUS_OPTIONS: { value: PurchaseStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "added", label: "In cart" },
  { value: "attempted", label: "Not in cart" },
];

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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, brand, or UPC"
          aria-label="Search purchases"
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        {categoryOptions.length > 1 && (
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger
              aria-label="Category"
              className="h-9 w-full text-sm sm:w-44"
            >
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
        )}

        <div
          role="group"
          aria-label="Cart status"
          className="flex shrink-0 gap-0.5 rounded-full bg-muted p-0.5"
        >
          {STATUS_OPTIONS.map((option) => {
            const isActive = option.value === statusFilter;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => onStatusFilterChange(option.value)}
                className={cn(
                  "h-8 whitespace-nowrap rounded-full px-3 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
