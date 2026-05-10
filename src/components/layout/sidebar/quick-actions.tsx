'use client';

import Link from 'next/link';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function QuickActions({
  collapsed,
  workspaceId,
  onItemClick,
}: {
  collapsed?: boolean;
  workspaceId?: string;
  onItemClick?: () => void;
}) {
  if (collapsed) {
    return (
      <div className="flex flex-col gap-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button asChild variant="outline" size="sm" className="w-full justify-center">
              <Link href="/workspaces/new" onClick={onItemClick}>
                <Plus className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">New workspace</TooltipContent>
        </Tooltip>
        {workspaceId && (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button asChild size="sm" className="w-full justify-center">
                <Link href={`/workspaces/${workspaceId}/generations/new`} onClick={onItemClick}>
                  <Sparkles className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Generate banner</TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button asChild variant="outline" size="sm" className="w-full justify-start">
        <Link href="/workspaces/new" onClick={onItemClick}>
          <Plus className="size-4" />
          New workspace
        </Link>
      </Button>
      {workspaceId && (
        <Button asChild size="sm" className="w-full justify-start shadow-sm">
          <Link href={`/workspaces/${workspaceId}/generations/new`} onClick={onItemClick}>
            <Sparkles className="size-4" />
            Generate banner
          </Link>
        </Button>
      )}
    </div>
  );
}
