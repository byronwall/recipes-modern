"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";

export function useRadioList(items: readonly string[], defaultValue: string) {
  const [groupMode, setGroupMode] = useState(defaultValue);

  const radioGroupComp = (
    <RadioGroup
      defaultValue={groupMode}
      onValueChange={(value) => setGroupMode(value)}
      className="flex flex-wrap gap-2"
    >
      {items.map((mode) => (
        <div
          key={mode}
          className="flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2"
        >
          <RadioGroupItem value={mode} className="h-4 w-4" id={mode} />
          <Label
            className="cursor-pointer text-sm font-medium capitalize"
            htmlFor={mode}
          >
            {mode}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
  return { groupMode, radioGroupComp };
}
