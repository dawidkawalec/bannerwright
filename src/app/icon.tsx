import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #11BB88 0%, #0A7F5C 100%)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6.5 4 L4 4 L4 18 L6.5 18"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M15.5 4 L18 4 L18 18 L15.5 18"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="8" y="9" width="6" height="1.7" rx="0.5" fill="white" />
          <rect x="8" y="11.6" width="4" height="1.7" rx="0.5" fill="white" fillOpacity="0.7" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
