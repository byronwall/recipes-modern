import { type ReactNode } from "react";
import { CheckCircle2, CircleDashed, ListFilter, Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { TooltipButton } from "~/components/ui/tooltip-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";

export type PurchaseStatusFilter = "all" | "added" | "attempted";

function StatusIconButton(props: {
  value: PurchaseStatusFilter;
  activeValue: PurchaseStatusFilter;
  onChange: (value: PurchaseStatusFilter) => void;
  label: string;
  icon: ReactNode;
}) {
  const { value, activeValue, onChange, label, icon } = props;
  const isActive = value === activeValue;

  return (
    <TooltipButton content={label}>
      <Button
        type="button"
        size="icon"
        variant={isActive ? "secondary" : "outline"}
        className={isActive ? "bg-secondary" : ""}
        aria-label={label}
        aria-pressed={isActive}
        onClick={() => onChange(value)}
      >
        {icon}
      </Button>
    </TooltipButton>
  );
}

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
    <div className="py-1">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto] lg:items-end">
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

        <div className="flex flex-col gap-2">
          <Label className="text-xs uppercase text-muted-foreground">Status</Label>
          <div className="flex items-center gap-2">
            <StatusIconButton
              value="all"
              activeValue={statusFilter}
              onChange={onStatusFilterChange}
              label="All statuses"
              icon={<ListFilter className="h-4 w-4 shrink-0" />}
            />
            <StatusIconButton
              value="added"
              activeValue={statusFilter}
              onChange={onStatusFilterChange}
              label="Added to cart"
              icon={<CheckCircle2 className="h-4 w-4 shrink-0" />}
            />
            <StatusIconButton
              value="attempted"
              activeValue={statusFilter}
              onChange={onStatusFilterChange}
              label="Attempted add"
              icon={<CircleDashed className="h-4 w-4 shrink-0" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
