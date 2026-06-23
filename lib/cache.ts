/**
 * lib/cache.ts
 * Server-side in-memory cache using Next.js unstable_cache.
 * This means repeated requests within the revalidation window
 * are served from RAM — zero DB round-trips.
 */
import { unstable_cache } from 'next/cache';
import { connectDB } from './db';
import GameModel from './models/Game';
import CategoryModel from './models/Category';
import HomepageConfigModel from './models/HomepageConfig';

// ── Games list (home page) ────────────────────────────────────────────────────
export const getCachedGames = unstable_cache(
  async (limit = 40) => {
    await connectDB();
    const games = await GameModel.find({ isActive: true })
      .sort({ featured: -1, playCount: -1, createdAt: -1 })
      .limit(limit)
      .populate('categories', 'name slug icon')
      .lean();
    return JSON.parse(JSON.stringify(games));
  },
  ['games-list'],
  { revalidate: 30, tags: ['games'] }
);

// ── Categories ────────────────────────────────────────────────────────────────
export const getCachedCategories = unstable_cache(
  async () => {
    await connectDB();
    const cats = await CategoryModel.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();
    return JSON.parse(JSON.stringify(cats));
  },
  ['categories-list'],
  { revalidate: 60, tags: ['categories'] }
);

// ── Homepage config ───────────────────────────────────────────────────────────
export const getCachedHomepageConfig = unstable_cache(
  async () => {
    await connectDB();
    const cfg = await HomepageConfigModel.findOne({ key: 'main' }).lean();
    return cfg ? JSON.parse(JSON.stringify(cfg)) : null;
  },
  ['homepage-config'],
  { revalidate: 60, tags: ['homepage'] }
);

// ── Single game by slug ───────────────────────────────────────────────────────
export const getCachedGame = unstable_cache(
  async (slug: string) => {
    await connectDB();
    const game = await GameModel.findOne({ slug, isActive: true })
      .populate('categories', 'name slug icon')
      .lean();
    return game ? JSON.parse(JSON.stringify(game)) : null;
  },
  ['game-by-slug'],
  { revalidate: 60, tags: ['games'] }
);

// ── Games by category (for related games sidebar) ─────────────────────────────
export const getCachedGamesByCategory = unstable_cache(
  async (categoryId: string, excludeSlug: string, limit = 8) => {
    await connectDB();
    const games = await GameModel.find({
      isActive: true,
      categories: categoryId,
      slug: { $ne: excludeSlug },
    })
      .limit(limit)
      .populate('categories', 'name slug icon')
      .lean();
    return JSON.parse(JSON.stringify(games));
  },
  ['games-by-category'],
  { revalidate: 60, tags: ['games'] }
);
