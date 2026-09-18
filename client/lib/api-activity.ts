/**
 * How the API is answering, so the UI can tell "slow" from "broken".
 *
 * The backend runs on a free plan that sleeps after ~15 minutes idle, and the
 * first request after that waits ~30s for a container to start. That looks
 * identical to a hang unless something says otherwise, so every ordinary
 * request reports when it starts and finishes here; the splash screen shows
 * once the oldest one has been waiting long enough to be worth explaining.
 *
 * Long-by-design calls (uploads, zip downloads, Gemini analysis) are not
 * tracked - they take a while when everything is perfectly healthy.
 */

export type ConnectionStatus = "unknown" | "online" | "offline";

export type ApiActivity = {
  /** When the longest-running tracked request started, or null when idle. */
  pendingSince: number | null;
  status: ConnectionStatus;
};

const IDLE: ApiActivity = { pendingSince: null, status: "unknown" };

let snapshot: ApiActivity = IDLE;
let nextId = 0;
const started = new Map<number, number>();
const listeners = new Set<() => void>();

function publish() {
  let oldest: number | null = null;
  for (const time of started.values()) {
    if (oldest === null || time < oldest) oldest = time;
  }
  if (oldest === snapshot.pendingSince && snapshot.status === currentStatus) return;
  snapshot = { pendingSince: oldest, status: currentStatus };
  listeners.forEach((listener) => listener());
}

let currentStatus: ConnectionStatus = "unknown";

/** Call when a tracked request starts; pass the returned id to `finishRequest`. */
export function startRequest() {
  const id = nextId++;
  started.set(id, Date.now());
  publish();
  return id;
}

export function finishRequest(id: number, outcome: "reached" | "unreachable") {
  started.delete(id);
  currentStatus = outcome === "reached" ? "online" : "offline";
  publish();
}

export function subscribeApiActivity(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getApiActivity(): ApiActivity {
  return snapshot;
}

/** The server render has never made a request, so nothing is pending. */
export function getServerApiActivity(): ApiActivity {
  return IDLE;
}

/**
 * Whether a request should count towards "the server is waking up".
 * Uploads, downloads and AI calls are slow on a perfectly awake server.
 */
export function tracksColdStart(path: string, body?: BodyInit | null) {
  if (body instanceof FormData) return false;
  return !path.includes("/ai/") && !path.startsWith("/photos/download") && !path.startsWith("/photos/upload");
}
