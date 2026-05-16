import type { MetadataRoute } from 'next';

const SITE_URL = 'https://bannerwright.com';

// One-pager landing site — only the root URL is publicly indexable.
// Authenticated app routes (/workspaces, /account, /login) intentionally excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
