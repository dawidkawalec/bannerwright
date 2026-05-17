'use client';

import { useState } from 'react';
import { ImageIcon, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HelpHint } from '@/components/ui/help-hint';

/**
 * Shows a thumbnail of the original Nano Banana design that Gemini Vision
 * transcribed into the editable tree. Click → full-size modal so the user can
 * compare reconstruction fidelity or download the raw PNG.
 *
 * Renders nothing when the generation has no reference image (Auto preset,
 * text-only path, legacy banners).
 */
export function ReferenceImagePanel({
  workspaceId,
  referenceImagePath,
}: {
  workspaceId: string;
  referenceImagePath: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  if (!referenceImagePath) return null;
  const filename = referenceImagePath.split('/').pop() ?? '';
  const src = `/api/workspaces/${workspaceId}/assets/${filename}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          Original AI design
          <HelpHint text="Reference image that Nano Banana painted before Gemini Vision transcribed it into the editable tree. The tree may approximate fonts and positions; this is the source of truth for visual fidelity." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="group relative block w-full overflow-hidden rounded-md border border-border bg-muted/40 transition-shadow hover:shadow-md"
              title="Click to see the full-size design"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Original Nano Banana design"
                className="block h-auto w-full object-cover"
                loading="lazy"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/0 transition-colors group-hover:bg-background/30">
                <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-card/90 px-2 py-1 text-xs font-medium text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100">
                  <Maximize2 className="size-3" />
                  Full size
                </span>
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="size-4" />
                Original AI design (Nano Banana)
              </DialogTitle>
            </DialogHeader>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Original Nano Banana design (full size)"
              className="mx-auto max-h-[70vh] w-auto rounded-md border border-border"
            />
            <p className="text-center text-xs text-muted-foreground">
              <a
                href={src}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Open original ({filename}) →
              </a>
            </p>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
