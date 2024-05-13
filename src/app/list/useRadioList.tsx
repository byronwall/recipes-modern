"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";

export function useRadioList(items: readonly string[], defaultValue: string) {
  const [groupMode, setGroupMode] = useState(defaultValue);

  const radioGroupComp = (
    <div>
      <RadioGroup
        defaultValue={groupMode}
        onValueChange={(value) => setGroupMode(value)}
      >
        {items.map((mode) => (
          <div key={mode} className="flex items-center space-x-2">
            <RadioGroupItem value={mode} />
            <Label>{mode}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
  return { groupMode, radioGroupComp };
}
