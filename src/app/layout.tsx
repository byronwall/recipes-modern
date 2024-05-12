import "~/styles/globals.css";

import { Inter } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { MainPageWithNav } from "../components/MainPageWithNav";
import { HydrationBoundary } from "@tanstack/react-query";
import { helpers } from "~/trpc/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Family Recipes",
  description: "Made with love",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // types are a mess but .json is required for this to work
  // might be due to transformer = superjson?
  const trpcState = (helpers.dehydrate() as any).json;

  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable}`}>
        <TRPCReactProvider>
          <HydrationBoundary state={trpcState}>
            <MainPageWithNav>{children}</MainPageWithNav>
          </HydrationBoundary>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
