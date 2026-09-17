import { format, isSameYear, isToday, isYesterday } from "date-fns";

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${sizes[i]}`;
}

export function formatDateHeading(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isSameYear(date, new Date())) return format(date, "EEEE, d MMMM");
  return format(date, "d MMMM yyyy");
}

export function formatPhotoDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return format(date, "d MMMM yyyy, h:mm a");
}

/**
 * EXIF capture times are the camera's wall-clock reading, which the backend
 * stores at UTC (there's no reliable zone to attach). Rebuilding a local Date
 * from the UTC fields keeps that reading intact - otherwise a photo taken at
 * 23:30 would slide into the next day for anyone east of UTC.
 */
export function parseDateTaken(dateTaken: string): Date {
  const utc = new Date(dateTaken);
  return new Date(
    utc.getUTCFullYear(),
    utc.getUTCMonth(),
    utc.getUTCDate(),
    utc.getUTCHours(),
    utc.getUTCMinutes(),
    utc.getUTCSeconds(),
  );
}

/** When the photo was taken if EXIF says so, otherwise when it was uploaded. */
export function getPhotoDate(photo: { createdAt: string; dateTaken?: string | null }): Date {
  return photo.dateTaken ? parseDateTaken(photo.dateTaken) : new Date(photo.createdAt);
}

export type DateGroup<T> = {
  key: string;
  heading: string;
  items: T[];
};

/**
 * Groups items (newest first) into day buckets, Google Photos style - by the
 * day a photo was taken, falling back to its upload day when there's no EXIF
 * date. Item order within a day is kept as the API returned it.
 */
export function groupByDay<T extends { createdAt: string; dateTaken?: string | null }>(items: T[]): DateGroup<T>[] {
  const groups = new Map<string, { date: Date; items: T[] }>();

  for (const item of items) {
    const date = getPhotoDate(item);
    const key = format(date, "yyyy-MM-dd");
    const bucket = groups.get(key);
    if (bucket) {
      bucket.items.push(item);
    } else {
      groups.set(key, { date, items: [item] });
    }
  }

  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, group]) => ({
      key,
      heading: formatDateHeading(group.date),
      items: group.items,
    }));
}
