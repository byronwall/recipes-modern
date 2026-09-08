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
        email: email.trim(),
        password,
        callbackUrl: "/",
        redirect: false,
      });
      if (!result?.ok) {
        setErrorMessage("Invalid email or password");
        return;
      }
      router.push("/");
      router.refresh();
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
      await createUser.mutateAsync({ email: email.trim(), password });
      // Auto-login after successful registration
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        callbackUrl: "/",
        redirect: false,
      });
      if (!result?.ok) {
        setErrorMessage("Account created. Please reload and sign in.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unable to register. Please try again.",
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
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void (allowRegistration ? handleRegister() : handleSubmit());
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              autoComplete="email"
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
              autoComplete={
                allowRegistration ? "new-password" : "current-password"
              }
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {errorMessage ? (
            <div role="alert" className="text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? allowRegistration
                ? "Creating account..."
                : "Logging in..."
              : allowRegistration
                ? "Create account"
                : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
