"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type AiTransformRequest } from "@/lib/api";
import { libraryKeys, photoKeys } from "@/lib/query-keys";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useAiPreview() {
  return useMutation({
    mutationFn: ({ photoId, body }: { photoId: string; body: AiTransformRequest }) =>
      api.photos.aiPreview(photoId, body),
    onError: (error) => toast.error(errorMessage(error, "Failed to generate preview")),
  });
}

export function useApplyAiTransform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ photoId, body }: { photoId: string; body: AiTransformRequest }) =>
      api.photos.aiApply(photoId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.storage() });
      toast.success("Created an edited copy in your library");
    },
    onError: (error) => toast.error(errorMessage(error, "AI edit failed")),
  });
}
