// @ts-nocheck -- Load application TypeScript with the installed compiler.
// pnpm --pm-on-fail=ignore exec node scripts/test-kroger.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(
    this,
    name.startsWith("~/") ? path.join(root, "src", name.slice(2)) : name,
    ...args,
  );
};
const loadJs = Module._extensions[".js"];
function loadSource(module, filename) {
  if (!filename.startsWith(path.join(root, "src")))
    return loadJs(module, filename);
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
}
Module._extensions[".ts"] = loadSource;
Module._extensions[".tsx"] = loadSource;
Module._extensions[".js"] = loadSource;

let user, purchases, bought, requests, logs;
const db = {
  userExtras: {
    findUnique: async () => user && { ...user },
    upsert: async ({ update }) => {
      user = { ...user, ...update };
    },
    updateMany: async ({ where, data }) => {
      if (user?.krogerUserRefreshToken === where.krogerUserRefreshToken)
        Object.assign(user, data);
    },
  },
  shoppingList: {
    findUniqueOrThrow: async () => ({ ingredientId: null, recipeId: null }),
    update: async () => {
      bought = true;
    },
  },
  krogerPurchase: {
    create: async ({ data }) => {
      purchases.push(data);
      return { id: purchases.length };
    },
    update: async ({ where, data }) => {
      Object.assign(purchases[where.id - 1], data);
    },
  },
};
require.cache[path.join(root, "src/server/db.ts")] = { exports: { db } };
require.cache[path.join(root, "src/env.js")] = {
  exports: {
    env: {
      KROGER_CLIENT_ID: "client-secret-fixture",
      KROGER_CLIENT_SECRET: "secret-fixture",
      NEXT_REDIRECT_URI: "https://example.test/kroger/auth",
      NEXT_SKIP_ADD_TO_CART: "false",
    },
  },
};
require.cache[path.join(root, "src/server/auth.ts")] = {
  exports: {
    getServerAuthSession: () => {
      throw new Error("No real sessions");
    },
  },
};
const {
  krogerRequest,
  doOAuth,
  getKrogerAccessToken,
} = require("../src/server/krogerAuth.ts");
const { krogerRouter } = require("../src/server/api/routers/krogerRouter.ts");
const { doKrogerSearch } = require("../src/server/kroger.ts");
const { krogerPurchaseNote } = require("../src/lib/krogerPurchaseNote.ts");
const originalFetch = global.fetch;
const originalConsole = {
  info: console.info,
  warn: console.warn,
  error: console.error,
};
for (const level of Object.keys(originalConsole))
  console[level] = (...args) => logs.push(args);
function reset(expiry = null) {
  user = {
    krogerUserAccessToken: "old-access",
    krogerUserRefreshToken: "old-refresh",
    krogerTokenExpiresAt: expiry,
  };
  purchases = [];
  bought = false;
  requests = [];
  logs = [];
}
function tokenResponse(extra = {}) {
  return Response.json({
    access_token: "new-access",
    refresh_token: "new-refresh",
    expires_in: 1800,
    ...extra,
  });
}
function mockFetch(handler) {
  global.fetch = async (url, init) => {
    assert.equal(
      init.cache,
      "no-store",
      "Authenticated requests cannot use Next fetch cache",
    );
    requests.push({ url, init });
    return handler(url, init);
  };
}
const cartUrl = "https://api.kroger.com/v1/cart/add";
const ctx = {
  db,
  headers: new Headers(),
  session: { user: { id: "test-user" }, expires: "" },
};
const cart = krogerRouter.createCaller(ctx);
const input = {
  items: [{ upc: "123", quantity: 2 }],
  listItemId: 1,
  purchaseDetails: {
    sku: "123",
    productId: "123",
    name: "Test item",
    quantity: 2,
    size: "1 lb",
  },
};
(async () => {
  reset();
  mockFetch(async (url) => {
    if (url.includes("oauth2")) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return tokenResponse();
    }
    return new Response(null, { status: 204 });
  });
  await Promise.all(
    Array.from({ length: 10 }, () =>
      krogerRequest("test-user", cartUrl, {
        method: "PUT",
        body: '{"items":[]}',
      }),
    ),
  );
  assert.equal(requests.filter((r) => r.url.includes("oauth2")).length, 1);
  assert.equal(requests.filter((r) => r.url === cartUrl).length, 10);
  assert.ok(
    requests
      .filter((r) => r.url === cartUrl)
      .every(
        (r) => r.init.headers.get("Authorization") === "Bearer new-access",
      ),
  );
  assert.ok(user.krogerTokenExpiresAt > new Date());
  assert.ok(!JSON.stringify(logs).includes("new-access"));
  assert.ok(!JSON.stringify(logs).includes("old-refresh"));
  assert.ok(!JSON.stringify(logs).includes("secret-fixture"));

  reset(new Date(Date.now() + 1800_000));
  mockFetch(async (url, init) => {
    if (url.includes("oauth2")) return tokenResponse();
    if (init.headers.get("Authorization") === "Bearer old-access") {
      // The second 401 arrives after the first refresh has completed.
      if (requests.filter((r) => r.url === cartUrl).length === 2)
        await new Promise((resolve) => setTimeout(resolve, 30));
      return Response.json({ error: "invalid_token" }, { status: 401 });
    }
    return new Response(null, { status: 204 });
  });
  await Promise.all([cart.addToCart(input), cart.addToCart(input)]);
  assert.equal(requests.filter((r) => r.url.includes("oauth2")).length, 1);
  assert.ok(purchases.every((p) => p.wasAddedToCart && !p.note));
  assert.ok(bought);
  assert.ok(
    requests
      .filter((r) => r.url === cartUrl)
      .every((r) => r.init.body === JSON.stringify({ items: input.items })),
  );

  reset();
  mockFetch(() => tokenResponse({ refresh_token: undefined }));
  await getKrogerAccessToken("test-user");
  assert.equal(
    user.krogerUserRefreshToken,
    "old-refresh",
    "Keep the refresh token when Kroger omits its replacement",
  );

  reset();
  mockFetch(() =>
    Response.json({
      access_token: {},
      expires_in: "1800",
      refresh_token: "bad",
    }),
  );
  await assert.rejects(
    cart.addToCart(input),
    (e) => e.code === "INTERNAL_SERVER_ERROR",
  );
  assert.equal(
    user.krogerUserAccessToken,
    "old-access",
    "Never store malformed token data",
  );
  assert.equal(requests.length, 1);

  reset(new Date(Date.now() + 30_000));
  mockFetch((url) =>
    url.includes("oauth2")
      ? tokenResponse()
      : new Response(null, { status: 204 }),
  );
  await cart.addToCart(input);
  assert.ok(requests[0].url.includes("oauth2"), "Refresh before expiry");
  assert.equal(purchases.length, 1);
  assert.equal(purchases[0].wasAddedToCart, true);

  reset();
  mockFetch(() =>
    Response.json(
      {
        error: "invalid_grant",
        error_description: "sensitive raw upstream response",
      },
      { status: 400 },
    ),
  );
  await assert.rejects(
    cart.addToCart(input),
    (e) => e.code === "PRECONDITION_FAILED",
  );
  assert.equal(requests.length, 1);
  assert.equal(bought, false);
  assert.ok(!purchases[0].wasAddedToCart);
  assert.match(purchases[0].note, /Reconnect Kroger/);
  assert.equal(user.krogerUserRefreshToken, "");
  assert.deepEqual(await cart.getKrogerStatus(), { connected: false });
  assert.ok(!JSON.stringify(logs).includes("sensitive raw upstream"));

  reset();
  mockFetch(() => Response.json({ error: "invalid_grant" }, { status: 400 }));
  assert.equal(await doOAuth("test-user", "bad-code"), false);
  assert.equal(
    user.krogerUserRefreshToken,
    "old-refresh",
    "Failed connection callback must not erase an existing connection",
  );

  reset();
  mockFetch(() => Response.json({ error: "invalid_client" }, { status: 401 }));
  await assert.rejects(
    cart.addToCart(input),
    (e) => e.code === "INTERNAL_SERVER_ERROR",
  );
  assert.equal(user.krogerUserRefreshToken, "old-refresh");
  assert.ok(JSON.stringify(logs).includes("invalid_client"));

  reset();
  mockFetch(() => {
    throw new Error("network failure");
  });
  await assert.rejects(cart.addToCart(input));
  assert.equal(user.krogerUserRefreshToken, "old-refresh");
  mockFetch((url) =>
    url.includes("oauth2")
      ? tokenResponse()
      : new Response(null, { status: 204 }),
  );
  await cart.addToCart(input); // Failed refresh must not leave the user locked.
  assert.equal(purchases[1].wasAddedToCart, true);

  reset(new Date(Date.now() + 1800_000));
  mockFetch(() => new Response("upstream response", { status: 503 }));
  await assert.rejects(cart.addToCart(input));
  assert.equal(
    requests.length,
    1,
    "Never replay cart writes after an ambiguous failure",
  );
  assert.equal(bought, false);
  assert.ok(!purchases[0].note.includes("upstream response"));

  reset(new Date(Date.now() + 1800_000));
  mockFetch((url) =>
    url.includes("oauth2")
      ? tokenResponse()
      : new Response(null, { status: 401 }),
  );
  await assert.rejects(
    cart.addToCart(input),
    (e) => e.code === "PRECONDITION_FAILED",
  );
  assert.equal(
    requests.filter((r) => r.url === cartUrl).length,
    2,
    "Stop after one 401 retry",
  );
  assert.equal(bought, false);

  reset();
  mockFetch((url) =>
    url.includes("oauth2")
      ? tokenResponse()
      : Response.json({ data: [{ productId: "123" }] }),
  );
  assert.deepEqual(await doKrogerSearch({ filterTerm: "milk" }, "test-user"), [
    { productId: "123" },
  ]);
  assert.equal(
    requests[1].init.headers.get("Authorization"),
    "Bearer new-access",
  );
  assert.equal(
    krogerPurchaseNote(
      'Kroger cart request failed: HTTP 401: {"error":"invalid_token"}',
    ),
    "This attempt was not added because the Kroger connection expired.",
  );
  assert.equal(krogerPurchaseNote("Unrelated note"), "Unrelated note");
  originalConsole.info(
    "PASS: concurrent expiry refresh, delayed 401 recovery, cart bookkeeping, token rotation, revoked grants, diagnostics, safe retries, search, and historical notes",
  );
})()
  .catch((error) => {
    originalConsole.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    global.fetch = originalFetch;
    Object.assign(console, originalConsole);
  });
