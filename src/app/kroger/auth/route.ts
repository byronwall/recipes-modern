import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { doOAuth } from "~/server/kroger";

// http://recipes.byroni.us/auth?code=ipE_clTAYZqpwBrrBfZMGTT5CFTeORfw3rd_Sdqb

export async function GET(req: NextRequest) {
  console.log(new Date(), "kroger auth", req.nextUrl.searchParams);

  const session = await getServerAuthSession(req);

  console.log(new Date(), "kroger auth", session);

  const protocol = req.nextUrl.protocol;
  const host = req.nextUrl.host;

  if (!session) {
    redirect(`${protocol}://${host}/auth`);
  }

  const postData = req.nextUrl.searchParams;
  const code = postData.get("code");

  console.log(new Date(), "kroger auth", code);

  const didAuth = await doOAuth(false, code, session.user.id);

  console.log(new Date(), "kroger auth", didAuth);

  if (didAuth) {
    redirect(`${protocol}://${host}/list`);
  }

  return new Response("error occurred during auth");
}
