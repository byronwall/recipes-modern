import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

export async function useEnforceAuth() {
  const session = await getServerAuthSession();

  console.log("session", session);
  if (!session) {
    redirect("/auth");
  }

  return session;
}
