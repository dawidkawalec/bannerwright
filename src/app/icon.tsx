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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #11BB88 0%, #0A7F5C 100%)',
          borderRadius: 8,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          B
        </span>
      </div>
    ),
    { ...size },
  );
}
