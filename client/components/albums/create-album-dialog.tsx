"use client";

import { useState } from "react";
import { RiAddLine } from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useCreateAlbum } from "@/hooks/use-albums";

export function CreateAlbumDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const createAlbum = useCreateAlbum();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createAlbum.mutate(trimmed, {
      onSuccess: () => {
        setTitle("");
        setOpen(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <RiAddLine />
        Create album
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New album</DialogTitle>
          <DialogDescription>Give your album a name</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field>
            <FieldLabel htmlFor="album-title">Album name</FieldLabel>
            <Input
              id="album-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Summer trip"
              autoFocus
            />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={!title.trim() || createAlbum.isPending}>
              {createAlbum.isPending ? <Spinner /> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
