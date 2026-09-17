"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { googleLoginUrl } from "@/lib/api";
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "@/lib/validations/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.87-3c-1.08.72-2.46 1.14-4.07 1.14-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.75l4-3.11Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.63l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

function GoogleSignInButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        window.location.href = googleLoginUrl;
      }}
    >
      <GoogleIcon />
      Continue with Google
    </Button>
  );
}

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm(props: AuthFormProps) {
  return (
    <Suspense fallback={null}>
      <AuthFormContent {...props} />
    </Suspense>
  );
}

function AuthFormContent({ mode }: AuthFormProps) {
  const isLogin = mode === "login";
  const login = useLogin();
  const registerUser = useRegister();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") === "oauth2_failed") {
      toast.error("Google sign-in failed");
    }
  }, [searchParams]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  const pending = isLogin ? login.isPending : registerUser.isPending;
  const error = isLogin ? login.error : registerUser.error;
  const errorMessage =
    error instanceof Error ? error.message : isLogin ? "Unable to sign in" : "Unable to create account";

  if (isLogin) {
    const { register, handleSubmit, formState } = loginForm;

    return (
      <form
        onSubmit={handleSubmit((values) => login.mutate(values))}
        className="space-y-6"
      >
        <FieldGroup>
          <Field data-invalid={!!formState.errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!formState.errors.email}
              {...register("email")}
            />
            <FieldError errors={[formState.errors.email]} />
          </Field>

          <Field data-invalid={!!formState.errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={!!formState.errors.password}
              {...register("password")}
            />
            <FieldError errors={[formState.errors.password]} />
          </Field>
        </FieldGroup>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <FieldSeparator>Or</FieldSeparator>

        <GoogleSignInButton />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    );
  }

  const { register, handleSubmit, formState } = registerForm;

  return (
    <form
      onSubmit={handleSubmit((values) => registerUser.mutate(values))}
      className="space-y-6"
    >
      <FieldGroup>
        <Field data-invalid={!!formState.errors.displayName}>
          <FieldLabel htmlFor="displayName">Display name</FieldLabel>
          <Input
            id="displayName"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            aria-invalid={!!formState.errors.displayName}
            {...register("displayName")}
          />
          <FieldError errors={[formState.errors.displayName]} />
        </Field>

        <Field data-invalid={!!formState.errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!formState.errors.email}
            {...register("email")}
          />
          <FieldError errors={[formState.errors.email]} />
        </Field>

        <Field data-invalid={!!formState.errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={!!formState.errors.password}
            {...register("password")}
          />
          <FieldError errors={[formState.errors.password]} />
        </Field>
      </FieldGroup>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Spinner />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <FieldSeparator>Or</FieldSeparator>

      <GoogleSignInButton />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}