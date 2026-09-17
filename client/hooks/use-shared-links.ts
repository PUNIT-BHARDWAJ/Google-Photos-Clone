"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { sharedLinkKeys } from "@/lib/query-keys";

export function useSharedLinks() {
  return useQuery({
    queryKey: sharedLinkKeys.lists(),
    queryFn: () => api.sharedLinks.list(),
  });
}

export function useCreatePhotoShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ photoId, expiryDays }: { photoId: string; expiryDays?: number }) =>
      api.photos.share(photoId, expiryDays),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sharedLinkKeys.lists() }),
    onError: () => toast.error("Failed to create share link"),
  });
}

export function useCreateAlbumShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, expiryDays }: { albumId: string; expiryDays?: number }) =>
      api.albums.share(albumId, expiryDays),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sharedLinkKeys.lists() }),
    onError: () => toast.error("Failed to create share link"),
  });
}

export function useRevokeSharedLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.sharedLinks.revoke(id),
    onSuccess: () => {
      toast.success("Link revoked");
      queryClient.invalidateQueries({ queryKey: sharedLinkKeys.lists() });
    },
    onError: () => toast.error("Failed to revoke link"),
  });
}

export function useSharedPhoto(token: string) {
  return useQuery({
    queryKey: sharedLinkKeys.publicPhoto(token),
    queryFn: () => api.public.getPhoto(token),
    retry: false,
  });
}

export function useSharedAlbum(token: string, enabled: boolean) {
  return useQuery({
    queryKey: sharedLinkKeys.publicAlbum(token),
    queryFn: () => api.public.getAlbum(token),
    retry: false,
    enabled,
  });
}
