"use client";

import { api } from "~/trpc/react";

export function UserKrogerStatus() {
  const { data: userStatus } = api.kroger.getKrogerStatus.useQuery();

  return (
    <div>
      <h1>Kroger Status</h1>
      <p>Are you authorized with Kroger?</p>
      <p>{userStatus?.krogerUserAccessToken ? "Yes" : "No"}</p>
    </div>
  );
}
