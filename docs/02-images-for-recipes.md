Hi,

> Goal: add first-class image support (hero + gallery + per-step) with object storage, uploads from the browser via pre-signed URLs, thumbnails/derivatives, CDN-friendly URLs, and a clean Prisma model that composes with your existing Recipe/StepGroup structure.

---

### Proposed architecture (at a glance)

- **Object storage (S3-compatible)**

  - Default local/dev: **MinIO** container with a named volume, fronted by your existing Traefik.
  - Prod options: stick with MinIO, or point the exact same code to **S3 / Cloudflare R2**.

- **Upload flow (browser → bucket)**

  - Client asks your tRPC/route handler for a **pre-signed PUT** URL.
  - Browser uploads file **directly** to the bucket.
  - Client calls a **confirm API** with the uploaded key → server probes object (HEAD/GetObject), runs **sharp** for metadata + derivatives, **stores Image row**, and **links** to Recipe/StepGroup.

- **Delivery**

  - Public bucket + **long-lived cache headers**; or private bucket + **signed GET** if you prefer.
  - Start simple: serve derivatives from the bucket and use `next/image` with **remotePatterns**.
  - Optional (later): drop in **imgproxy/thumbor** for on-the-fly transforms.

---

### Storage choices (pick 1 now, you can swap later)

| Option                               | When to use                       | Pros                                                    | Cons                         |
| ------------------------------------ | --------------------------------- | ------------------------------------------------------- | ---------------------------- |
| **MinIO (Docker)**                   | Local + single-file deploy parity | Same API as S3; lives in your compose; no external deps | You manage disk & backups    |
| **AWS S3**                           | Cloud deploy on AWS               | Durable, cheap, CDN via CloudFront                      | Separate infra, IAM setup    |
| **Cloudflare R2**                    | Want S3 API + low egress          | S3-compatible, great egress, easy CF CDN                | Separate provider; IAM model |
| **Postgres bytea** (not recommended) | Never (except tiny avatars)       | One DB to backup                                        | DB bloat; slow; no CDN       |

---

### Prisma schema additions

> Minimal, composable, and future-proof for step images.

```prisma
// Add this enum
enum ImageRole {
  HERO
  GALLERY
  STEP
  OTHER
}

model Image {
  id            Int       @id @default(autoincrement())
  bucket        String    // e.g. "recipes-media"
  key           String    // e.g. "u_<uid>/r_<rid>/orig/<uuid>.jpg"
  mime          String
  bytes         Int
  width         Int?
  height        Int?
  sha256        String?   @unique
  blurhash      String?   // for fast LQ previews
  dominantColor String?   // e.g. "#aabbcc"
  alt           String?   // author-provided
  createdAt     DateTime  @default(now())
  createdById   String
  createdBy     User      @relation(fields: [createdById], references: [id])

  // reverse links
  recipes       RecipeImage[]
  @@index([bucket, key])
}

// Link images to recipes (and optionally a specific step)
model RecipeImage {
  recipeId     Int
  imageId      Int
  role         ImageRole    @default(GALLERY)
  "gallery sort"
  order        Int          @default(0)
  caption      String?
  "Optional linkage to a StepGroup + step index inside that group"
  stepGroupId  Int?
  stepIndex    Int?         // 0-based index into StepGroup.steps[]

  recipe       Recipe       @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  image        Image        @relation(fields: [imageId], references: [id], onDelete: Cascade)
  stepGroup    StepGroup?   @relation(fields: [stepGroupId], references: [id])

  @@id([recipeId, imageId, role, stepGroupId, stepIndex])
  @@index([imageId])
  @@index([recipeId, role, order])
}
```

- Keeps your current `StepGroup` model intact (string\[]).
- Allows **recipe-level** (HERO/GALLERY) and **step-level** images without remodeling steps immediately.
- If you later move to first-class `Step` rows, this link still works.

---

### Env vars to add

- `S3_ENDPOINT` (e.g. `http://minio:9000` for Docker network; `https://s3.amazonaws.com` for AWS)
- `S3_REGION` (e.g. `us-east-1`)
- `S3_BUCKET` (e.g. `recipes-media`)
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `IMAGE_SIGNED_GET` = `false` (or `true` if you want private GETs)
- `IMAGE_MAX_SIZE_MB` = `10` (guardrails)

---

### Docker Compose: MinIO (+ optional imgproxy)

```yaml
services:
  web-app:
    build: .
    ports:
      - "3000"
    depends_on:
      - db
      - minio
    env_file:
      - .env
    environment:
      - S3_ENDPOINT=http://minio:9000
      - S3_REGION=us-east-1
      - S3_BUCKET=recipes-media
      - S3_ACCESS_KEY_ID=${MINIO_ROOT_USER}
      - S3_SECRET_ACCESS_KEY=${MINIO_ROOT_PASSWORD}
    # (keep your Traefik labels)

  db:
    image: postgres:13
    # (unchanged)
    volumes:
      - db-data:/var/lib/postgresql/data

  minio:
    image: minio/minio:RELEASE.2025-01-11T00-00-00Z # example tag
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
    volumes:
      - minio-data:/data
    ports:
      - "9000" # S3 API (optionally expose)
      - "9001" # Console
    labels:
      - traefik.enable=true
      - traefik.http.routers.minio.rule=Host(`recipes-media.byroni.us`)
      - traefik.http.routers.minio.entrypoints=https
      - traefik.http.routers.minio.tls=true
      - traefik.http.services.minio.loadbalancer.server.port=9000

  # Optional: On-the-fly transforms later (leave commented for now)
  # imgproxy:
  #   image: darthsim/imgproxy:latest
  #   environment:
  #     IMGPROXY_USE_S3: "true"
  #     IMGPROXY_S3_ENDPOINT: http://minio:9000
  #     AWS_ACCESS_KEY_ID: ${MINIO_ROOT_USER}
  #     AWS_SECRET_ACCESS_KEY: ${MINIO_ROOT_PASSWORD}
  #   depends_on: [minio]
  #   labels: ... expose via Traefik if desired

volumes:
  db-data:
  minio-data:
```

> Create the bucket once (manually via MinIO Console at `:9001` or with an init job). Add a simple **CORS** policy to allow your web origin to PUT and GET.

**Sample CORS (MinIO/S3)**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": ["https://recipes.byroni.us", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

### Next.js integration

- **next.config.js**: allow remote bucket host for `next/image`.

```js
/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "recipes-media.byroni.us" },
      { protocol: "http", hostname: "minio" }, // dev in docker network if you expose
    ],
  },
};
```

- **Server utilities** (S3 client + presign):

```ts
// src/server/lib/s3.ts
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT, // include protocol
  forcePathStyle: true, // needed for MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export async function createPutUrl(
  key: string,
  contentType: string,
  maxAgeSeconds = 60,
) {
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
    // You can also add ACL here if you’re using S3 with public ACLs
  });
  return getSignedUrl(s3, cmd, { expiresIn: maxAgeSeconds });
}

export async function headObject(key: string) {
  return s3.send(
    new HeadObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }),
  );
}
```

- **tRPC / Route handlers**

> 1. _getUploadUrl_ → returns `{ key, url }`
> 2. _confirmUpload_ → probes object, runs `sharp`, stores `Image`, links via `RecipeImage`

```ts
// src/server/routers/images.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createPutUrl, headObject } from "../lib/s3";
import sharp from "sharp";
import crypto from "node:crypto";

export const imagesRouter = createTRPCRouter({
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        recipeId: z.number(),
        role: z.enum(["HERO", "GALLERY", "STEP"]).default("GALLERY"),
        mime: z.string(), // e.g. "image/jpeg"
        stepGroupId: z.number().optional(),
        stepIndex: z.number().optional(),
        ext: z.string().optional(), // ".jpg" etc
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const key = `u_${uid}/r_${input.recipeId}/orig/${crypto.randomUUID()}${input.ext ?? ""}`;
      const url = await createPutUrl(key, input.mime);
      return { key, url };
    }),

  confirmUpload: protectedProcedure
    .input(
      z.object({
        recipeId: z.number(),
        role: z.enum(["HERO", "GALLERY", "STEP"]).default("GALLERY"),
        key: z.string(),
        alt: z.string().optional(),
        caption: z.string().optional(),
        order: z.number().default(0),
        stepGroupId: z.number().optional(),
        stepIndex: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const meta = await headObject(input.key);
      const bucket = process.env.S3_BUCKET!;
      const mime = String(meta.ContentType ?? "image/jpeg");
      const bytes = Number(meta.ContentLength ?? 0);

      // fetch original to analyze + produce derivatives
      const res = await fetch(
        `${process.env.S3_ENDPOINT!.replace(/\/$/, "")}/${bucket}/${input.key}`,
      );
      const buf = Buffer.from(await res.arrayBuffer());

      const image = sharp(buf);
      const { width, height } = await image.metadata();

      // small preview (e.g., 24px height) + blurhash-like placeholder
      const preview = await image
        .resize({ height: 24 })
        .webp({ quality: 60 })
        .toBuffer();
      const sha256 = crypto.createHash("sha256").update(buf).digest("hex");

      const dominant = await image.stats().then((s) => {
        const r = s.dominant;
        return `#${r.r.toString(16).padStart(2, "0")}${r.g.toString(16).padStart(2, "0")}${r.b.toString(16).padStart(2, "0")}`;
      });

      const created = await ctx.db.image.create({
        data: {
          bucket,
          key: input.key,
          mime,
          bytes,
          width: width ?? 0,
          height: height ?? 0,
          sha256,
          dominantColor: dominant,
          alt: input.alt ?? null,
          createdById: ctx.session.user.id,
        },
      });

      await ctx.db.recipeImage.create({
        data: {
          recipeId: input.recipeId,
          imageId: created.id,
          role: input.role,
          order: input.order,
          caption: input.caption ?? null,
          stepGroupId: input.stepGroupId,
          stepIndex: input.stepIndex,
        },
      });

      // (Optionally) push derivatives back to bucket here: thumb/large/etc.
      // await putObject("thumb/...", preview);

      return created;
    }),
});
```

- **Client Upload (dropzone-style)**

```ts
// pseudo React handler
const onDrop = async (file: File) => {
  const { key, url } = await trpc.images.getUploadUrl.mutate({
    recipeId,
    role: "GALLERY",
    mime: file.type,
    ext: file.name.match(/\.\w+$/)?.[0],
  });

  // Direct PUT to bucket
  const put = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!put.ok) throw new Error("Upload failed");

  // Confirm and link to recipe
  await trpc.images.confirmUpload.mutate({ recipeId, role: "GALLERY", key });
};
```

---

### Authorization & privacy

- For **family recipes** it’s common to keep images **public** with opaque keys (simplest + CDNable).
- If you need private: set `IMAGE_SIGNED_GET=true`, generate short-lived **GET** URLs per request, and avoid exposing raw keys.

---

### Caching & CDN

- Set `Cache-Control: public, max-age=31536000, immutable` for immutable originals/derivatives.
- Put a CDN (Cloudflare) in front of `recipes-media.byroni.us` to compress/edge-cache.

---

### Minimal UI affordances

- **Hero image** picker on the recipe header (role=HERO, order=0).
- **Gallery** grid with drag-to-reorder (update `order`).
- **Per-step image** add button beside each step in a `StepGroup` (uses `stepGroupId` + `stepIndex`).
- **Captions + Alt** inline editable.
- **LQ placeholder** via `blurhash` or tiny preview for instant paint.

---

### Rollout plan

- Add Prisma models → `prisma generate && prisma migrate dev`.
- Add MinIO to `docker-compose.yaml`, create bucket + CORS.
- Implement `getUploadUrl` & `confirmUpload`, wire to simple uploader UI.
- Switch `next/image` config to allow your media host.
- Add delete/unlink flows; add `onDelete: Cascade` semantics as above.
- (Later) Add **derivatives** write-back (`thumb/`, `lg/`) + **imgproxy** if you want runtime transforms.

---

### Guardrails & DX

- Validate MIME (`image/jpeg|png|webp|avif`) + file size (env).
- Compute **sha256** to avoid dup storage; de-dupe on identical upload across recipes if you like (link existing `Image`).
- Log ETag/sha for troubleshooting.
- Consider **background job** (BullMQ/queue) if sharp transforms grow.

---

### Why this shape fits your stack

- **tRPC + Prisma** keeps the code cohesive; all image linking stays relational.
- **S3-compatible** means local (MinIO) and cloud (S3/R2) use the **same code paths**.
- **Pre-signed direct PUT** avoids proxying big blobs through Next (cheaper + faster).
- **Step-level linking** works today with your `StepGroup.steps[]`, and remains compatible if you later normalize steps.

If you want, I can also drop in a ready-to-paste `bucket-init` one-shot container to auto-create the bucket and apply the CORS/policy during `docker compose up`.

Hi,

> Below is a **copy-pasteable** setup that provisions MinIO, creates your bucket, applies **public read** (download) policy, and installs a permissive **CORS** for your app origins — **no manual clicks**. It uses a tiny “init” sidecar that waits for MinIO to be healthy, then runs `mc` commands once.

---

- **What you’ll get**

  - MinIO running in your compose stack with a persisted volume.
  - A bucket (e.g., `recipes-media`) auto-created on boot.
  - Public read (download) enabled for that bucket (good for family site galleries; flip to private if you prefer).
  - CORS set for `http://localhost:3000` and your prod domain (adjustable).
  - Your `web-app` wired with S3 creds + endpoint via env vars.

- **Files you’ll add**

  - `docker-compose.yaml` (updated).
  - `infra/minio/cors.json` (CORS rules).
  - `.env` (new keys).

---

> ### 1) `.env` additions
>
> (keep your existing vars; add these)

```
# ---- MinIO root credentials ----
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# ---- Media bucket + endpoint ----
S3_BUCKET=recipes-media
S3_REGION=us-east-1
# internal endpoint (Docker network)
S3_ENDPOINT=http://minio:9000

# ---- Public media host (for next/image remotePatterns) ----
PUBLIC_MEDIA_HOST=recipes-media.byroni.us

# ---- App origins for CORS (comma-separated) ----
APP_ORIGINS=http://localhost:3000,https://recipes.byroni.us
```

---

> ### 2) `infra/minio/cors.json`
>
> (MinIO/S3 CORS config – you can tune allowed methods later)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": ["http://localhost:3000", "https://recipes.byroni.us"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

> If you edit app origins later, you can either regenerate this file or (easiest) leave as is and handle auth at your API. For a strict setup, keep origins in sync.

---

> ### 3) `docker-compose.yaml`
>
> (drop-in replacement / merge with yours)

```yaml
version: "3.8"

services:
  web-app:
    build: .
    ports:
      - "3000"
    depends_on:
      - db
      - minio
      - minio-init
    env_file:
      - .env
    environment:
      # Wire S3 to your app
      S3_ENDPOINT: ${S3_ENDPOINT}
      S3_REGION: ${S3_REGION}
      S3_BUCKET: ${S3_BUCKET}
      S3_ACCESS_KEY_ID: ${MINIO_ROOT_USER}
      S3_SECRET_ACCESS_KEY: ${MINIO_ROOT_PASSWORD}
      PUBLIC_MEDIA_HOST: ${PUBLIC_MEDIA_HOST}
    labels:
      - traefik.enable=true
      - traefik.http.middlewares.gzip.compress=true
      - traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
      - traefik.http.routers.http-0-r8c8c8kwscwwo804c48oswgo.entryPoints=http
      - traefik.http.routers.http-0-r8c8c8kwscwwo804c48oswgo.middlewares=redirect-to-https
      - "traefik.http.routers.http-0-r8c8c8kwscwwo804c48oswgo.rule=Host(`recipes.byroni.us`) && PathPrefix(`/`)"
      - traefik.http.routers.https-0-r8c8c8kwscwwo804c48oswgo.entryPoints=https
      - traefik.http.routers.https-0-r8c8c8kwscwwo804c48oswgo.middlewares=gzip
      - "traefik.http.routers.https-0-r8c8c8kwscwwo804c48oswgo.rule=Host(`recipes.byroni.us`) && PathPrefix(`/`)"
      - traefik.http.routers.https-0-r8c8c8kwscwwo804c48oswgo.tls.certresolver=letsencrypt
      - traefik.http.routers.https-0-r8c8c8kwscwwo804c48oswgo.tls=true
      - traefik.http.services.https-0-r8c8c8kwscwwo804c48oswgo.loadbalancer.server.port=3000

  db:
    image: postgres:13
    env_file:
      - .env
    environment:
      - POSTGRES_PASSWORD=${DATABASE_PASSWORD}
      - POSTGRES_USER=${DATABASE_USER}
      - POSTGRES_DB=${DATABASE_NAME}
    volumes:
      - db-data:/var/lib/postgresql/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio-data:/data
      - ./infra/minio/cors.json:/config/cors.json:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/ready"]
      interval: 5s
      timeout: 3s
      retries: 20
    ports:
      # Optional: expose if you want to reach the console/API from host
      - "9000:9000" # S3 API
      - "9001:9001" # Web console
    labels:
      # Optional: expose S3 API via Traefik/HTTPS (kept simple here)
      - traefik.enable=true
      - "traefik.http.routers.minio.rule=Host(`${PUBLIC_MEDIA_HOST}`)"
      - traefik.http.routers.minio.entrypoints=https
      - traefik.http.routers.minio.tls=true
      - traefik.http.services.minio.loadbalancer.server.port=9000

  # One-shot init job that runs mc to:
  # - configure alias
  # - create bucket if missing
  # - set public read on bucket
  # - apply CORS from mounted file
  minio-init:
    image: minio/mc:latest
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: ["/bin/sh", "-c"]
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      S3_BUCKET: ${S3_BUCKET}
      APP_ORIGINS: ${APP_ORIGINS}
    volumes:
      - ./infra/minio/cors.json:/tmp/cors.json:ro
    command: |
      set -eu
      echo "Waiting for MinIO..."
      # configure alias
      mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"

      # create bucket if not exists (idempotent)
      if ! mc ls local/"$S3_BUCKET" >/dev/null 2>&1; then
        mc mb --ignore-existing local/"$S3_BUCKET"
      fi

      # public read (download) for the bucket; remove if you want private
      mc anonymous set download local/"$S3_BUCKET"

      # apply CORS (from file). We also dynamically patch origins from .env if provided.
      if [ -n "${APP_ORIGINS:-}" ]; then
        # build a temp CORS with env-provided origins overriding the file's origins
        ORIGINS_JSON="$(printf '%s' "$APP_ORIGINS" | awk -F, 'BEGIN{printf("["} {for(i=1;i<=NF;i++){gsub(/^ +| +$/,"",$i); printf("%s\"%s\"", (i>1?",":""), $i)} } END{printf("]")}')"
        jq --argjson origins "$ORIGINS_JSON" '.[0].AllowedOrigins = $origins' /tmp/cors.json > /tmp/cors.effective.json
        mc anonymous set-json /tmp/cors.effective.json local/"$S3_BUCKET"
      else
        mc anonymous set-json /tmp/cors.json local/"$S3_BUCKET"
      fi

      echo "MinIO init complete."

volumes:
  db-data:
  minio-data:
```

> Notes
>
> - `minio-init` runs once per compose start and is **idempotent** (safe to re-run).
> - If you prefer **private** media, replace `mc anonymous set download` with `mc anonymous set none` and serve via **signed GET** URLs from your API.

---

> ### 4) Next.js `next.config.js` adjustment (once)
>
> (so `next/image` can load from your media host)

```js
/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: process.env.PUBLIC_MEDIA_HOST },
      // dev via Docker network (if you want to bypass Traefik for testing):
      { protocol: "http", hostname: "minio" },
    ],
  },
};
```

---

### Common tweaks & variants

- **Tighter CORS**

  - Change AllowedMethods to only what you need (`GET` for viewing; `PUT` for direct uploads).
  - If you move uploads through your Next.js API (server PUT to S3), you can restrict to `GET` only.

- **No public read (private bucket)**

  - Use `mc anonymous set none local/"$S3_BUCKET"` in `minio-init`.
  - In your app, generate **signed GET** URLs per request for `next/image` (or proxy via an API route).

- **Traefik HTTPS for media**

  - The example labels expose the S3 API at `https://${PUBLIC_MEDIA_HOST}`. You can also point Cloudflare/CDN at that host later.

- **Multiple buckets (orig/thumbs)**

  - Duplicate the `mc mb` + `mc anonymous set` lines for each bucket and set separate envs, e.g., `S3_BUCKET_THUMBS`.

---

If you want, I can also add a tiny **“derivatives”** (thumb/large) job that listens for new objects and writes resized variants back to the same bucket (using `sharp`) — also fully containerized and zero-touch.

---

### Plan + Steps

- **Add Prisma models**

  - Create `ImageRole`, `Image`, `RecipeImage` in `prisma/schema.prisma` per the schema above.
  - Run migrations: `npx prisma migrate dev -n images_support`.

- **Environment & config**

  - Add `.env` vars: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `PUBLIC_MEDIA_HOST`, `IMAGE_MAX_SIZE_MB`.
  - Update `docker-compose.yaml` to include `minio` and `minio-init` sidecar; mount `infra/minio/cors.json`.
  - Add `infra/minio/cors.json` and set CORS for localhost and prod.
  - Update `next.config.js` `images.remotePatterns` to allow `${PUBLIC_MEDIA_HOST}` and `minio`.

- **Server: S3 utilities**

  - Add `src/server/lib/s3.ts` with `S3Client`, `createPutUrl`, and `headObject` helpers.
  - Install deps: `npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp`.

- **tRPC router**

  - Create `src/server/api/routers/imagesRouter.ts` with:
    - `getUploadUrl(input: { recipeId, role, mime, stepGroupId?, stepIndex?, ext? })` → `{ key, url }` using pre-signed PUT.
    - `confirmUpload(input: { recipeId, role, key, alt?, caption?, order?, stepGroupId?, stepIndex? })` → creates `Image` and `RecipeImage` after probing object and `sharp` metadata.
  - Register router in `src/server/api/root.ts` as `images: imagesRouter`.

- **Recipe queries**

  - Extend `recipe.getRecipe` include to fetch linked images once models exist (e.g., `RecipeImage` with `Image`).
  - Optionally expose `images.listForRecipe(recipeId)` for client galleries.

- **Client UI**

  - Add a simple uploader to `src/app/recipes/[id]/RecipeClient.tsx`:
    - File input/dropzone → call `getUploadUrl`, PUT directly to bucket, then `confirmUpload`.
    - Show gallery grid for `GALLERY` images; choose `HERO` via action.
  - Use `next/image` to render; pass remote URLs as `https://${PUBLIC_MEDIA_HOST}/${S3_BUCKET}/${key}` (or via signed GET if private).

- **Ordering and metadata**

  - Add reorder mutation to update `RecipeImage.order`.
  - Inline edit for `caption` and `alt` via small inputs.

- **Delete/unlink**

  - Mutation to unlink `RecipeImage` (and optionally delete `Image` + object if no other links).

- **Guardrails**

  - Validate MIME and file size server-side before issuing PUT URL.
  - Compute and persist `sha256`; consider de-dupe by reusing existing `Image` if `sha256` already exists.

- **Rollout**
  - 1. Migrate DB and deploy MinIO (or configure S3/R2).
  - 2. Add S3 utils and `images` router; register in app router.
  - 3. Wire `next.config.js` `remotePatterns`.
  - 4. Implement minimal uploader UI and gallery on recipe page.
  - 5. Add reorder, alt/caption edits, and delete/unlink.
  - 6. Later: write back derivatives (`thumb/`, `lg/`) or add imgproxy.
