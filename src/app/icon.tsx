import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Standalone mark on a transparent canvas — the browser tab chrome (light or dark)
// becomes the backdrop. Same geometry as the in-page <LogoMark/>: two teal brackets
// holding a stacked banner pictogram.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="ico-grad" x1="2" y1="4" x2="30" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#16D195" />
              <stop offset="1" stopColor="#0A7F5C" />
            </linearGradient>
          </defs>
          <path
            d="M10 5 L4 5 L4 27 L10 27"
            stroke="url(#ico-grad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M22 5 L28 5 L28 27 L22 27"
            stroke="url(#ico-grad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="11.5" y="13" width="9" height="2.8" rx="1" fill="url(#ico-grad)" />
          <rect x="11.5" y="17.4" width="6" height="2.8" rx="1" fill="url(#ico-grad)" fillOpacity="0.6" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
