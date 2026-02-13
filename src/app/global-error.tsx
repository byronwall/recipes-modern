"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "~/components/ui/button";

export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { error, reset } = props;

  return (
    <html lang="en">
      <body className="font-sans">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10">
          <section className="w-full rounded-2xl border bg-card/70 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="space-y-2">
                <h1 className="text-xl font-semibold tracking-tight">Application error</h1>
                <p className="text-sm text-muted-foreground">
                  The app failed to render this screen. Use retry to attempt recovery.
                </p>
                <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  {error.message || "Unknown error"}
                  {error.digest ? ` (digest: ${error.digest})` : ""}
                </p>
                <div className="pt-1">
                  <Button type="button" onClick={reset}>
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </body>
    </html>
  );
}
