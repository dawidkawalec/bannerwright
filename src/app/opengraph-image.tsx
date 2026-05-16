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
        {/* top row — mark + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 72,
              height: 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              background: 'linear-gradient(135deg, #11BB88 0%, #0A7F5C 100%)',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 10 L9 10 L9 38 L15 38"
                stroke="white"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M33 10 L39 10 L39 38 L33 38"
                stroke="white"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <rect x="18" y="20" width="12" height="3.2" rx="1" fill="white" />
              <rect x="18" y="25" width="8" height="3.2" rx="1" fill="white" fillOpacity="0.7" />
            </svg>
          </div>
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
          <span style={{ color: '#F5F7F6', fontWeight: 500 }}>bannerwright.kawalec.pl</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
