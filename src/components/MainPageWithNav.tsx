import { H1 } from "~/components/ui/typography";
import Link from "next/link";

export function MainPageWithNav(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4">
      <Link href="/">
        <H1>Recipes Modern</H1>
      </Link>

      {children}
    </main>
  );
}
