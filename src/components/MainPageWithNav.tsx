import Link from "next/link";
import { getServerAuthSession } from "~/server/auth";

export async function MainPageWithNav(props: { children: React.ReactNode }) {
  const { children } = props;

  const session = await getServerAuthSession();

  return (
    <main className="m-auto flex min-h-screen max-w-4xl flex-col items-start gap-4 p-4">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-end gap-4 font-bold tracking-tight">
          <Link href="/" className="text-4xl">
            recipes
          </Link>
          <Link href="/plan" className="text-3xl">
            plan
          </Link>
          <Link href="/list" className="text-3xl">
            list
          </Link>
          {/* kroger link */}
          <Link href="/kroger" className="text-3xl">
            kroger
          </Link>
        </div>
        {/* sign out */}
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
