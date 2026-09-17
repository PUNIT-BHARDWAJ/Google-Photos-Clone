"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

function OAuth2CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (!accessToken || !refreshToken) {
      toast.error("Google sign-in failed");
      router.replace("/login");
      return;
    }

    useAuthStore.getState().setTokens(accessToken, refreshToken);

    api
      .me()
      .then((user) => {
        useAuthStore.getState().setUser(user);
        router.replace("/photos");
      })
      .catch(() => {
        useAuthStore.getState().clearAuth();
        toast.error("Google sign-in failed");
        router.replace("/login");
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-full items-center justify-center bg-background text-muted-foreground">
      <Spinner className="size-6" />
    </div>
  );
}

export default function OAuth2CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-background text-muted-foreground">
          <Spinner className="size-6" />
        </div>
      }
    >
      <OAuth2CallbackContent />
    </Suspense>
  );
}
