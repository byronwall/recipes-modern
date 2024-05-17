"use client";

import { Button } from "~/components/ui/button";
import { type CookingTimer, useCookingMode } from "./useCookingMode";
import { cn } from "~/lib/utils";

type TimerProps = {
  timer: CookingTimer;
};
export function Timer({ timer }: TimerProps) {
  const { removeTimer, changeTimerDescription } = useCookingMode();

  const remaining = Math.floor((timer.endTime - Date.now()) / 1000);

  const isOver = remaining <= 0;

  const displayRemaining = Math.abs(remaining);

  const minutes = Math.floor(displayRemaining / 60);
  const seconds = displayRemaining % 60;

  return (
    <div
      key={timer.id}
      className={cn(
        "flex items-center justify-between gap-2 text-lg font-semibold",
        {
          "text-red-500": isOver,
        },
      )}
    >
      <div
        className="cursor-pointer hover:underline"
        onClick={() => {
          const newDescription = prompt(
            "Enter new description",
            timer.description,
          );
          if (newDescription) {
            changeTimerDescription(timer.id, newDescription);
          }
        }}
      >
        {timer.description} {minutes}:{seconds.toString().padStart(2, "0")}{" "}
        {isOver && " - Over!"}
      </div>

      <Button onClick={() => removeTimer(timer.id)}>Remove</Button>
    </div>
  );
}
