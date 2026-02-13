"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import { Button } from "~/components/ui/button";

type RuntimeErrorEntry = {
  id: number;
  source: "error" | "unhandledrejection";
  message: string;
  stack?: string;
  timestamp: string;
};

const MAX_ERRORS = 20;

function toErrorEntry(
  source: RuntimeErrorEntry["source"],
  value: unknown,
): RuntimeErrorEntry {
  const error = value instanceof Error ? value : null;
  return {
    id: Date.now() + Math.random(),
    source,
    message: error?.message ?? String(value ?? "Unknown runtime error"),
    stack: error?.stack,
    timestamp: new Date().toISOString(),
  };
}

export function RuntimeErrorOverlay() {
  const [errors, setErrors] = useState<RuntimeErrorEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const entry = toErrorEntry("error", event.error ?? event.message);
      setErrors((prev) => [entry, ...prev].slice(0, MAX_ERRORS));
      setIsOpen(true);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const entry = toErrorEntry("unhandledrejection", event.reason);
      setErrors((prev) => [entry, ...prev].slice(0, MAX_ERRORS));
      setIsOpen(true);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[120]">
        <Button
          type="button"
          variant="destructive"
          className="gap-2 shadow-lg"
          onClick={() => setIsOpen((current) => !current)}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {errors.length} runtime {errors.length === 1 ? "error" : "errors"}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[130] bg-black/55 p-4">
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col rounded-2xl border bg-background/95 shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="text-lg font-semibold">Runtime Errors</h2>
                <p className="text-xs text-muted-foreground">
                  Captured by window error + unhandled rejection listeners
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setErrors([])}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close runtime errors overlay"
                >
                  <X className="h-4 w-4 shrink-0" />
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-auto p-4">
              {errors.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-xl border bg-card/80 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border px-2 py-0.5">
                      {entry.source}
                    </span>
                    <span>{entry.timestamp}</span>
                  </div>
                  <p className="mt-2 font-medium text-destructive">{entry.message}</p>
                  {entry.stack && (
                    <pre className="mt-2 overflow-x-auto rounded-md border bg-muted/40 p-2 text-xs leading-relaxed text-muted-foreground">
                      {entry.stack}
                    </pre>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
