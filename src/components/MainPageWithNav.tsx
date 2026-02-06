import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";
import { NavLink } from "./NavLink";

export async function MainPageWithNav(props: { children: React.ReactNode }) {
  const { children } = props;

  const session = await getServerAuthSession();

  return (
    <main className="m-auto flex min-h-screen max-w-4xl flex-col items-start gap-4 p-4">
      <div
        className={`flex w-full items-center ${session ? "justify-between" : "justify-center"}`}
      >
        <div className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight">
          {session ? (
            <>
              <NavLink href="/" className="text-lg">
                recipes
              </NavLink>
              <NavLink href="/plan" className="text-lg">
                plan
              </NavLink>
              <NavLink href="/list" className="text-lg">
                list
              </NavLink>
              <NavLink href="/purchases" className="text-lg">
                purchases
              </NavLink>
              <NavLink href="/ingredients" className="text-lg">
                ingredients
              </NavLink>
              <NavLink href="/ai/recipe" className="text-lg">
                ai
              </NavLink>
              <NavLink href="/kroger" className="text-lg">
                kroger
              </NavLink>
            </>
          ) : (
            <div className="px-3 py-1 text-lg font-semibold">
              family recipes
            </div>
          )}
        </div>

        {session && (
          <Link
            href="/api/auth/signout"
            className="rounded-full px-3 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            sign out
          </Link>
        )}
      </div>

      {children}
    </main>
  );
}
