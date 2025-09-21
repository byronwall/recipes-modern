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

## Setup (Images & Object Storage)

This app supports recipe images using an S3-compatible bucket (MinIO in Docker by default).

1. Copy envs

   - Duplicate `.env.example` to `.env` and adjust values if needed (DB, media host, etc.).

2. Start services

   - Using Docker Compose (app, Postgres, MinIO):

   ```bash
   docker compose up --build
   ```

   - `minio-init` auto-creates the bucket and applies CORS driven by env (`APP_ORIGINS`, `CORS_ALLOWED_METHODS`, `CORS_MAX_AGE`).

3. Database

   - If running without Compose DB helper, ensure Postgres is up, then:

   ```bash
   npm run db:push
   ```

4. Run the app

   ```bash
   npm run dev
   ```

5. Uploading images

   - Open a recipe page and use the file input under "Images".
   - Files upload directly to the bucket via a pre-signed URL, then the server records metadata and links to the recipe.

Notes

- For local dev via Compose, the app talks to MinIO at `http://minio:9000` inside the Docker network.
- To serve images over HTTPS in prod, point `PUBLIC_MEDIA_HOST` DNS to your Traefik/MinIO endpoint and keep it in Next.js `remotePatterns`.

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

Media (S3/MinIO):

- `MINIO_ROOT_USER` = MinIO root user (dev default: `minioadmin`)
- `MINIO_ROOT_PASSWORD` = MinIO root password (dev default: `minioadmin`)
- `S3_ENDPOINT` = S3 API endpoint (dev: `http://minio:9000`)
- `S3_REGION` = Region label (e.g. `us-east-1`)
- `S3_BUCKET` = Bucket name (e.g. `recipes-media`)
- `S3_ACCESS_KEY_ID` = Access key (in Compose defaults to `${MINIO_ROOT_USER}`)
- `S3_SECRET_ACCESS_KEY` = Secret (in Compose defaults to `${MINIO_ROOT_PASSWORD}`)
- `PUBLIC_MEDIA_HOST` = Public host serving media (e.g. `recipes-media.byroni.us`)
- `NEXT_PUBLIC_MEDIA_HOST` = Same host, exposed to client for image URLs
- `NEXT_PUBLIC_S3_BUCKET` = Bucket name, exposed to client
- `APP_ORIGINS` = Comma-separated origins allowed for CORS (e.g. `http://localhost:3000,https://recipes.byroni.us`)
- `CORS_ALLOWED_METHODS` = Comma-separated methods (default `GET,PUT`)
- `CORS_MAX_AGE` = Max age seconds (default `3600`)

Notes:

- The app validates env vars at startup. To bypass during Docker builds, set `SKIP_ENV_VALIDATION=1`.
- For local only usage without Kroger, you can omit the Kroger variables; avoid visiting Kroger pages.

## Verify MinIO setup

Use the MinIO client container to verify bucket, policy, and CORS:

```bash
# List buckets (should include your S3_BUCKET)
docker compose run --rm --entrypoint /bin/sh minio-init -lc \
  'mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"; mc ls local'

# Show anonymous policy and CORS for the bucket
docker compose run --rm --entrypoint /bin/sh minio-init -lc \
  'mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"; mc anonymous get local/"$S3_BUCKET"; mc cors get local/"$S3_BUCKET"'

# Quick write/read test from the app container
docker compose exec -T web-app node -e "const {S3Client,PutObjectCommand}=require('@aws-sdk/client-s3');(async()=>{const s3=new S3Client({region:process.env.S3_REGION,endpoint:process.env.S3_ENDPOINT,forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}});await s3.send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:'healthcheck/test.txt',ContentType:'text/plain',Body:'ok'}));console.log('PUT_OK')})()"
```

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
- Images:

  - If uploads fail with 403/NoSuchBucket, ensure the bucket exists. Re-run:

    ```bash
    docker compose up -d minio-init
    ```

  - If browser PUT is blocked by CORS, set `APP_ORIGINS`, `CORS_ALLOWED_METHODS`, and `CORS_MAX_AGE` in `.env` and re-run the init job:

    ```bash
    docker compose up -d minio-init
    ```

  - For private buckets, replace public policy with:

    ```bash
    docker compose run --rm --entrypoint /bin/sh minio-init -lc 'mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"; mc anonymous set none local/"$S3_BUCKET"'
    ```
