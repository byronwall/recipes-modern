import Link from "next/link";
import { ChefHat, LogOut } from "lucide-react";
import { getServerAuthSession } from "~/server/auth";
import { NavLink } from "./NavLink";

const NAV_ITEMS = [
  { href: "/", label: "Recipes", matchPrefixes: ["/recipes"] },
  { href: "/plan", label: "Plan" },
  { href: "/list", label: "List" },
  { href: "/purchases", label: "Purchases" },
  { href: "/ingredients", label: "Ingredients" },
  { href: "/ai/recipe", label: "AI" },
  { href: "/kroger", label: "Kroger" },
];

export async function MainPageWithNav(props: { children: React.ReactNode }) {
  const { children } = props;

  const session = await getServerAuthSession();

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-semibold tracking-tight hover:no-underline"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ChefHat className="h-4 w-4 shrink-0" />
            </span>
            <span className={session ? "hidden lg:inline" : "inline"}>
              Family Recipes
            </span>
          </Link>

          {session && (
            <>
              <nav
                aria-label="Main"
                className="-my-2 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-2 pr-4 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] md:pr-0 md:[mask-image:none] lg:ml-4 [&::-webkit-scrollbar]:hidden"
              >
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    matchPrefixes={item.matchPrefixes}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <Link
                href="/api/auth/signout"
                aria-label="Sign out"
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground hover:no-underline"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Sign out</span>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        {children}
      </main>
    </>
  );
}
