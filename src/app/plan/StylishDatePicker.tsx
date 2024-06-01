"use client";

import { PopoverContent } from "@radix-ui/react-popover";
import { Calendar } from "~/components/ui/calendar";
import { Popover, PopoverTrigger } from "~/components/ui/popover";

type StylishDatePickerProps = {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
};
export function StylishDatePicker({
  value = new Date(),
  onChange,
}: StylishDatePickerProps) {
  const shortMonth = new Date(value).toLocaleDateString("en-US", {
    month: "short",
  });

  return (
    <Popover>
      <PopoverTrigger className="">
        <div className="flex  flex-1 flex-col items-center justify-center border-r px-2  ">
          <div className="text-lg font-semibold">{shortMonth}</div>
          <div className="text-4xl font-bold">{new Date(value).getDate()}</div>
          <div className="text-xs font-bold text-gray-500">
            {new Date(value).toLocaleDateString("en-US", {
              weekday: "short",
            })}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="z-10 border border-black bg-white">
        <Calendar
          mode="single"
          selected={value}
          title="Select date"
          onSelect={onChange}
        />
      </PopoverContent>
    </Popover>
  );
}
