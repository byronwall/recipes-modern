"use client";

import { Label } from "@radix-ui/react-label";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

export function LoginForm(props: { mode: "login" | "signup" }) {
  const createUserMutation = api.user.createUser.useMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // redirect hook
  const router = useRouter();

  async function handleClick() {
    if (props.mode === "login") {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/");
        return;
      }

      alert("Invalid login, try again");
    } else {
      await createUserMutation.mutateAsync({
        email,
        password,
      });

      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      router.push("/");
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">
          {props.mode === "login" ? "Login" : "Sign Up"}
        </CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link href="#" className="ml-auto inline-block text-sm underline">
                Forgot your password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" onClick={handleClick}>
            {props.mode === "login" ? "Login" : "Sign Up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
