// import { useAuthStore } from "@/hooks/use-auth";

import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const NETWORK_ERROR_MESSAGE = "Unable to connect to server. Please try again later.";

/** True when a request failed because the server couldn't be reached at all. */
export function isNetworkError(error: unknown) {
  return error instanceof Error && error.message === NETWORK_ERROR_MESSAGE;
}

// OAuth2 endpoints are registered at the servlet root by Spring Security, not
// under the /api prefix our own controllers use.
const API_ROOT = API_URL.replace(/\/api\/?$/, "");
export const googleLoginUrl = `${API_ROOT}/oauth2/authorization/google`;

export type User = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type PhotoStatus = "ACTIVE" | "ARCHIVE" | "TRASH";

export type AiTransformType =
  | "REMOVE_BACKGROUND"
  | "BACKGROUND_AND_SHADOW"
  | "CHANGE_BACKGROUND"
  | "GENERATIVE_FILL"
  | "SMART_CROP"
  | "OBJECT_CROP"
  | "RETOUCH"
  | "UPSCALE"
  | "AI_EDIT";

export type Photo = {
  id: string;
  imageKitFileId: string;
  fileName: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  status: PhotoStatus;
  createdAt: string;
  deletedAt: string | null;
  parentPhotoId: string | null;
  aiTransformType: AiTransformType | null;
  starred: boolean;
  dateTaken: string | null;
  hasCameraData: boolean;
  hasGpsData: boolean;
};

export type PhotoMetadata = {
  photoId: string;
  dateTaken: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  focalLength: string | null;
  aperture: string | null;
  iso: number | null;
  shutterSpeed: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  latitude: number | null;
  longitude: number | null;
  fileSize: number | null;
};

export type Album = {
  id: string;
  title: string;
  coverPhotoId: string | null;
  coverThumbnailUrl: string | null;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type StorageUsage = {
  libraryUsedBytes: number;
  libraryPhotoCount: number;
  imagekitBandwidthBytes: number | null;
  imagekitStorageBytes: number | null;
};

export type AiTransformRequest = {
  type: AiTransformType;
  prompt?: string;
  width?: number;
  height?: number;
  focusObject?: string;
};

export type AiTransformPreview = {
  previewUrl: string;
  type: AiTransformType;
  transformChain: string;
};

export type UpdateProfileRequest = {
  displayName?: string;
  currentPassword?: string;
  newPassword?: string;
};

export type SharedLink = {
  id: string;
  token: string;
  url: string;
  createdAt: string;
  expiresAt: string | null;
  targetType: "PHOTO" | "ALBUM";
  targetId: string;
  targetTitle: string;
  targetThumbnailUrl: string | null;
};

export type PublicPhoto = {
  fileName: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  dateTaken: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
};

export type PublicAlbum = {
  title: string;
  photos: PublicPhoto[];
};

export type ImageKitAsset = {
  fileId: string;
  fileName: string;
  url: string;
  thumbnailUrl: string;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  alreadyImported: boolean;
};

export type RefreshOutcome =
  | { status: "refreshed"; accessToken: string }
  // The server looked at the refresh token and refused it - the session is over.
  | { status: "rejected" }
  // No verdict: the server was unreachable or errored. The session may be fine.
  | { status: "unreachable" };

// Backoff between refresh attempts when the server can't be reached.
const REFRESH_RETRY_DELAYS_MS = [1000, 3000, 9000];
const CONNECTION_TOAST_ID = "connection-status";

async function attemptRefresh(refreshToken: string): Promise<RefreshOutcome> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return { status: "unreachable" };
  }

  // Only an explicit verdict on the token itself ends the session. A 5xx (the
  // database being down, a restart in progress) says nothing about the token.
  if (response.status === 400 || response.status === 401 || response.status === 403) {
    return { status: "rejected" };
  }
  if (!response.ok) return { status: "unreachable" };

  try {
    const data: AuthResponse = await response.json();
    useAuthStore.getState().setAuth(data);
    return { status: "refreshed", accessToken: data.accessToken };
  } catch {
    return { status: "unreachable" };
  }
}

// Refresh rotates the refresh token server-side (the old one is deleted), so
// concurrent 401s must share a single in-flight refresh - retries included -
// rather than racing each other with the same token.
let refreshPromise: Promise<RefreshOutcome> | null = null;

export function refreshAccessToken(): Promise<RefreshOutcome> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    useAuthStore.getState().clearAuth();
    return Promise.resolve({ status: "rejected" });
  }

  refreshPromise ??= (async () => {
    let outcome = await attemptRefresh(refreshToken);
    let retried = false;

    for (const delay of REFRESH_RETRY_DELAYS_MS) {
      if (outcome.status !== "unreachable") break;
      retried = true;
      toast.loading("Connection lost. Retrying...", { id: CONNECTION_TOAST_ID });
      await new Promise((resolve) => setTimeout(resolve, delay));
      outcome = await attemptRefresh(refreshToken);
    }

    if (outcome.status === "rejected") {
      toast.dismiss(CONNECTION_TOAST_ID);
      useAuthStore.getState().clearAuth();
    } else if (outcome.status === "unreachable") {
      // Keep the tokens: a network blip or backend restart must not sign the
      // user out. The next request after the server is back refreshes again.
      toast.error("Unable to connect. Your session will resume when the connection is restored.", {
        id: CONNECTION_TOAST_ID,
        duration: 8000,
      });
    } else if (retried) {
      toast.success("Connection restored", { id: CONNECTION_TOAST_ID });
    }
    return outcome;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// Refresh this long before `exp`, so a token can't lapse between the check and
// the request reaching the server.
const ACCESS_TOKEN_EXPIRY_SKEW_MS = 30_000;

function accessTokenExpiresSoon(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 - Date.now() < ACCESS_TOKEN_EXPIRY_SKEW_MS;
  } catch {
    // Not a readable JWT - let the server decide, and the 401 path handle it.
    return false;
  }
}

/**
 * The access token to send, refreshed first when it's expired or about to be.
 * Sending a token we already know is dead only buys a 401 round trip - and the
 * browser logs every such 401 to the console on each page load after an idle
 * spell. Throws NETWORK_ERROR_MESSAGE when a needed refresh can't reach the
 * server; returns null when the session is over.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const token = useAuthStore.getState().accessToken;
  if (!token || !accessTokenExpiresSoon(token)) return token;

  const outcome = await refreshAccessToken();
  if (outcome.status === "refreshed") return outcome.accessToken;
  if (outcome.status === "unreachable") throw new Error(NETWORK_ERROR_MESSAGE);
  return null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
  isRetry = false,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = await getValidAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    // fetch only rejects when no HTTP response arrived at all (server down,
    // offline, DNS, CORS) - the browser's own "Failed to fetch" / "Load
    // failed" text means nothing to users. Deliberate aborts pass through.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (response.status === 401 && auth && !isRetry) {
    const outcome = await refreshAccessToken();
    if (outcome.status === "refreshed") {
      return request<T>(path, options, auth, true);
    }
    if (outcome.status === "unreachable") {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
  }

  if (!response.ok) {
    // Try to read { message } from the backend; otherwise use a generic error
    let message = "Request failed";
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  register: (body: { email: string; password: string; displayName: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }, false),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }, false),

  logout: () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    return request<void>(
      "/auth/logout",
      { method: "POST", body: JSON.stringify({ refreshToken }) },
      false,
    );
  },

  refresh: (refreshToken: string) =>
    request<AuthResponse>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }, false),

  me: () => request<User>("/auth/me"),

  user: {
    updateProfile: (body: UpdateProfileRequest) =>
      request<User>("/user/profile", { method: "PUT", body: JSON.stringify(body) }),
  },

  photos: {
    list: (params: { status: PhotoStatus; starred?: boolean; page?: number; size?: number }) => {
      const query = new URLSearchParams({
        status: params.status,
        page: String(params.page ?? 0),
        size: String(params.size ?? 60),
      });
      if (params.starred !== undefined) {
        query.set("starred", String(params.starred));
      }
      return request<PageResponse<Photo>>(`/photos?${query.toString()}`);
    },

    get: (id: string) => request<Photo>(`/photos/${id}`),

    getMetadata: (id: string) => request<PhotoMetadata>(`/photos/${id}/metadata`),

    toggleStar: (id: string) => request<Photo>(`/photos/${id}/star`, { method: "PUT" }),

    search: (params: { q: string; status?: PhotoStatus; page?: number; size?: number }) => {
      const query = new URLSearchParams({
        q: params.q,
        status: params.status ?? "ACTIVE",
        page: String(params.page ?? 0),
        size: String(params.size ?? 60),
      });
      return request<PageResponse<Photo>>(`/photos/search?${query.toString()}`);
    },

    upload: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<Photo>("/photos/upload", { method: "POST", body: formData });
    },

    archive: (photoIds: string[]) =>
      request<void>("/photos/archive", { method: "POST", body: JSON.stringify({ photoIds }) }),

    trash: (photoIds: string[]) =>
      request<void>("/photos/trash", { method: "POST", body: JSON.stringify({ photoIds }) }),

    restore: (photoIds: string[]) =>
      request<void>("/photos/restore?status=ACTIVE", {
        method: "POST",
        body: JSON.stringify({ photoIds }),
      }),

    deletePermanent: (photoIds: string[]) =>
      request<void>("/photos/delete-permanent", {
        method: "POST",
        body: JSON.stringify({ photoIds }),
      }),

    deleteOne: (id: string) => request<void>(`/photos/${id}`, { method: "DELETE" }),

    aiPreview: (photoId: string, body: AiTransformRequest) =>
      request<AiTransformPreview>(`/photos/${photoId}/ai/preview`, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    aiApply: (photoId: string, body: AiTransformRequest) =>
      request<Photo>(`/photos/${photoId}/ai/apply`, {
        method: "POST",
        body: JSON.stringify(body),
      }),

    share: (photoId: string, expiryDays?: number) =>
      request<SharedLink>(`/photos/${photoId}/share`, {
        method: "POST",
        body: JSON.stringify({ expiryDays: expiryDays ?? null }),
      }),
  },

  albums: {
    list: () => request<Album[]>("/albums"),

    create: (body: { title: string }) =>
      request<Album>("/albums", { method: "POST", body: JSON.stringify(body) }),

    get: (id: string) => request<Album>(`/albums/${id}`),

    photos: (id: string, params: { page?: number; size?: number } = {}) => {
      const query = new URLSearchParams({
        page: String(params.page ?? 0),
        size: String(params.size ?? 60),
      });
      return request<PageResponse<Photo>>(`/albums/${id}/photos?${query.toString()}`);
    },

    update: (id: string, body: { title?: string; coverPhotoId?: string }) =>
      request<Album>(`/albums/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

    delete: (id: string) => request<void>(`/albums/${id}`, { method: "DELETE" }),

    addPhotos: (id: string, photoIds: string[]) =>
      request<void>(`/albums/${id}/photos`, { method: "POST", body: JSON.stringify({ photoIds }) }),

    removePhoto: (id: string, photoId: string) =>
      request<void>(`/albums/${id}/photos/${photoId}`, { method: "DELETE" }),

    share: (albumId: string, expiryDays?: number) =>
      request<SharedLink>(`/albums/${albumId}/share`, {
        method: "POST",
        body: JSON.stringify({ expiryDays: expiryDays ?? null }),
      }),
  },

  sharedLinks: {
    list: () => request<SharedLink[]>("/shared-links"),

    revoke: (id: string) => request<void>(`/shared-links/${id}`, { method: "DELETE" }),
  },

  public: {
    getPhoto: (token: string) => request<PublicPhoto>(`/public/photos/${token}`, {}, false),

    getAlbum: (token: string) => request<PublicAlbum>(`/public/albums/${token}`, {}, false),
  },

  library: {
    storageUsage: () => request<StorageUsage>("/library/storage"),

    imagekitAssets: () => request<ImageKitAsset[]>("/library/imagekit-assets"),

    importAssets: (imagekitFileIds: string[]) =>
      request<Photo[]>("/library/import", {
        method: "POST",
        body: JSON.stringify({ imagekitFileIds }),
      }),
  },
};
