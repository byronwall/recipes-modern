import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { CreatePost } from "~/app/_components/create-post";
import { Button } from "~/components/ui/button";
import { Card, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { H1 } from "~/components/ui/typography";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function Home() {
  const recipes = await api.post.getRecipes();
  const session = await getServerAuthSession();

  return (
    <div>
      <Button>Click me</Button>

      <Input placeholder="Search" />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        {recipes.recipes.map((recipe) => (
          <Card key={recipe.name} className="h-40">
            <CardTitle className="p-2">
              <Link href={`/recipes/${recipe.id}`}>{recipe.name}</Link>
            </CardTitle>
          </Card>
        ))}
      </div>
    </div>
  );
}
