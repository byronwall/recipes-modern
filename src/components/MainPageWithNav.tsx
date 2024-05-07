import Link from "next/link";

export function MainPageWithNav(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <main className="m-auto flex min-h-screen max-w-4xl flex-col items-start gap-4 p-4">
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
      </div>

      {children}
    </main>
  );
}
