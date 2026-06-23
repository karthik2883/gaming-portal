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

  const puzzleCat  = await Category.findOne({ slug: 'puzzle' });
  const casualCat  = await Category.findOne({ slug: 'casual' });

  console.log('Puzzle category:', puzzleCat?._id);
  console.log('Casual category:', casualCat?._id);

  await Game.deleteMany({ slug: 'memory-match' });
  console.log('Cleared existing memory-match game');

  const cats = [puzzleCat?._id, casualCat?._id].filter(Boolean);

  await Game.create({
    title: 'Memory Match Neo',
    slug: 'memory-match',
    description: 'Flip glowing neon cards and find all matching symbol pairs before time runs out! Features 3 difficulty levels (Easy 4×3, Medium 4×4, Hard 5×4), combo chains with bonus points and time extensions, particle burst effects, cyberpunk synthesized sound effects, and full leaderboard integration.',
    thumbnail: '/thumbnails/memory-match.png',
    gameType: 'phaser',
    phaserGameKey: 'memory-match',
    categories: cats,
    tags: ['memory', 'match', 'cards', 'puzzle', 'concentration', 'brain', 'neon', 'casual'],
    isActive: true,
    featured: true,
    rating: 4.8,
    playCount: 0,
    instructions: 'Click cards to flip them. Match pairs of identical symbols. Find all pairs before the timer runs out! Chain matches for combo bonuses.',
  });

  console.log('✅ Memory Match Neo seeded successfully!');
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
