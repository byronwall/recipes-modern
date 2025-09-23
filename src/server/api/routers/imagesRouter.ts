import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  createPutUrl,
  headObject,
  getObjectBuffer,
  deleteObject,
} from "~/server/lib/s3";
import crypto from "node:crypto";
import sharp from "sharp";
import { db } from "~/server/db";

export const imagesRouter = createTRPCRouter({
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        recipeId: z.number(),
        role: z.enum(["HERO", "GALLERY", "STEP"]).default("GALLERY"),
        mime: z.string(),
        stepGroupId: z.number().optional(),
        stepIndex: z.number().optional(),
        ext: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;
      const key = `u_${uid}/r_${input.recipeId}/orig/${crypto.randomUUID()}${
        input.ext ?? ""
      }`;
      const signedUrl = await createPutUrl(key, input.mime);
      // Inject proxy prefix (e.g., /media) for browser routing, without affecting the signature
      const mediaPrefix = (process.env.MEDIA_PATH_PREFIX ?? "").replace(
        /\/$/,
        "",
      );
      let url = signedUrl;
      if (mediaPrefix) {
        try {
          const u = new URL(signedUrl);
          // Preserve query string; only prefix path
          u.pathname = `${mediaPrefix}${u.pathname}`;
          url = u.toString();
        } catch {
          // fall back to original on parse errors
        }
      }
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

      // Read the object via SDK to avoid endpoint composition issues
      const buf = await getObjectBuffer(input.key);

      const image = sharp(buf);
      const { width, height } = await image.metadata();

      const sha256 = crypto
        .createHash("sha256")
        .update(new Uint8Array(buf))
        .digest("hex");
      const dominant = await image.stats().then((s) => {
        const r = s.dominant;
        return `#${r.r.toString(16).padStart(2, "0")}${r.g
          .toString(16)
          .padStart(2, "0")}${r.b.toString(16).padStart(2, "0")}`;
      });

      const created = await db.image.create({
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

      await db.recipeImage.create({
        data: {
          recipeId: input.recipeId,
          imageId: created.id,
          role: input.role as unknown as "HERO" | "GALLERY" | "STEP",
          order: input.order,
          caption: input.caption ?? null,
          stepGroupId: input.stepGroupId,
          stepIndex: input.stepIndex,
        },
      });

      return created;
    }),

  deleteRecipeImage: protectedProcedure
    .input(
      z.union([
        z.object({ recipeImageId: z.number() }),
        z.object({ imageId: z.number(), recipeId: z.number() }),
      ]),
    )
    .mutation(async ({ ctx, input }) => {
      // Resolve the RecipeImage to delete and verify ownership
      const where =
        "recipeImageId" in input
          ? { id: input.recipeImageId }
          : { imageId: input.imageId, recipeId: input.recipeId };

      const recipeImage = await db.recipeImage.findFirst({
        where,
        include: { image: true, recipe: { select: { userId: true } } },
      });

      if (!recipeImage) {
        throw new Error("Image link not found");
      }

      if (recipeImage.recipe.userId !== ctx.session.user.id) {
        throw new Error("Not authorized to delete this image");
      }

      // Delete the recipe-image link
      await db.recipeImage.delete({ where: { id: recipeImage.id } });

      // If no more links reference this image, delete the image and S3 object
      const remaining = await db.recipeImage.count({
        where: { imageId: recipeImage.imageId },
      });
      if (remaining === 0) {
        // Best-effort S3 cleanup; ignore failures so UI isn't blocked
        try {
          await deleteObject(recipeImage.image.key);
        } catch {}
        await db.image.delete({ where: { id: recipeImage.imageId } });
      }

      return { success: true } as const;
    }),
});
