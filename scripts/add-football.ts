import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { webcrypto } from 'crypto';

if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

const CategorySchema = new mongoose.Schema({ name: String, slug: String }, { strict: false });
const GameSchema = new mongoose.Schema({}, { strict: false });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find Sports & Action categories
  const sportsCat = await Category.findOne({ slug: 'sports' });
  const actionCat = await Category.findOne({ slug: 'action' });

  console.log('Sports category:', sportsCat?._id);
  console.log('Action category:', actionCat?._id);

  // Remove existing football game entry
  await Game.deleteMany({ slug: 'football' });
  console.log('Cleared existing football game');

  const cats = [sportsCat?._id, actionCat?._id].filter(Boolean);

  await Game.create({
    title: 'FIFA Football Neo',
    slug: 'football',
    description: 'Choose your national team and challenge the CPU in a thrilling top-down 5v5 football match! Features 16 international teams, canvas-drawn flags, smart AI opponents scaled by team rating, realistic ball physics, goal celebrations, and a full 90-minute match with halftime.',
    thumbnail: '/thumbnails/football.png',
    gameType: 'phaser',
    phaserGameKey: 'football',
    categories: cats,
    tags: ['football','soccer','sports','multiplayer','FIFA','country','5v5','arcade'],
    isActive: true,
    featured: true,
    difficulty: 'medium',
    controls: 'Arrow Keys / WASD to move player • Space to shoot',
    rating: 4.9,
    playCount: 0,
  });

  console.log('✅ FIFA Football Neo seeded successfully!');
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
