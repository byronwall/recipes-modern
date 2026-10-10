"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * Product thumbnail that degrades to a neutral icon tile when the image is
 * missing or fails to load (instead of showing broken-image alt text).
 */
export function ProductImage(props: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const { src, alt, className } = props;
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={cn(
          "flex shrink-0 items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
      >
        <Package className="h-1/2 max-h-5 w-1/2 max-w-5 shrink-0" />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={cn("shrink-0 bg-muted object-contain", className)}
    />
  );
}
