import { describe, expect, it } from 'vitest';
import type { BannerTree } from './types';
import { renderTreeToHtml } from './render-html';

function tree(): BannerTree {
  return {
    schemaVersion: 1,
    canvas: {
      width: 1080,
      height: 1080,
      background: { kind: 'solid', color: '#0F172A' },
    },
    fonts: [{ family: 'Inter', weights: [400, 800] }],
    root: {
      id: 'root',
      type: 'frame',
      frame: { x: 0, y: 0, w: 1080, h: 1080 },
      children: [
        {
          id: 'h1',
          type: 'text',
          frame: { x: 80, y: 380, w: 920, h: 200 },
          text: 'Black Friday\n-50%',
          font: { family: 'Inter', weight: 800, size: 120 },
          color: '#FBBF24',
          align: 'left',
        },
        {
          id: 'b1',
          type: 'button',
          frame: { x: 80, y: 820, w: 280, h: 80 },
          label: 'Kup teraz',
          fill: { kind: 'solid', color: '#F59E0B' },
          textColor: '#0F172A',
          cornerRadius: 40,
          font: { family: 'Inter', weight: 700, size: 28 },
          padding: { x: 24, y: 12 },
        },
        {
          id: 's1',
          type: 'shape',
          frame: { x: 900, y: 80, w: 100, h: 100 },
          variant: 'ellipse',
          fill: { kind: 'solid', color: '#F59E0B' },
        },
      ],
    },
  };
}

describe('tree/render-html', () => {
  it('produces a self-contained HTML document', () => {
    const html = renderTreeToHtml(tree());
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<html>');
    expect(html).toContain('</html>');
    expect(html).toContain('width:1080px');
    expect(html).toContain('height:1080px');
  });

  it('emits Google Fonts @import for declared fonts', () => {
    const html = renderTreeToHtml(tree());
    expect(html).toContain("@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;800");
  });

  it('renders text content with line breaks preserved', () => {
    const html = renderTreeToHtml(tree());
    expect(html).toContain('Black Friday');
    expect(html).toContain('-50%');
    expect(html).toContain('<br/>');
  });

  it('renders button label and shape as a div', () => {
    const html = renderTreeToHtml(tree());
    expect(html).toContain('Kup teraz');
    // ellipse → border-radius:50%
    expect(html).toContain('border-radius:50%');
  });

  it('does NOT emit data-node-id in server output (withNodeIds=false)', () => {
    const html = renderTreeToHtml(tree());
    expect(html).not.toContain('data-node-id');
  });
});
