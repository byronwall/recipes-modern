import { z } from "zod";
import bcrypt from "bcrypt";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
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
      console.log("trying to create user", input);

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await db.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
        },
      });

      return user;
    }),

  getKrogerStatus: protectedProcedure.query(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    const user = await db.userExtras.findUnique({
      where: {
        userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }),
});
