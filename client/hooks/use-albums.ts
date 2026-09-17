"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { albumKeys } from "@/lib/query-keys";

const PAGE_SIZE = 60;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useAlbums() {
  return useQuery({
    queryKey: albumKeys.lists(),
    queryFn: () => api.albums.list(),
  });
}

export function useAlbum(id: string | null) {
  return useQuery({
    queryKey: albumKeys.detail(id ?? ""),
    queryFn: () => api.albums.get(id as string),
    enabled: !!id,
  });
}

export function useAlbumPhotos(id: string | null) {
  return useInfiniteQuery({
    queryKey: albumKeys.photos(id ?? ""),
    queryFn: ({ pageParam }) => api.albums.photos(id as string, { page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
    enabled: !!id,
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => api.albums.create({ title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
      toast.success("Album created");
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to create album")),
  });
}

export function useUpdateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; coverPhotoId?: string }) =>
      api.albums.update(id, body),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
      queryClient.invalidateQueries({ queryKey: albumKeys.detail(id) });
      toast.success("Album updated");
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to update album")),
  });
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (id: string) => api.albums.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
      toast.success("Album deleted");
      router.replace("/albums");
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to delete album")),
  });
}

export function useAddPhotosToAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, photoIds }: { albumId: string; photoIds: string[] }) =>
      api.albums.addPhotos(albumId, photoIds),
    onSuccess: (_data, { albumId }) => {
      queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });
      queryClient.invalidateQueries({ queryKey: albumKeys.photos(albumId) });
      queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
      toast.success("Added to album");
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to add photos")),
  });
}

export function useRemovePhotoFromAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, photoId }: { albumId: string; photoId: string }) =>
      api.albums.removePhoto(albumId, photoId),
    onSuccess: (_data, { albumId }) => {
      queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });
      queryClient.invalidateQueries({ queryKey: albumKeys.photos(albumId) });
      queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
      toast.success("Removed from album");
    },
    onError: (error) => toast.error(errorMessage(error, "Failed to remove photo")),
  });
}
