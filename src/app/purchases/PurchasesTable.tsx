import { formatDistanceToNowStrict } from "date-fns";
import { CheckCircle2, CircleDashed } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "~/app/list/formatMoney";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
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

function PurchaseStatusIcon(props: { wasAddedToCart: boolean }) {
  const { wasAddedToCart } = props;

  return (
    <TooltipButton content={wasAddedToCart ? "Added to cart" : "Attempted add"}>
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
          wasAddedToCart
            ? "bg-emerald-100 text-emerald-700"
            : "bg-muted text-muted-foreground"
        }`}
        aria-label={wasAddedToCart ? "Added to cart" : "Attempted add"}
      >
        {wasAddedToCart ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <CircleDashed className="h-3.5 w-3.5 shrink-0" />
        )}
      </span>
    </TooltipButton>
  );
}

function PurchaseTableRow(props: { purchase: PurchaseListItem }) {
  const { purchase } = props;
  const linkedRecipe = purchase.linkedRecipe;
  const krogerProductHref = getKrogerProductHref(purchase);
  const identifier = getItemIdentifier(purchase);
  const itemMeta = [purchase.krogerBrand, identifier].filter(Boolean).join(" • ");

  return (
    <TableRow key={purchase.id}>
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <img
            src={purchase.imageUrl}
            alt={purchase.krogerName}
            className="h-12 w-12 rounded-md object-cover"
          />
          <div>
            {krogerProductHref ? (
              <a
                href={krogerProductHref}
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline-offset-2 hover:underline"
              >
                {purchase.krogerName}
              </a>
            ) : (
              <div className="font-semibold">{purchase.krogerName}</div>
            )}
            <div className="text-xs text-muted-foreground">{itemMeta}</div>
            {purchase.ingredientName && (
              <div className="text-xs text-muted-foreground">
                From ingredient: {purchase.ingredientName}
              </div>
            )}
            {linkedRecipe && (
              <div className="text-xs text-muted-foreground">
                Recipe:{" "}
                <Link
                  href={`/recipes/${linkedRecipe.id}`}
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  {linkedRecipe.name}
                </Link>
              </div>
            )}
            {purchase.note && (
              <div className="text-xs text-destructive">Note: {purchase.note}</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="py-3 text-center">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-base font-semibold leading-tight text-foreground">
            x{purchase.quantity}
          </span>
          <span className="text-xs text-muted-foreground">
            {purchase.itemSize ?? "—"}
          </span>
        </div>
      </TableCell>
      <TableCell className="w-[10rem] py-3 text-right text-sm">
        <div className="whitespace-nowrap font-semibold">
          {formatMoney(purchase.price)} / ea
        </div>
        <div className="text-xs text-muted-foreground">
          Total {formatMoney(purchase.price * purchase.quantity)}
        </div>
      </TableCell>
      <TableCell className="py-3 text-center text-sm">
        <div className="inline-flex">
          <PurchaseStatusIcon wasAddedToCart={purchase.wasAddedToCart} />
        </div>
      </TableCell>
      <TableCell className="py-3 text-center text-xs text-muted-foreground">
        {purchase.krogerCategories?.[0] ?? "—"}
      </TableCell>
      <TableCell className="w-[8.5rem] py-3 text-right text-[11px] leading-tight text-muted-foreground">
        {formatDistanceToNowStrict(new Date(purchase.createdAt), {
          addSuffix: true,
        })}
      </TableCell>
    </TableRow>
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
    <div className="rounded-2xl border bg-card/70 shadow-sm">
      {/*
        Sticky header classes live on each th so they stay pinned during scroll.
      */}
      <Table containerClassName="overflow-visible">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky top-0 z-10 w-[44%] bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
              Item
            </TableHead>
            <TableHead className="sticky top-0 z-10 w-[10rem] bg-card/95 text-center backdrop-blur supports-[backdrop-filter]:bg-card/80">
              Qty / Size
            </TableHead>
            <TableHead className="sticky top-0 z-10 w-[10rem] bg-card/95 text-right backdrop-blur supports-[backdrop-filter]:bg-card/80">
              Price
            </TableHead>
            <TableHead className="sticky top-0 z-10 w-[6rem] bg-card/95 text-center backdrop-blur supports-[backdrop-filter]:bg-card/80">
              Status
            </TableHead>
            <TableHead className="sticky top-0 z-10 w-[11rem] bg-card/95 text-center backdrop-blur supports-[backdrop-filter]:bg-card/80">
              Category
            </TableHead>
            <TableHead className="sticky top-0 z-10 w-[8.5rem] bg-card/95 text-right text-[11px] backdrop-blur supports-[backdrop-filter]:bg-card/80">
              Time
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((purchase) => (
            <PurchaseTableRow key={purchase.id} purchase={purchase} />
          ))}
        </TableBody>
      </Table>

      {filteredCount === 0 && (
        <div className="border-t p-6 text-sm text-muted-foreground">
          No purchases match your filters.
        </div>
      )}

      {filteredCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm">
          <div className="text-muted-foreground">
            Showing {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filteredCount)} of {filteredCount}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
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
                onClick={onPreviousPage}
                disabled={safePage === 1}
              >
                Prev
              </button>
              <span className="px-2 text-xs text-muted-foreground">
                Page {safePage} of {totalPages}
              </span>
              <button
                className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
                onClick={onNextPage}
                disabled={safePage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
