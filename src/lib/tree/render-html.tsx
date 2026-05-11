import { renderToStaticMarkup } from 'react-dom/server';
import type { BannerFont, BannerTree } from './types';
import { BannerRenderer } from './render-react';

/**
 * Render a BannerTree to a complete, self-contained HTML document for headless
 * screenshotting. Identical visual output to the canvas (same React component).
 *
 * Fonts: we emit a Google Fonts `@import` for declared families when the
 * family matches a known Google font name pattern. Custom-hosted fonts are
 * caller's responsibility.
 */
export function renderTreeToHtml(tree: BannerTree): string {
  const body = renderToStaticMarkup(<BannerRenderer tree={tree} withNodeIds={false} />);
  const fontImports = buildFontImports(tree.fonts ?? []);
  const { width, height } = tree.canvas;
  return [
    '<!DOCTYPE html>',
    '<html><head>',
    '<meta charset="utf-8" />',
    `<meta name="viewport" content="width=${width}, height=${height}" />`,
    '<style>',
    fontImports,
    'html,body{margin:0;padding:0;background:transparent;}',
    `body{width:${width}px;height:${height}px;}`,
    '</style>',
    '</head><body>',
    body,
    '</body></html>',
  ].join('');
}

function buildFontImports(fonts: BannerFont[]): string {
  if (fonts.length === 0) return '';
  const families = fonts
    .map((f) => {
      const weights = [...new Set(f.weights)].sort((a, b) => a - b).join(';');
      const family = f.family.replace(/\s+/g, '+');
      return `family=${family}:wght@${weights}`;
    })
    .join('&');
  return `@import url('https://fonts.googleapis.com/css2?${families}&display=swap');`;
}
