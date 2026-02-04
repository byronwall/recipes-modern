import { helpers } from "~/trpc/helpers";
import { useEnforceAuth } from "../useEnforceAuth";
import { PurchasesList } from "./PurchasesList";
import { H2 } from "~/components/ui/typography";
import { env } from "~/env";
import { PurchasesDevActions } from "./PurchasesDevActions";

export default async function PurchasesPage() {
  await useEnforceAuth();

  await (await helpers()).purchases.list.prefetch();

  const skipAddToCart = env.NEXT_SKIP_ADD_TO_CART === "true";
  const showDevActions = process.env.NODE_ENV === "development";

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <H2>Purchases</H2>
        {showDevActions && <PurchasesDevActions />}
      </div>
      {skipAddToCart && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
          Actually adding to the Kroger cart is disabled. Purchases are being
          skipped due to NEXT_SKIP_ADD_TO_CART=true
        </div>
      )}
      <PurchasesList />
    </div>
  );
}
