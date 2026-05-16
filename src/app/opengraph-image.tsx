import { ImageResponse } from 'next/og';

export const alt = 'Bannerwright — The AI workshop for HTML banners';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background:
            'radial-gradient(ellipse at top left, rgba(17,187,136,0.22), transparent 55%), radial-gradient(ellipse at bottom right, rgba(95,76,237,0.18), transparent 55%), linear-gradient(180deg, #0B1112 0%, #0A1A18 100%)',
          color: '#F5F7F6',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* top row — standalone mark + wordmark, no surrounding tile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="og-grad"
                x1="2"
                y1="4"
                x2="30"
                y2="28"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#16D195" />
                <stop offset="1" stopColor="#0A7F5C" />
              </linearGradient>
            </defs>
            <path
              d="M10 5 L4 5 L4 27 L10 27"
              stroke="url(#og-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M22 5 L28 5 L28 27 L22 27"
              stroke="url(#og-grad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <rect x="11.5" y="13" width="9" height="2.8" rx="1" fill="url(#og-grad)" />
            <rect
              x="11.5"
              y="17.4"
              width="6"
              height="2.8"
              rx="1"
              fill="url(#og-grad)"
              fillOpacity="0.6"
            />
          </svg>
          <span style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.01em' }}>
            Bannerwright
          </span>
        </div>

        {/* middle — headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <span
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: '#11BB88',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Open source · Self-hosted · BYOM
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: 96,
              fontWeight: 300,
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              maxWidth: 1040,
            }}
          >
            The AI workshop for HTML banners.
          </h1>
        </div>

        {/* bottom — tagline + URL */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            color: '#9CA3A0',
            fontSize: 24,
          }}
        >
          <span style={{ maxWidth: 720 }}>
            Brief in. Brand-perfect creatives out — as editable HTML, ready to export.
          </span>
          <span style={{ color: '#F5F7F6', fontWeight: 500 }}>bannerwright.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
