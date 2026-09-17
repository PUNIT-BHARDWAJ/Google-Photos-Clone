"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { photoKeys, libraryKeys } from "@/lib/query-keys";
import { NETWORK_ERROR_MESSAGE, getValidAccessToken, refreshAccessToken, type Photo } from "@/lib/api";

const MAX_CONCURRENT = 3;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/bmp",
  "image/tiff",
  "image/svg+xml",
];
const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp", "tiff", "tif", "svg"];
const DONE_LINGER_MS = 5000;
// Library refresh after uploads finish: trailing debounce so completions that
// land close together share one refetch, capped so a long batch still shows
// new photos arriving every few seconds instead of only at the very end.
const REFRESH_DEBOUNCE_MS = 500;
const REFRESH_MAX_WAIT_MS = 3000;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export type UploadStatus = "pending" | "uploading" | "done" | "error";

export type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  error: string | null;
};

function getExtension(filename: string): string | null {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === filename.length - 1) return null;
  return filename.slice(dotIndex + 1).toLowerCase();
}

// Mirrors PhotoService.validateUpload on the backend: browsers/OSes are
// inconsistent about File.type for drag-and-drop and HEIC in particular
// (often empty or the generic application/octet-stream), so a missing or
// generic type falls back to the file extension instead of being rejected.
function validateFile(file: File): string | null {
  const type = file.type.toLowerCase();
  const isKnownType = ACCEPTED_TYPES.includes(type);
  const isGenericOrMissingType = type === "" || type === "application/octet-stream";

  if (!isKnownType) {
    const extension = isGenericOrMissingType ? getExtension(file.name) : null;
    if (!extension || !ACCEPTED_EXTENSIONS.includes(extension)) {
      return "Unsupported file type";
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    return "File too large (max 50MB)";
  }
  return null;
}

class UploadHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// XHR bypasses lib/api's request(), so it needs its own token handling: the
// same up-front refresh of an expiring token, plus one refresh-and-resend if
// the server still answers 401 (e.g. the token was revoked).
async function uploadFileWithAuth(file: File, onProgress: (percent: number) => void): Promise<Photo> {
  try {
    return await uploadFile(file, await getValidAccessToken(), onProgress);
  } catch (error) {
    if (!(error instanceof UploadHttpError) || error.status !== 401) throw error;

    const outcome = await refreshAccessToken();
    if (outcome.status === "refreshed") return uploadFile(file, outcome.accessToken, onProgress);
    throw new Error(
      outcome.status === "unreachable" ? NETWORK_ERROR_MESSAGE : "Your session has expired. Please sign in again.",
    );
  }
}

// fetch() has no upload-progress event, so this needs XMLHttpRequest.
function uploadFile(file: File, token: string | null, onProgress: (percent: number) => void): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/photos/upload`);

    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Unexpected response from server"));
        }
        return;
      }
      let message = "Upload failed";
      try {
        const body = JSON.parse(xhr.responseText);
        if (body?.message) message = body.message;
      } catch {
        // ignore - use the generic message
      }
      reject(new UploadHttpError(message, xhr.status));
    };

    xhr.onerror = () => reject(new Error("Upload failed"));

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}

export function useUploadQueue() {
  const [items, setItems] = useState<UploadItem[]>([]);

  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const queryClient = useQueryClient();
  const prevActiveCountRef = useRef(0);

  // The runner below reads `items` from a render snapshot, and a render that
  // was already in flight when an item flipped to "uploading" still sees it as
  // "pending" - so snapshot state alone can dispatch the same file twice.
  // These refs are the synchronous source of truth for what has actually been
  // handed to XHR. An id leaves `startedIdsRef` only when the item is retried
  // or removed from the queue, never on settle, so no late snapshot can
  // restart a file that just finished.
  const startedIdsRef = useRef(new Set<string>());
  const inFlightCountRef = useRef(0);

  // Completions are counted as they happen: finished rows are removed from
  // `items` after DONE_LINGER_MS, so counting "done" rows when the queue
  // drains undercounts any batch that takes longer than that.
  const sessionDoneCountRef = useRef(0);
  const sessionFailedIdsRef = useRef(new Set<string>());

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshWaitStartRef = useRef<number | null>(null);

  // Each finished upload used to invalidate the photo list and storage usage
  // on its own - two refetches per file, ~60 for a 30-file batch. Now every
  // completion just (re)arms one shared timer: while other uploads are still
  // running it waits out the max-wait window (real uploads finish seconds
  // apart, so a bare 500ms debounce would still refetch per file), and once
  // the queue has drained it fires after the short debounce.
  const scheduleLibraryRefresh = useCallback((queueDrained: boolean) => {
    const now = Date.now();
    refreshWaitStartRef.current ??= now;
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const remainingMaxWait = REFRESH_MAX_WAIT_MS - (now - refreshWaitStartRef.current);
    const delay = Math.max(0, queueDrained ? Math.min(REFRESH_DEBOUNCE_MS, remainingMaxWait) : remainingMaxWait);

    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      refreshWaitStartRef.current = null;
      if (pathnameRef.current !== "/favorites") {
        queryClient.invalidateQueries({ queryKey: photoKeys.all });
        queryClient.invalidateQueries({ queryKey: libraryKeys.storage() });
        queryClient.invalidateQueries({ queryKey: libraryKeys.counts() });
      }
    }, delay);
  }, [queryClient]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const addFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;

    let rejectedCount = 0;
    const newItems: UploadItem[] = files.map((file) => {
      const error = validateFile(file);
      if (error) rejectedCount++;
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: error ? "error" : "pending",
        progress: 0,
        error,
      };
    });

    if (rejectedCount > 0) {
      toast.error(`${rejectedCount} file${rejectedCount === 1 ? "" : "s"} skipped (unsupported type or too large)`);
    }

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const retry = useCallback((id: string) => {
    startedIdsRef.current.delete(id);
    sessionFailedIdsRef.current.delete(id);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "pending", error: null, progress: 0 } : item)),
    );
  }, []);

  const dismiss = useCallback((id: string) => {
    startedIdsRef.current.delete(id);
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  // Concurrency runner: whenever the queue changes, top up "uploading" slots
  // from "pending" items, up to MAX_CONCURRENT. The whole scheduling body is
  // deferred into the setTimeout callback (never called synchronously at the
  // top of the effect) since starting an upload is a genuine side effect, not
  // state derived from props - it has to live somewhere, and a zero-delay
  // timer callback is the standard way to keep that out of the render path.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const slots = MAX_CONCURRENT - inFlightCountRef.current;
      if (slots <= 0) return;

      const toStart = items
        .filter((item) => item.status === "pending" && !startedIdsRef.current.has(item.id))
        .slice(0, slots);
      if (toStart.length === 0) return;

      // Claimed synchronously, before any await, so a runner firing from an
      // older snapshot sees these ids as taken.
      for (const item of toStart) {
        startedIdsRef.current.add(item.id);
      }
      inFlightCountRef.current += toStart.length;

      const toStartIds = new Set(toStart.map((item) => item.id));
      setItems((prev) => prev.map((item) => (toStartIds.has(item.id) ? { ...item, status: "uploading" } : item)));

      toStart.forEach((item) => {
        uploadFileWithAuth(item.file, (progress) => {
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress } : i)));
        })
          .then(() => {
            inFlightCountRef.current -= 1;
            sessionDoneCountRef.current += 1;
            setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "done", progress: 100 } : i)));
            scheduleLibraryRefresh(false);
            setTimeout(() => {
              startedIdsRef.current.delete(item.id);
              setItems((prev) => prev.filter((i) => i.id !== item.id));
              URL.revokeObjectURL(item.previewUrl);
            }, DONE_LINGER_MS);
          })
          .catch((error) => {
            inFlightCountRef.current -= 1;
            sessionFailedIdsRef.current.add(item.id);
            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? { ...i, status: "error", error: error instanceof Error ? error.message : "Upload failed" }
                  : i,
              ),
            );
          });
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [items, scheduleLibraryRefresh]);

  // Fires once when the queue fully drains (no more pending/uploading items).
  useEffect(() => {
    const activeCount = items.filter((item) => item.status === "pending" || item.status === "uploading").length;
    if (prevActiveCountRef.current > 0 && activeCount === 0) {
      // Batch finished: pull a pending library refresh forward to the short
      // debounce instead of letting it wait out the rest of the max-wait window.
      if (refreshTimerRef.current) scheduleLibraryRefresh(true);
      const doneCount = sessionDoneCountRef.current;
      const errorCount = sessionFailedIdsRef.current.size;
      if (errorCount === 0 && doneCount > 0) {
        toast.success(`${doneCount} photo${doneCount === 1 ? "" : "s"} uploaded successfully`);
      } else if (errorCount > 0) {
        toast.error(`${doneCount} uploaded, ${errorCount} failed`);
      }
      sessionDoneCountRef.current = 0;
      sessionFailedIdsRef.current.clear();
    }
    prevActiveCountRef.current = activeCount;
  }, [items, scheduleLibraryRefresh]);

  return { items, addFiles, retry, dismiss };
}
