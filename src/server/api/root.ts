import { recipeRouter } from "~/server/api/routers/recipe";
import { userRouter } from "./routers/userRouter";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { shoppingListRouter } from "./routers/shoppingListRouter";
import { krogerRouter } from "./routers/krogerRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  recipe: recipeRouter,
  user: userRouter,
  shoppingList: shoppingListRouter,
  kroger: krogerRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
