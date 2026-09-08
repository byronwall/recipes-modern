// @ts-nocheck -- Node test runner loads app TypeScript with the installed compiler.
// Run against a disposable database named recipes_audit:
// Z_DB_URL=postgresql://.../recipes_audit pnpm exec node scripts/test-regressions.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
assert.equal(
  new URL(process.env.Z_DB_URL).pathname,
  "/recipes_audit",
  "Use the disposable test database",
);
process.env.SKIP_ENV_VALIDATION = "1";
process.env.NODE_ENV = "test";
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
// Router callers receive explicit sessions; never read real browser sessions.
require.cache[path.join(root, "src/server/auth.ts")] = {
  exports: {
    getServerAuthSession: () => {
      throw new Error("Supply the test session");
    },
  },
};
const { db } = require("../src/server/db.ts");
const { recipeRouter } = require("../src/server/api/routers/recipe.ts");
const {
  shoppingListRouter,
} = require("../src/server/api/routers/shoppingListRouter.ts");
const {
  mealPlanRouter,
} = require("../src/server/api/routers/mealPlanRouter.ts");
const { krogerRouter } = require("../src/server/api/routers/krogerRouter.ts");
const { urlStateCodecs } = require("../src/hooks/use-url-state.ts");
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { Button } = require("../src/components/ui/button.tsx");
assert.match(
  renderToStaticMarkup(
    createElement(Button, { isLoading: true, disabled: false }),
  ),
  /disabled=""/,
);
const ids = [];
(async () => {
  assert.equal(urlStateCodecs.number(1).parse(null), 1);
  assert.equal(urlStateCodecs.number(25).parse(""), 25);
  assert.equal(urlStateCodecs.number(1).parse("nope"), 1);
  const user = await db.user.create({ data: {} });
  ids.push(user.id);
  const other = await db.user.create({ data: {} });
  ids.push(other.id);
  const ctx = {
    db,
    headers: new Headers(),
    session: { user: { id: user.id }, expires: "" },
  };
  const recipes = recipeRouter.createCaller(ctx);
  const list = shoppingListRouter.createCaller(ctx);
  const plans = mealPlanRouter.createCaller(ctx);
  const kroger = krogerRouter.createCaller(ctx);
  assert.deepEqual(await kroger.getKrogerStatus(), { connected: false });
  const recipe = await recipes.createRecipeFromTextInput({
    title: "Audit recipe",
    description: "",
    ingredients: "Salt\nWater",
    steps: "Mix\nCook",
  });
  const foreign = await db.recipe.create({
    data: { name: "Other account", description: "", userId: other.id },
  });
  await assert.rejects(recipes.deleteRecipe({ id: foreign.id }));
  await assert.rejects(
    recipes.addRecipeToMealPlan({ recipeId: foreign.id, date: new Date() }),
  );
  await assert.rejects(list.addRecipeToShoppingList({ recipeId: foreign.id }));
  const foreignMeal = await db.plannedMeal.create({
    data: { recipeId: foreign.id, userId: other.id, date: new Date() },
  });
  await assert.rejects(
    plans.updateMealPlan({ id: foreignMeal.id, isMade: true }),
  );
  await assert.rejects(plans.deleteMealPlan({ id: foreignMeal.id }));
  const foreignItem = await db.shoppingList.create({
    data: { userId: other.id, looseItem: "Other item" },
  });
  await assert.rejects(list.deleteItemFromShoppingList({ id: foreignItem.id }));
  await assert.rejects(list.markItemAsBought({ id: foreignItem.id }));
  await assert.rejects(
    kroger.addToCart({ items: [{ upc: "123", quantity: 0 }] }),
  );
  await assert.rejects(
    kroger.addToCart({
      items: [{ upc: "123", quantity: 1 }],
      listItemId: foreignItem.id,
    }),
  );
  await assert.rejects(list.addLooseItemToShoppingList({ ingredient: "   " }));
  const meal = await recipes.addRecipeToMealPlan({
    recipeId: recipe.id,
    date: new Date(),
  });
  await recipes.addMealPlanToShoppingList({ id: meal.id });
  await recipes.addMealPlanToShoppingList({ id: meal.id });
  assert.equal(
    (await list.getShoppingList()).length,
    2,
    "Adding the same meal twice must not duplicate ingredients",
  );
  await list.deleteAllItemsFromShoppingList();
  assert.equal(
    (await db.plannedMeal.findUniqueOrThrow({ where: { id: meal.id } }))
      .isOnShoppingList,
    false,
  );
  assert.ok(
    await db.shoppingList.findUnique({ where: { id: foreignItem.id } }),
  );
  await recipes.addMealPlanToShoppingList({ id: meal.id });
  for (const item of await list.getShoppingList())
    await list.markItemAsBought({ id: item.id });
  await list.deleteAllBoughtItemsFromShoppingList();
  assert.equal(
    (await db.plannedMeal.findUniqueOrThrow({ where: { id: meal.id } }))
      .isOnShoppingList,
    false,
  );
  // A later failure must roll back earlier ingredient edits.
  const draft = {
    recipeId: recipe.id,
    ingredientGroups: structuredClone(recipe.ingredientGroups),
    stepGroups: structuredClone(recipe.stepGroups),
  };
  draft.ingredientGroups[0].ingredients[0].ingredient = "Changed salt";
  draft.stepGroups[0].id = 2147483647;
  await assert.rejects(recipes.updateRecipeContent(draft));
  assert.equal(
    (await recipes.getRecipe({ id: recipe.id })).ingredientGroups[0]
      .ingredients[0].ingredient,
    "Salt",
  );
  draft.stepGroups = recipe.stepGroups;
  await recipes.updateRecipeContent(draft);
  assert.equal(
    (await recipes.getRecipe({ id: recipe.id })).ingredientGroups[0]
      .ingredients[0].ingredient,
    "Changed salt",
  );
  // Deleting an ingredient already on the shopping list must succeed.
  await list.addRecipeToShoppingList({ recipeId: recipe.id });
  draft.ingredientGroups[0].ingredients[0].id *= -1;
  await recipes.updateRecipeContent(draft);
  assert.equal((await list.getShoppingList()).length, 1);
  await list.deleteItemFromShoppingList({
    id: (await list.getShoppingList())[0].id,
  });
  console.log(
    "PASS: pagination, account boundaries, cart validation, list resets, and atomic recipe saves",
  );
})()
  .finally(async () => {
    await db.shoppingList.deleteMany({ where: { userId: { in: ids } } });
    await db.recipe.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
