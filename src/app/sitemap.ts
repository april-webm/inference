import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://inferenc.me', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://inferenc.me/about', changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://inferenc.me/leaderboard', changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://inferenc.me/rounds', changeFrequency: 'weekly', priority: 0.7 },
  ]
}
