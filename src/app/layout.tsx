import "~/styles/globals.css";

import { Inter } from "next/font/google";

import { HydrationBoundary } from "@tanstack/react-query";
import { getTrpcHelperState } from "~/trpc/helpers";
import { TRPCReactProvider } from "~/trpc/react";
import { MainPageWithNav } from "../components/MainPageWithNav";
import { TailwindIndicator } from "./TailwindIndicator";
import { GlobalAddTagDialog } from "~/components/GlobalAddTagDialog";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Family Recipes",
  description: "Made with love",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // types are a mess but .json is required for this to work
  // might be due to transformer = superjson?

  // verify we have a request context

  const trpcState = await getTrpcHelperState();

  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable} mb-10`}>
        <TRPCReactProvider>
          <HydrationBoundary state={trpcState}>
            <MainPageWithNav>{children}</MainPageWithNav>
          </HydrationBoundary>
          <GlobalAddTagDialog />
        </TRPCReactProvider>

        <TailwindIndicator />
      </body>
    </html>
  );
}
