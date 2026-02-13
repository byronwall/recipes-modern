"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "~/components/ui/button";

export default function ErrorPage(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { error, reset } = props;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <section className="rounded-2xl border bg-card/70 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              The page hit an unexpected error. You can retry now or refresh.
            </p>
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {error.message || "Unknown error"}
              {error.digest ? ` (digest: ${error.digest})` : ""}
            </p>
            <div className="pt-1">
              <Button type="button" onClick={reset}>
                Try again
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
