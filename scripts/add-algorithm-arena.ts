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

const MenuSchema = new mongoose.Schema({
  label: String, slug: String, type: String, categoryRef: mongoose.Types.ObjectId,
  url: String, position: String, sortOrder: Number, isActive: Boolean,
}, { timestamps: true });

const GameSchema = new mongoose.Schema({
  title: String, slug: String, description: String, thumbnail: String,
  categories: [mongoose.Types.ObjectId], tags: [String],
  gameType: String, iframeUrl: String, phaserGameKey: String,
  width: Number, height: Number, featured: Boolean, isActive: Boolean,
  playCount: Number, rating: Number, sortOrder: Number, developer: String, instructions: String,
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Menu = mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Create or Find Math Category
  let mathCat = await Category.findOne({ slug: 'math' });
  if (!mathCat) {
    mathCat = new Category({
      name: 'Math',
      slug: 'math',
      icon: '🧮',
      description: 'Educational, numbers and math strategy games',
      isActive: true,
      sortOrder: 8
    });
    await mathCat.save();
    console.log('Created Math category');
  } else {
    console.log('Math category already exists');
  }

  // 2. Create or Find Math Header Menu
  let mathMenu = await Menu.findOne({ slug: 'math', position: 'header' });
  if (!mathMenu) {
    mathMenu = new Menu({
      label: 'Math',
      slug: 'math',
      type: 'category',
      categoryRef: mathCat._id,
      position: 'header',
      sortOrder: 5,
      isActive: true
    });
    await mathMenu.save();
    console.log('Created Math header menu item');
  } else {
    console.log('Math header menu item already exists');
  }

  // 3. Delete existing Algorithm Arena game to avoid duplicates
  await Game.deleteMany({ slug: 'algorithm-arena' });
  console.log('Cleared existing Algorithm Arena game data');

  // 4. Create new game entry
  const newGame = new Game({
    title: 'Algorithm Arena',
    slug: 'algorithm-arena',
    description: 'A cyberpunk mathematical auto-battler where you draft Number Units (1–9) and Operator Tiles (+, -, ×, ÷, √) to solve equations and defeat mechanical boss nodes in a solo roguelike campaign! Synergize Prime numbers, Even/Odd sequences, or Fibonacci runs to unlock massive damage boosts and submit your top scores to the seasonal leaderboard.',
    thumbnail: '/thumbnails/algorithm-arena.png',
    categories: [mathCat._id],
    tags: ['math', 'auto-battler', 'strategy', 'roguelike', 'numbers', 'phaser'],
    gameType: 'phaser',
    phaserGameKey: 'algorithm-arena',
    width: 800,
    height: 600,
    featured: true,
    isActive: true,
    playCount: 1980,
    rating: 4.9,
    sortOrder: 19,
    developer: 'FlipTrip Games',
    instructions: '1. Shop Phase: Buy Number Units (1–9) and Operator Tiles (+, -, ×, ÷, √) with gold credits.\n2. Placement Phase: Place tiles onto the 5 board slots: [Unit] [Operator] [Unit] [Operator] [Unit] to construct math formulas.\n3. Synergies: Activating synergies like All Primes, All Evens, All Odds, or Fibonacci sequences grants huge stat multipliers!\n4. Auto-Battle: Click START COMBAT to watch your numbers charge and cast calculation spells to defeat the boss node! Defeat all 5 roguelike stages to win!'
  });

  await newGame.save();
  console.log('Algorithm Arena game registered successfully!');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

run().catch(err => {
  console.error('Error running seeder script:', err);
  process.exit(1);
});
