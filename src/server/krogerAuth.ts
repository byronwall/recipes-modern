import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "~/env";
import { db } from "./db";

export function logKroger(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, unknown>,
) {
  console[level](JSON.stringify({ event, ...details }));
}

const refreshes = new Map<string, Promise<string>>();
const expiryMargin = 60_000;

function reconnectError() {
  return new TRPCError({
    code: "PRECONDITION_FAILED",
    message: "Reconnect Kroger on the Kroger page, then add this item again.",
  });
}

async function exchangeToken(userId: string, accessCode?: string) {
  const user = accessCode
    ? null
    : await db.userExtras.findUnique({ where: { userId } });
  if (!accessCode && !user?.krogerUserRefreshToken) throw reconnectError();

  const data = new URLSearchParams(
    accessCode
      ? {
          grant_type: "authorization_code",
          code: accessCode,
          redirect_uri: env.NEXT_REDIRECT_URI ?? "",
        }
      : {
          grant_type: "refresh_token",
          refresh_token: user!.krogerUserRefreshToken,
        },
  );
  const grant = accessCode ? "authorization_code" : "refresh_token";
  logKroger("info", "Kroger token exchange started", { userId, grant });
  let response: Response;
  try {
    response = await fetch("https://api.kroger.com/v1/connect/oauth2/token", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${env.KROGER_CLIENT_ID}:${env.KROGER_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: data.toString(),
    });
  } catch {
    logKroger("error", "Kroger token exchange network failure", {
      userId,
      grant,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Kroger is unavailable. Please try again.",
    });
  }

  if (!response.ok) {
    // Log only the allowlisted OAuth error code, never the response body.
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    const oauthError =
      ["invalid_grant", "invalid_client", "invalid_scope"].find(
        (code) => code === body?.error,
      ) ?? "unknown";
    logKroger("error", "Kroger token exchange rejected", {
      userId,
      grant,
      status: response.status,
      oauthError,
    });
    if (oauthError === "invalid_grant") {
      if (!accessCode)
        await db.userExtras.updateMany({
          where: {
            userId,
            krogerUserRefreshToken: user!.krogerUserRefreshToken,
          },
          data: {
            krogerUserAccessToken: "",
            krogerUserRefreshToken: "",
            krogerTokenExpiresAt: null,
          },
        });
      throw reconnectError();
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Kroger could not renew your connection. Please try again.",
    });
  }

  const parsed = z
    .object({
      access_token: z.string().min(1),
      refresh_token: z.string().min(1).optional(),
      expires_in: z.number().finite().positive(),
    })
    .safeParse(await response.json().catch(() => null));
  if (
    !parsed.success ||
    (!parsed.data.refresh_token && !user?.krogerUserRefreshToken)
  ) {
    logKroger("error", "Kroger token response invalid", { userId, grant });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Kroger could not renew your connection. Please try again.",
    });
  }
  const token = parsed.data;
  const refreshToken = token.refresh_token ?? user!.krogerUserRefreshToken;
  const tokens = {
    krogerUserAccessToken: token.access_token,
    krogerUserRefreshToken: refreshToken,
    krogerTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
  };
  await db.userExtras.upsert({
    where: { userId },
    update: tokens,
    create: { userId, ...tokens },
  });
  logKroger("info", "Kroger token exchange completed", {
    userId,
    grant,
    expiresAt: tokens.krogerTokenExpiresAt.toISOString(),
  });
  return token.access_token;
}

async function refreshToken(
  userId: string,
  rejectedToken?: string,
): Promise<string> {
  const pending = refreshes.get(userId);
  if (pending) return pending;

  const task = (async () => {
    // Another request may have refreshed while this request was in flight.
    const user = await db.userExtras.findUnique({ where: { userId } });
    if (!user?.krogerUserRefreshToken) throw reconnectError();
    const isCurrent =
      user.krogerUserAccessToken &&
      user.krogerTokenExpiresAt &&
      user.krogerTokenExpiresAt.getTime() > Date.now() + expiryMargin;
    if (isCurrent && user.krogerUserAccessToken !== rejectedToken) {
      return user.krogerUserAccessToken;
    }
    return exchangeToken(userId);
  })();
  refreshes.set(userId, task);
  try {
    return await task;
  } finally {
    refreshes.delete(userId);
  }
}

export async function getKrogerAccessToken(userId: string): Promise<string> {
  const user = await db.userExtras.findUnique({ where: { userId } });
  if (!user?.krogerUserRefreshToken) throw reconnectError();
  if (
    user.krogerUserAccessToken &&
    user.krogerTokenExpiresAt &&
    user.krogerTokenExpiresAt.getTime() > Date.now() + expiryMargin
  ) {
    return user.krogerUserAccessToken;
  }
  return refreshToken(userId);
}

export async function doOAuth(
  userId: string,
  accessCode: string,
): Promise<boolean> {
  try {
    await exchangeToken(userId, accessCode);
    return true;
  } catch (error) {
    logKroger("error", "Kroger authorization failed", {
      userId,
      code: error instanceof TRPCError ? error.code : "INTERNAL_SERVER_ERROR",
    });
    return false;
  }
}

export async function krogerRequest(
  userId: string,
  url: string,
  init: RequestInit = {},
  requestId = crypto.randomUUID(),
): Promise<Response> {
  const endpoint = new URL(url).pathname;
  const started = Date.now();
  const send = async (token: string) => {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...init, headers, cache: "no-store" });
  };
  logKroger("info", "Kroger request started", { requestId, userId, endpoint });
  try {
    const token = await getKrogerAccessToken(userId);
    let response = await send(token);
    if (response.status === 401) {
      logKroger("warn", "Kroger request refreshing after 401", {
        requestId,
        userId,
        endpoint,
      });
      await response.body?.cancel();
      response = await send(await refreshToken(userId, token));
    }
    logKroger("info", "Kroger request completed", {
      requestId,
      userId,
      endpoint,
      status: response.status,
      durationMs: Date.now() - started,
    });
    if (response.status === 401) throw reconnectError();
    return response;
  } catch (error) {
    logKroger("error", "Kroger request failed", {
      requestId,
      userId,
      endpoint,
      durationMs: Date.now() - started,
      code:
        error instanceof TRPCError ? error.code : "NETWORK_OR_INTERNAL_ERROR",
    });
    throw error;
  }
}
