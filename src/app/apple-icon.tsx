import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #06C167 0%, #0A7F5C 100%)',
          borderRadius: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M37 24 L22 24 L22 96 L37 96"
            stroke="white"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M83 24 L98 24 L98 96 L83 96"
            stroke="white"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="46" y="50" width="28" height="8" rx="2.5" fill="white" />
          <rect x="46" y="62" width="19" height="8" rx="2.5" fill="white" fillOpacity="0.7" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
