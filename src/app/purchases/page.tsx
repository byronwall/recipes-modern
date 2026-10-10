import { helpers } from "~/trpc/helpers";
import { useEnforceAuth } from "../useEnforceAuth";
import { PurchasesList } from "./PurchasesList";
import { env } from "~/env";
import { PurchasesDevActions } from "./PurchasesDevActions";
import { PageHeader } from "~/components/layout/PageHeader";
import { Info } from "lucide-react";

export default async function PurchasesPage() {
  await useEnforceAuth();

  await (await helpers()).purchases.list.prefetch();

  const skipAddToCart = env.NEXT_SKIP_ADD_TO_CART === "true";
  const showDevActions = process.env.NODE_ENV === "development";

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Purchases"
        description="Items you've sent to your Kroger cart."
        actions={showDevActions ? <PurchasesDevActions /> : undefined}
      />
      {skipAddToCart && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Cart sync is off. Purchases are recorded here but not sent to Kroger
            (<code className="text-xs">NEXT_SKIP_ADD_TO_CART=true</code>
            ).
          </span>
        </div>
      )}
      <PurchasesList />
    </div>
  );
}
