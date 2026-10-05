import {
  type API_KrogerProdRes,
  type API_KrogerSearch,
  type KrogerProduct,
} from "~/app/kroger/model";
import { normalizeKrogerSearchTerm } from "~/app/kroger/searchQuery";
import { TRPCError } from "@trpc/server";
import { krogerRequest, logKroger } from "./krogerAuth";

export async function doKrogerSearch(
  postData: API_KrogerSearch,
  userId: string,
): Promise<KrogerProduct[]> {
  const normalizedFilterTerm = normalizeKrogerSearchTerm(postData.filterTerm);
  const url = `https://api.kroger.com/v1/products?${new URLSearchParams({
    "filter.term": normalizedFilterTerm,
    "filter.locationId": "02100086",
    "filter.fulfillment": "ais",
  }).toString()}`;

  try {
    // Dev flag: simulate a 500 to verify client-side error handling
    if (process.env.KROGER_SIMULATE_SEARCH_500 === "true") {
      throw new Error(
        "Kroger search failed: simulated 500. Please try again later.",
      );
    }
    const response = await krogerRequest(userId, url);

    const search = (await response.json()) as API_KrogerProdRes;

    if (response.ok) {
      return search.data;
    }

    throw new Error("Kroger search failed. Please try again later.");
  } catch (error: unknown) {
    if (error instanceof TRPCError) throw error;
    logKroger("error", "Kroger search failed", { userId });
    // Re-throw to allow callers to handle and surface to the user
    throw new Error("Kroger search failed. Please try again later.");
  }
}
