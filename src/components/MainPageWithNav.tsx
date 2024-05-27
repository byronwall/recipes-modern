import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";
import { NavLink } from "./NavLink";

export async function MainPageWithNav(props: { children: React.ReactNode }) {
  const { children } = props;

  const session = await getServerAuthSession();

  return (
    <main className="m-auto flex min-h-screen max-w-4xl flex-col items-start gap-4 p-4">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-wrap items-end gap-6 font-bold tracking-tight">
          <NavLink href="/" className="text-4xl">
            recipes
          </NavLink>
          <NavLink href="/plan">plan</NavLink>

          <NavLink href="/list">list</NavLink>

          <NavLink href="/kroger">kroger</NavLink>
        </div>

        {session && (
          <Link href="/api/auth/signout" className="text-lg">
            sign out
          </Link>
        )}
      </div>

      {children}
    </main>
  );
}
