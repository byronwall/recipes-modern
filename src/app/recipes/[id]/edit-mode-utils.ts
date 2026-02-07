import { cn } from "~/lib/utils";

export function dirtyInputClass(isDirty: boolean) {
  return cn(
    "transition-colors hover:bg-primary/10 focus-visible:bg-primary/10",
    isDirty &&
      "border border-primary/30 shadow-[0_1px_0_0_hsl(var(--primary)/0.2)]",
  );
}
