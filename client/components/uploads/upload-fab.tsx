"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type UploadFabProps = {
  onFiles: (files: File[]) => void;
};

export function UploadFab({ onFiles }: UploadFabProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,image/bmp,image/tiff,image/svg+xml"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onFiles(files);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        aria-label="Upload photos"
        onClick={() => inputRef.current?.click()}
        className="fixed bottom-6 right-6 z-30 size-14 rounded-full shadow-lg transition-transform hover:scale-105 hover:shadow-xl"
      >
        <Plus className="size-6" />
      </Button>
    </>
  );
}
