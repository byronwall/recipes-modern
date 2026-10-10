"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

export function useRadioList<T extends string>(
  items: readonly T[],
  defaultValue: T,
  controlledValue?: T,
  onControlledValueChange?: (value: T) => void,
) {
  const [internalGroupMode, setInternalGroupMode] = useState(defaultValue);
  const groupMode = controlledValue ?? internalGroupMode;
  const setGroupMode = onControlledValueChange ?? setInternalGroupMode;

  const radioGroupComp = (
    <ToggleGroup
      type="single"
      value={groupMode}
      onValueChange={(value) => {
        if (value) setGroupMode(value as T);
      }}
      size="sm"
      className="flex justify-start gap-0.5 rounded-full bg-muted p-0.5"
    >
      {items.map((mode) => (
        <ToggleGroupItem
          key={mode}
          value={mode}
          className="h-7 rounded-full px-3 text-xs capitalize data-[state=on]:bg-background data-[state=on]:shadow-sm"
        >
          {mode}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
  return { groupMode, radioGroupComp };
}
