// signin via next-auth
import { LoginForm } from "./LoginForm";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { redirect } from "next/navigation";

export default async function AuthPage() {
  const session = await getServerAuthSession();
  if (session) {
    redirect("/");
  }

  // If there are no users, allow first-time registration on this screen
  const userCount = await db.user.count();
  const allowRegistration = userCount === 0;

  return (
    <div className="flex w-full justify-center px-4 pt-4">
      <div className="w-full max-w-sm">
        <LoginForm allowRegistration={allowRegistration} />
      </div>
    </div>
  );
}
