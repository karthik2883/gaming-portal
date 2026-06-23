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

  // Find Puzzle and Casual categories
  const puzzle = await Category.findOne({ slug: 'puzzle' });
  const casual = await Category.findOne({ slug: 'casual' });

  if (!puzzle || !casual) {
    console.error('Could not find Puzzle or Casual categories! Please seed database first.');
    process.exit(1);
  }

  // Delete existing candy-match to avoid duplicates
  await Game.deleteMany({ slug: 'candy-match' });
  console.log('Cleared existing Candy Match data');

  const newGame = new Game({
    title: 'Candy Match Neo',
    slug: 'candy-match',
    description: 'Match glowing cyberpunk neon candies, unlock powerful striped and wrapped special candies, activate color bombs, and rack up high score combos in this premium Match-3 puzzle experience built in Phaser.js! Features a 30-move limit and full leaderboard ranking.',
    thumbnail: '/thumbnails/candy-match.png',
    categories: [puzzle._id, casual._id],
    tags: ['candy', 'match', 'match3', 'puzzle', 'neon', 'casual'],
    gameType: 'phaser',
    phaserGameKey: 'candy-match',
    width: 800,
    height: 600,
    featured: true,
    isActive: true,
    playCount: 2045,
    rating: 4.8,
    sortOrder: 12,
    developer: 'FlipTrip Games',
    instructions: 'Click and drag a candy to swap it with an adjacent one, or click two adjacent cells to swap them. Match 3 or more of the same color in a row or column to clear them and score points. Matching 4 in a line creates a Striped Candy. Matching 5 in a T/L shape creates a Wrapped Candy. Matching 5 in a straight line creates a Color Bomb! You have 30 moves to score as high as possible.'
  });

  await newGame.save();
  console.log('Candy Match Neo saved successfully!');
  
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

run().catch(err => {
  console.error('Error seeding candy match:', err);
  process.exit(1);
});
