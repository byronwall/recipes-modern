import {
  type API_KrogerProdRes,
  type API_KrogerSearch,
  type KrogerProduct,
} from "~/app/kroger/model";
import { normalizeKrogerSearchTerm } from "~/app/kroger/searchQuery";
import { env } from "~/env";
import { db } from "./db";
import { getKrogerAccessToken } from "./api/routers/getKrogerAccessToken";

export async function doOAuth(
  isRefresh: boolean,
  userId?: string,
  accessCode?: string,
): Promise<boolean> {
  const config = {
    client: {
      id: env.KROGER_CLIENT_ID,
      secret: env.KROGER_CLIENT_SECRET,
    },
    auth: {
      tokenHost: "https://api.kroger.com/v1/connect/oauth2/token",
    },
  };

  const code = Buffer.from(
    `${config.client.id}:${config.client.secret}`,
  ).toString("base64");

  console.log("doOAuth", { isRefresh, accessCode, userId, code });

  const dataObj: any = {
    scope: "product.compact cart.basic:write",
    grant_type: isRefresh ? "refresh_token" : "authorization_code",
  };

  if (isRefresh) {
    // hit the db for the refresh token
    const user = await db.userExtras.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!user) {
      return false;
    }

    dataObj.refresh_token = user.krogerUserRefreshToken;
  } else {
    dataObj.code = accessCode;
    dataObj.redirect_uri = env.NEXT_REDIRECT_URI;
  }

  const postConfig = {
    method: "POST",
    body: new URLSearchParams(dataObj).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${code}`,
    },
  };

  // TODO: I think this is working, but I need to change the redirect URL to test

  console.log("postConfig", postConfig);

  try {
    const response = await fetch(config.auth.tokenHost, postConfig);
    const postRes = await response.json();

    console.log(
      "made req, got res",
      postRes,
      "****",
      response.ok,
      "****",
      response.status,
    );

    if (response.ok && userId) {
      await db.userExtras.upsert({
        where: {
          userId: userId,
        },
        update: {
          krogerUserAccessToken: postRes.access_token,
          krogerUserRefreshToken: postRes.refresh_token,
        },
        create: {
          userId: userId,
          krogerUserAccessToken: postRes.access_token,
          krogerUserRefreshToken: postRes.refresh_token,
        },
      });

      console.log("data", postRes);

      return true;
    }
  } catch (error) {
    console.error(error);
  }

  return false;
}

export async function doKrogerSearch(
  postData: API_KrogerSearch,
  userId: string,
  shouldRetry: boolean,
): Promise<KrogerProduct[]> {
  const normalizedFilterTerm = normalizeKrogerSearchTerm(postData.filterTerm);
  const url = encodeURI(
    `https://api.kroger.com/v1/products?filter.term=${normalizedFilterTerm}&filter.locationId=02100086&filter.fulfillment=ais`,
  );

  const accessToken = await getKrogerAccessToken(userId);

  try {
    console.log(
      "****** attempting search, url",
      url,
      "accessToken",
      accessToken,
    );
    // Dev flag: simulate a 500 to verify client-side error handling
    if (process.env.KROGER_SIMULATE_SEARCH_500 === "true") {
      throw new Error(
        "Kroger search failed: simulated 500. Please try again later.",
      );
    }
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const search = (await response.json()) as API_KrogerProdRes;

    console.log("search", { response, search });

    if (response.ok) {
      console.log("data", search);
      return search.data;
    }

    if (response.status === 401 && shouldRetry) {
      console.log("401 error");
      const isAuth = await doOAuth(true, userId, undefined);

      if (isAuth) {
        return await doKrogerSearch(postData, userId, false);
      }
    }

    // For non-OK responses (including 5xx), throw an error so the client can surface it
    const err: any = search as any;
    const errCode = err?.errors?.code ? ` (${err.errors.code})` : "";
    const errReason =
      err?.errors?.reason || response.statusText || "Unknown error";
    throw new Error(
      `Kroger search failed: ${errReason}${errCode}. Please try again later.`,
    );
  } catch (error: any) {
    console.error(error, "**** error on search");
    // Re-throw to allow callers to handle and surface to the user
    const message =
      error instanceof Error
        ? error.message
        : "Kroger search failed. Please try again later.";
    throw new Error(message);
  }
}
