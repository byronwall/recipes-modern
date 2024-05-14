import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { appRouter, createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(() => {
  console.warn("create context");
  try {
    const heads = new Headers(headers());
    heads.set("x-trpc-source", "rsc");

    return createTRPCContext({
      headers: heads,
    });
  } catch (e) {
    console.error(e);
    return createTRPCContext({
      headers: new Headers(),
    });
  }
});

export const helpers = createServerSideHelpers({
  router: appRouter,
  ctx: await createContext(),
  transformer: superjson, // optional - adds superjson serialization
});

const api = createCaller(createContext);
