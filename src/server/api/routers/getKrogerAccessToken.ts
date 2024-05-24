import { db } from "~/server/db";

export async function getKrogerAccessToken(userId: string) {
  const userExtras = await db.userExtras.findUnique({
    where: {
      userId,
    },
  });

  return userExtras?.krogerUserAccessToken;
}
