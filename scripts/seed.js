/**
 * Seed script — populates demo data into MongoDB
 * Run: node scripts/seed.js
 */

// Node 16 compatibility: polyfill globalThis.crypto
const { webcrypto } = require('crypto');
if (!globalThis.crypto) globalThis.crypto = webcrypto;

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

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

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([Category.deleteMany({}), Menu.deleteMany({}), Game.deleteMany({})]);
  console.log('🗑️  Cleared existing data');

  // Create categories
  const categories = await Category.insertMany([
    { name: 'Action', slug: 'action', icon: '⚔️', description: 'Fast-paced action games', isActive: true, sortOrder: 1 },
    { name: 'Puzzle', slug: 'puzzle', icon: '🧩', description: 'Mind-bending puzzle games', isActive: true, sortOrder: 2 },
    { name: 'Racing', slug: 'racing', icon: '🏎️', description: 'High-speed racing games', isActive: true, sortOrder: 3 },
    { name: 'Sports', slug: 'sports', icon: '⚽', description: 'Sports simulation games', isActive: true, sortOrder: 4 },
    { name: 'Arcade', slug: 'arcade', icon: '👾', description: 'Classic arcade games', isActive: true, sortOrder: 5 },
    { name: 'Adventure', slug: 'adventure', icon: '🌍', description: 'Epic adventure games', isActive: true, sortOrder: 6 },
    { name: 'Strategy', slug: 'strategy', icon: '🧠', description: 'Strategic thinking games', isActive: true, sortOrder: 7 },
    { name: 'Casual', slug: 'casual', icon: '🎯', description: 'Easy casual games', isActive: true, sortOrder: 8 },
  ]);
  console.log(`📂 Created ${categories.length} categories`);

  const catMap = {};
  categories.forEach(c => { catMap[c.slug] = c._id; });

  // Create menu items (header nav)
  await Menu.insertMany([
    { label: 'Action', slug: 'action', type: 'category', categoryRef: catMap['action'], position: 'header', sortOrder: 1, isActive: true },
    { label: 'Puzzle', slug: 'puzzle', type: 'category', categoryRef: catMap['puzzle'], position: 'header', sortOrder: 2, isActive: true },
    { label: 'Racing', slug: 'racing', type: 'category', categoryRef: catMap['racing'], position: 'header', sortOrder: 3, isActive: true },
    { label: 'Arcade', slug: 'arcade', type: 'category', categoryRef: catMap['arcade'], position: 'header', sortOrder: 4, isActive: true },
    { label: 'Strategy', slug: 'strategy', type: 'category', categoryRef: catMap['strategy'], position: 'header', sortOrder: 5, isActive: true },
    { label: 'Casual', slug: 'casual', type: 'category', categoryRef: catMap['casual'], position: 'header', sortOrder: 6, isActive: true },
    // Footer links
    { label: 'All Games', slug: 'all-games', type: 'custom', url: '/', position: 'footer', sortOrder: 1, isActive: true },
    { label: 'Action', slug: 'footer-action', type: 'category', categoryRef: catMap['action'], position: 'footer', sortOrder: 2, isActive: true },
    { label: 'Puzzle', slug: 'footer-puzzle', type: 'category', categoryRef: catMap['puzzle'], position: 'footer', sortOrder: 3, isActive: true },
    { label: 'Adventure', slug: 'footer-adventure', type: 'category', categoryRef: catMap['adventure'], position: 'footer', sortOrder: 4, isActive: true },
  ]);
  console.log('☰  Created menu items');

  // Create sample games
  const games = [
    {
      title: 'Snake Classic',
      slug: 'snake-classic',
      description: 'The classic snake game built with Phaser.js! Collect food, grow longer, and avoid walls. A timeless arcade experience.',
      thumbnail: 'https://images.unsplash.com/photo-1585620385456-4759f9b5c7d9?w=400&h=300&fit=crop',
      categories: [catMap['arcade']],
      tags: ['snake', 'classic', 'arcade', 'retro'],
      gameType: 'phaser',
      phaserGameKey: 'snake',
      width: 600, height: 500,
      featured: true, isActive: true, playCount: 1250, rating: 4.5, sortOrder: 1,
      developer: 'FlipTrip Games',
      instructions: 'Use Arrow Keys or WASD to control the snake. Eat the red food to grow. Avoid the walls and yourself!',
    },
    {
      title: '2048',
      slug: '2048-puzzle',
      description: 'Merge tiles to reach 2048! A highly addictive number puzzle game. Slide tiles to combine identical numbers.',
      thumbnail: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=300&fit=crop',
      categories: [catMap['puzzle'], catMap['casual']],
      tags: ['2048', 'puzzle', 'numbers', 'merge'],
      gameType: 'iframe',
      iframeUrl: 'https://play2048.co/',
      width: 800, height: 600,
      featured: true, isActive: true, playCount: 8920, rating: 4.7, sortOrder: 2,
      developer: 'Gabriele Cirulli',
      instructions: 'Use arrow keys to slide tiles. Match identical numbers to combine them. Reach 2048!',
    },
    {
      title: 'Flappy Bird',
      slug: 'flappy-bird',
      description: 'Navigate the bird through pipes without hitting them! Simple controls, brutally challenging gameplay.',
      thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
      categories: [catMap['arcade'], catMap['action']],
      tags: ['flappy', 'bird', 'flying', 'casual'],
      gameType: 'iframe',
      iframeUrl: 'https://flappybird.io/',
      width: 400, height: 600,
      featured: true, isActive: true, playCount: 12340, rating: 4.2, sortOrder: 3,
      developer: 'Dong Nguyen',
      instructions: 'Click or press Space to flap. Navigate through the pipes without hitting them!',
    },
    {
      title: 'Pac-Man',
      slug: 'pac-man',
      description: 'Eat all the dots while avoiding ghosts in this all-time arcade classic! Use power pellets to turn the tables.',
      thumbnail: 'https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?w=400&h=300&fit=crop',
      categories: [catMap['arcade'], catMap['action']],
      tags: ['pacman', 'ghost', 'arcade', 'classic', 'retro'],
      gameType: 'iframe',
      iframeUrl: 'https://www.google.com/logos/2010/pacman10-i.html',
      width: 700, height: 600,
      featured: true, isActive: true, playCount: 9870, rating: 4.8, sortOrder: 4,
      developer: 'Namco',
      instructions: 'Use arrow keys to move. Eat all dots, avoid ghosts. Eat power pellets to fight back!',
    },
    {
      title: 'Chess Online',
      slug: 'chess-online',
      description: 'Play chess against AI. The ultimate strategy board game. Perfect for all skill levels.',
      thumbnail: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=300&fit=crop',
      categories: [catMap['strategy'], catMap['puzzle']],
      tags: ['chess', 'strategy', 'board game', 'mind'],
      gameType: 'iframe',
      iframeUrl: 'https://www.chess.com/play/computer',
      width: 900, height: 700,
      featured: false, isActive: true, playCount: 3200, rating: 4.9, sortOrder: 5,
      developer: 'Chess.com',
      instructions: 'Click a piece to select it, then click the destination square. Checkmate the opponent!',
    },
    {
      title: 'Sudoku Master',
      slug: 'sudoku-master',
      description: 'Classic Sudoku number puzzle. Fill the 9x9 grid so every row, column, and box contains digits 1-9.',
      thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=300&fit=crop',
      categories: [catMap['puzzle'], catMap['casual']],
      tags: ['sudoku', 'puzzle', 'numbers', 'logic'],
      gameType: 'iframe',
      iframeUrl: 'https://sudoku.com/',
      width: 800, height: 650,
      featured: false, isActive: true, playCount: 4100, rating: 4.6, sortOrder: 6,
      developer: 'Sudoku.com',
      instructions: 'Click a cell and type a number (1-9). Fill the grid so each row, column, and 3x3 box has all digits!',
    },
    {
      title: 'Stack Ball',
      slug: 'stack-ball',
      description: 'Smash through rotating helix platforms with your bouncing ball. Break barriers and reach the bottom!',
      thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop',
      categories: [catMap['action'], catMap['casual']],
      tags: ['stack', 'ball', 'helix', 'smash'],
      gameType: 'iframe',
      iframeUrl: 'https://www.crazygames.com/embed/stack-ball',
      width: 400, height: 700,
      featured: false, isActive: true, playCount: 6700, rating: 4.3, sortOrder: 7,
      developer: 'Azur Games',
      instructions: 'Tap or hold to drop the ball. Break black segments and pass through colored ones!',
    },
    {
      title: 'Mini Golf',
      slug: 'mini-golf',
      description: 'Play a round of mini golf across beautifully designed courses. Aim, power up, and sink that putt!',
      thumbnail: 'https://images.unsplash.com/photo-1593452135571-6b4b6b8f5d5f?w=400&h=300&fit=crop',
      categories: [catMap['sports'], catMap['casual']],
      tags: ['golf', 'sports', 'mini golf', 'putting'],
      gameType: 'iframe',
      iframeUrl: 'https://www.crazygames.com/embed/mini-golf-club',
      width: 800, height: 600,
      featured: false, isActive: true, playCount: 2900, rating: 4.4, sortOrder: 8,
      developer: 'Miniclip',
      instructions: 'Click and drag to aim. Release to set power. Get the ball in the hole in as few strokes as possible!',
    },
    {
      title: 'Dino Jump',
      slug: 'dino-jump',
      description: 'The beloved Chrome offline dinosaur game! Jump over cacti and duck under birds. How far can you go?',
      thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      categories: [catMap['arcade'], catMap['casual']],
      tags: ['dino', 'dinosaur', 'jump', 'chrome', 'endless runner'],
      gameType: 'iframe',
      iframeUrl: 'https://chromedino.com/',
      width: 900, height: 500,
      featured: true, isActive: true, playCount: 15200, rating: 4.5, sortOrder: 9,
      developer: 'Google',
      instructions: 'Press Space or Up Arrow to jump. Duck with Down Arrow. Avoid obstacles and survive as long as possible!',
    },
    {
      title: 'Agar.io',
      slug: 'agario',
      description: 'Eat smaller cells and grow bigger while avoiding being eaten by larger players in this multiplayer battle!',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop',
      categories: [catMap['action'], catMap['strategy']],
      tags: ['agar', 'multiplayer', 'strategy', 'eat'],
      gameType: 'iframe',
      iframeUrl: 'https://agar.io/',
      width: 900, height: 700,
      featured: false, isActive: true, playCount: 18500, rating: 4.5, sortOrder: 10,
      developer: 'Miniclip',
      instructions: 'Move your mouse to steer your cell. Press Space to split and W to eject mass. Eat smaller cells to grow!',
    },
  ];

  await Game.insertMany(games);
  console.log(`🎮 Created ${games.length} sample games`);

  console.log('\n✅ Seeding complete!');
  console.log('👉 Run: npm run dev');
  console.log('🌐 Portal: http://localhost:3000');
  console.log('⚙️  Admin:  http://localhost:3000/admin (admin@gaming-portal.com / admin123)');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
