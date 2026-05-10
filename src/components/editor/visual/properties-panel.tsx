'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { describeElement } from '@/lib/wysiwyg/stamp';
import { readElementStyle, rgbToHex, type VisualOp } from '@/lib/wysiwyg/patch';

const COMMON_FONTS = [
  'Inter',
  'Manrope',
  'DM Sans',
  'Plus Jakarta Sans',
  'Montserrat',
  'Poppins',
  'Lato',
  'Roboto',
  'Source Sans 3',
  'Playfair Display',
  'Merriweather',
  'Space Grotesk',
  'Bricolage Grotesque',
  'Geist',
  'system-ui',
] as const;

type Props = {
  /** Element living in the canvas shadow DOM, or null when nothing selected. */
  selectedElement: HTMLElement | null;
  selectedId: string | null;
  onApply: (ops: VisualOp[]) => void;
  onCancel: () => void;
  disabled?: boolean;
};

type Fields = {
  text: string;
  color: string;
  backgroundColor: string;
  fontSize: string; // px without unit
  fontFamily: string;
  fontWeight: string;
};

const EMPTY: Fields = {
  text: '',
  color: '#000000',
  backgroundColor: '#ffffff',
  fontSize: '16',
  fontFamily: 'Inter',
  fontWeight: '400',
};

function computeInitial(el: HTMLElement | null): Fields {
  if (!el) return EMPTY;
  const computed = readElementStyle(el);
  return {
    text: collapseText(el),
    color: rgbToHex(computed.color),
    backgroundColor: rgbToHex(computed.backgroundColor),
    fontSize: parsePxToString(computed.fontSize),
    fontFamily: pickPrimaryFont(computed.fontFamily),
    fontWeight: computed.fontWeight,
  };
}

export function PropertiesPanel({
  selectedElement,
  selectedId,
  onApply,
  onCancel,
  disabled,
}: Props) {
  // Lazy init derived from selectedElement on mount. Parent passes
  // key={selectedId} so this component remounts (and re-derives) when the
  // user picks a different element — no effect-driven state syncing.
  const [initial] = useState<Fields>(() => computeInitial(selectedElement));
  const [fields, setFields] = useState<Fields>(initial);

  if (!selectedElement || !selectedId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">
            Click any element on the banner — text, button, image — to edit it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const dirty = JSON.stringify(fields) !== JSON.stringify(initial);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function buildOps(): VisualOp[] {
    const ops: VisualOp[] = [];
    if (fields.text !== initial.text) {
      ops.push({ kind: 'text', bwId: selectedId!, text: fields.text });
    }
    if (fields.color !== initial.color) {
      ops.push({ kind: 'style', bwId: selectedId!, prop: 'color', value: fields.color });
    }
    if (fields.backgroundColor !== initial.backgroundColor) {
      ops.push({
        kind: 'style',
        bwId: selectedId!,
        prop: 'background-color',
        value: fields.backgroundColor,
      });
    }
    if (fields.fontSize !== initial.fontSize && fields.fontSize !== '') {
      ops.push({
        kind: 'style',
        bwId: selectedId!,
        prop: 'font-size',
        value: `${fields.fontSize}px`,
      });
    }
    if (fields.fontFamily !== initial.fontFamily) {
      ops.push({
        kind: 'style',
        bwId: selectedId!,
        prop: 'font-family',
        value: `'${fields.fontFamily}', system-ui, sans-serif`,
      });
    }
    if (fields.fontWeight !== initial.fontWeight) {
      ops.push({
        kind: 'style',
        bwId: selectedId!,
        prop: 'font-weight',
        value: fields.fontWeight,
      });
    }
    return ops;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Properties</span>
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
            {describeElement(selectedElement)}
          </code>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bw-text">Text</Label>
          <textarea
            id="bw-text"
            rows={3}
            value={fields.text}
            onChange={(e) => update('text', e.target.value)}
            disabled={disabled}
            placeholder="(no text)"
            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bw-color">Text colour</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Text colour picker"
                value={fields.color}
                onChange={(e) => update('color', e.target.value)}
                disabled={disabled}
                className="h-9 w-10 cursor-pointer rounded-md border border-slate-200"
              />
              <Input
                id="bw-color"
                value={fields.color}
                onChange={(e) => update('color', e.target.value)}
                disabled={disabled}
                className="font-mono"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bw-bg">Background</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Background picker"
                value={fields.backgroundColor}
                onChange={(e) => update('backgroundColor', e.target.value)}
                disabled={disabled}
                className="h-9 w-10 cursor-pointer rounded-md border border-slate-200"
              />
              <Input
                id="bw-bg"
                value={fields.backgroundColor}
                onChange={(e) => update('backgroundColor', e.target.value)}
                disabled={disabled}
                className="font-mono"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bw-fs">Font size (px)</Label>
            <Input
              id="bw-fs"
              type="number"
              min={6}
              max={400}
              value={fields.fontSize}
              onChange={(e) => update('fontSize', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bw-fw">Font weight</Label>
            <select
              id="bw-fw"
              value={fields.fontWeight}
              onChange={(e) => update('fontWeight', e.target.value)}
              disabled={disabled}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:opacity-50"
            >
              {['300', '400', '500', '600', '700', '800', '900'].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bw-ff">Font family</Label>
          <select
            id="bw-ff"
            value={fields.fontFamily}
            onChange={(e) => update('fontFamily', e.target.value)}
            disabled={disabled}
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:opacity-50"
          >
            {COMMON_FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-700">
            Loaded as Google Font when used. Add @import in code mode for niche faces.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={disabled}>
            Deselect
          </Button>
          <Button
            size="sm"
            disabled={disabled || !dirty}
            onClick={() => {
              const ops = buildOps();
              if (ops.length > 0) onApply(ops);
            }}
          >
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function collapseText(el: HTMLElement): string {
  // Show inline text only (no nested element text). Good for headlines/paragraphs.
  let s = '';
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) s += n.textContent ?? '';
  });
  return s.trim() || el.textContent?.trim() || '';
}

function parsePxToString(value: string): string {
  const m = value.match(/^(\d+(?:\.\d+)?)px$/);
  return m ? m[1]! : value;
}

function pickPrimaryFont(stack: string): string {
  const first = stack.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '') ?? 'Inter';
  return first;
}
