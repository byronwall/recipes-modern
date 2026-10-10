// Seeds the sandbox DB (see scripts/sandbox-db.sh) with a test user and
// realistic sample data. This WIPES recipe/user tables, so it refuses to run
// against anything except the sandbox database.
//
//   node scripts/seed-sandbox.mjs            # wipe + reseed
//   node scripts/seed-sandbox.mjs --if-empty # seed only when there are no users
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const SANDBOX_DB_NAME = "recipes_sandbox";

const dbUrl = process.env.Z_DB_URL ?? "";
if (new URL(dbUrl).pathname.replace("/", "") !== SANDBOX_DB_NAME) {
  console.error(
    `Refusing to seed: Z_DB_URL does not point at the "${SANDBOX_DB_NAME}" database.`,
  );
  process.exit(1);
}

const db = new PrismaClient();

const TEST_EMAIL = "audit@example.test";
const TEST_PASSWORD = "audit-password";

const recipes = [
  {
    name: "Weeknight Chicken Tikka Masala",
    description: "Creamy, mildly spiced tomato curry with seared chicken thighs. Better the next day.",
    type: "DINNER",
    cookMinutes: 45,
    tags: ["indian", "chicken", "weeknight", "freezer-friendly"],
    ingredientGroups: [
      { title: "Chicken", items: [["1.5", "lb", "chicken thighs", "boneless, cut in chunks"], ["1", "cup", "plain yogurt", ""], ["2", "tsp", "garam masala", ""], ["1", "tsp", "kosher salt", ""]] },
      { title: "Sauce", items: [["2", "tbsp", "butter", ""], ["1", "", "yellow onion", "diced"], ["4", "cloves", "garlic", "minced"], ["1", "tbsp", "ginger", "grated"], ["1", "can", "crushed tomatoes", "28 oz"], ["0.75", "cup", "heavy cream", ""], ["", "", "cilantro", "to serve"]] },
    ],
    stepGroups: [
      { title: "Marinate", steps: ["Toss chicken with yogurt, half the garam masala, and salt. Rest 20 minutes or overnight."] },
      { title: "Cook", steps: ["Sear chicken in a hot skillet in batches until charred in spots. Set aside.", "Melt butter, cook onion until soft, about 6 minutes. Add garlic, ginger, and remaining garam masala; cook 1 minute.", "Add tomatoes and simmer 10 minutes. Stir in cream and chicken; simmer 10 more minutes until chicken is cooked through.", "Finish with cilantro and serve with rice or naan."] },
    ],
  },
  {
    name: "Overnight Oats",
    description: "Grab-and-go breakfast jars.",
    type: "BREAKFAST",
    cookMinutes: 5,
    tags: ["make-ahead", "vegetarian"],
    ingredientGroups: [{ title: "", items: [["0.5", "cup", "rolled oats", ""], ["0.5", "cup", "milk", ""], ["0.25", "cup", "greek yogurt", ""], ["1", "tbsp", "chia seeds", ""], ["1", "tsp", "maple syrup", ""], ["", "", "berries", "for topping"]] }],
    stepGroups: [{ title: "", steps: ["Stir everything except berries in a jar.", "Refrigerate overnight. Top with berries before eating."] }],
  },
  {
    name: "Sheet Pan Gnocchi with Sausage and Peppers",
    description: "Crispy shelf-stable gnocchi roasted with Italian sausage, peppers, and red onion. One pan, minimal cleanup.",
    type: "DINNER",
    cookMinutes: 30,
    tags: ["sheet-pan", "weeknight", "kid-friendly"],
    ingredientGroups: [{ title: "", items: [["1", "lb", "shelf-stable gnocchi", ""], ["1", "lb", "italian sausage", "links, sliced"], ["2", "", "bell peppers", "sliced"], ["1", "", "red onion", "wedged"], ["2", "tbsp", "olive oil", ""], ["", "", "parmesan", "grated, to serve"]] }],
    stepGroups: [{ title: "", steps: ["Heat oven to 450°F.", "Toss everything with oil, salt, and pepper on a large sheet pan.", "Roast 20–25 minutes, flipping halfway, until gnocchi are golden.", "Shower with parmesan."] }],
  },
  {
    name: "Classic Chocolate Chip Cookies",
    description: "Brown butter, a little extra yolk, flaky salt on top.",
    type: "DESSERT",
    cookMinutes: 40,
    tags: ["baking", "kid-friendly"],
    ingredientGroups: [
      { title: "Dry", items: [["2.25", "cup", "all-purpose flour", ""], ["1", "tsp", "baking soda", ""], ["1", "tsp", "kosher salt", ""]] },
      { title: "Wet", items: [["1", "cup", "butter", "browned and cooled"], ["1", "cup", "brown sugar", "packed"], ["0.5", "cup", "granulated sugar", ""], ["1", "", "egg", ""], ["1", "", "egg yolk", ""], ["2", "tsp", "vanilla extract", ""]] },
      { title: "Mix-ins", items: [["2", "cup", "chocolate chips", ""], ["", "", "flaky salt", ""]] },
    ],
    stepGroups: [{ title: "", steps: ["Whisk dry ingredients.", "Whisk browned butter with sugars, then egg, yolk, and vanilla.", "Fold in dry, then chocolate. Chill 30 minutes.", "Scoop and bake at 350°F for 10–12 minutes. Sprinkle with flaky salt."] }],
  },
  {
    name: "Lemony White Bean Soup",
    description: "Pantry soup with kale and a big squeeze of lemon.",
    type: "LUNCH",
    cookMinutes: 35,
    tags: ["vegetarian", "soup", "pantry"],
    ingredientGroups: [{ title: "", items: [["2", "tbsp", "olive oil", ""], ["1", "", "yellow onion", "diced"], ["2", "", "carrots", "diced"], ["3", "cloves", "garlic", ""], ["2", "can", "cannellini beans", "drained"], ["4", "cup", "vegetable broth", ""], ["1", "bunch", "kale", "chopped"], ["1", "", "lemon", "juiced"]] }],
    stepGroups: [{ title: "", steps: ["Soften onion and carrot in oil, 8 minutes. Add garlic.", "Add beans and broth; simmer 15 minutes. Mash some beans to thicken.", "Stir in kale until wilted. Finish with lemon, salt, and pepper."] }],
  },
  {
    name: "Smash Burgers",
    description: "",
    type: "DINNER",
    cookMinutes: 20,
    tags: ["grill", "kid-friendly", "beef"],
    ingredientGroups: [{ title: "", items: [["1", "lb", "ground beef", "80/20"], ["4", "", "potato buns", ""], ["4", "slice", "american cheese", ""], ["", "", "pickles", ""], ["", "", "special sauce", ""]] }],
    stepGroups: [{ title: "", steps: ["Divide beef into 8 balls.", "Smash onto a ripping hot griddle, season, cook 2 minutes, flip, add cheese.", "Stack two patties per bun."] }],
  },
  {
    name: "Guacamole",
    description: "Chunky, with plenty of lime.",
    type: "APPETIZER",
    cookMinutes: 10,
    tags: ["mexican", "vegetarian", "party"],
    ingredientGroups: [{ title: "", items: [["3", "", "avocados", ""], ["1", "", "lime", "juiced"], ["0.25", "cup", "red onion", "minced"], ["1", "", "jalapeño", "minced"], ["", "", "cilantro", ""]] }],
    stepGroups: [{ title: "", steps: ["Mash avocado with lime and salt.", "Fold in onion, jalapeño, and cilantro."] }],
  },
  {
    name: "Roasted Garlic Parmesan Broccoli",
    description: "The side dish that disappears first.",
    type: "SIDE",
    cookMinutes: 25,
    tags: ["vegetarian", "sheet-pan"],
    ingredientGroups: [{ title: "", items: [["2", "lb", "broccoli", "florets"], ["3", "tbsp", "olive oil", ""], ["4", "cloves", "garlic", "sliced"], ["0.5", "cup", "parmesan", ""]] }],
    stepGroups: [{ title: "", steps: ["Toss broccoli with oil, salt, garlic.", "Roast at 425°F for 20 minutes. Top with parmesan for the last 3 minutes."] }],
  },
  {
    name: "Iced Brown Sugar Oat Latte",
    description: "Coffee shop copycat.",
    type: "DRINK",
    cookMinutes: 5,
    tags: ["coffee"],
    ingredientGroups: [{ title: "", items: [["2", "shots", "espresso", ""], ["1", "tbsp", "brown sugar syrup", ""], ["0.75", "cup", "oat milk", ""], ["", "", "ice", ""]] }],
    stepGroups: [{ title: "", steps: ["Shake espresso with syrup and a pinch of cinnamon.", "Pour over ice and top with oat milk."] }],
  },
  {
    name: "Thai Peanut Noodle Salad with Crunchy Vegetables and Lime",
    description: "Cold noodles in a punchy peanut-lime dressing, loaded with cabbage, carrots, cucumber, and herbs. A great make-ahead lunch that holds up for days in the fridge.",
    type: "LUNCH",
    cookMinutes: 25,
    tags: ["thai", "make-ahead", "vegetarian", "noodles", "meal-prep"],
    ingredientGroups: [
      { title: "Dressing", items: [["0.33", "cup", "peanut butter", ""], ["3", "tbsp", "soy sauce", ""], ["2", "tbsp", "rice vinegar", ""], ["1", "tbsp", "honey", ""], ["1", "", "lime", "juiced"], ["1", "tbsp", "sriracha", ""]] },
      { title: "Salad", items: [["8", "oz", "rice noodles", ""], ["2", "cup", "red cabbage", "shredded"], ["2", "", "carrots", "julienned"], ["1", "", "cucumber", "sliced"], ["", "", "peanuts", "chopped"], ["", "", "cilantro", ""]] },
    ],
    stepGroups: [{ title: "", steps: ["Cook noodles, rinse cold.", "Whisk dressing, thinning with warm water.", "Toss everything together and top with peanuts."] }],
  },
  {
    name: "Buttermilk Pancakes",
    description: "Fluffy Saturday pancakes.",
    type: "BREAKFAST",
    cookMinutes: 25,
    tags: ["kid-friendly", "weekend"],
    ingredientGroups: [{ title: "", items: [["2", "cup", "all-purpose flour", ""], ["2", "tbsp", "sugar", ""], ["2", "tsp", "baking powder", ""], ["2", "cup", "buttermilk", ""], ["2", "", "eggs", ""], ["4", "tbsp", "butter", "melted"]] }],
    stepGroups: [{ title: "", steps: ["Whisk dry; whisk wet; combine until just mixed.", "Cook on a buttered griddle until bubbles form, flip once."] }],
  },
  {
    name: "Trail Mix Energy Bites",
    description: "No-bake snack balls.",
    type: "SNACK",
    cookMinutes: 15,
    tags: ["make-ahead", "no-bake"],
    ingredientGroups: [{ title: "", items: [["1", "cup", "rolled oats", ""], ["0.5", "cup", "peanut butter", ""], ["0.33", "cup", "honey", ""], ["0.5", "cup", "mini chocolate chips", ""]] }],
    stepGroups: [{ title: "", steps: ["Stir together, chill 20 minutes, roll into balls."] }],
  },
  {
    name: "Mom's Pot Roast",
    description: "Sunday dinner. Low and slow.",
    type: "DINNER",
    cookMinutes: 240,
    tags: ["beef", "slow-cooker", "family"],
    ingredientGroups: [{ title: "", items: [["3", "lb", "chuck roast", ""], ["1", "lb", "baby potatoes", ""], ["4", "", "carrots", "chunked"], ["1", "", "yellow onion", "quartered"], ["2", "cup", "beef broth", ""], ["2", "tbsp", "tomato paste", ""]] }],
    stepGroups: [{ title: "", steps: ["Sear roast on all sides.", "Add everything to a Dutch oven and braise at 300°F for 3.5–4 hours."] }],
  },
  {
    name: "Untitled draft",
    description: "",
    type: "OTHER",
    cookMinutes: null,
    tags: [],
    ingredientGroups: [{ title: "", items: [] }],
    stepGroups: [{ title: "", steps: [] }],
  },
];

const purchases = [
  ["Kroger® Boneless Skinless Chicken Thighs", "Kroger", 8.99, 7.49, 1, "1.5 lb", 0],
  ["Simple Truth Organic® Rolled Oats", "Simple Truth Organic", 4.29, null, 2, "18 oz", 1],
  ["Private Selection® Potato Gnocchi", "Private Selection", 3.49, 2.99, 2, "16 oz", 2],
  ["Nestle Toll House Semi-Sweet Chocolate Chips", "Nestle", 4.79, null, 1, "12 oz", 3],
  ["Kroger® Cannellini Beans", "Kroger", 1.09, null, 2, "15.5 oz", 4],
  ["Kroger® 80/20 Ground Beef", "Kroger", 5.99, null, 1, "1 lb", 5],
  ["Hass Avocados", "", 1.25, 0.99, 3, "1 ct", 6],
];

async function main() {
  if (process.argv.includes("--if-empty") && (await db.user.count()) > 0) {
    return;
  }

  await db.$transaction([
    db.krogerPurchase.deleteMany(),
    db.shoppingList.deleteMany(),
    db.plannedMeal.deleteMany(),
    db.recipeTag.deleteMany(),
    db.tag.deleteMany(),
    db.recipe.deleteMany(),
    db.user.deleteMany(),
  ]);

  const user = await db.user.create({
    data: { email: TEST_EMAIL, name: "Audit Tester", password: await bcrypt.hash(TEST_PASSWORD, 10) },
  });

  const created = [];
  for (const r of recipes) {
    const recipe = await db.recipe.create({
      data: {
        name: r.name,
        description: r.description,
        type: r.type,
        cookMinutes: r.cookMinutes,
        userId: user.id,
        ingredientGroups: {
          create: r.ingredientGroups.map((g, order) => ({
            title: g.title,
            order,
            ingredients: {
              create: g.items.map(([amount, unit, ingredient, modifier]) => ({
                amount,
                unit,
                ingredient,
                modifier,
                rawInput: [amount, unit, ingredient].filter(Boolean).join(" ") + (modifier ? `, ${modifier}` : ""),
              })),
            },
          })),
        },
        stepGroups: { create: r.stepGroups.map((g, order) => ({ title: g.title, order, steps: g.steps })) },
      },
      include: { ingredientGroups: { include: { ingredients: true } } },
    });
    for (const slug of r.tags) {
      const tag = await db.tag.upsert({ where: { slug }, update: {}, create: { slug, name: slug } });
      await db.recipeTag.create({ data: { recipeId: recipe.id, tagId: tag.id } });
    }
    created.push(recipe);
  }

  // meal plan: spread across the current and next week
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const plan = [[0, -2, true], [2, -1, true], [5, 0, false], [12, 1, false], [1, 2, false], [7, 3, false], [3, 5, false]];
  for (const [idx, offset, isMade] of plan) {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    await db.plannedMeal.create({ data: { date, isMade, recipeId: created[idx].id, userId: user.id } });
  }

  // shopping list: ingredients from two recipes + loose items
  for (const idx of [0, 2]) {
    for (const ing of created[idx].ingredientGroups.flatMap((g) => g.ingredients)) {
      await db.shoppingList.create({ data: { recipeId: created[idx].id, ingredientId: ing.id, userId: user.id, isBought: Math.random() < 0.25 } });
    }
  }
  for (const looseItem of ["paper towels", "dish soap", "sparkling water", "bananas"]) {
    await db.shoppingList.create({ data: { looseItem, userId: user.id } });
  }

  // aisles for a few ingredients
  const aisles = { "chicken thighs": "Meat", "plain yogurt": "Dairy", "heavy cream": "Dairy", "yellow onion": "Produce", garlic: "Produce", "bell peppers": "Produce", "italian sausage": "Meat" };
  for (const [ingredient, aisle] of Object.entries(aisles)) {
    await db.ingredient.updateMany({ where: { ingredient }, data: { aisle } });
  }

  for (const [i, [krogerName, krogerBrand, regular, promo, quantity, itemSize, recipeIdx]] of purchases.entries()) {
    const createdAt = new Date(today);
    createdAt.setDate(createdAt.getDate() - i * 4);
    await db.krogerPurchase.create({
      data: {
        userId: user.id,
        recipeId: created[recipeIdx].id,
        ingredientId: created[recipeIdx].ingredientGroups[0]?.ingredients[0]?.id,
        krogerSku: `000111${1000 + i}`,
        krogerProductId: `000111${1000 + i}`,
        krogerName,
        krogerBrand: krogerBrand || null,
        krogerCategories: ["Grocery"],
        krogerPriceRegular: regular,
        krogerPricePromo: promo,
        price: promo ?? regular,
        quantity,
        itemSize,
        imageUrl: "",
        wasAddedToCart: i !== 3,
        createdAt,
      },
    });
  }

  console.log(`Seeded ${created.length} recipes for ${TEST_EMAIL}`);
}

main().finally(() => db.$disconnect());
