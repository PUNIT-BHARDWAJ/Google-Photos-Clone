"use client";

import { useState } from "react";
import { RiArrowRightLine, RiErrorWarningLine, RiMagicLine, RiSparkling2Line } from "@remixicon/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAiEnabled, useSaveEdit, useSuggestEdit } from "@/hooks/use-ai";
import { useAiPreview, useApplyAiTransform } from "@/hooks/use-ai-transform";
import type { AiTransformType, Photo } from "@/lib/api";
import { getEditComparisonSources } from "@/lib/imagekit";

const EXAMPLE_PROMPTS = [
  "Make it brighter",
  "Remove background",
  "Convert to black and white",
  "Enhance colors",
  "Make it look vintage",
  "Crop to portrait",
];

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
  // Bumped on close so the next open starts from a clean slate.
  const [session, setSession] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) setSession((value) => value + 1);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI edit</DialogTitle>
          <DialogDescription>Creates a new edited copy — your original photo is never changed</DialogDescription>
        </DialogHeader>

        <Tabs key={`${photo.id}:${session}`} defaultValue="describe">
          <TabsList>
            <TabsTrigger value="describe">Describe an edit</TabsTrigger>
            <TabsTrigger value="transforms">AI transforms</TabsTrigger>
          </TabsList>
          <TabsContent value="describe" className="pt-4">
            <DescribeEditPanel photo={photo} onSaved={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="transforms" className="pt-4">
            <TransformsPanel photo={photo} onApplied={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ---- Describe an edit -------------------------------------------------------

function DescribeEditPanel({ photo, onSaved }: { photo: Photo; onSaved: () => void }) {
  const aiEnabled = useAiEnabled();
  const [instruction, setInstruction] = useState("");
  const [applied, setApplied] = useState(false);
  const [afterImage, setAfterImage] = useState<"loading" | "loaded" | "error">("loading");
  const suggest = useSuggestEdit();
  const save = useSaveEdit();
  const result = suggest.isPending ? undefined : suggest.data;

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || suggest.isPending) return;
    setInstruction(trimmed);
    setApplied(false);
    setAfterImage("loading");
    suggest.mutate({ photoId: photo.id, instruction: trimmed });
  }

  const comparison = applied && result?.previewUrl ? getEditComparisonSources(photo, result.previewUrl) : null;
  // Both frames take the original's shape (within reason), so "before" fills its
  // frame exactly and a cropped "after" shows how much was cut.
  const frameRatio = photo.width && photo.height ? Math.min(16 / 9, Math.max(3 / 4, photo.width / photo.height)) : 4 / 3;
  const notes = result?.operations.filter((operation) => operation.note) ?? [];

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(instruction);
        }}
      >
        <InputGroup>
          <InputGroupInput
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="Describe what you want to change..."
            aria-label="Describe the edit"
            maxLength={300}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-xs"
              disabled={!instruction.trim() || suggest.isPending}
              aria-label="Get edit suggestion"
            >
              <RiArrowRightLine />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>

      <div className="flex flex-wrap gap-1.5" aria-label="Example edits">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => submit(prompt)}
            disabled={suggest.isPending}
            className="rounded-full border border-border px-3 py-1 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {suggest.isPending && (
        <div className="flex items-center gap-2 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground" role="status">
          <Spinner className="size-4" />
          {aiEnabled ? "Asking Gemini how to do this…" : "Matching your request to ImageKit edits…"}
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-2xl border border-border p-4">
          {result.suggestion && (
            <div className="flex gap-2">
              <RiSparkling2Line className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <p className="text-sm leading-relaxed text-foreground">{result.suggestion}</p>
            </div>
          )}
          {result.aiMessage && <p className="text-xs text-muted-foreground">{result.aiMessage}</p>}

          {result.operations.length > 0 ? (
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">ImageKit edits</p>
                <ul className="flex flex-wrap gap-1.5">
                  {result.operations.map((operation) => (
                    <li key={operation.key}>
                      <Badge variant="secondary">{operation.label}</Badge>
                    </li>
                  ))}
                </ul>
                {notes.map((operation) => (
                  <p key={operation.key} className="text-xs text-muted-foreground">
                    {operation.label}: {operation.note}
                  </p>
                ))}
              </div>
              {!applied && (
                <Button size="sm" onClick={() => setApplied(true)}>
                  <RiMagicLine data-icon="inline-start" />
                  Apply with ImageKit
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              None of ImageKit&apos;s instant edits can do this. The AI transforms tab has generative edits that might.
            </p>
          )}
        </div>
      )}

      {comparison && (
        <div className="grid grid-cols-2 gap-3">
          <figure className="space-y-1.5">
            <div
              className="flex items-center justify-center overflow-hidden rounded-2xl bg-muted"
              style={{ aspectRatio: frameRatio }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={comparison.before} alt="Before" className="max-h-full max-w-full object-contain" />
            </div>
            <figcaption className="text-center text-xs text-muted-foreground">Before</figcaption>
          </figure>
          <figure className="space-y-1.5">
            <div
              className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-muted"
              style={{ aspectRatio: frameRatio }}
            >
              {afterImage !== "error" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comparison.after}
                  alt="After"
                  onLoad={() => setAfterImage("loaded")}
                  onError={() => setAfterImage("error")}
                  className="max-h-full max-w-full object-contain"
                />
              )}
              {afterImage === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/70" role="status">
                  <Spinner className="size-5 text-muted-foreground" />
                  <span className="sr-only">Rendering preview</span>
                </div>
              )}
              {afterImage === "error" && (
                <p className="flex items-center gap-1.5 px-3 text-center text-xs text-destructive">
                  <RiErrorWarningLine className="size-4 shrink-0" />
                  The preview didn&apos;t load
                </p>
              )}
            </div>
            <figcaption className="text-center text-xs text-muted-foreground">After</figcaption>
          </figure>
        </div>
      )}

      {comparison && (
        <DialogFooter>
          <Button
            onClick={() =>
              result &&
              save.mutate(
                { photoId: photo.id, operations: result.operations.map((operation) => operation.key) },
                { onSuccess: onSaved },
              )
            }
            disabled={afterImage !== "loaded" || save.isPending}
          >
            {save.isPending && <Spinner data-icon="inline-start" />}
            {save.isPending ? "Saving…" : "Save as new photo"}
          </Button>
        </DialogFooter>
      )}
    </div>
  );
}

// ---- ImageKit AI transforms -------------------------------------------------

function TransformsPanel({ photo, onApplied }: { photo: Photo; onApplied: () => void }) {
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
    apply.mutate({ photoId: photo.id, body: buildRequest() }, { onSuccess: onApplied });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Generative edits run on ImageKit&apos;s AI extensions and can take a little while to render.
      </p>
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

      <DialogFooter>
        <Button variant="outline" onClick={handlePreview} disabled={!isValid() || preview.isPending}>
          {preview.isPending ? <Spinner /> : "Preview"}
        </Button>
        <Button onClick={handleApply} disabled={!isValid() || apply.isPending}>
          {apply.isPending ? <Spinner /> : "Apply"}
        </Button>
      </DialogFooter>
    </div>
  );
}
