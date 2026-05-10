'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { promoteToTemplate, unpromoteTemplate } from '@/app/actions/generations';

type Props = {
  workspaceId: string;
  generationId: string;
  isTemplate: boolean;
  templateName: string | null;
  defaultName: string;
};

export function TemplateToggle({
  workspaceId,
  generationId,
  isTemplate,
  templateName,
  defaultName,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState(templateName ?? defaultName);
  const [error, setError] = useState<string | null>(null);

  if (isTemplate) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
            Template{templateName ? ` · ${templateName}` : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const res = await unpromoteTemplate(workspaceId, generationId);
                if (!res.ok) setError(res.error);
                else router.refresh();
              })
            }
          >
            Unpromote
          </Button>
        </div>
        {error && (
          <span className="text-xs text-destructive" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }

  if (!showInput) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowInput(true)}>
        Promote to template
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          setError(null);
          const res = await promoteToTemplate(workspaceId, generationId, name);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setShowInput(false);
          router.refresh();
        });
      }}
      className="flex flex-col items-end gap-1"
    >
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Template name"
          required
          autoFocus
          className="h-8 w-48"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Saving…' : 'Promote'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowInput(false)}>
          Cancel
        </Button>
      </div>
      {error && (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      )}
    </form>
  );
}
