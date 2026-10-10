"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useShoppingListActions } from "../useShoppingListActions";
import { SimpleAlertDialog } from "~/components/SimpleAlertDialog";
import { TooltipButton } from "~/components/ui/tooltip-button";

export function ShoppingRecipeItem(props: { id: string; name: string }) {
  const { id, name } = props;

  const { handleDeleteRecipe } = useShoppingListActions();

  return (
    <span className="inline-flex max-w-full items-center gap-0.5 rounded-full bg-accent/60 py-0.5 pl-3 pr-1 text-xs font-medium">
      <Link
        href={`/recipes/${id}`}
        className="truncate hover:text-primary hover:no-underline"
      >
        {name}
      </Link>
      <TooltipButton content="Remove recipe from list">
        <span className="inline-flex">
          <SimpleAlertDialog
            trigger={
              <button
                type="button"
                aria-label={`Remove ${name} from list`}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </button>
            }
            title={`Remove ${name}?`}
            description={
              "This will remove all items for this recipe from your shopping list."
            }
            confirmText={"Remove"}
            cancelText={"Cancel"}
            onConfirm={async () => {
              await handleDeleteRecipe(Number(id));
            }}
          />
        </span>
      </TooltipButton>
    </span>
  );
}
