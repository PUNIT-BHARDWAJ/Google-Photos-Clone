"use client";

import { RiCameraLine, RiMapPinLine, RiShareLine } from "@remixicon/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useSharedLinks } from "@/hooks/use-shared-links";
import { usePhotoMetadata } from "@/hooks/use-photos";
import { formatBytes, formatPhotoDate, parseDateTaken } from "@/lib/format";
import type { Photo } from "@/lib/api";

type PhotoInfoPanelProps = {
  photo: Photo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function Unknown() {
  return <span className="italic text-muted-foreground">Unknown</span>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {icon}
      {children}
    </h3>
  );
}

function formatCoordinate(value: number, axis: "lat" | "lng") {
  const direction = axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  return `${Math.abs(value).toFixed(4)}° ${direction}`;
}

export function PhotoInfoPanel({ photo, open, onOpenChange }: PhotoInfoPanelProps) {
  const { data: metadata, isLoading } = usePhotoMetadata(photo.id, open);
  const { data: links } = useSharedLinks();
  const sharedLink = links?.find((link) => link.targetType === "PHOTO" && link.targetId === photo.id);

  const hasCameraData = !!(
    metadata &&
    (metadata.cameraMake || metadata.cameraModel || metadata.focalLength || metadata.aperture || metadata.iso != null || metadata.shutterSpeed)
  );
  const hasGpsData = !!(metadata && metadata.latitude != null && metadata.longitude != null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Photo info</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner className="text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <InfoRow label="File name" value={<span className="break-all">{photo.fileName}</span>} />
                <InfoRow
                  label="File size"
                  value={metadata?.fileSize != null ? formatBytes(metadata.fileSize) : <Unknown />}
                />
                <InfoRow
                  label="Dimensions"
                  value={photo.width && photo.height ? `${photo.width} × ${photo.height}` : <Unknown />}
                />
                <InfoRow
                  label="Date taken"
                  value={metadata?.dateTaken ? formatPhotoDate(parseDateTaken(metadata.dateTaken)) : <Unknown />}
                />
                <InfoRow label="Date uploaded" value={formatPhotoDate(photo.createdAt)} />
              </div>

              {hasCameraData && metadata && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <SectionHeading icon={<RiCameraLine className="size-3.5" />}>Camera</SectionHeading>
                    {(metadata.cameraMake || metadata.cameraModel) && (
                      <InfoRow
                        label="Camera"
                        value={[metadata.cameraMake, metadata.cameraModel].filter(Boolean).join(" ")}
                      />
                    )}
                    {metadata.focalLength && <InfoRow label="Focal length" value={metadata.focalLength} />}
                    {metadata.aperture && <InfoRow label="Aperture" value={metadata.aperture} />}
                    {metadata.iso != null && <InfoRow label="ISO" value={metadata.iso} />}
                    {metadata.shutterSpeed && <InfoRow label="Shutter speed" value={metadata.shutterSpeed} />}
                  </div>
                </>
              )}

              {hasGpsData && metadata && metadata.latitude != null && metadata.longitude != null && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <SectionHeading icon={<RiMapPinLine className="size-3.5" />}>Location</SectionHeading>
                    <a
                      href={`https://www.google.com/maps?q=${metadata.latitude},${metadata.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary hover:underline"
                    >
                      {formatCoordinate(metadata.latitude, "lat")}, {formatCoordinate(metadata.longitude, "lng")}
                    </a>
                  </div>
                </>
              )}

              {sharedLink && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <SectionHeading icon={<RiShareLine className="size-3.5" />}>Sharing</SectionHeading>
                    <p className="text-sm text-foreground">Shared via public link</p>
                    <p className="truncate text-xs text-muted-foreground">{sharedLink.url}</p>
                    <InfoRow
                      label="Expires"
                      value={sharedLink.expiresAt ? formatPhotoDate(sharedLink.expiresAt) : "Never"}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
