"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RiExternalLinkLine, RiRefreshLine, RiSparkling2Line, RiStopCircleLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/layout/error-state";
import { useAiStatus, useAnalyzeAll, useCancelAnalyzeAll } from "@/hooks/use-ai";
import { formatDuration } from "@/lib/ai";
import { api, type AiConnection, type AiStatus } from "@/lib/api";
import { aiKeys, albumKeys, photoKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const SETUP_GUIDE_URL = "https://github.com/PUNIT-BHARDWAJ/Google-Photos-Clone#ai-features-optional";

const CONNECTION_LABELS: Record<AiConnection, { label: string; tone: "ok" | "warn" | "error" | "muted" }> = {
  CONNECTED: { label: "Connected", tone: "ok" },
  NOT_CONFIGURED: { label: "Not configured", tone: "muted" },
  UNKNOWN: { label: "Not checked yet", tone: "muted" },
  RATE_LIMITED: { label: "Rate limited", tone: "warn" },
  INVALID_KEY: { label: "Invalid API key", tone: "error" },
  MODEL_UNAVAILABLE: { label: "Model unavailable", tone: "error" },
  ERROR: { label: "Can't reach Gemini", tone: "error" },
};

const TONE_DOT = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  error: "bg-destructive",
  muted: "bg-muted-foreground/50",
};

export function AiFeaturesCard() {
  const queryClient = useQueryClient();
  const { data: status, isLoading, isError, error, refetch, isRefetching } = useAiStatus({ poll: true });
  const analyzeAll = useAnalyzeAll();
  const cancel = useCancelAnalyzeAll();
  const recheck = useMutation({
    mutationFn: () => api.ai.status(true),
    onSuccess: (fresh) => queryClient.setQueryData(aiKeys.status(), fresh),
  });

  // When a bulk run ends, everything built from AI data is stale: photo info,
  // search suggestions and album suggestions.
  const running = status?.job?.running ?? false;
  const wasRunning = useRef(running);
  useEffect(() => {
    if (wasRunning.current && !running) {
      queryClient.invalidateQueries({ queryKey: photoKeys.all });
      queryClient.invalidateQueries({ queryKey: aiKeys.topTags() });
      queryClient.invalidateQueries({ queryKey: albumKeys.suggestions() });
    }
    wasRunning.current = running;
  }, [running, queryClient]);

  return (
    <Card id="ai-features" className="scroll-mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiSparkling2Line className="size-4" />
          AI Features
        </CardTitle>
        <CardDescription>Captions, tags and smarter search from Google Gemini</CardDescription>
      </CardHeader>
      <CardContent>
        {isError && !status ? (
          <ErrorState inline error={error} onRetry={() => refetch()} retrying={isRefetching} />
        ) : isLoading || !status ? (
          <Spinner className="size-4 text-muted-foreground" />
        ) : !status.configured ? (
          <SetupInstructions />
        ) : (
          <ConfiguredStatus
            status={status}
            onAnalyzeAll={() => analyzeAll.mutate()}
            analyzeStarting={analyzeAll.isPending}
            onCancel={() => cancel.mutate()}
            cancelling={cancel.isPending}
            onRecheck={() => recheck.mutate()}
            rechecking={recheck.isPending}
          />
        )}
      </CardContent>
    </Card>
  );
}

function SetupInstructions() {
  return (
    <div className="space-y-3 text-sm">
      <p className="font-medium text-foreground">Set up a Gemini API key to enable AI features</p>
      <p className="text-muted-foreground">
        Everything else works without it. With a key, photos get captions and tags automatically, search understands
        descriptions, and albums can be suggested for you.
      </p>
      <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
        <li>
          Create a free key in{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Google AI Studio
          </a>
        </li>
        <li>
          Add <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">gemini.api-key=YOUR_KEY</code> to{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">backend/backend/application-local.properties</code>{" "}
          (or set <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">GEMINI_API_KEY</code>)
        </li>
        <li>Restart the backend</li>
      </ol>
      <a
        href={SETUP_GUIDE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline"
      >
        Setup instructions
        <RiExternalLinkLine className="size-3.5" />
      </a>
    </div>
  );
}

type ConfiguredStatusProps = {
  status: AiStatus;
  onAnalyzeAll: () => void;
  analyzeStarting: boolean;
  onCancel: () => void;
  cancelling: boolean;
  onRecheck: () => void;
  rechecking: boolean;
};

function ConfiguredStatus({
  status,
  onAnalyzeAll,
  analyzeStarting,
  onCancel,
  cancelling,
  onRecheck,
  rechecking,
}: ConfiguredStatusProps) {
  const connection = CONNECTION_LABELS[status.connection];
  const job = status.job;
  const running = job?.running ?? false;
  const percent = status.totalPhotos ? (status.analyzedPhotos / status.totalPhotos) * 100 : 0;
  const remaining = running ? status.estimatedSecondsRemaining : status.pendingPhotos * status.secondsPerPhoto;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Gemini</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <span className={cn("size-2 rounded-full", TONE_DOT[connection.tone])} aria-hidden />
            {connection.label}
          </span>
          <span className="text-xs text-muted-foreground">({status.model})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onRecheck} disabled={rechecking}>
          {rechecking ? <Spinner data-icon="inline-start" /> : <RiRefreshLine data-icon="inline-start" />}
          Check connection
        </Button>
      </div>
      {connection.tone !== "ok" && status.connectionMessage && (
        <p className={cn("-mt-3 text-xs", connection.tone === "error" ? "text-destructive" : "text-muted-foreground")}>
          {status.connectionMessage}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">
            Photos analyzed: {status.analyzedPhotos}/{status.totalPhotos}
          </span>
          {status.failedPhotos > 0 && (
            <span className="text-xs text-muted-foreground">{status.failedPhotos} failed</span>
          )}
        </div>
        <Progress value={percent} aria-label="Photos analyzed" />
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {running && job
            ? `Analyzing ${Math.min(job.processed + 1, job.total)} of ${job.total} · ${formatDuration(remaining)} remaining`
            : status.pendingPhotos > 0
              ? `${status.pendingPhotos} photo${status.pendingPhotos === 1 ? "" : "s"} left to analyze · ${formatDuration(remaining)}`
              : "Every photo has been analyzed"}
        </p>
        {!running && job && (
          <p className="text-xs text-muted-foreground">
            Last run: {job.message} — {job.succeeded} analyzed{job.failed ? `, ${job.failed} failed` : ""}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {running ? (
          <Button variant="outline" onClick={onCancel} disabled={cancelling || job?.cancelRequested}>
            {cancelling || job?.cancelRequested ? <Spinner data-icon="inline-start" /> : <RiStopCircleLine data-icon="inline-start" />}
            {job?.cancelRequested ? "Stopping…" : "Stop analysis"}
          </Button>
        ) : (
          <Button onClick={onAnalyzeAll} disabled={analyzeStarting || status.pendingPhotos === 0}>
            {analyzeStarting ? <Spinner data-icon="inline-start" /> : <RiSparkling2Line data-icon="inline-start" />}
            Analyze all photos
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Photos are analyzed one every {status.secondsPerPhoto} seconds to stay within Gemini&apos;s free tier. New uploads
        are analyzed automatically.
      </p>
    </div>
  );
}
