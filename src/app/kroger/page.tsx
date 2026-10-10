import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { env } from "~/env";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PageHeader } from "~/components/layout/PageHeader";
import { useEnforceAuth } from "../useEnforceAuth";
import { UserKrogerStatus } from "./UserKrogerStatus";

export default async function KrogerPage() {
  await useEnforceAuth();

  const clientId = env.KROGER_CLIENT_ID;
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
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Kroger"
        description="Product search and add-to-cart for your shopping list."
        actions={<UserKrogerStatus />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connect your account</CardTitle>
          <CardDescription>
            Sign in with Kroger to search products and send shopping list items
            straight to your cart. You can reconnect at any time if your session
            expires.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href={krogerUrl} className="hover:no-underline">
              Sign in to Kroger
              <ExternalLink className="ml-1 h-4 w-4 shrink-0" />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Requires a Kroger account
          </span>
        </CardContent>
      </Card>

      <details className="group rounded-2xl border bg-card/70 px-6 py-4 text-sm">
        <summary className="cursor-pointer select-none font-medium text-muted-foreground group-open:mb-3">
          Developer details
        </summary>
        <div className="grid grid-cols-1 items-baseline gap-2 sm:grid-cols-3">
          <div className="text-muted-foreground">Client ID</div>
          <div className="break-all font-mono sm:col-span-2">
            {elide(clientId)}
          </div>

          <div className="text-muted-foreground">Redirect URI</div>
          <div className="break-all font-mono sm:col-span-2">
            {redirectUri}
          </div>
        </div>
      </details>
    </div>
  );
}
