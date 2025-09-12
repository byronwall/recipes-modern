# Family Recipes

A modern Next.js 14 app for creating and managing recipes, planning meals, and maintaining a shopping list. Optional Kroger integration lets you search products and add items to your Kroger cart.

## Features

- Recipes: create, view, edit, and delete recipes with grouped ingredients and step groups
- Meal planning: schedule recipes on a calendar; mark as made; add plan to shopping list
- Shopping list: add loose items, add all ingredients from a recipe, mark bought, bulk clear
- Auth: email/password via NextAuth (Credentials provider)
- Kroger (optional): OAuth connect, product search, add-to-cart from shopping list

## Tech Stack

- Next.js 14 (App Router), React 18
- tRPC, Prisma (PostgreSQL)
- NextAuth (credentials), Zod
- Tailwind CSS, Radix UI, Lucide Icons

## Environment variables

Create a `.env` file in the project root.

Required for app and database:

- `DATABASE_URL` = Postgres connection string (e.g. `postgresql://user:password@localhost:5432/recipes-modern`)
- `NEXTAUTH_URL` = Base URL of the app (e.g. `http://localhost:3000`)
- `NEXTAUTH_SECRET` = Any random string in production

Kroger integration (optional, required only if using Kroger pages/actions):

- `NEXT_CLIENT_ID` = Kroger OAuth client id
- `CLIENT_SECRET` = Kroger OAuth client secret
- `NEXT_REDIRECT_URI` = Redirect URL registered with Kroger (e.g. `http://localhost:3000/kroger/auth`)

Notes:

- The app validates env vars at startup. To bypass during Docker builds, set `SKIP_ENV_VALIDATION=1`.
- For local only usage without Kroger, you can omit the Kroger variables; avoid visiting Kroger pages.

## Local development

1. Install dependencies

```bash
npm ci
```

2. Start Postgres

- Using Docker directly (recommended):

```bash
./start-database.sh
```

This will create/start a local Postgres container named `recipes-modern-postgres` using credentials parsed from `DATABASE_URL`.

3. Apply database schema and generate Prisma client

```bash
npm run db:push
```

4. Start the app

```bash
npm run dev
```

5. Create an account

- Visit `/auth` and use the Sign Up form (email + password). You’ll be auto-signed in.

## Using Docker Compose

A `docker-compose.yaml` is provided to run the app and Postgres together.

```bash
docker compose up --build
```

- Ensure `.env` contains `DATABASE_URL`, `NEXTAUTH_*`, and optionally Kroger variables.
- The app will be available on `http://localhost:3000`.

## Production build

```bash
npm run build
npm run start
```

In Docker (multi-step handled in the Dockerfile):

```bash
docker build -t recipes-modern .
docker run -p 3000:3000 --env-file .env recipes-modern
```

The container entrypoint runs `npx prisma migrate deploy` before `next start`.

## Kroger integration

- Go to `/kroger` and click “Sign in to Kroger” to connect your account.
- You must configure `NEXT_CLIENT_ID`, `CLIENT_SECRET`, and `NEXT_REDIRECT_URI` (must match the OAuth app’s redirect).
- After connecting, you can search Kroger products and add items to your cart from the shopping list.

## Project scripts

- `dev`: start Next.js dev server
- `build`: build the app
- `start`: start the built app
- `start-prod`: run Prisma migrate deploy, then start (used in Docker)
- `db:push`: push Prisma schema to DB
- `db:studio`: open Prisma Studio
- `lint`: run Next.js ESLint

## Directory overview

- `src/app` — App Router pages (recipes, plan, list, auth, kroger)
- `src/server` — tRPC routers, Prisma, NextAuth config
- `prisma/schema.prisma` — database schema and migrations

## Troubleshooting

- Env validation errors: confirm required variables in `.env` match the names above
- DB connection issues: ensure Postgres is running and `DATABASE_URL` credentials are correct
- Auth errors: confirm `NEXTAUTH_URL` matches the URL you’re visiting and `NEXTAUTH_SECRET` is set in production
- Kroger errors: check OAuth app config and `NEXT_REDIRECT_URI` exact match
