"use client";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

export function PurchasesDevActions() {
  const utils = api.useUtils();
  const seedPurchases = api.purchases.seedDevPurchases.useMutation({
    onSuccess: () => utils.purchases.list.invalidate(),
  });

  return (
    <Button
      size="sm"
      variant="secondary"
      isLoading={seedPurchases.isPending}
      onClick={() => seedPurchases.mutate({ count: 12 })}
    >
      Seed purchases
    </Button>
  );
}
