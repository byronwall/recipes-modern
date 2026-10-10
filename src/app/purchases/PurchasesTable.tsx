import { format, formatDistanceToNowStrict } from "date-fns";
import { CircleDashed } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "~/app/list/formatMoney";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { ProductImage } from "~/components/ProductImage";
import { TooltipButton } from "~/components/ui/tooltip-button";
import { type RouterOutputs } from "~/trpc/react";

type PurchaseListItem = RouterOutputs["purchases"]["list"][number];

function getKrogerProductHref(purchase: PurchaseListItem) {
  const upc = (purchase.krogerSku ?? "").trim();
  if (upc.length > 0) {
    return `https://www.kroger.com/p/x/${upc}`;
  }

  const productId = (purchase.krogerProductId ?? "").trim();
  if (productId.length > 0) {
    return `https://www.kroger.com/search?query=${encodeURIComponent(productId)}`;
  }

  return null;
}

function getItemIdentifier(purchase: PurchaseListItem) {
  const sku = (purchase.krogerSku ?? "").trim();
  if (sku.length > 0) return sku;

  const productId = (purchase.krogerProductId ?? "").trim();
  return productId.length > 0 ? productId : null;
}

function PurchaseRow(props: { purchase: PurchaseListItem }) {
  const { purchase } = props;
  const linkedRecipe = purchase.linkedRecipe;
  const krogerProductHref = getKrogerProductHref(purchase);
  const identifier = getItemIdentifier(purchase);
  const category = purchase.krogerCategories?.[0];
  const itemMeta = [purchase.krogerBrand, purchase.itemSize, category]
    .filter(Boolean)
    .join(" · ");
  const createdAt = new Date(purchase.createdAt);

  return (
    <li className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 px-4 py-3 md:grid-cols-[3rem_minmax(0,1fr)_5rem_7rem_7rem] md:items-center">
      <ProductImage
        src={purchase.imageUrl}
        alt={purchase.krogerName}
        className="h-12 w-12 rounded-lg"
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {krogerProductHref ? (
            <a
              href={krogerProductHref}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold leading-snug hover:text-primary hover:no-underline"
            >
              {purchase.krogerName}
            </a>
          ) : (
            <span className="text-sm font-semibold leading-snug">
              {purchase.krogerName}
            </span>
          )}
          {!purchase.wasAddedToCart && (
            <TooltipButton content="This item was not sent to your Kroger cart">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                <CircleDashed className="h-3 w-3 shrink-0" />
                Not in cart
              </span>
            </TooltipButton>
          )}
        </div>
        {itemMeta && (
          <div className="mt-0.5 text-xs text-muted-foreground">{itemMeta}</div>
        )}
        {(purchase.ingredientName || linkedRecipe) && (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {purchase.ingredientName ? (
              <span>For {purchase.ingredientName}</span>
            ) : null}
            {purchase.ingredientName && linkedRecipe ? " in " : null}
            {linkedRecipe ? (
              <Link
                href={`/recipes/${linkedRecipe.id}`}
                className="font-medium text-foreground hover:text-primary hover:no-underline"
              >
                {linkedRecipe.name}
              </Link>
            ) : null}
          </div>
        )}
        {purchase.note && (
          <div className="mt-0.5 text-xs text-destructive">
            Note: {purchase.note}
          </div>
        )}
        {identifier && (
          <div className="mt-0.5 hidden font-mono text-[11px] text-muted-foreground/70 md:block">
            {identifier}
          </div>
        )}
      </div>

      <div className="hidden text-right text-sm tabular-nums md:block">
        ×{purchase.quantity}
      </div>

      <div className="text-right tabular-nums">
        <div className="text-sm font-semibold">
          {formatMoney(purchase.price * purchase.quantity)}
        </div>
        <div className="text-xs text-muted-foreground">
          {purchase.quantity > 1
            ? `${purchase.quantity} × ${formatMoney(purchase.price)}`
            : "each"}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground md:hidden">
          {formatDistanceToNowStrict(createdAt, { addSuffix: true })}
        </div>
      </div>

      <TooltipButton content={format(createdAt, "PPp")}>
        <div className="hidden text-right text-xs text-muted-foreground md:block">
          {formatDistanceToNowStrict(createdAt, { addSuffix: true })}
        </div>
      </TooltipButton>
    </li>
  );
}

export function PurchasesTable(props: {
  purchases: PurchaseListItem[];
  filteredCount: number;
  safePage: number;
  pageSize: number;
  totalPages: number;
  onPageSizeChange: (value: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) {
  const {
    purchases,
    filteredCount,
    safePage,
    pageSize,
    totalPages,
    onPageSizeChange,
    onPreviousPage,
    onNextPage,
  } = props;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card/70 shadow-sm">
      <div className="hidden grid-cols-[3rem_minmax(0,1fr)_5rem_7rem_7rem] gap-x-3 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground md:grid">
        <span className="col-span-2">Item</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Total</span>
        <span className="text-right">When</span>
      </div>
      <ul className="divide-y">
        {purchases.map((purchase) => (
          <PurchaseRow key={purchase.id} purchase={purchase} />
        ))}
      </ul>

      {filteredCount === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No purchases match your filters.
        </div>
      )}

      {filteredCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm">
          <div className="text-muted-foreground">
            {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredCount)} of {filteredCount}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger
                aria-label="Items per page"
                className="h-8 w-[110px] text-xs"
              >
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
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreviousPage}
                  disabled={safePage === 1}
                >
                  Prev
                </Button>
                <span className="px-1 text-xs text-muted-foreground">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextPage}
                  disabled={safePage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
