import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { CardDescription, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <CardTitle className="text-3xl">Create account</CardTitle>
        <CardDescription>Start organizing your photos in one place</CardDescription>
      </div>
      <AuthForm mode="register" />
    </div>
  );
}