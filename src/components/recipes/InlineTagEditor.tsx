"use client";

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { api } from "~/trpc/react";

export function InlineTagEditor(props: {
  values: string[];
  onChange: (vals: string[]) => void;
}) {
  const { values, onChange } = props;
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { data } = api.tag.search.useQuery({ q: input, limit: 10 });
  const lowerValues = values.map((v) => v.toLowerCase());
  const filteredSuggestions =
    data?.filter((t) => !lowerValues.includes(t.name.toLowerCase())) ?? [];

  function addTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = values.some(
      (v) => v.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) return;
    onChange([...values, trimmed]);
    setInput("");
  }

  function removeTag(name: string) {
    onChange(values.filter((v) => v !== name));
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
          >
            {v}
            <button
              className="-mr-1 ml-1 rounded px-1 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground"
              onClick={() => removeTag(v)}
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a tag"
          className="max-w-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
          }}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Add tag">
              <ChevronDown className="h-4 w-4" />
              Add tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1">
            <div className="max-h-56 overflow-auto">
              {filteredSuggestions.length ? (
                filteredSuggestions.map((t) => (
                  <button
                    key={t.id}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => addTag(t.name)}
                  >
                    {t.name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No tags
                </div>
              )}
              {input.trim() && (
                <button
                  className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => addTag(input)}
                >
                  Create “{input}”
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
