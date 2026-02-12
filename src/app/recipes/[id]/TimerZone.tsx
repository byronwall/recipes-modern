"use client";
import { Button } from "~/components/ui/button";
import { useCookingMode } from "./useCookingMode";
import { useEffect, useState } from "react";
import { Timer } from "./Timer";
import { Input } from "~/components/ui/input";

export function TimerZone() {
  const { cookingMode, timers, addTimer } = useCookingMode();

  const [, setDummy] = useState(0); // force re-render

  const [minutes, setMinutes] = useState("5");
  const [seconds, setSeconds] = useState("0");

  useEffect(() => {
    if (!cookingMode) return;

    const timeout = setInterval(() => {
      setDummy((prev) => prev + 1);
    }, 1000);

    // fire immediately
    setDummy((prev) => prev + 1);

    return () => clearTimeout(timeout);
  }, [cookingMode]);

  function handleNewTimer() {
    const minutesInt = parseInt(minutes || "0", 10);
    const secondsInt = parseInt(seconds || "0", 10);

    if (isNaN(minutesInt) || isNaN(secondsInt)) {
      return;
    }

    const duration = minutesInt * 60 + secondsInt;

    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    return addTimer({
      id: Date.now(),
      description: "Test timer",
      startTime,
      endTime,
    });
  }

  if (!cookingMode) return null;

  return (
    <div className="sticky bottom-0 right-0 -mx-4 -mb-4 min-h-10 w-screen max-w-full bg-purple-100 px-4 py-2 shadow-lg md:w-full">
      <div className="flex items-center justify-start gap-2 text-xl">
        <Button onClick={handleNewTimer}>Add Timer</Button>

        <Input
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-20 text-2xl"
        />
        <span> : </span>
        <Input
          type="number"
          value={seconds}
          onChange={(e) => setSeconds(e.target.value)}
          className="w-20 text-2xl"
        />
      </div>

      <div>
        {timers.map((timer) => (
          <Timer key={timer.id} timer={timer} />
        ))}
      </div>
    </div>
  );
}
