import { MetadataRoute } from 'next';
import { connectDB } from '@/lib/db';
import Game from '@/lib/models/Game';
import Category from '@/lib/models/Category';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  await connectDB();
  
  // Get all active categories
  const categories = await Category.find({ isActive: true }).select('slug updatedAt').lean() as any[];
  
  // Get all active games
  const games = await Game.find({ isActive: true }).select('slug updatedAt').lean() as any[];

  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const gameEntries: MetadataRoute.Sitemap = games.map((game) => ({
    url: `${baseUrl}/game/${game.slug}`,
    lastModified: game.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...categoryEntries,
    ...gameEntries,
  ];
}
