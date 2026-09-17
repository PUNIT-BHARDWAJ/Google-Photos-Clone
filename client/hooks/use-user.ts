"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type UpdateProfileRequest } from "@/lib/api";
import { authKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => api.user.updateProfile(body),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(authKeys.me(), user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: Required<Pick<UpdateProfileRequest, "currentPassword" | "newPassword">>) =>
      api.user.updateProfile(body),
    onSuccess: () => toast.success("Password updated"),
  });
}
