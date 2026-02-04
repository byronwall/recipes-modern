"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

export function useRadioList(items: readonly string[], defaultValue: string) {
  const [groupMode, setGroupMode] = useState(defaultValue);

  const radioGroupComp = (
    <ToggleGroup
      type="single"
      value={groupMode}
      onValueChange={(value) => {
        if (value) setGroupMode(value);
      }}
      variant="outline"
      size="sm"
      className="flex flex-wrap justify-start gap-2"
    >
      {items.map((mode) => (
        <ToggleGroupItem key={mode} value={mode} className="capitalize">
          {mode}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
  return { groupMode, radioGroupComp };
}
