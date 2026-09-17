"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { libraryKeys, photoKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export function useStorageUsage() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: libraryKeys.storage(),
    queryFn: () => api.library.storageUsage(),
    enabled: !!accessToken,
    staleTime: 60 * 1000,
  });
}

export function useImageKitAssets(enabled: boolean) {
  return useQuery({
    queryKey: libraryKeys.imagekitAssets(),
    queryFn: () => api.library.imagekitAssets(),
    enabled,
  });
}

export function useImportAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imagekitFileIds: string[]) => api.library.importAssets(imagekitFileIds),
    onSuccess: (imported) => {
      queryClient.invalidateQueries({ queryKey: photoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.storage() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.imagekitAssets() });
      toast.success(`Imported ${imported.length} photo${imported.length === 1 ? "" : "s"}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Import failed"),
  });
}
