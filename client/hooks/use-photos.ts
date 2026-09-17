"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type PageResponse, type Photo, type PhotoStatus } from "@/lib/api";
import { libraryKeys, photoKeys } from "@/lib/query-keys";

const PAGE_SIZE = 60;

export function usePhotos(status: PhotoStatus, starred?: boolean) {
  return useInfiniteQuery({
    queryKey: photoKeys.list(status, starred),
    queryFn: ({ pageParam }) => api.photos.list({ status, starred, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
  });
}

export function useSearchPhotos(query: string) {
  const trimmed = query.trim();

  return useInfiniteQuery({
    queryKey: photoKeys.search(trimmed),
    queryFn: ({ pageParam }) => api.photos.search({ q: trimmed, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
    enabled: trimmed.length > 0,
  });
}

function flipStarred(data: unknown, photoId: string, starred: boolean) {
  if (!data || typeof data !== "object" || !("pages" in data)) return data;
  const infinite = data as InfiniteData<PageResponse<Photo>>;
  return {
    ...infinite,
    pages: infinite.pages.map((page) => ({
      ...page,
      content: page.content.map((photo) => (photo.id === photoId ? { ...photo, starred } : photo)),
    })),
  };
}

export function useToggleStar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photo: Photo) => api.photos.toggleStar(photo.id),
    onMutate: async (photo) => {
      await queryClient.cancelQueries({ queryKey: photoKeys.all });
      const previous = queryClient.getQueriesData({ queryKey: photoKeys.all });

      queryClient.setQueriesData({ queryKey: photoKeys.all }, (data: unknown) =>
        flipStarred(data, photo.id, !photo.starred),
      );

      return { previous };
    },
    onError: (_error, _photo, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error("Failed to update favorite");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: photoKeys.all });
    },
  });
}

export function usePhotoMetadata(photoId: string, enabled: boolean) {
  return useQuery({
    queryKey: photoKeys.metadata(photoId),
    queryFn: () => api.photos.getMetadata(photoId),
    enabled,
  });
}

export function useBulkSetStarred() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photos, starred }: { photos: Photo[]; starred: boolean }) => {
      const targets = photos.filter((photo) => photo.starred !== starred);
      await Promise.allSettled(targets.map((photo) => api.photos.toggleStar(photo.id)));
    },
    onSuccess: (_data, { starred }) => {
      toast.success(starred ? "Added to favorites" : "Removed from favorites");
      queryClient.invalidateQueries({ queryKey: photoKeys.all });
    },
    onError: () => toast.error("Failed to update favorites"),
  });
}

export function usePhoto(id: string | null) {
  return useQuery({
    queryKey: photoKeys.detail(id ?? ""),
    queryFn: () => api.photos.get(id as string),
    enabled: !!id,
  });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function useInvalidatePhotos() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: photoKeys.lists() });
    queryClient.invalidateQueries({ queryKey: libraryKeys.storage() });
  };
}

export function useUploadPhotos() {
  const invalidate = useInvalidatePhotos();

  return useMutation({
    mutationFn: async (files: File[]) => {
      const results = await Promise.allSettled(files.map((file) => api.photos.upload(file)));
      const failed = results.filter((result) => result.status === "rejected").length;
      return { succeeded: results.length - failed, failed };
    },
    onSuccess: ({ succeeded, failed }) => {
      if (succeeded) {
        toast.success(`Uploaded ${succeeded} photo${succeeded === 1 ? "" : "s"}`);
      }
      if (failed) {
        toast.error(`${failed} photo${failed === 1 ? "" : "s"} failed to upload`);
      }
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error, "Upload failed")),
  });
}

export function useArchivePhotos() {
  const invalidate = useInvalidatePhotos();
  return useMutation({
    mutationFn: (photoIds: string[]) => api.photos.archive(photoIds),
    onSuccess: (_data, photoIds) => {
      toast.success(`Archived ${photoIds.length} photo${photoIds.length === 1 ? "" : "s"}`);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to archive")),
  });
}

export function useTrashPhotos() {
  const invalidate = useInvalidatePhotos();
  return useMutation({
    mutationFn: (photoIds: string[]) => api.photos.trash(photoIds),
    onSuccess: (_data, photoIds) => {
      toast.success(`Moved ${photoIds.length} photo${photoIds.length === 1 ? "" : "s"} to trash`);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to move to trash")),
  });
}

export function useRestorePhotos() {
  const invalidate = useInvalidatePhotos();
  return useMutation({
    mutationFn: (photoIds: string[]) => api.photos.restore(photoIds),
    onSuccess: (_data, photoIds) => {
      toast.success(`Restored ${photoIds.length} photo${photoIds.length === 1 ? "" : "s"}`);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to restore")),
  });
}

export function useDeletePhotosForever() {
  const invalidate = useInvalidatePhotos();
  return useMutation({
    mutationFn: (photoIds: string[]) => api.photos.deletePermanent(photoIds),
    onSuccess: (_data, photoIds) => {
      toast.success(`Deleted ${photoIds.length} photo${photoIds.length === 1 ? "" : "s"} forever`);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to delete")),
  });
}
