"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type AlbumSuggestion, type PageResponse, type Photo } from "@/lib/api";
import { aiKeys, albumKeys, libraryKeys, photoKeys } from "@/lib/query-keys";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Replaces one photo everywhere it's cached - timeline pages, search results,
 * album pages and its detail entry - so AI data shows up in an open viewer
 * without refetching whole lists.
 */
export function patchPhotoInCaches(queryClient: QueryClient, updated: Photo) {
  const patch = (data: unknown) => {
    if (!data || typeof data !== "object") return data;
    if ("pages" in data) {
      const infinite = data as InfiniteData<PageResponse<Photo>>;
      return {
        ...infinite,
        pages: infinite.pages.map((page) => ({
          ...page,
          content: page.content.map((photo) => (photo.id === updated.id ? updated : photo)),
        })),
      };
    }
    if ("id" in data && (data as Photo).id === updated.id) return updated;
    return data;
  };

  queryClient.setQueriesData({ queryKey: photoKeys.all }, patch);
  queryClient.setQueriesData({ queryKey: albumKeys.all }, patch);
}

export function useAiStatus({ poll = false }: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: aiKeys.status(),
    queryFn: () => api.ai.status(),
    staleTime: 60_000,
    // Every 5s while a bulk run is going, so progress moves on its own.
    refetchInterval: (query) => (poll && query.state.data?.job?.running ? 5000 : false),
  });
}

/** Whether AI features are usable - false while loading, so nothing AI flashes in and out. */
export function useAiEnabled() {
  const { data } = useAiStatus();
  return data?.configured ?? false;
}

export function useTopTags(enabled: boolean) {
  return useQuery({
    queryKey: aiKeys.topTags(),
    queryFn: () => api.ai.topTags(8),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useAnalyzePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoId: string) => api.photos.aiAnalyze(photoId),
    onSuccess: (photo) => {
      patchPhotoInCaches(queryClient, photo);
      queryClient.invalidateQueries({ queryKey: aiKeys.all });
    },
    onError: async (error, photoId) => {
      toast.error(errorMessage(error, "AI analysis failed"));
      // A failed run stores its error on the photo - show it with a Retry button.
      try {
        patchPhotoInCaches(queryClient, await api.photos.get(photoId));
      } catch {
        // The toast already told the user; the panel keeps its previous state.
      }
    },
  });
}

/**
 * Polls a photo while its automatic post-upload analysis is running, then
 * patches the result into the caches.
 */
export function usePendingAnalysis(photo: Photo, enabled: boolean) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: photoKeys.detail(photo.id),
    queryFn: () => api.photos.get(photo.id),
    enabled: enabled && photo.aiPending,
    refetchInterval: (query) => (query.state.data && !query.state.data.aiPending ? false : 3000),
  });

  useEffect(() => {
    if (data && !data.aiPending && photo.aiPending) {
      patchPhotoInCaches(queryClient, data);
      queryClient.invalidateQueries({ queryKey: aiKeys.all });
    }
  }, [data, photo.aiPending, queryClient]);
}

export function useAnalyzeAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.ai.analyzeAll(),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: aiKeys.status() });
    },
    onError: (error) => toast.error(errorMessage(error, "Couldn't start AI analysis")),
  });
}

export function useCancelAnalyzeAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.ai.cancelAnalyzeAll(),
    onSuccess: (status) => {
      queryClient.setQueryData(aiKeys.status(), status);
      toast.success("Stopping AI analysis");
    },
    onError: (error) => toast.error(errorMessage(error, "Couldn't stop AI analysis")),
  });
}

export function useSuggestEdit() {
  return useMutation({
    mutationFn: ({ photoId, instruction }: { photoId: string; instruction: string }) =>
      api.photos.aiSuggestEdit(photoId, instruction),
    onError: (error) => toast.error(errorMessage(error, "Couldn't get an edit suggestion")),
  });
}

export function useSaveEdit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ photoId, operations }: { photoId: string; operations: string[] }) =>
      api.photos.aiSaveEdit(photoId, operations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photoKeys.lists() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.storage() });
      toast.success("Saved the edited copy to your library");
    },
    onError: (error) => toast.error(errorMessage(error, "Couldn't save the edited photo")),
  });
}

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export function useAlbumSuggestions() {
  return useQuery({
    queryKey: albumKeys.suggestions(),
    queryFn: () => api.albums.suggestions(browserTimeZone()),
    staleTime: 60_000,
  });
}

export function useCreateSuggestedAlbum() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (suggestion: AlbumSuggestion) => {
      const album = await api.albums.create({ title: suggestion.suggestedName });
      await api.albums.addPhotos(album.id, suggestion.photoIds);
      return album;
    },
    onSuccess: (album) => {
      queryClient.invalidateQueries({ queryKey: albumKeys.all });
      toast.success(`Created "${album.title}"`);
      router.push(`/albums/${album.id}`);
    },
    onError: (error) => {
      // The album may exist without its photos if adding them failed.
      queryClient.invalidateQueries({ queryKey: albumKeys.all });
      toast.error(errorMessage(error, "Couldn't create the album"));
    },
  });
}
