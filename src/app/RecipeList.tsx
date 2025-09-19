"use client";

import { RecipeType, type Recipe } from "@prisma/client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { api } from "~/trpc/react";
import { RecipeActions } from "./recipes/[id]/RecipeActions";

const defaultRecipes: Recipe[] = [];

type RecipeWithTags = Recipe & {
  tags?: { tag: { id: string; name: string } }[];
};

export function RecipeList() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<RecipeType | undefined>(undefined);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<{ slug: string; name: string }[]>([]);

  const { data: _recipes } = api.recipe.list.useQuery({
    type,
    includeTags: tags.map((t) => t.slug),
  });

  const recipes: RecipeWithTags[] =
    (_recipes as RecipeWithTags[] | undefined) ??
    (defaultRecipes as RecipeWithTags[]);

  // prevent undefined?
  const filteredRecipes = useMemo(
    () =>
      recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [recipes, search],
  );

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name"
          className="max-w-xs"
        />

        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">Type</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="flex flex-wrap "
            value={(type ?? "ALL") as string}
            onValueChange={(v) => {
              if (!v || v === "ALL") {
                setType(undefined);
              } else {
                setType(v as RecipeType);
              }
            }}
          >
            <ToggleGroupItem value="ALL">All</ToggleGroupItem>
            {Object.values(RecipeType).map((t) => (
              <ToggleGroupItem key={t} value={t}>
                {t}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-2">
          <Label>Tags</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag"
                className="max-w-[200px]"
              />
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0">
              <TagSearchList
                query={tagInput}
                onPick={(tag) => {
                  const exists = tags.some((t) => t.slug === tag.slug);
                  if (!exists) setTags([...tags, tag]);
                  setTagInput("");
                }}
              />
            </PopoverContent>
          </Popover>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t.slug} className="rounded bg-muted px-2 py-1 text-xs">
                {t.name}
                <button
                  className="ml-1"
                  onClick={() => setTags(tags.filter((x) => x.slug !== t.slug))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecipes.map((recipe) => (
              <tr key={recipe.id} className="border-t">
                <td className="px-3 py-2">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="hover:underline"
                  >
                    <div className="flex flex-col">
                      <span className="whitespace-nowrap font-medium">
                        {recipe.name}
                      </span>
                      {recipe.description &&
                      recipe.description.trim().toLowerCase() !== "desc" ? (
                        <span className="line-clamp-2 max-w-[48ch] text-muted-foreground">
                          {recipe.description}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <span className="rounded border px-2 py-0.5 text-xs">
                      {recipe.type}
                    </span>
                    {recipe.tags?.map((rt) => (
                      <span
                        key={rt.tag.id}
                        className="rounded bg-muted px-2 py-0.5 text-xs"
                      >
                        {rt.tag.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex gap-1">
                    <RecipeActions recipeId={recipe.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TagSearchList(props: {
  query: string;
  onPick: (tag: { slug: string; name: string }) => void;
}) {
  const { query, onPick } = props;
  const { data } = api.tag.search.useQuery({ q: query, limit: 10 });
  return (
    <div className="max-h-64 overflow-auto py-1">
      {data?.length ? (
        data.map((t) => (
          <button
            key={t.id}
            className="block w-full px-3 py-2 text-left hover:bg-muted"
            onClick={() => onPick({ slug: t.slug, name: t.name })}
          >
            {t.name}
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-muted-foreground">No tags</div>
      )}
      {query.trim() && (
        <button
          className="block w-full px-3 py-2 text-left hover:bg-muted"
          onClick={() =>
            onPick({
              slug: query.trim().toLowerCase().replace(/\s+/g, "-"),
              name: query,
            })
          }
        >
          Use &quot;{query}&quot;
        </button>
      )}
    </div>
  );
}
