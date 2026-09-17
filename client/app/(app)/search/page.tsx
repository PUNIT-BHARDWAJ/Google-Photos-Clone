"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RiInformationLine, RiSearchLine, RiSparkling2Fill } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/layout/error-state";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PhotoGridSkeleton } from "@/components/photos/photo-grid-skeleton";
import { PhotoViewer } from "@/components/photos/photo-viewer";
import { useAiEnabled, useTopTags } from "@/hooks/use-ai";
import { useSearchPhotos } from "@/hooks/use-photos";
import type { Photo } from "@/lib/api";
import { searchHref } from "@/lib/search";

// Search results aren't selectable. Module-level so the grid's memoization
// isn't defeated by a fresh Set/handler on every render.
const NO_SELECTION = new Set<string>();
function ignoreToggle() {}

function TrySuggestions({ ai }: { ai: boolean }) {
  const aiEnabled = useAiEnabled();
  const { data: topTags } = useTopTags(aiEnabled);
  if (!topTags?.length) return null;

  return (
    <EmptyContent>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="text-sm text-muted-foreground">Try:</span>
        {topTags.map(({ tag }) => (
          <Link
            key={tag}
            href={searchHref(tag, ai)}
            className="rounded-full border border-border px-3 py-1 text-sm text-foreground transition-colors hover:bg-accent"
          >
            {tag}
          </Link>
        ))}
      </div>
    </EmptyContent>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const ai = searchParams.get("ai") === "1";
  const aiEnabled = useAiEnabled();
  const { data, isLoading, isError, error, refetch, isRefetching, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSearchPhotos(query, ai);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const photos = data?.pages.flatMap((page) => page.content) ?? [];
  const firstPage = data?.pages[0];
  const totalCount = firstPage?.totalElements ?? 0;

  function handleOpen(photo: Photo) {
    const index = photos.findIndex((item) => item.id === photo.id);
    setViewerIndex(index === -1 ? null : index);
  }

  if (!query) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiSearchLine />
          </EmptyMedia>
          <EmptyTitle>Search your photos</EmptyTitle>
          <EmptyDescription>
            {aiEnabled
              ? "Find photos by file name, or by what's in them once AI has analyzed your library"
              : "Start typing in the search bar to find photos by file name"}
          </EmptyDescription>
        </EmptyHeader>
        <TrySuggestions ai={ai} />
      </Empty>
    );
  }

  const heading = (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Results for &ldquo;{query}&rdquo;
        </h1>
        {firstPage?.aiRanked && (
          <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary dark:bg-primary/15">
            <RiSparkling2Fill data-icon="inline-start" />
            AI-powered
          </Badge>
        )}
      </div>
      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Spinner className="size-3.5" />
          {ai ? "Ranking results with AI…" : "Searching…"}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {totalCount} photo{totalCount === 1 ? "" : "s"} found
        </p>
      )}
      {ai && firstPage?.aiMessage && (
        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
          <RiInformationLine className="mt-px size-3.5 shrink-0" />
          {firstPage.aiMessage}
        </p>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {heading}
        <PhotoGridSkeleton />
      </div>
    );
  }

  return (
    <div>
      {heading}

      {isError && photos.length === 0 ? (
        <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
      ) : photos.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiSearchLine />
            </EmptyMedia>
            <EmptyTitle>No photos match your search</EmptyTitle>
            <EmptyDescription>
              {aiEnabled ? "Try different words or a file name" : "Try a different file name"}
            </EmptyDescription>
          </EmptyHeader>
          <TrySuggestions ai={ai} />
        </Empty>
      ) : (
        <PhotoGrid
          photos={photos}
          selectedIds={NO_SELECTION}
          selectionActive={false}
          onToggleSelect={ignoreToggle}
          onOpen={handleOpen}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          // Relevance order is the point of AI ranking - don't regroup it by day.
          groupByDate={!firstPage?.aiRanked}
        />
      )}

      <PhotoViewer
        photos={photos}
        index={viewerIndex}
        onOpenChange={(open) => !open && setViewerIndex(null)}
        onIndexChange={setViewerIndex}
      />
    </div>
  );
}
