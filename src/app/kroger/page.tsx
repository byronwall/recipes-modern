import Link from "next/link";
import { env } from "~/env";
import { useEnforceAuth } from "../useEnforceAuth";
import { UserKrogerStatus } from "./UserKrogerStatus";

export default async function KrogerPage() {
  await useEnforceAuth();

  const clientId = env.NEXT_CLIENT_ID;
  const redirectUri = env.NEXT_REDIRECT_URI;

  const krogerUrl =
    `https://api.kroger.com/v1/connect/oauth2/authorize?` +
    `client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=product.compact cart.basic:write`;

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-gray-100 p-4 text-center shadow-lg">
      <h1 className="text-4xl font-bold">Kroger Page</h1>
      <p>ENV bits</p>
      <p>CLIENT_ID: {clientId}</p>
      <p>REDIRECT_URI: {redirectUri}</p>
      <Link
        href={krogerUrl}
        // poppy button
        className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      >
        Sign in to Kroger
      </Link>

      <UserKrogerStatus />

      <p className="bg-orange-100 p-4 text-orange-900">
        This page is a work in progress. It is not functional yet.
      </p>
    </div>
  );
}
