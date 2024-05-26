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
        "px-2 py-1 text-3xl hover:bg-gray-200 hover:no-underline",
        "border-b",
        {
          "border-b-4 border-b-primary": pathName === href,
        },
        className,
      )}
    >
      {children}
    </Link>
  );
}
