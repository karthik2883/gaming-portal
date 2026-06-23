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

  // 3. Delete existing Nebula Navigator game to avoid duplicates
  await Game.deleteMany({ slug: 'nebula-navigator' });
  console.log('Cleared existing Nebula Navigator game data');

  // 4. Create new game entry
  const newGame = new Game({
    title: 'Nebula Navigator',
    slug: 'nebula-navigator',
    description: 'A top-down space exploration RPG where you navigate a procedurally generated galaxy. Solve algebraic Warp Equations to travel between star systems, engage in Frequency Tuning combat by balancing equations against enemy shields, and claim star systems by solving Grand Theorem puzzles. Implement your own trading economy using Math-Commodities!',
    thumbnail: '/thumbnails/nebula-navigator.png',
    categories: [mathCat._id],
    tags: ['math', 'space', 'rpg', 'exploration', 'puzzle', 'phaser'],
    gameType: 'phaser',
    phaserGameKey: 'nebula-navigator',
    width: 800,
    height: 600,
    featured: true,
    isActive: true,
    playCount: 543,
    rating: 4.8,
    sortOrder: 20,
    developer: 'AstroMath Studios',
    instructions: '1. Exploration: Click on adjacent star systems in the Galaxy Map to travel. Solve Warp Equations to jump without using extra fuel.\n2. Combat: Engage enemy ships using Frequency Tuning—balance your weapon frequency to match their shields.\n3. Claiming: Solve high-difficulty Grand Theorem puzzles to claim systems and generate Math-Commodities.\n4. Trading: Trade commodities at Space Stations to upgrade your ship.'
  });

  await newGame.save();
  console.log('Nebula Navigator game registered successfully!');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

run().catch(err => {
  console.error('Error running seeder script:', err);
  process.exit(1);
});
