/**
 * Gold few-shot examples for `generate-html`.
 *
 * Each example pairs a brief + format with a hand-crafted HTML banner that
 * exemplifies the constraints (single doc, inline CSS, Google Fonts, exact
 * viewport, no scripts). Add more examples here as we ship Faza 2 → 5.
 *
 * Format: each entry returns the HTML as a tagged template so unused
 * prettier plugins don't reformat it inside dynamic prompt construction.
 */
import type { GenerationFormat } from '@/lib/db/schema';

type GoldExample = {
  format: GenerationFormat;
  brief: string;
  brand: { primary: string; accent: string; headlineFont: string };
  html: string;
};

export const GOLD_EXAMPLES: GoldExample[] = [
  {
    format: 'square_1080',
    brief: 'Winter sale, up to 30% off, deadline December 15.',
    brand: { primary: '#1F2937', accent: '#F97316', headlineFont: 'Inter' },
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1080px;font-family:'Inter',system-ui,sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
body{background:radial-gradient(120% 120% at 100% 0%,#F97316 0%,#1F2937 55%,#0F172A 100%);display:flex;flex-direction:column;justify-content:space-between;padding:96px}
.eyebrow{font-size:24px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;opacity:.75}
h1{font-size:128px;font-weight:900;line-height:.96;letter-spacing:-0.04em;margin-top:32px}
h1 em{font-style:normal;color:#F97316}
.deadline{font-size:28px;line-height:1.4;margin-top:32px;max-width:720px;opacity:.85}
.cta{align-self:flex-start;margin-top:auto;background:#fff;color:#0F172A;font-weight:800;font-size:32px;padding:24px 40px;border-radius:9999px;letter-spacing:-0.01em}
</style>
</head>
<body>
<div class="eyebrow">Winter sale</div>
<h1>Up to <em>30% off</em> everything.</h1>
<p class="deadline">Ends December 15. Free returns until end of January.</p>
<span class="cta">Shop the sale →</span>
</body>
</html>`,
  },
];

export function exampleHtmlByFormat(format: GenerationFormat): string | undefined {
  return GOLD_EXAMPLES.find((e) => e.format === format)?.html;
}
