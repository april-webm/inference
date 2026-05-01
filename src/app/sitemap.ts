import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://inferenc.me', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://inferenc.me/about', changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://inferenc.me/leaderboard', changeFrequency: 'daily', priority: 0.7 },
  ]
}
