import { type HydrationBoundaryProps } from "@tanstack/react-query";
import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";
import { appRouter, type AppRouter } from "~/server/api/root";
import { createContext } from "./server";

let helperSingleton: ReturnType<
  typeof createServerSideHelpers<AppRouter>
> | null = null;

// these needs to be a function to ensure it's called after the request context is created
export async function helpers() {
  if (!helperSingleton) {
    helperSingleton = createServerSideHelpers({
      router: appRouter,
      ctx: await createContext(),
      transformer: superjson,
    });
  }
  return helperSingleton;
}

export async function getTrpcHelperState() {
  // this helpers just cleans up the layout HydrationBoundary
  const actualHelpers = await helpers();

  if (!actualHelpers) {
    throw new Error("No helpers found");
  }

  const dehyrated = actualHelpers.dehydrate();

  // types are messy, but json is legit
  const trpcState = (dehyrated as any).json;

  return trpcState as HydrationBoundaryProps["state"];
}
