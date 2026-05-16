import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bannerwright',
    short_name: 'Bannerwright',
    description:
      'The AI workshop for HTML banners. Brief in, brand-perfect creatives out — self-hosted, editable, version-controlled.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1112',
    theme_color: '#11BB88',
    orientation: 'portrait',
    categories: ['design', 'productivity', 'business'],
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
