"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";

type GuestGuardProps = {
  children: React.ReactNode;
  redirectTo?: string;
};

// Persist hydration is external state (localStorage), so it's read through
// useSyncExternalStore instead of being copied into useState from an effect.
// The server snapshot is `false`, so SSR and the hydration render both show
// the spinner and never mismatch whatever the saved session holds.
function subscribeToHydration(onStoreChange: () => void) {
  return useAuthStore.persist?.onFinishHydration(onStoreChange) ?? (() => {});
}

function getHydrated() {
  return useAuthStore.persist?.hasHydrated() ?? true;
}

function getServerHydrated() {
  return false;
}

/** For login/register pages - redirect away if already logged in */
export function GuestGuard({ children, redirectTo = "/photos" }: GuestGuardProps) {
  const router = useRouter();
  const isReady = useSyncExternalStore(subscribeToHydration, getHydrated, getServerHydrated);
  const isLoggedIn = useAuthStore((state) => !!state.accessToken);

  useEffect(() => {
    if (isReady && isLoggedIn) {
      router.replace(redirectTo);
    }
  }, [isReady, isLoggedIn, redirectTo, router]);

  if (!isReady || isLoggedIn) {
    return (
      <div className="flex min-h-full items-center justify-center bg-background text-muted-foreground">
        <Spinner className="size-6" />
      </div>
    );
  }

  return children;
}