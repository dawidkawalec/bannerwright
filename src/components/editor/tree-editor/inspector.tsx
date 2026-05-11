'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  BannerTree,
  ButtonNode,
  Fill,
  ImageNode,
  Node,
  ShapeNode,
  TextNode,
} from '@/lib/tree/types';
import { findNode } from '@/lib/tree/operations';

export type InspectorProps = {
  tree: BannerTree;
  selection: string[];
  onPatch: <T extends Partial<Node>>(id: string, patch: T) => void;
};

export function Inspector({ tree, selection, onPatch }: InspectorProps) {
  if (selection.length === 0) {
    return (
      <div className="flex h-full flex-col gap-2 p-4 text-xs text-muted-foreground">
        <h3 className="text-[10px] font-medium uppercase tracking-wider">Inspector</h3>
        <p>Select an element on the canvas or in Layers to edit its properties.</p>
      </div>
    );
  }
  if (selection.length > 1) {
    return (
      <div className="flex h-full flex-col gap-2 p-4 text-xs text-muted-foreground">
        <h3 className="text-[10px] font-medium uppercase tracking-wider">Inspector</h3>
        <p>{selection.length} elements selected. Multi-select editing lands in Phase 2.</p>
      </div>
    );
  }
  const node = findNode(tree, selection[0]!);
  if (!node) return null;
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 text-xs">
      <header className="flex items-center justify-between">
        <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {node.type}
        </h3>
        <span className="font-mono text-[10px] text-muted-foreground/60">{node.id}</span>
      </header>

      <FrameFields node={node} onPatch={onPatch} />

      {node.type === 'text' && <TextFields node={node} onPatch={onPatch} />}
      {node.type === 'button' && <ButtonFields node={node} onPatch={onPatch} />}
      {node.type === 'shape' && <ShapeFields node={node} onPatch={onPatch} />}
      {node.type === 'image' && <ImageFields node={node} onPatch={onPatch} />}
    </div>
  );
}

function FrameFields({ node, onPatch }: { node: Node; onPatch: InspectorProps['onPatch'] }) {
  return (
    <Section title="Position & size">
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="X"
          value={node.frame.x}
          onChange={(v) => onPatch(node.id, { frame: { ...node.frame, x: v } })}
        />
        <NumberField
          label="Y"
          value={node.frame.y}
          onChange={(v) => onPatch(node.id, { frame: { ...node.frame, y: v } })}
        />
        <NumberField
          label="W"
          value={node.frame.w}
          min={0}
          onChange={(v) => onPatch(node.id, { frame: { ...node.frame, w: Math.max(0, v) } })}
        />
        <NumberField
          label="H"
          value={node.frame.h}
          min={0}
          onChange={(v) => onPatch(node.id, { frame: { ...node.frame, h: Math.max(0, v) } })}
        />
      </div>
    </Section>
  );
}

function TextFields({
  node,
  onPatch,
}: {
  node: TextNode;
  onPatch: InspectorProps['onPatch'];
}) {
  return (
    <>
      <Section title="Text">
        <textarea
          rows={3}
          value={node.text}
          onChange={(e) => onPatch(node.id, { text: e.target.value })}
          className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </Section>

      <Section title="Typography">
        <Field label="Font family">
          <Input
            value={node.font.family}
            onChange={(e) => onPatch(node.id, { font: { ...node.font, family: e.target.value } })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Size"
            value={node.font.size}
            min={1}
            onChange={(v) => onPatch(node.id, { font: { ...node.font, size: v } })}
          />
          <NumberField
            label="Weight"
            value={node.font.weight}
            min={100}
            max={900}
            step={100}
            onChange={(v) => onPatch(node.id, { font: { ...node.font, weight: v } })}
          />
        </div>
        <Field label="Color">
          <ColorField
            value={node.color}
            onChange={(c) => onPatch(node.id, { color: c })}
          />
        </Field>
        <Field label="Align">
          <select
            value={node.align}
            onChange={(e) => onPatch(node.id, { align: e.target.value as TextNode['align'] })}
            className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </Field>
      </Section>
    </>
  );
}

function ButtonFields({
  node,
  onPatch,
}: {
  node: ButtonNode;
  onPatch: InspectorProps['onPatch'];
}) {
  return (
    <>
      <Section title="Label">
        <Input
          value={node.label}
          onChange={(e) => onPatch(node.id, { label: e.target.value })}
        />
      </Section>
      <Section title="Style">
        <Field label="Background">
          <ColorField
            value={fillColor(node.fill)}
            onChange={(c) => onPatch(node.id, { fill: { kind: 'solid', color: c } })}
          />
        </Field>
        <Field label="Text color">
          <ColorField
            value={node.textColor}
            onChange={(c) => onPatch(node.id, { textColor: c })}
          />
        </Field>
        <NumberField
          label="Corner radius"
          value={node.cornerRadius}
          min={0}
          onChange={(v) => onPatch(node.id, { cornerRadius: v })}
        />
      </Section>
    </>
  );
}

function ShapeFields({
  node,
  onPatch,
}: {
  node: ShapeNode;
  onPatch: InspectorProps['onPatch'];
}) {
  return (
    <Section title="Style">
      <Field label="Fill">
        <ColorField
          value={fillColor(node.fill)}
          onChange={(c) => onPatch(node.id, { fill: { kind: 'solid', color: c } })}
        />
      </Field>
      <NumberField
        label="Corner radius"
        value={node.cornerRadius ?? 0}
        min={0}
        onChange={(v) => onPatch(node.id, { cornerRadius: v })}
      />
    </Section>
  );
}

function ImageFields({
  node,
  onPatch,
}: {
  node: ImageNode;
  onPatch: InspectorProps['onPatch'];
}) {
  return (
    <Section title="Image">
      <Field label="Source URL">
        <Input value={node.src} onChange={(e) => onPatch(node.id, { src: e.target.value })} />
      </Field>
      <Field label="Fit">
        <select
          value={node.fit}
          onChange={(e) => onPatch(node.id, { fit: e.target.value as ImageNode['fit'] })}
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
        </select>
      </Field>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Primitive form elements
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
    </Field>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={isHex(value) ? value : '#000000'}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-9 w-12 cursor-pointer rounded-md border border-border bg-background"
      />
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function fillColor(fill: Fill | undefined): string {
  if (!fill) return '#000000';
  if (fill.kind === 'solid') return fill.color;
  if (fill.kind === 'linear') return fill.stops[0]?.color ?? '#000000';
  return '#000000';
}

function isHex(s: string): boolean {
  return /^#[0-9a-fA-F]{3,8}$/.test(s);
}
