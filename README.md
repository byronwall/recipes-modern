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

   - `minio-init` auto-creates the bucket and applies CORS driven by env (`APP_ORIGINS`).

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
- To serve images over HTTPS in prod, set `NEXT_PUBLIC_MEDIA_BASE_URL` to your public S3/MinIO endpoint plus bucket (e.g. `https://media.example.com/recipes-media`). `next.config.js` derives image `remotePatterns` from this value.

## Environment variables

Create a `.env` file in the project root.

Required (core app):

- `DB_URL` = Postgres connection string (e.g. `postgresql://user:password@localhost:5432/recipes-modern`)
- `NEXTAUTH_URL` = Base URL of the app (e.g. `http://localhost:3000`)
- `NEXTAUTH_SECRET` = Any random string in production

Required (images & object storage):

- `NEXT_PUBLIC_MEDIA_BASE_URL` = Public base URL to your bucket (e.g. `http://localhost:9000/recipes-media`)
- `S3_BUCKET` = Bucket name (e.g. `recipes-media`)
- `S3_ACCESS_KEY_ID` = Access key (used for both MinIO root and S3 client)
- `S3_SECRET_ACCESS_KEY` = Secret
- `S3_REGION` = Region label (default `us-east-1`)
- Endpoints (choose one of the following setups):
  - Provide both:
    - `S3_ENDPOINT_PUBLIC` = Public browser-reachable endpoint (e.g. `http://localhost:9000`)
    - `S3_ENDPOINT_INTERNAL` = Server-reachable endpoint (e.g. `http://minio:9000` in Docker)
  - Or provide a single legacy:
    - `S3_ENDPOINT` = Used as a fallback if the above are not set

Optional:

- `OPENAI_API_KEY` = Enables AI recipe generation
- `KROGER_CLIENT_ID`, `CLIENT_SECRET`, `NEXT_REDIRECT_URI` = Kroger integration
- `NEXT_SKIP_ADD_TO_CART` = Set to `true` to disable pushing items to Kroger cart
- `APP_ORIGINS` = Comma-separated origins to allow in MinIO CORS (Compose defaults this to `APP_URL`)

Notes:

- Env vars are validated at startup. To bypass during Docker builds, set `SKIP_ENV_VALIDATION=1`.
- Kroger and AI are optional; omit those vars if you’re not using those features.

## Verify MinIO setup

Use the MinIO client container to verify bucket, policy, and CORS:

```bash
# List buckets (should include your S3_BUCKET)
docker compose run --rm --entrypoint /bin/sh minio-init -lc \
  'mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"; mc ls local'

# Show anonymous policy and CORS for the bucket
docker compose run --rm --entrypoint /bin/sh minio-init -lc \
  'mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"; mc anonymous get local/"$S3_BUCKET"; mc cors get local/"$S3_BUCKET"'

# Quick write test to the internal endpoint from the app container
docker compose exec -T web-app node -e "const {S3Client,PutObjectCommand}=require('@aws-sdk/client-s3');(async()=>{const endpoint=(process.env.S3_ENDPOINT_INTERNAL||process.env.S3_ENDPOINT||'').replace(/\/$/,'');const s3=new S3Client({region:process.env.S3_REGION,endpoint,forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}});await s3.send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:'healthcheck/test.txt',ContentType:'text/plain',Body:'ok'}));console.log('PUT_OK')})()"
```

## Using Docker Compose

A `docker-compose.yaml` is provided to run the app and Postgres together.

```bash
docker compose up --build
```

- Ensure `.env` contains `DB_URL`, `NEXTAUTH_*`, `NEXT_PUBLIC_MEDIA_BASE_URL`, required `S3_*` values, and optionally Kroger/AI variables.
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
- You must configure `KROGER_CLIENT_ID`, `CLIENT_SECRET`, and `NEXT_REDIRECT_URI` (must match the OAuth app’s redirect).
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
- DB connection issues: ensure Postgres is running and `DB_URL` credentials are correct
- Auth errors: confirm `NEXTAUTH_URL` matches the URL you’re visiting and `NEXTAUTH_SECRET` is set in production
- Kroger errors: check OAuth app config and `NEXT_REDIRECT_URI` exact match
- Images:

  - If uploads fail with 403/NoSuchBucket, ensure the bucket exists. Re-run:

    ```bash
    docker compose up -d minio-init
    ```

  - If browser PUT is blocked by CORS, set `APP_ORIGINS` in `.env` and re-run the init job:

    ```bash
    docker compose up -d minio-init
    ```

  - For private buckets, replace public policy with:

    ```bash
    docker compose run --rm --entrypoint /bin/sh minio-init -lc 'mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"; mc anonymous set none local/"$S3_BUCKET"'
    ```
