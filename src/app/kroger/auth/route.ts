import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { doOAuth } from "~/server/kroger";

// http://recipes.byroni.us/auth?code=ipE_clTAYZqpwBrrBfZMGTT5CFTeORfw3rd_Sdqb

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession();

  const protocol = req.nextUrl.protocol;
  const host = req.nextUrl.host;

  if (!session) {
    redirect(`${protocol}://${host}/auth`);
  }

  const postData = req.nextUrl.searchParams;
  const code = postData.get("code");

  if (!code) {
    return new Response("error occurred during auth");
  }

  const didAuth = await doOAuth(false, session.user.id, code);

  if (didAuth) {
    redirect(`${protocol}://${host}/list`);
  }

  return new Response("error occurred during auth");
}
