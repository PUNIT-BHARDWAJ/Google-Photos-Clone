
export const authKeys = {
    all: ["auth"] as const,
    me: () => [...authKeys.all,"me"] as const,
};

export const photoKeys = {
  all: ["photos"] as const,
  lists: () => [...photoKeys.all, "list"] as const,
  list: (status: string, filters: object = {}, sort = "taken_desc") => [...photoKeys.lists(), status, filters, sort] as const,
  detail: (id: string) => [...photoKeys.all, "detail", id] as const,
  search: (query: string, ai = false, filters: object = {}) => [...photoKeys.all, "search", query, ai, filters] as const,
  facets: () => [...photoKeys.all, "facets"] as const,
  metadata: (id: string) => [...photoKeys.all, "metadata", id] as const,
};

export const albumKeys = {
  all: ["albums"] as const,
  lists: () => [...albumKeys.all, "list"] as const,
  detail: (id: string) => [...albumKeys.all, "detail", id] as const,
  photos: (id: string) => [...albumKeys.detail(id), "photos"] as const,
  suggestions: () => [...albumKeys.all, "suggestions"] as const,
};

export const aiKeys = {
  all: ["ai"] as const,
  status: () => [...aiKeys.all, "status"] as const,
  topTags: () => [...aiKeys.all, "top-tags"] as const,
};

export const libraryKeys = {
  all: ["library"] as const,
  storage: () => [...libraryKeys.all, "storage"] as const,
  counts: () => [...libraryKeys.all, "counts"] as const,
  imagekitAssets: () => [...libraryKeys.all, "imagekit-assets"] as const,
};

export const sharedLinkKeys = {
  all: ["shared-links"] as const,
  lists: () => [...sharedLinkKeys.all, "list"] as const,
  publicPhoto: (token: string) => [...sharedLinkKeys.all, "public-photo", token] as const,
  publicAlbum: (token: string) => [...sharedLinkKeys.all, "public-album", token] as const,
};
