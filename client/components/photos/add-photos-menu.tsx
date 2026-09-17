"use client";

import { useRef, useState } from "react";
import { RiArrowDownSLine, RiDownloadCloud2Line, RiUploadCloud2Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImportFromImageKitDialog } from "@/components/photos/import-from-imagekit-dialog";
import { useUploadPhotos } from "@/hooks/use-photos";

export function AddPhotosMenu() {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadPhotos();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) upload.mutate(files);
          event.target.value = "";
        }}
      />

      <ButtonGroup>
        <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? <Spinner /> : <RiUploadCloud2Line />}
          Upload
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="icon" aria-label="More ways to add photos" />}>
            <RiArrowDownSLine />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setImportOpen(true)}>
              <RiDownloadCloud2Line />
              Import from ImageKit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      <ImportFromImageKitDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
