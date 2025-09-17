// signin via next-auth
import { LoginForm } from "./LoginForm";
import { getServerAuthSession } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function AuthPage() {
  const session = await getServerAuthSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex w-full justify-center px-4 pt-4">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
