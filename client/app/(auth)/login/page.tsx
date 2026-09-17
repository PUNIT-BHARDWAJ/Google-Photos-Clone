import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { CardDescription, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <CardTitle className="text-3xl">Sign in</CardTitle>
        <CardDescription>Enter your credentials to continue</CardDescription>
      </div>
      <AuthForm mode="login" />
    </div>
  );
}