import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { RecipeType } from "@prisma/client";
import { faker } from "@faker-js/faker";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { type Ingredient2, type Root } from "./old_types";

export const recipeRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          type: z.nativeEnum(RecipeType).optional(),
          includeTags: z.array(z.string()).optional(),
          excludeTags: z.array(z.string()).optional(),
          maxCookMins: z.number().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const where: Prisma.RecipeWhereInput = { userId };

      if (input?.type) where.type = input.type;
      if (input?.includeTags?.length) {
        where.tags = { some: { tag: { slug: { in: input.includeTags } } } };
      }
      if (input?.excludeTags?.length) {
        const andArray: Prisma.RecipeWhereInput[] = Array.isArray(where.AND)
          ? [...where.AND]
          : where.AND
            ? [where.AND]
            : [];
        andArray.push({
          NOT: { tags: { some: { tag: { slug: { in: input.excludeTags } } } } },
        });
        where.AND = andArray;
      }
      if (input?.maxCookMins)
        where.cookMinutes = {
          lte: input.maxCookMins,
        } as Prisma.IntNullableFilter;

      const recipes = await db.recipe.findMany({
        where,
        orderBy: { name: "asc" },
        include: {
          tags: { include: { tag: true } },
          images: {
            include: { image: true },
            orderBy: [{ role: "asc" }, { order: "asc" }],
          },
        },
      });
      return recipes;
    }),
  getRecipes: protectedProcedure.query(async ({ ctx }) => {
    const recipes = db.recipe.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        tags: { include: { tag: true } },
        images: {
          include: { image: true },
          orderBy: [{ role: "asc" }, { order: "asc" }],
        },
      },
    });
    return recipes ?? [];
  }),

  getRecipe: protectedProcedure
    .input(z.object({ id: z.coerce.number() }))
    .query(async ({ input, ctx }) => {
      const recipe = await db.recipe.findUnique({
        where: { id: input.id, userId: ctx.session.user.id },
        include: {
          stepGroups: {
            include: { Recipe: true },
          },
          ingredientGroups: {
            include: { ingredients: true },
          },
          tags: { include: { tag: true } },
          images: { include: { image: true } },
        },
      });

      return recipe;
    }),

  getMealPlans: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const plannedMeals = db.plannedMeal.findMany({
      where: { userId },
      include: {
        Recipe: { include: { tags: { include: { tag: true } } } },
      },
      orderBy: { date: "asc" },
    });

    return plannedMeals;
  }),

  updateRecipeMeta: protectedProcedure
    .input(
      z.object({
        id: z.coerce.number(),
        name: z.string().min(1),
        description: z.string(),
        type: z.nativeEnum(RecipeType).optional(),
        cookMinutes: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const existing = await db.recipe.findUnique({
        where: { id: input.id, userId },
      });
      if (!existing) {
        throw new Error("Recipe not found");
      }

      const updated = await db.recipe.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          ...(input.type ? { type: input.type } : {}),
          ...(typeof input.cookMinutes === "number"
            ? { cookMinutes: input.cookMinutes }
            : {}),
        },
      });

      return updated;
    }),

  updateRecipeType: protectedProcedure
    .input(z.object({ id: z.coerce.number(), type: z.nativeEnum(RecipeType) }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const existing = await db.recipe.findUnique({
        where: { id: input.id, userId },
      });
      if (!existing) {
        throw new Error("Recipe not found");
      }

      const updated = await db.recipe.update({
        where: { id: input.id },
        data: { type: input.type },
      });

      return updated;
    }),

  updateIngredientGroups: protectedProcedure
    .input(
      z.object({
        recipeId: z.coerce.number(),
        ingredientGroups: z.array(
          z.object({
            id: z.coerce.number(),
            title: z.string(),
            ingredients: z.array(
              z.object({
                id: z.coerce.number(),
                ingredient: z.string(),
                amount: z.string().optional(),
                modifier: z.string().optional(),
                unit: z.string().optional(),
              }),
            ),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const recipe = await db.recipe.findUnique({
        where: { id: input.recipeId },
      });

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      // update the ingredient groups
      for (const group of input.ingredientGroups) {
        await db.ingredientGroup.update({
          where: { id: group.id },
          data: {
            title: group.title,
          },
        });

        // add new ingredients with id 0
        const newIngredients = group.ingredients.filter(
          (ingredient) => ingredient.id === 0,
        );

        for (const ingredient of newIngredients) {
          await db.ingredient.create({
            data: {
              ingredient: ingredient.ingredient,
              amount: ingredient.amount,
              modifier: ingredient.modifier,
              unit: ingredient.unit,
              groupId: group.id,
            },
          });
        }

        const deletedIngredients = group.ingredients.filter(
          (ingredient) => ingredient.id < 0,
        );

        // delete ingredients with negative id
        for (const ingredient of deletedIngredients) {
          await db.ingredient.delete({
            where: { id: -ingredient.id },
          });
        }

        // update the ingredients
        const updatedIngredients = group.ingredients.filter(
          (ingredient) => ingredient.id > 0,
        );
        for (const ingredient of updatedIngredients) {
          // skip new ingredients

          await db.ingredient.update({
            where: { id: ingredient.id },
            data: {
              ingredient: ingredient.ingredient,
              amount: ingredient.amount,
              modifier: ingredient.modifier,
              unit: ingredient.unit,
            },
          });
        }
      }

      return recipe;
    }),

  updateStepGroups: protectedProcedure
    .input(
      z.object({
        recipeId: z.coerce.number(),
        stepGroups: z.array(
          z.object({
            id: z.coerce.number(),
            title: z.string(),
            steps: z.array(z.string()),
            order: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const recipe = await db.recipe.findUnique({
        where: { id: input.recipeId },
      });

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      const groupsToDelete = input.stepGroups.filter((group) => group.id < 0);

      // delete groups with negative id
      for (const group of groupsToDelete) {
        await db.stepGroup.delete({
          where: { id: -group.id },
        });
      }

      // add new groups with id 0
      const newGroups = input.stepGroups.filter((group) => group.id === 0);
      for (const group of newGroups) {
        await db.stepGroup.create({
          data: {
            title: group.title,
            steps: group.steps,
            order: group.order,
            recipeId: recipe.id,
          },
        });
      }

      // update the step groups
      const updatedGroups = input.stepGroups.filter((group) => group.id > 0);
      for (const group of updatedGroups) {
        await db.stepGroup.update({
          where: { id: group.id },
          data: {
            title: group.title,
            steps: group.steps,
          },
        });
      }

      return recipe;
    }),

  replaceGroups: protectedProcedure
    .input(
      z.object({
        recipeId: z.coerce.number(),
        ingredientGroups: z.array(
          z.object({
            title: z.string(),
            ingredients: z.array(
              z.object({
                ingredient: z.string(),
                amount: z.string().optional().default(""),
                modifier: z.string().optional().default(""),
                unit: z.string().optional().default(""),
                original: z.string().optional().default(""),
              }),
            ),
          }),
        ),
        stepGroups: z.array(
          z.object({
            title: z.string(),
            steps: z.array(z.string()),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const existing = await db.recipe.findUnique({
        where: { id: input.recipeId, userId },
      });
      if (!existing) throw new Error("Recipe not found");

      // Replace all groups in a transaction
      await db.$transaction(async (tx) => {
        // Delete existing groups (cascade deletes ingredients and step images)
        await tx.ingredientGroup.deleteMany({
          where: { recipeId: input.recipeId },
        });
        await tx.stepGroup.deleteMany({ where: { recipeId: input.recipeId } });

        // Create ingredient groups
        for (let i = 0; i < input.ingredientGroups.length; i++) {
          const g = input.ingredientGroups[i]!;
          await tx.ingredientGroup.create({
            data: {
              title: g.title,
              order: i,
              recipeId: input.recipeId,
              ingredients: {
                create: g.ingredients.map((ing) => ({
                  ingredient: ing.ingredient,
                  amount: ing.amount ?? "",
                  modifier: ing.modifier ?? "",
                  unit: ing.unit ?? "",
                  rawInput: ing.original ?? "",
                })),
              },
            },
          });
        }

        // Create step groups
        for (let i = 0; i < input.stepGroups.length; i++) {
          const g = input.stepGroups[i]!;
          await tx.stepGroup.create({
            data: {
              title: g.title,
              order: i,
              steps: g.steps,
              recipeId: input.recipeId,
            },
          });
        }
      });

      return { ok: true as const };
    }),

  /*
  type NewRecipe = {
  title: string;
  ingredients: string;
  steps: string;
};
*/
  createRecipeFromTextInput: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        ingredients: z.string(),
        steps: z.string(),
        type: z.nativeEnum(RecipeType).optional(),
        tagSlugs: z.array(z.string()).optional(),
        cookMinutes: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Initialize an empty array to hold group objects

      const ingredientGroups = splitTextIntoHeaderAndItems(
        input.ingredients,
      ).map((group, index) => ({
        title: group.title,
        order: index,
        ingredients: group.items.map((item) => {
          return {
            ingredient: item,
            rawInput: item,
          };
        }),
      }));

      const stepGroups = splitTextIntoHeaderAndItems(input.steps).map(
        (group, index) => ({
          title: group.title,
          order: index,
          steps: group.items,
        }),
      );

      // Creating the recipe along with ingredient groups and step groups in a single command
      const newRecipe = await db.recipe.create({
        data: {
          name: input.title,
          description: input.description,
          ...(input.type ? { type: input.type } : {}),
          ...(typeof input.cookMinutes === "number"
            ? { cookMinutes: input.cookMinutes }
            : {}),
          userId,
          ingredientGroups: {
            create: ingredientGroups.map((group) => ({
              title: group.title,
              order: group.order,
              ingredients: {
                create: group.ingredients,
              },
            })),
          },
          stepGroups: {
            create: stepGroups.map((group) => ({
              title: group.title,
              order: group.order,
              steps: group.steps,
            })),
          },
          ...(input.tagSlugs?.length
            ? {
                tags: {
                  create: (
                    await db.tag.findMany({
                      where: { slug: { in: input.tagSlugs } },
                    })
                  ).map((t) => ({ tagId: t.id })),
                },
              }
            : {}),
        },
        include: {
          ingredientGroups: {
            include: {
              ingredients: true,
            },
          },
          stepGroups: {
            include: {
              Recipe: true,
            },
          },
          tags: { include: { tag: true } },
        },
      });

      return newRecipe;
    }),

  deleteRecipe: protectedProcedure
    .input(z.object({ id: z.coerce.number() }))
    .mutation(async ({ input }) => {
      const recipe = await db.recipe.delete({
        where: { id: input.id },
      });

      return recipe;
    }),

  addRecipeToMealPlan: protectedProcedure
    .input(z.object({ recipeId: z.coerce.number(), date: z.date() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // this check is not really needed, call below will fail anyways
      const recipe = await db.recipe.findUnique({
        where: { id: input.recipeId },
      });

      if (!recipe) {
        throw new Error("Recipe not found");
      }

      const plannedMeal = await db.plannedMeal.create({
        data: {
          date: input.date,
          recipeId: input.recipeId,
          userId,
        },
      });

      return plannedMeal;
    }),

  // code below is related to migrating old data structures to new database
  migrateRecipes: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // need to insert all of the

    const data = await fetch("http://recipes.byroni.us/api/db");

    const root = (await data.json()) as Root;

    // create lookup of ingredients by id
    const ingredientsById = root.ingredients.reduce(
      (acc, ingredient) => {
        acc[ingredient.id] = ingredient;
        return acc;
      },
      {} as Record<number, Ingredient2>,
    );

    // insert all recipes
    for (const recipe of root.recipes) {
      const newRecipe = await db.recipe.create({
        data: {
          name: recipe.name,
          description: recipe.description,
          userId,
        },
      });

      // insert all steps
      let stepIndex = 0;
      for (const stepGroup of recipe.stepGroups) {
        await db.stepGroup.create({
          data: {
            title: stepGroup.title,
            steps: stepGroup.steps.map((step) => step.description),
            recipeId: newRecipe.id,
            order: stepIndex++,
          },
        });
      }

      // insert all ingredients
      let ingredientIndex = 0;
      for (const ingredientGroup of recipe.ingredientGroups) {
        const newIngredientGroup = await db.ingredientGroup.create({
          data: {
            title: ingredientGroup.title,
            recipeId: newRecipe.id,
            order: ingredientIndex++,
          },
        });

        for (const ingredient of ingredientGroup.ingredients) {
          // force each ingredient group into a new ingredient in the main table
          // this removes the old mapping
          const oldIngredient = ingredientsById[ingredient.ingredientId];

          if (!oldIngredient) {
            continue;
          }

          await db.ingredient.create({
            data: {
              ingredient: oldIngredient.name,
              plu: oldIngredient.plu,
              isGoodName: oldIngredient.isGoodName,
              aisle: oldIngredient.aisle,
              comments: oldIngredient.comments,
              amount: String(ingredient.amount),
              modifier: ingredient.modifier,
              unit: ingredient.unit,
              groupId: newIngredientGroup.id,
            },
          });
        }
      }

      // migrate the meal plans too
      const plannedMeals = root.plannedMeals.filter(
        (meal) => meal.recipeId === recipe.id,
      );

      for (const plannedMeal of plannedMeals) {
        await db.plannedMeal.create({
          data: {
            date: plannedMeal.date,
            recipeId: newRecipe.id,
            isMade: plannedMeal.isMade,
            isOnShoppingList: plannedMeal.isOnShoppingList,
            scale: plannedMeal.scale,
            userId,
          },
        });
      }
    }
  }),

  updateIngredientAisle: protectedProcedure
    .input(z.object({ id: z.coerce.number(), aisle: z.string() }))
    .mutation(async ({ input }) => {
      const ingredient = await db.ingredient.update({
        where: { id: input.id },
        data: {
          aisle: input.aisle,
        },
      });

      return ingredient;
    }),

  getDistinctAisles: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get distinct aisle values for this user's ingredients
    const rows = await db.ingredient.findMany({
      where: {
        group: { Recipe: { userId } },
        AND: [{ aisle: { not: null } }, { aisle: { not: "" } }],
      },
      distinct: ["aisle"],
      select: { aisle: true },
    });

    const aisles = rows
      .map((r) => r.aisle)
      .filter((v): v is string => Boolean(v))
      .sort((a, b) => a.localeCompare(b));

    return aisles;
  }),

  addMealPlanToShoppingList: protectedProcedure
    .input(z.object({ id: z.coerce.number() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const plannedMeal = await db.plannedMeal.update({
        where: { id: input.id },
        data: {
          isOnShoppingList: true,
        },
      });

      const recipeId = plannedMeal.recipeId;

      // get ingredient groups for that recipe
      const ingredientGroups = await db.ingredientGroup.findMany({
        where: { recipeId },
      });

      // get all ingredients in those groups
      const ingredients = await db.ingredient.findMany({
        where: { groupId: { in: ingredientGroups.map((group) => group.id) } },
      });

      // add all ingredients to the shopping list
      for (const ingredient of ingredients) {
        await db.shoppingList.create({
          data: {
            ingredientId: ingredient.id,
            userId,
            recipeId,
          },
        });
      }
    }),

  seedDevRecipes: protectedProcedure
    .input(
      z
        .object({
          count: z.number().int().min(1).max(50).optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      if (process.env.NODE_ENV !== "development") {
        throw new Error("Seed recipes are only available in development.");
      }

      const userId = ctx.session.user.id;
      const count = input?.count ?? 10;
      const seeds = Array.from({ length: count }, () => buildSeedRecipe());
      const availableTags = await ensureSeedTags(userId);

      await db.$transaction(
        seeds.map((seed) =>
          db.recipe.create({
            data: {
              name: seed.name,
              description: seed.description,
              type: seed.type,
              cookMinutes: seed.cookMinutes,
              userId,
              ingredientGroups: {
                create: seed.ingredientGroups.map((group, index) => ({
                  title: group.title,
                  order: index,
                  ingredients: {
                    create: group.ingredients.map((ingredient) => ({
                      ...ingredient,
                    })),
                  },
                })),
              },
              stepGroups: {
                create: seed.stepGroups.map((group, index) => ({
                  title: group.title,
                  order: index,
                  steps: group.steps,
                })),
              },
              tags: {
                create: faker.helpers
                  .arrayElements(
                    availableTags,
                    faker.number.int({ min: 1, max: 4 }),
                  )
                  .map((tag) => ({ tagId: tag.id })),
              },
            },
          }),
        ),
      );

      return { created: count };
    }),
});

function splitTextIntoHeaderAndItems(text: string) {
  const lines = text.split("\n");

  const headerRegEx = /^\[(.+?)\]$/;

  const groups: { title: string; items: string[] }[] = [];

  let currentGroup: { title: string; items: string[] } = {
    title: "",
    items: [],
  };

  for (const _line of lines) {
    const line = _line.trim();

    if (!line) {
      continue;
    }

    const headerMatch = line.match(headerRegEx);

    if (headerMatch) {
      if (currentGroup.items.length > 0) {
        groups.push(currentGroup);
      }

      currentGroup = {
        title: headerMatch[1] ?? "Unknown",
        items: [],
      };
    } else {
      currentGroup.items.push(line);
    }
  }

  if (currentGroup.items.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

type SeedIngredient = {
  ingredient: string;
  amount: string;
  unit: string;
  modifier: string;
  rawInput: string;
};

type SeedGroup = {
  title: string;
  ingredients: SeedIngredient[];
};

type SeedStepGroup = {
  title: string;
  steps: string[];
};

type SeedRecipe = {
  name: string;
  description: string;
  type: RecipeType;
  cookMinutes: number;
  ingredientGroups: SeedGroup[];
  stepGroups: SeedStepGroup[];
};

const proteins = [
  "chicken thighs",
  "salmon fillets",
  "shrimp",
  "ground turkey",
  "tofu",
  "pork tenderloin",
  "chickpeas",
  "black beans",
  "sirloin steak",
];
const veggies = [
  "bell pepper",
  "zucchini",
  "broccoli",
  "spinach",
  "carrot",
  "mushrooms",
  "red onion",
  "green beans",
  "cherry tomatoes",
];
const carbs = [
  "jasmine rice",
  "quinoa",
  "penne",
  "fusilli",
  "couscous",
  "baby potatoes",
  "tortillas",
];
const herbs = ["parsley", "cilantro", "basil", "dill", "thyme", "mint"];
const acids = ["lemon", "lime", "red wine vinegar", "rice vinegar"];

function makeIngredient(
  amount: string,
  unit: string,
  ingredient: string,
  modifier = "",
): SeedIngredient {
  const parts = [amount, unit, ingredient, modifier].filter(Boolean);
  return {
    ingredient,
    amount,
    unit,
    modifier,
    rawInput: parts.join(" "),
  };
}

function buildSkilletDinner(): SeedRecipe {
  const protein = faker.helpers.arrayElement(proteins);
  const veg1 = faker.helpers.arrayElement(veggies);
  const veg2 = faker.helpers.arrayElement(veggies.filter((v) => v !== veg1));
  const herb = faker.helpers.arrayElement(herbs);
  const acid = faker.helpers.arrayElement(acids);
  const spice = faker.helpers.arrayElement([
    "smoked paprika",
    "Italian seasoning",
    "curry powder",
    "chili flakes",
  ]);

  return {
    name: `${faker.word.adjective({ length: { min: 4, max: 8 } })} ${protein} skillet`,
    description: `Weeknight skillet with ${veg1}, ${veg2}, and a ${spice} finish.`,
    type: RecipeType.DINNER,
    cookMinutes: faker.number.int({ min: 20, max: 40 }),
    ingredientGroups: [
      {
        title: "Skillet",
        ingredients: [
          makeIngredient("1", "tbsp", "olive oil"),
          makeIngredient("1", "lb", protein),
          makeIngredient("1", "cup", veg1, "sliced"),
          makeIngredient("1", "cup", veg2, "chopped"),
          makeIngredient("2", "cloves", "garlic", "minced"),
          makeIngredient("1", "tsp", spice),
          makeIngredient("1", "tsp", "kosher salt"),
          makeIngredient("1/2", "tsp", "black pepper"),
        ],
      },
      {
        title: "Finish",
        ingredients: [
          makeIngredient("1/2", "cup", "chicken stock"),
          makeIngredient("1", "tbsp", "butter"),
          makeIngredient("1", "tbsp", acid, "juice"),
          makeIngredient("2", "tbsp", herb, "chopped"),
        ],
      },
    ],
    stepGroups: [
      {
        title: "Cook",
        steps: [
          "Pat the protein dry and season with salt, pepper, and the spice blend.",
          "Heat olive oil in a large skillet over medium-high heat. Sear the protein until browned.",
          "Add the vegetables and garlic. Cook until just tender, 4 to 6 minutes.",
          "Pour in stock and butter, scraping up browned bits. Simmer until slightly glossy.",
          "Finish with citrus juice and herbs. Serve right away.",
        ],
      },
    ],
  };
}

function buildSheetPanDinner(): SeedRecipe {
  const protein = faker.helpers.arrayElement(proteins);
  const veg1 = faker.helpers.arrayElement(veggies);
  const veg2 = faker.helpers.arrayElement(veggies.filter((v) => v !== veg1));
  const herb = faker.helpers.arrayElement(herbs);
  const acid = faker.helpers.arrayElement(acids);

  return {
    name: `${faker.word.adjective({ length: { min: 4, max: 8 } })} ${protein} sheet pan`,
    description: `Roasted ${protein} with ${veg1} and ${veg2}.`,
    type: RecipeType.DINNER,
    cookMinutes: faker.number.int({ min: 25, max: 45 }),
    ingredientGroups: [
      {
        title: "Sheet Pan",
        ingredients: [
          makeIngredient("1", "lb", protein),
          makeIngredient("2", "cups", veg1, "chunks"),
          makeIngredient("2", "cups", veg2, "chunks"),
          makeIngredient("2", "tbsp", "olive oil"),
          makeIngredient("1", "tsp", "garlic powder"),
          makeIngredient("1", "tsp", "kosher salt"),
          makeIngredient("1/2", "tsp", "black pepper"),
        ],
      },
      {
        title: "Finish",
        ingredients: [
          makeIngredient("1", "tbsp", acid, "juice"),
          makeIngredient("2", "tbsp", herb, "chopped"),
        ],
      },
    ],
    stepGroups: [
      {
        title: "Roast",
        steps: [
          "Heat the oven to 425°F and line a sheet pan with parchment.",
          "Toss the protein and vegetables with olive oil, garlic powder, salt, and pepper.",
          "Spread everything in an even layer and roast 18 to 25 minutes, stirring halfway.",
          "Finish with citrus juice and fresh herbs before serving.",
        ],
      },
    ],
  };
}

function buildPastaDinner(): SeedRecipe {
  const herb = faker.helpers.arrayElement(herbs);
  const veg = faker.helpers.arrayElement(veggies);

  return {
    name: `${faker.word.adjective({ length: { min: 4, max: 8 } })} tomato ${faker.helpers.arrayElement(["penne", "fusilli"])}`,
    description: "Simple pasta with a bright tomato sauce.",
    type: RecipeType.DINNER,
    cookMinutes: faker.number.int({ min: 20, max: 35 }),
    ingredientGroups: [
      {
        title: "Pasta",
        ingredients: [
          makeIngredient("12", "oz", "pasta"),
          makeIngredient("2", "tbsp", "olive oil"),
          makeIngredient("1", "", "yellow onion", "diced"),
          makeIngredient("3", "cloves", "garlic", "minced"),
          makeIngredient("1", "can", "crushed tomatoes", "14 oz"),
          makeIngredient("1", "cup", veg, "sliced"),
          makeIngredient("1", "tsp", "kosher salt"),
          makeIngredient("1/2", "tsp", "black pepper"),
        ],
      },
      {
        title: "Finish",
        ingredients: [
          makeIngredient("1/4", "cup", "parmesan", "grated"),
          makeIngredient("2", "tbsp", herb, "chopped"),
        ],
      },
    ],
    stepGroups: [
      {
        title: "Simmer",
        steps: [
          "Cook the pasta in salted water until al dente; reserve 1/2 cup cooking water.",
          "Saute onion and garlic in olive oil until soft, then add the vegetables.",
          "Stir in tomatoes, salt, and pepper. Simmer 8 to 10 minutes.",
          "Toss the pasta with the sauce, loosening with reserved water as needed.",
          "Finish with parmesan and herbs.",
        ],
      },
    ],
  };
}

function buildBreakfastScramble(): SeedRecipe {
  const veg = faker.helpers.arrayElement(veggies);
  const herb = faker.helpers.arrayElement(herbs);
  return {
    name: `${faker.word.adjective({ length: { min: 4, max: 8 } })} veggie scramble`,
    description: `Fluffy eggs with ${veg} and herbs.`,
    type: RecipeType.BREAKFAST,
    cookMinutes: faker.number.int({ min: 10, max: 20 }),
    ingredientGroups: [
      {
        title: "Scramble",
        ingredients: [
          makeIngredient("6", "", "eggs"),
          makeIngredient("1/4", "cup", "milk"),
          makeIngredient("1", "cup", veg, "chopped"),
          makeIngredient("1/2", "cup", "cheddar", "shredded"),
          makeIngredient("1", "tbsp", "butter"),
          makeIngredient("1/2", "tsp", "kosher salt"),
          makeIngredient("1/4", "tsp", "black pepper"),
          makeIngredient("1", "tbsp", herb, "chopped"),
        ],
      },
    ],
    stepGroups: [
      {
        title: "Cook",
        steps: [
          "Whisk the eggs with milk, salt, and pepper.",
          "Melt butter in a nonstick skillet over medium heat, then add vegetables and cook until tender.",
          "Pour in eggs and gently scramble until just set.",
          "Fold in cheese and herbs. Serve immediately.",
        ],
      },
    ],
  };
}

function buildDessertCrisp(): SeedRecipe {
  const fruit = faker.helpers.arrayElement([
    "apples",
    "blueberries",
    "peaches",
    "strawberries",
  ]);
  return {
    name: `${faker.word.adjective({ length: { min: 4, max: 8 } })} ${fruit} crisp`,
    description: `Warm baked ${fruit} with an oat topping.`,
    type: RecipeType.DESSERT,
    cookMinutes: faker.number.int({ min: 35, max: 55 }),
    ingredientGroups: [
      {
        title: "Fruit",
        ingredients: [
          makeIngredient("4", "cups", fruit, "sliced"),
          makeIngredient("2", "tbsp", "granulated sugar"),
          makeIngredient("1", "tbsp", "lemon juice"),
          makeIngredient("1", "tbsp", "cornstarch"),
        ],
      },
      {
        title: "Topping",
        ingredients: [
          makeIngredient("1", "cup", "rolled oats"),
          makeIngredient("1/2", "cup", "flour"),
          makeIngredient("1/3", "cup", "brown sugar"),
          makeIngredient("1/2", "tsp", "cinnamon"),
          makeIngredient("6", "tbsp", "butter", "cold, cubed"),
        ],
      },
    ],
    stepGroups: [
      {
        title: "Bake",
        steps: [
          "Heat oven to 375°F and butter a baking dish.",
          "Toss fruit with sugar, lemon juice, and cornstarch, then spread in the dish.",
          "Mix oats, flour, brown sugar, and cinnamon; cut in butter until crumbly.",
          "Sprinkle topping over fruit and bake 30 to 35 minutes until bubbling.",
        ],
      },
    ],
  };
}

function buildLunchBowl(): SeedRecipe {
  const protein = faker.helpers.arrayElement(proteins);
  const veg = faker.helpers.arrayElement(veggies);
  const grain = faker.helpers.arrayElement(carbs);
  const herb = faker.helpers.arrayElement(herbs);
  return {
    name: `${faker.word.adjective({ length: { min: 4, max: 8 } })} ${protein} bowl`,
    description: `Hearty bowl with ${grain}, ${veg}, and a quick dressing.`,
    type: RecipeType.LUNCH,
    cookMinutes: faker.number.int({ min: 20, max: 35 }),
    ingredientGroups: [
      {
        title: "Bowl",
        ingredients: [
          makeIngredient("2", "cups", grain, "cooked"),
          makeIngredient("1", "lb", protein),
          makeIngredient("1", "cup", veg, "sliced"),
          makeIngredient("1", "tbsp", "olive oil"),
          makeIngredient("1", "tsp", "kosher salt"),
          makeIngredient("1/2", "tsp", "black pepper"),
        ],
      },
      {
        title: "Dressing",
        ingredients: [
          makeIngredient("2", "tbsp", "olive oil"),
          makeIngredient("1", "tbsp", "lemon juice"),
          makeIngredient("1", "tsp", "honey"),
          makeIngredient("1", "tsp", "Dijon mustard"),
          makeIngredient("1", "tbsp", herb, "chopped"),
        ],
      },
    ],
    stepGroups: [
      {
        title: "Assemble",
        steps: [
          "Season the protein with salt and pepper, then cook until browned and cooked through.",
          "Warm the grain and toss with a drizzle of olive oil.",
          "Whisk dressing ingredients until smooth.",
          "Build bowls with grain, protein, and vegetables. Drizzle with dressing.",
        ],
      },
    ],
  };
}

function buildSeedRecipe(): SeedRecipe {
  const builders = [
    buildSkilletDinner,
    buildSheetPanDinner,
    buildPastaDinner,
    buildBreakfastScramble,
    buildDessertCrisp,
    buildLunchBowl,
  ];
  return faker.helpers.arrayElement(builders)();
}

async function ensureSeedTags(userId: string) {
  const existing = await db.tag.findMany({ orderBy: { name: "asc" } });
  if (existing.length >= 4) return existing;

  const fallbackTags = [
    "Quick",
    "Family Favorite",
    "Meal Prep",
    "Budget Friendly",
    "One-Pan",
    "Vegetarian",
    "Gluten Free",
    "High Protein",
    "Freezer Friendly",
    "Weeknight",
  ];

  await db.$transaction(
    fallbackTags.map((name) =>
      db.tag.upsert({
        where: { slug: name.toLowerCase().replace(/\s+/g, "-") },
        update: { name },
        create: {
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-"),
          createdBy: userId,
        },
      }),
    ),
  );

  return db.tag.findMany({ orderBy: { name: "asc" } });
}
