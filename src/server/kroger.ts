import { type API_KrogerSearch, type KrogerProduct } from "~/app/kroger/model";
import { env } from "~/env";
import { db } from "./db";

export async function doOAuth(
  isRefresh: boolean,
  accessCode?: string,
  userId?: string,
): Promise<boolean> {
  const config = {
    client: {
      id: env.NEXT_CLIENT_ID,
      secret: env.CLIENT_SECRET,
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
  shouldRetry: boolean,
): Promise<KrogerProduct[]> {
  const url = encodeURI(
    `https://api.kroger.com/v1/products?filter.term=${postData.filterTerm}&filter.locationId=02100086`,
  );

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.USER_ACCESS_TOKEN}`,
      },
    });
    const search = await response.json();

    if (response.ok) {
      console.log("data", search);
      return search;
    }
  } catch (error: any) {
    console.error(error, "**** error on search");

    if (
      error.response?.data?.error === "API-401: Invalid Access Token" &&
      shouldRetry
    ) {
      const isAuth = await doOAuth(true);

      if (isAuth) {
        return await doKrogerSearch(postData, false);
      }
    }
  }

  return [];
}
