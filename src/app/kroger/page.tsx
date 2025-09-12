import Link from "next/link";
import { env } from "~/env";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { H1, Muted } from "~/components/ui/typography";
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

  const elide = (value?: string) =>
    value && value.length > 14
      ? `${value.slice(0, 8)}…${value.slice(-6)}`
      : value ?? "";

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <H1 className="mb-2">Kroger</H1>
        <UserKrogerStatus />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect your account</CardTitle>
          <CardDescription>
            Sign in to enable product search and add-to-cart from your shopping
            list.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Link href={krogerUrl}>Sign in to Kroger</Link>

          <Muted>Requires a Kroger account</Muted>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Developer details</CardTitle>
          <CardDescription>Values loaded from environment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 items-baseline gap-2 sm:grid-cols-3">
            <div className="text-sm text-muted-foreground">Client ID</div>
            <div className="break-all font-mono text-sm sm:col-span-2">
              {elide(clientId)}
            </div>

            <div className="text-sm text-muted-foreground">Redirect URI</div>
            <div className="break-all font-mono text-sm sm:col-span-2">
              {redirectUri}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
