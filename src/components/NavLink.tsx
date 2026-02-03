"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";

export function NavLink(props: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { href, children, className } = props;

  const pathName = usePathname();

  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1 text-base font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground hover:no-underline",
        {
          "bg-foreground text-background hover:bg-foreground hover:text-background":
            pathName === href,
        },
        className,
      )}
    >
      {children}
    </Link>
  );
}
