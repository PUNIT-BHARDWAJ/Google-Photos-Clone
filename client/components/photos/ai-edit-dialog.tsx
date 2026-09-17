"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAiPreview, useApplyAiTransform } from "@/hooks/use-ai-transform";
import type { AiTransformType, Photo } from "@/lib/api";

const TRANSFORM_OPTIONS: { value: AiTransformType; label: string; description: string }[] = [
  { value: "REMOVE_BACKGROUND", label: "Remove background", description: "Cut the subject out onto a transparent background" },
  { value: "BACKGROUND_AND_SHADOW", label: "Background + shadow", description: "Remove the background and add a soft drop shadow" },
  { value: "CHANGE_BACKGROUND", label: "Change background", description: "Replace the background based on a text prompt" },
  { value: "GENERATIVE_FILL", label: "Generative fill", description: "Expand the canvas and fill the new space with AI" },
  { value: "SMART_CROP", label: "Smart crop", description: "Crop to a target size while keeping the subject in frame" },
  { value: "OBJECT_CROP", label: "Object-aware crop", description: "Crop tightly around a named object" },
  { value: "RETOUCH", label: "Retouch", description: "Clean up minor blemishes and imperfections" },
  { value: "UPSCALE", label: "Upscale", description: "Increase resolution and sharpen details" },
  { value: "AI_EDIT", label: "AI edit", description: "Describe any edit in your own words" },
];

const REQUIRES_PROMPT: AiTransformType[] = ["CHANGE_BACKGROUND", "AI_EDIT"];
const OPTIONAL_PROMPT: AiTransformType[] = ["GENERATIVE_FILL"];
const REQUIRES_DIMENSIONS: AiTransformType[] = ["GENERATIVE_FILL", "SMART_CROP"];
const REQUIRES_FOCUS_OBJECT: AiTransformType[] = ["OBJECT_CROP"];

type AiEditDialogProps = {
  photo: Photo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AiEditDialog({ photo, open, onOpenChange }: AiEditDialogProps) {
  const [type, setType] = useState<AiTransformType>("REMOVE_BACKGROUND");
  const [prompt, setPrompt] = useState("");
  const [width, setWidth] = useState(String(photo.width ?? 1024));
  const [height, setHeight] = useState(String(photo.height ?? 1024));
  const [focusObject, setFocusObject] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const preview = useAiPreview();
  const apply = useApplyAiTransform();

  const selected = TRANSFORM_OPTIONS.find((option) => option.value === type) ?? TRANSFORM_OPTIONS[0];

  function buildRequest() {
    return {
      type,
      prompt:
        REQUIRES_PROMPT.includes(type) || OPTIONAL_PROMPT.includes(type)
          ? prompt.trim() || undefined
          : undefined,
      width: REQUIRES_DIMENSIONS.includes(type) ? Number(width) : undefined,
      height: REQUIRES_DIMENSIONS.includes(type) ? Number(height) : undefined,
      focusObject: REQUIRES_FOCUS_OBJECT.includes(type) ? focusObject.trim() || undefined : undefined,
    };
  }

  function isValid() {
    if (REQUIRES_PROMPT.includes(type) && !prompt.trim()) return false;
    if (REQUIRES_DIMENSIONS.includes(type) && (!width || !height)) return false;
    if (REQUIRES_FOCUS_OBJECT.includes(type) && !focusObject.trim()) return false;
    return true;
  }

  function handleTypeChange(nextType: AiTransformType) {
    setType(nextType);
    setPreviewUrl(null);
  }

  function handlePreview() {
    preview.mutate(
      { photoId: photo.id, body: buildRequest() },
      { onSuccess: (data) => setPreviewUrl(data.previewUrl) },
    );
  }

  function handleApply() {
    apply.mutate(
      { photoId: photo.id, body: buildRequest() },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setPreviewUrl(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>AI edit</DialogTitle>
          <DialogDescription>Creates a new edited copy — your original photo is never changed</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field>
            <FieldLabel>Transformation</FieldLabel>
            <Select
              items={TRANSFORM_OPTIONS}
              value={type}
              onValueChange={(value) => handleTypeChange(value as AiTransformType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSFORM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>{selected.description}</FieldDescription>
          </Field>

          {(REQUIRES_PROMPT.includes(type) || OPTIONAL_PROMPT.includes(type)) && (
            <Field>
              <FieldLabel htmlFor="ai-prompt">
                Prompt {OPTIONAL_PROMPT.includes(type) && <span className="text-muted-foreground">(optional)</span>}
              </FieldLabel>
              <Textarea
                id="ai-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe what you want..."
              />
            </Field>
          )}

          {REQUIRES_DIMENSIONS.includes(type) && (
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="ai-width">Width</FieldLabel>
                <Input
                  id="ai-width"
                  type="number"
                  min={64}
                  max={4096}
                  value={width}
                  onChange={(event) => setWidth(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ai-height">Height</FieldLabel>
                <Input
                  id="ai-height"
                  type="number"
                  min={64}
                  max={4096}
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                />
              </Field>
            </div>
          )}

          {REQUIRES_FOCUS_OBJECT.includes(type) && (
            <Field>
              <FieldLabel htmlFor="ai-focus">Object to keep in frame</FieldLabel>
              <Input
                id="ai-focus"
                value={focusObject}
                onChange={(event) => setFocusObject(event.target.value)}
                placeholder="e.g. person, dog, car"
              />
            </Field>
          )}

          <div className="overflow-hidden rounded-2xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl ?? photo.url} alt="Preview" className="max-h-72 w-full object-contain" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handlePreview} disabled={!isValid() || preview.isPending}>
            {preview.isPending ? <Spinner /> : "Preview"}
          </Button>
          <Button onClick={handleApply} disabled={!isValid() || apply.isPending}>
            {apply.isPending ? <Spinner /> : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
