import { z } from "zod";
import bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const userRouter = createTRPCRouter({
  createUser: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // hash the password

      // server-side guard: only allow registration if no users exist
      const userCount = await db.user.count();
      if (userCount > 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Registration is disabled",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await db.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
        },
      });

      return user;
    }),
});
