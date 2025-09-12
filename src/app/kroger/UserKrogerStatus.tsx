"use client";

import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";

export function UserKrogerStatus() {
  const { data: userStatus } = api.kroger.getKrogerStatus.useQuery();

  const isAuthed = Boolean(userStatus?.krogerUserAccessToken);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        isAuthed
          ? "bg-green-100 text-green-800 ring-1 ring-green-200"
          : "bg-red-100 text-red-800 ring-1 ring-red-200",
      )}
      title={isAuthed ? "Connected to Kroger" : "Not connected to Kroger"}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isAuthed ? "bg-green-500" : "bg-red-500",
        )}
      />
      {isAuthed ? "Connected" : "Not connected"}
    </span>
  );
}
