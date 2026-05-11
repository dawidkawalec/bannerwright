'use client';

import { ChevronRight, Eye, EyeOff, Lock, Square, Type, Image as ImageIcon, MousePointer, Box, Group as GroupIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BannerTree, Node, NodeType } from '@/lib/tree/types';

export type LayersPanelProps = {
  tree: BannerTree;
  selection: string[];
  hover: string | null;
  onSelect: (id: string, additive: boolean) => void;
  onHover: (id: string | null) => void;
  onToggleVisible: (id: string, visible: boolean) => void;
  onToggleLocked: (id: string, locked: boolean) => void;
};

export function LayersPanel(props: LayersPanelProps) {
  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto p-2">
      <h3 className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Layers
      </h3>
      <Row node={props.tree.root} depth={0} {...props} />
    </div>
  );
}

function Row({
  node,
  depth,
  selection,
  hover,
  onSelect,
  onHover,
  onToggleVisible,
  onToggleLocked,
  tree: _tree,
}: { node: Node; depth: number } & LayersPanelProps) {
  const isSelected = selection.includes(node.id);
  const isHover = hover === node.id;
  return (
    <>
      <button
        type="button"
        onClick={(e) => onSelect(node.id, e.shiftKey)}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        className={cn(
          'group flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs transition-colors',
          isSelected
            ? 'bg-sky-500/15 text-foreground'
            : isHover
              ? 'bg-muted/60'
              : 'hover:bg-muted/40',
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <NodeIcon type={node.type} />
        <span className="flex-1 truncate">{labelOf(node)}</span>
        <span className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <IconAction
            label={node.visible === false ? 'Show' : 'Hide'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisible(node.id, node.visible === false);
            }}
          >
            {node.visible === false ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
          </IconAction>
          <IconAction
            label={node.locked ? 'Unlock' : 'Lock'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLocked(node.id, !node.locked);
            }}
          >
            <Lock
              className={cn('size-3', node.locked ? 'text-amber-500' : 'text-muted-foreground')}
            />
          </IconAction>
        </span>
      </button>
      {(node.type === 'frame' || node.type === 'group') &&
        node.children.map((c) => (
          <Row
            key={c.id}
            node={c}
            depth={depth + 1}
            selection={selection}
            hover={hover}
            onSelect={onSelect}
            onHover={onHover}
            onToggleVisible={onToggleVisible}
            onToggleLocked={onToggleLocked}
            tree={_tree}
          />
        ))}
    </>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <span
      role="button"
      aria-label={label}
      tabIndex={0}
      onClick={onClick}
      className="flex size-5 items-center justify-center rounded hover:bg-muted-foreground/20"
    >
      {children}
    </span>
  );
}

function NodeIcon({ type }: { type: NodeType }) {
  const cls = 'size-3 text-muted-foreground';
  switch (type) {
    case 'text':
      return <Type className={cls} />;
    case 'image':
      return <ImageIcon className={cls} />;
    case 'shape':
      return <Square className={cls} />;
    case 'button':
      return <MousePointer className={cls} />;
    case 'frame':
      return <Box className={cls} />;
    case 'group':
      return <GroupIcon className={cls} />;
    default:
      return <ChevronRight className={cls} />;
  }
}

function labelOf(node: Node): string {
  if (node.name) return node.name;
  if (node.type === 'text') return node.text.slice(0, 24) || 'Text';
  if (node.type === 'button') return node.label || 'Button';
  return capitalize(node.type);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
