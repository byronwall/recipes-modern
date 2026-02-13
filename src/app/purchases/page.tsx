import { helpers } from "~/trpc/helpers";
import { useEnforceAuth } from "../useEnforceAuth";
import { PurchasesList } from "./PurchasesList";
import { H1 } from "~/components/ui/typography";
import { env } from "~/env";
import { PurchasesDevActions } from "./PurchasesDevActions";
import { PageHeaderCard } from "~/components/layout/PageHeaderCard";

export default async function PurchasesPage() {
  await useEnforceAuth();

  await (await helpers()).purchases.list.prefetch();

  const skipAddToCart = env.NEXT_SKIP_ADD_TO_CART === "true";
  const showDevActions = process.env.NODE_ENV === "development";

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeaderCard className="border-0 bg-transparent p-0 shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col">
            <H1 className="leading-tight">Purchases</H1>
          </div>
          {showDevActions && <PurchasesDevActions />}
        </div>
      </PageHeaderCard>
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
