"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";

export function NavLink(props: {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** Extra path prefixes that should also mark this link active (e.g. `/recipes` for `/`). */
  matchPrefixes?: string[];
}) {
  const { href, children, className, matchPrefixes = [] } = props;

  const pathName = usePathname() ?? "";

  const isActive =
    pathName === href ||
    (href !== "/" && pathName.startsWith(`${href}/`)) ||
    matchPrefixes.some((prefix) => pathName.startsWith(prefix));

  // Keep the active pill visible when the nav scrolls horizontally on phones.
  const linkRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (isActive) {
      linkRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [isActive]);

  return (
    <Link
      ref={linkRef}
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground hover:no-underline",
        {
          "bg-foreground text-background hover:bg-foreground hover:text-background":
            isActive,
        },
        className,
      )}
    >
      {children}
    </Link>
  );
}
