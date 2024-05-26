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
      className="flex gap-2"
    >
      {items.map((mode) => (
        <div key={mode} className="flex items-center space-x-2">
          <RadioGroupItem value={mode} className="h-6 w-6" id={mode} />
          <Label
            className="cursor-pointer text-lg font-medium hover:bg-gray-100"
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
