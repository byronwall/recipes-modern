"use client";

import { Label } from "@radix-ui/react-label";
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
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export function LoginForm({
  allowRegistration = false,
}: {
  allowRegistration?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // redirect hook
  const router = useRouter();

  const createUser = api.user.createUser.useMutation();

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      setErrorMessage(null);
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/",
        redirect: true,
      });
      // When redirect: true, NextAuth will navigate; result may be undefined
      // In case redirect is blocked, ensure we land on home
      if (result?.ok) {
        router.push("/");
      }
    } catch (err) {
      // no-op, surface minimal error UI below
      setErrorMessage("Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister() {
    setIsSubmitting(true);
    try {
      setErrorMessage(null);
      await createUser.mutateAsync({ email, password });
      // Auto-login after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/",
        redirect: true,
      });
      if (result?.ok) {
        router.push("/");
      }
    } catch (err) {
      setErrorMessage(
        createUser.error?.message || "Unable to register. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">
          {allowRegistration ? "Create account" : "Login"}
        </CardTitle>
        <CardDescription>
          {allowRegistration
            ? "No users found. Create the first account to get started."
            : "Enter your email and password to continue"}
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {errorMessage ? (
            <div className="text-sm text-red-600">{errorMessage}</div>
          ) : null}
          <Button
            type="button"
            className="w-full"
            onClick={allowRegistration ? handleRegister : handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? allowRegistration
                ? "Creating account..."
                : "Logging in..."
              : allowRegistration
                ? "Create account"
                : "Login"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
