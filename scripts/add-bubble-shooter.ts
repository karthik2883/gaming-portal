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

  // Find Arcade and Puzzle categories
  const arcade = await Category.findOne({ slug: 'arcade' });
  const puzzle = await Category.findOne({ slug: 'puzzle' });

  if (!arcade || !puzzle) {
    console.error('Could not find Arcade or Puzzle categories! Please seed database first.');
    process.exit(1);
  }

  // Delete existing bubble shooter to avoid duplicates
  await Game.deleteMany({ slug: 'bubble-shooter' });
  console.log('Cleared existing Bubble Shooter data');

  const newGame = new Game({
    title: 'Bubble Shooter Neo',
    slug: 'bubble-shooter',
    description: 'Pop glowing bubbles, aim with a bouncing wall laser sight, drop hanging orphan clusters, and survive the advancing ceiling in this cyberpunk Bubble Shooter built with Phaser.js! Features full leaderboard ranking.',
    thumbnail: '/thumbnails/bubble-shooter.png',
    categories: [arcade._id, puzzle._id],
    tags: ['bubble', 'shooter', 'neon', 'puzzle', 'arcade'],
    gameType: 'phaser',
    phaserGameKey: 'bubble-shooter',
    width: 480,
    height: 600,
    featured: true,
    isActive: true,
    playCount: 1250,
    rating: 4.8,
    sortOrder: 10,
    developer: 'FlipTrip Games',
    instructions: 'Aim with your mouse cursor. Left click to shoot your colored bubble. Match 3 or more bubbles of the same color to pop them. Pop bubbles holding up other clusters to drop them for massive bonus points! The ceiling pushes down a new row of bubbles every 6 shots. Do not let bubbles reach the danger line!'
  });

  await newGame.save();
  console.log('Bubble Shooter Neo saved successfully!');
  
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

run().catch(err => {
  console.error('Error seeding bubble shooter:', err);
  process.exit(1);
});
