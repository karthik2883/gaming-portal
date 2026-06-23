import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { webcrypto } from 'crypto';

if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gaming-portal';

const CategorySchema = new mongoose.Schema({
  name: String, slug: String, icon: String, description: String,
  isActive: Boolean, sortOrder: Number,
}, { timestamps: true });

const GameSchema = new mongoose.Schema({
  title: String, slug: String, description: String, thumbnail: String,
  categories: [mongoose.Types.ObjectId], tags: [String],
  gameType: String, iframeUrl: String, phaserGameKey: String,
  width: Number, height: Number, featured: Boolean, isActive: Boolean,
  playCount: Number, rating: Number, sortOrder: Number, developer: String, instructions: String,
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find Action and Arcade categories
  const action = await Category.findOne({ slug: 'action' });
  const arcade = await Category.findOne({ slug: 'arcade' });

  if (!action || !arcade) {
    console.error('Could not find Action or Arcade categories! Please seed database first.');
    process.exit(1);
  }

  // Delete existing fruit slice to avoid duplicates
  await Game.deleteMany({ slug: 'fruit-slice' });
  console.log('Cleared existing Fruit Slice data');

  const newGame = new Game({
    title: 'Fruit Slice Neo',
    slug: 'fruit-slice',
    description: 'Slash glowing cyberpunk hologram fruits, dodge glowing red bombs, chain combo multipliers, and paint the screen in neon splatters in this premium Fruit Ninja adaptation built in Phaser.js! Features full leaderboard ranking.',
    thumbnail: '/thumbnails/fruit-slice.png',
    categories: [action._id, arcade._id],
    tags: ['fruit', 'slice', 'ninja', 'slash', 'neon', 'action', 'arcade'],
    gameType: 'phaser',
    phaserGameKey: 'fruit-slice',
    width: 800,
    height: 600,
    featured: true,
    isActive: true,
    playCount: 1420,
    rating: 4.9,
    sortOrder: 11,
    developer: 'FlipTrip Games',
    instructions: 'Click and drag your mouse pointer (or swipe on touchscreen) to draw a glowing neon energy slash. Intersect the flying holographic fruits to split them apart. Slicing 3 or more fruits in a single swipe triggers a combo for bonus points! Missing a fruit costs 1 life. Slicing a red warning bomb triggers an explosion and instantly ends the session!'
  });

  await newGame.save();
  console.log('Fruit Slice Neo saved successfully!');
  
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

run().catch(err => {
  console.error('Error seeding fruit slice:', err);
  process.exit(1);
});
