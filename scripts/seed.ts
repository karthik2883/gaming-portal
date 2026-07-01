/**
 * Seed script — populates demo data into MongoDB
 * Run: npx ts-node scripts/seed.ts
 * Or add to package.json: "seed": "npx ts-node scripts/seed.ts"
 */

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
  seoTitle: String, seoDescription: String, seoKeywords: String,
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
  seoTitle: String, seoDescription: String, seoKeywords: String,
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Menu = mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);

const AdSchema = new mongoose.Schema({
  position: String,
  gridIndex: Number,
  title: String,
  description: String,
  icon: String,
  link: String,
  size: String,
  colorTheme: String,
  isActive: Boolean
});

const HomepageConfigSchema = new mongoose.Schema({
  key: String,
  title: String,
  subtitle: String,
  ads: [AdSchema]
}, { timestamps: true });

const HomepageConfig = mongoose.models.HomepageConfig || mongoose.model('HomepageConfig', HomepageConfigSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await Promise.all([
    Category.deleteMany({}),
    Menu.deleteMany({}),
    Game.deleteMany({}),
    HomepageConfig.deleteMany({})
  ]);
  console.log('Cleared existing data');

  // Create categories
  const categories = await Category.insertMany([
    { name: 'Action', slug: 'action', icon: '⚔️', description: 'Fast-paced action games', isActive: true, sortOrder: 1 },
    { name: 'Puzzle', slug: 'puzzle', icon: '🧩', description: 'Mind-bending puzzle games', isActive: true, sortOrder: 2 },
    { name: 'Racing', slug: 'racing', icon: '🏎️', description: 'High-speed racing games', isActive: true, sortOrder: 3 },
    { name: 'Sports', slug: 'sports', icon: '⚽', description: 'Sports simulation games', isActive: true, sortOrder: 4 },
    { name: 'Arcade', slug: 'arcade', icon: '👾', description: 'Classic arcade games', isActive: true, sortOrder: 5 },
    { name: 'Adventure', slug: 'adventure', icon: '🌍', description: 'Epic adventure games', isActive: true, sortOrder: 6 },
    { name: 'Casual', slug: 'casual', icon: '☕', description: 'Relaxing casual games', isActive: true, sortOrder: 7 },
  ]);
  console.log(`Created ${categories.length} categories`);

  const catMap: Record<string, any> = {};
  categories.forEach(c => { catMap[c.slug] = c._id; });

  // Create menu items
  await Menu.insertMany([
    { label: 'Action', slug: 'action', type: 'category', categoryRef: catMap['action'], position: 'header', sortOrder: 1, isActive: true },
    { label: 'Puzzle', slug: 'puzzle', type: 'category', categoryRef: catMap['puzzle'], position: 'header', sortOrder: 2, isActive: true },
    { label: 'Racing', slug: 'racing', type: 'category', categoryRef: catMap['racing'], position: 'header', sortOrder: 3, isActive: true },
    { label: 'Arcade', slug: 'arcade', type: 'category', categoryRef: catMap['arcade'], position: 'header', sortOrder: 4, isActive: true },
  ]);
  console.log('Created menu items');

  // Create sample games (using free embeddable game URLs)
  const games = [
    {
      title: 'Snake Classic',
      slug: 'snake-classic',
      description: 'The classic snake game built with Phaser.js! Collect food, grow longer, and avoid walls.',
      thumbnail: '/thumbnails/snake.webp',
      categories: [catMap['arcade']],
      tags: ['snake', 'classic', 'arcade'],
      gameType: 'phaser',
      phaserGameKey: 'snake',
      width: 600, height: 500,
      featured: true, isActive: true, playCount: 1250, rating: 4.5, sortOrder: 1,
      developer: 'FlipTrip Games',
      instructions: 'Use Arrow Keys or WASD to control the snake. Eat the green food to grow. Avoid the walls and yourself!',
    },
    {
      title: '2048 Cyber',
      slug: '2048-puzzle',
      description: 'Slide grid tiles to merge matching numbers and reach the ultimate 2048 tile in this glowing cyberpunk puzzle experience built in Phaser.js! Features smooth sliding animations, mistake-free undo support, local high scores, and custom retro synth sound effects.',
      thumbnail: '/thumbnails/2048.webp',
      categories: [catMap['puzzle']],
      tags: ['2048', 'puzzle', 'numbers', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: '2048',
      width: 500, height: 600,
      featured: true, isActive: true, playCount: 8920, rating: 4.7, sortOrder: 2,
      developer: 'FlipTrip Games',
      instructions: 'Use WASD or Arrow keys to slide tiles. When two tiles with the same number touch, they merge into one! Reach 2048 to win, and keep playing to set new high scores. Click Undo to revert your last move if you make a mistake!',
    },
    {
      title: 'Tetris Neo',
      slug: 'tetris-classic',
      description: 'Stack falling blocks, complete lines, and climb levels in this high-tech cyberpunk Tetris experience built in Phaser.js! Features increasing speed, custom synth audio effects, next-piece preview, and a ghost drop indicator.',
      thumbnail: '/thumbnails/tetris.webp',
      categories: [catMap['puzzle'], catMap['arcade']],
      tags: ['tetris', 'blocks', 'classic', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'tetris',
      width: 500, height: 600,
      featured: true, isActive: true, playCount: 5600, rating: 4.8, sortOrder: 3,
      developer: 'FlipTrip Games',
      instructions: 'Use Left/Right arrows or A/D to move. Up arrow or W to rotate. Down arrow or S for soft drop. Spacebar to hard drop. Press Spacebar or click/tap to restart on Game Over.',
    },
    {
      title: 'Flappy Cyber',
      slug: 'flappy-bird-online',
      description: 'Fly your cyber-drone through glowing neon obstacles in this premium Flappy Bird adaptation built in Phaser.js! Features dynamic difficulty level-ups (escalating speed, narrowing gaps, and vertically moving pipes), collectible neon powerups (Shields, Scale Shrinkers, Slow-Motion, and Auto-Boost runs), and procedurally generated synthesizer audio sweeps.',
      thumbnail: '/thumbnails/flappy-bird.webp',
      categories: [catMap['arcade'], catMap['action']],
      tags: ['flappy', 'bird', 'arcade', 'cyberpunk', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'flappy-bird',
      width: 400, height: 600,
      featured: true, isActive: true, playCount: 12340, rating: 4.8, sortOrder: 4,
      developer: 'FlipTrip Games',
      instructions: 'Click the canvas or press SPACEBAR / UP ARROW to flap. Guide the drone safely through neon pipe columns.\n- Collect Powerups:\n  🛡️ S: Shield (absorbs 1 crash)\n  🔍 M: Shrink (reduces scale)\n  ⏳ T: Slow-Mo (slows scroll speed & gravity)\n  ⚡ B: Auto-Boost (safely rockets through 3 pipes)\n- Points add levels every 5 pipe passes. Speed increases, gaps narrow, and pipes float vertically!',
    },
    {
      title: 'Chess Neo',
      slug: 'chess-online',
      description: 'Play chess against a tactical computer opponent in a beautiful retro-cyberpunk interface. Features standard chess moves, piece capture indicators, visual evaluation bar, check alerts, and custom synth sound effects.',
      thumbnail: '/thumbnails/chess.webp',
      categories: [catMap['puzzle']],
      tags: ['chess', 'strategy', 'board game', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'chess',
      width: 640, height: 600,
      featured: true, isActive: true, playCount: 3200, rating: 4.9, sortOrder: 5,
      developer: 'FlipTrip Games',
      instructions: 'Click a piece to select it, then click a highlighted green square to move. Capture opponent pieces (highlights in red). Checkmate the opponent to win! The sidebar shows turn status, captured pieces, and a real-time evaluation bar.',
    },
    {
      title: 'Pac-Man',
      slug: 'pac-man',
      description: 'Eat all the dots while avoiding ghosts in this all-time arcade classic built inside Phaser.js! Control Pac-Man through the neon cyber-maze, collect power pellets to turn the ghosts frightened, and score points.',
      thumbnail: '/thumbnails/pacman.webp',
      categories: [catMap['arcade'], catMap['action']],
      tags: ['pacman', 'ghost', 'arcade', 'classic', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'pacman',
      width: 480, height: 560,
      featured: true, isActive: true, playCount: 9870, rating: 4.8, sortOrder: 6,
      developer: 'FlipTrip Games',
      instructions: 'Use WASD or Arrow keys to guide Pac-Man. Eat all dots to clear the maze. Eat flashing power pellets to temporarily turn ghosts frightened (blue) so you can eat them back! 3 lives.',
    },
    {
      title: 'Sudoku Neo',
      slug: 'sudoku-neo',
      description: 'Train your brain with Sudoku Neo! Enjoy infinite puzzles across Easy, Medium, and Hard difficulty levels in a beautiful retro-cyber interface.',
      thumbnail: '/thumbnails/sudoku.webp',
      categories: [catMap['puzzle']],
      tags: ['sudoku', 'puzzle', 'brain', 'logic'],
      gameType: 'phaser',
      phaserGameKey: 'sudoku',
      width: 600, height: 650,
      featured: true, isActive: true, playCount: 4320, rating: 4.8, sortOrder: 7,
      developer: 'FlipTrip Games',
      instructions: 'Click a cell to select it. Press keys 1-9 or click the number pad at the bottom to input a number. Press Backspace or click Erase to clear. Fill all cells correctly without making 3 mistakes to win!',
    },
    {
      title: 'Breakout',
      slug: 'breakout',
      description: 'Classic brick-breaker arcade game built with Phaser.js! Smash colorful brick walls with your ball and paddle. Features speed difficulty levels (Slow, Medium, Fast) and an immediate Game Over mode.',
      thumbnail: '/thumbnails/breakout.webp',
      categories: [catMap['arcade'], catMap['action']],
      tags: ['breakout', 'bricks', 'arcade', 'phaser', 'ball'],
      gameType: 'phaser',
      phaserGameKey: 'breakout',
      width: 600, height: 500,
      featured: true, isActive: true, playCount: 1540, rating: 4.6, sortOrder: 8,
      developer: 'FlipTrip Games',
      instructions: 'Use the Left and Right Arrow keys to control the paddle. Choose a speed level and press SPACE to launch the ball. Keep the ball in play — if you miss, it is Game Over!',
    },
    {
      title: 'Water Sort Puzzle',
      slug: 'water-sort-puzzle',
      description: 'Sort the coloured water so every tube holds only one colour! A relaxing yet challenging puzzle game with 5 levels. Pour water between tubes by tapping — match colours to move them.',
      thumbnail: '/thumbnails/water-sort.webp',
      categories: [catMap['puzzle'], catMap['casual']],
      tags: ['puzzle', 'water', 'sort', 'casual', 'phaser', 'color'],
      gameType: 'phaser',
      phaserGameKey: 'water-sort',
      width: 480, height: 600,
      featured: true, isActive: true, playCount: 2240, rating: 4.8, sortOrder: 9,
      developer: 'FlipTrip Games',
      instructions: 'Tap a tube to select it, then tap another tube to pour water. You can only pour if the colours match or the destination is empty. Sort all tubes so each holds a single colour to win!',
    },
    {
      title: 'Unblock Me',
      slug: 'unblock-me',
      description: 'A classic sliding-block puzzle. Slide wooden planks out of the way to free the red block and guide it to the exit. 8 hand-crafted levels from beginner to expert — can you solve them all?',
      thumbnail: '/thumbnails/unblock-me.webp',
      categories: [catMap['puzzle'], catMap['casual']],
      tags: ['puzzle', 'sliding', 'block', 'logic', 'casual', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'unblock-me',
      width: 480, height: 580,
      featured: true, isActive: true, playCount: 3180, rating: 4.7, sortOrder: 10,
      developer: 'FlipTrip Games',
      instructions: 'Drag the wooden blocks left/right or up/down to clear a path for the red block. Slide the red block all the way to the right exit arrow to win. Horizontal blocks only slide sideways; vertical blocks only slide up and down.',
    },
    {
      title: 'Typing Nexus',
      slug: 'typing-nexus',
      description: 'Test and improve your typing skills in Typing Nexus! Choose between three unique game modes in a retro cyberpunk neon styling: Meteor Defend (Arcade Survival), Time Attack (60s Speed Run), and Hacker Terminal (Code Typer). Calculations of live WPM and Accuracy included, along with custom audio click synthesis.',
      thumbnail: '/thumbnails/typing.webp',
      categories: [catMap['arcade'], catMap['puzzle']],
      tags: ['typing', 'keyboard', 'retro', 'arcade', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'typing',
      width: 600, height: 500,
      featured: true, isActive: true, playCount: 4820, rating: 4.9, sortOrder: 11,
      developer: 'FlipTrip Games',
      instructions: 'Type the words displayed on screen exactly. Select from three game modes on the main menu:\n1. Meteor Defend: Type words before they hit the shield wall (5 lives).\n2. Time Attack: Type words to add time (+1s) and survive the 60s countdown.\n3. Hacker Terminal: Type terminal commands and syntax before the Firewall Scan progress bar completes. Press Backspace to edit mistakes.',
    },
    {
      title: 'Neon Rider',
      slug: 'neon-rider',
      description: 'Race at warp speeds down a glowing 3D cyberpunk highway in Neon Rider! Dodge traffic, customize underglow neon colors, upgrade your sports car stats (Speed, Acceleration, Handling, Nitro), and score points for high-speed close-pass overtaking maneuvers. Features a custom glassmorphism HUD dashboard and pitch-shifting procedural audio.',
      thumbnail: '/thumbnails/neon-rider.webp',
      categories: [catMap['arcade'], catMap['racing']],
      tags: ['racing', 'car', 'retro', 'cyberpunk', 'neon', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'neon-rider',
      width: 600, height: 500,
      featured: true, isActive: true, playCount: 5290, rating: 4.9, sortOrder: 12,
      developer: 'FlipTrip Games',
      instructions: 'Enter the Garage to customize your underglow neon styling and upgrade Speed, Acceleration, Handling, or Nitro capacity using credits. Press DEPART TRANSMISSION to start racing!\n- Steer: Left/Right arrow keys or A/D keys\n- Accelerate: Up arrow key or W key\n- Brake: Down arrow key or S key\n- Nitro Boost: Hold SPACEBAR\nDodge traffic cars and pass close to them to earn points and credits bonuses!',
    },
    {
      title: 'Cyber Runner',
      slug: 'cyber-runner',
      description: 'Dash through a neon cyberpunk cityscape in Cyber Runner! Collect floating coins and multiplier chests, leap over fences, slide under laser security barriers, and grab speed boosts and invincibility shields in this high-tech 2D infinite side-scrolling runner built with PhaserJS.',
      thumbnail: '/thumbnails/cyber-runner.webp',
      categories: [catMap['arcade'], catMap['action']],
      tags: ['runner', 'action', 'infinite', 'cyberpunk', 'neon', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'cyber-runner',
      width: 800, height: 450,
      featured: true, isActive: true, playCount: 6480, rating: 4.8, sortOrder: 13,
      developer: 'FlipTrip Games',
      instructions: 'Survive as long as possible and score high by collecting coins and avoiding hurdles!\n- Jump: Press SPACEBAR or UP ARROW key\n- Slide: Hold DOWN ARROW key (scales physics box down to fit under low obstacles)\n- Collect speed powerups (speed boost) and shield powerups (invincibility)\n- Collect multiplier chests to earn a large point boost!',
    },
    {
      title: 'Memory Match',
      slug: 'memory-match',
      description: 'Test your memory with this neon cyberpunk card-matching game! Flip cards to find matching pairs, race against the clock, and challenge yourself across Easy, Medium, and Hard difficulty levels.',
      thumbnail: '/thumbnails/memory-match.webp',
      categories: [catMap['puzzle'], catMap['casual']],
      tags: ['memory', 'match', 'cards', 'puzzle', 'casual', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'memory-match',
      width: 600, height: 550,
      featured: true, isActive: true, playCount: 3400, rating: 4.6, sortOrder: 14,
      developer: 'FlipTrip Games',
      instructions: 'Click or tap cards to flip them. Match pairs of identical symbols. Complete all pairs before time runs out! Fewer moves = higher score. Choose difficulty before starting.',
    },
    {
      title: 'Bubble Shooter',
      slug: 'bubble-shooter',
      description: 'Classic bubble shooter with a neon cyberpunk twist! Aim and shoot colored bubbles to create groups of 3 or more. Features multiple levels, special bubbles, and increasing difficulty.',
      thumbnail: '/thumbnails/bubble-shooter.webp',
      categories: [catMap['arcade'], catMap['casual']],
      tags: ['bubble', 'shooter', 'casual', 'arcade', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'bubble-shooter',
      width: 800, height: 600,
      featured: true, isActive: true, playCount: 5120, rating: 4.7, sortOrder: 15,
      developer: 'FlipTrip Games',
      instructions: 'Aim with your mouse and click to shoot a bubble. Match 3 or more bubbles of the same color to pop them. Clear the board to advance! Watch for special bubbles.',
    },
    {
      title: 'Fruit Slice',
      slug: 'fruit-slice',
      description: 'Slash glowing neon fruit in this cyberpunk Fruit Ninja-style game! Swipe to slice multiple fruits, avoid bombs, and chain combos for massive score multipliers.',
      thumbnail: '/thumbnails/fruit-slice.webp',
      categories: [catMap['arcade'], catMap['action']],
      tags: ['fruit', 'slice', 'swipe', 'arcade', 'action', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'fruit-slice',
      width: 480, height: 640,
      featured: true, isActive: true, playCount: 6890, rating: 4.8, sortOrder: 16,
      developer: 'FlipTrip Games',
      instructions: 'Click and drag to slice fruit. Slice multiple fruits in one swipe for a combo bonus! Avoid the red bombs — slicing one loses a life. You have 3 lives total.',
    },
    {
      title: 'Candy Match',
      slug: 'candy-match',
      description: 'Swap neon candy gems in this match-3 puzzle game! Create chains, trigger combos, and clear levels in this Candy Crush-inspired cyberpunk puzzle adventure built in Phaser.js.',
      thumbnail: '/thumbnails/candy-match.webp',
      categories: [catMap['puzzle'], catMap['casual']],
      tags: ['candy', 'match3', 'puzzle', 'casual', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'candy-match',
      width: 800, height: 600,
      featured: true, isActive: true, playCount: 4750, rating: 4.7, sortOrder: 17,
      developer: 'FlipTrip Games',
      instructions: 'Click or drag a candy gem to swap it with an adjacent gem. Match 3 or more of the same color to clear them. Create matches of 4 or 5 for special power candies! Complete the target score before moves run out.',
    },
    {
      title: 'Football Strike',
      slug: 'football-strike',
      description: 'Score goals in this neon cyberpunk football game! Aim your shots, curve the ball around defenders, and complete challenges across multiple stadiums. Features power shots and goalkeeper AI.',
      thumbnail: '/thumbnails/football.webp',
      categories: [catMap['sports'], catMap['arcade']],
      tags: ['football', 'soccer', 'sports', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'football',
      width: 800, height: 600,
      featured: true, isActive: true, playCount: 4100, rating: 4.6, sortOrder: 18,
      developer: 'FlipTrip Games',
      instructions: 'Click and drag to aim your shot. The direction and speed of your drag determines ball trajectory. Curve shots around defenders! Score as many goals as possible in the time limit.',
    },
    {
      title: 'Neon Surfer',
      slug: 'neon-surfer',
      description: 'A fast-paced Subway Surfer-style endless runner in a neon cyberpunk underground! Switch between 3 lanes, jump over trains, slide under barriers, and collect coins. Grab 5 unique power-ups: Magnet, Shield, Jetpack, Score Multiplier, and Hoverboard. Speed increases as you run further — how far can you get?',
      thumbnail: '/thumbnails/neon-surfer.webp',
      categories: [catMap['action'], catMap['arcade']],
      tags: ['runner', 'subway', 'surfer', 'endless', 'cyberpunk', 'lane', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'neon-surfer',
      width: 480, height: 640,
      featured: true, isActive: true, playCount: 7820, rating: 4.9, sortOrder: 14,
      developer: 'FlipTrip Games',
      instructions: 'Switch Lanes: ← → Arrow Keys or A/D\nJump: ↑ / W / SPACE / Tap screen\nSlide: ↓ / S / Swipe Down\n\nPower-Ups:\n🧲 Magnet — Pulls all coins on screen\n🛡️ Shield — Absorbs one collision\n🚀 Jetpack — Fly over obstacles for 7s\n✨ Multiplier — 2x score for 10s\n🛹 Hoverboard — Immunity to lane obstacles\n\nTip: Your speed increases the further you run!',
    },
    {
      title: 'Neon Jigsaw: Comic Adventure',
      slug: 'neon-jigsaw',
      description: 'Piece together stunning retro-neon comic scenes and futuristic characters in this immersive jigsaw puzzle adventure! Choose from 6 different levels including Cyber Ninja, Cosmic Explorer, and Steampunk Aviator. Features actual interlocking jigsaw-edge shapes, dynamic snapping, glowing neon particle bursts, and customizable difficulty from Easy to Hard.',
      thumbnail: '/thumbnails/jigsaw.webp',
      categories: [catMap['puzzle'], catMap['casual']],
      tags: ['jigsaw', 'puzzle', 'casual', 'comic', 'retro', 'neon', 'phaser'],
      gameType: 'phaser',
      phaserGameKey: 'jigsaw',
      width: 800, height: 600,
      featured: true, isActive: true, playCount: 2450, rating: 4.8, sortOrder: 19,
      developer: 'FlipTrip Games',
      instructions: 'Choose a Scene and Difficulty from the Menu. Drag the jigsaw pieces onto the board grid to assemble the puzzle. Tap or click "👁 GUIDE" to toggle a faint overlay preview of the completed image. Tap or click "⚡ SCATTER" to randomly spread the pieces. Pieces snap and lock into place when positioned correctly.',
    },
  ];

  await Game.insertMany(games);
  console.log(`Created ${games.length} sample games`);

  // Create default homepage settings and ads
  await HomepageConfig.create({
    key: 'main',
    title: 'FLIPTRIP GAMES',
    subtitle: 'Play free online games instantly. No downloads, no signup!',
    ads: [
      {
        position: 'leaderboard',
        title: 'NEON RIDER OUT NOW',
        description: 'Rev your lightcycle in a stunning cyber-grid synthwave racer!',
        icon: '🏎️',
        link: '/game/neon-rider',
        colorTheme: 'cyan',
        isActive: true
      },
      {
        position: 'skyscraper-left',
        title: 'NEON RIDER',
        description: 'Race through the grid in pseudo-3D lightcycle action!',
        icon: '🕹️',
        link: '/game/neon-rider',
        colorTheme: 'cyan',
        isActive: true
      },
      {
        position: 'skyscraper-right',
        title: 'BREAKOUT',
        description: 'Break glowing blocks with real particle trail physics!',
        icon: '🧱',
        link: '/game/breakout',
        colorTheme: 'green',
        isActive: true
      },
      {
        position: 'in-grid',
        gridIndex: 3,
        size: '2x2',
        title: 'NEON RIDER',
        description: 'Speed through 3D hills, hills, and sharp bends in our cyber-synthwave racing adventure.',
        icon: '🏎️',
        link: '/game/neon-rider',
        colorTheme: 'cyan',
        isActive: true
      },
      {
        position: 'in-grid',
        gridIndex: 14,
        size: '2x1',
        title: 'TETRIS NEO',
        description: 'Stack colorful blocks and clear lines with a smooth drop guide and delay mechanics.',
        icon: '🕹️',
        link: '/game/tetris-neo',
        colorTheme: 'default',
        isActive: true
      },
      {
        position: 'in-grid',
        gridIndex: 27,
        size: '2x2',
        title: 'SUDOKU NEO',
        description: 'Challenge your mind with recursive solver matrices and 8-bit synthetic soundscapes.',
        icon: '⬡',
        link: '/game/sudoku-neo',
        colorTheme: 'cyan',
        isActive: true
      }
    ]
  });
  console.log('Created default homepage settings and ads');

  console.log('\n✅ Seeding complete!');
  console.log('👉 You can now run: npm run dev');
  console.log('🌐 Portal: http://localhost:3000');
  console.log('⚙️  Admin: http://localhost:3000/admin');
  console.log('   Login: admin@gaming-portal.com / admin123');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
