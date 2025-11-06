import { useEnforceAuth } from "~/app/useEnforceAuth";
import { helpers } from "~/trpc/helpers";
import { TouchUpClient } from "./touchup-client";

export default async function TouchUpPage({
  params,
}: {
  params: { id: string };
}) {
  await useEnforceAuth();
  await (await helpers())?.recipe.getRecipe.prefetch({ id: +params.id });
  return <TouchUpClient id={+params.id} />;
}
