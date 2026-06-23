// Node 16 crypto polyfill for MongoDB compatibility
const { webcrypto } = require('crypto');
globalThis.crypto = webcrypto;

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  title: String, slug: String, description: String, thumbnail: String,
  categories: [mongoose.Types.ObjectId], tags: [String],
  gameType: String, iframeUrl: String, phaserGameKey: String,
  width: Number, height: Number, featured: Boolean, isActive: Boolean,
  playCount: Number, rating: Number, sortOrder: Number, developer: String, instructions: String,
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({ name: String, slug: String });

const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

async function addBreakout() {
  await mongoose.connect(process.env.MONGODB_URI);

  const arcade = await Category.findOne({ slug: 'arcade' });
  const action = await Category.findOne({ slug: 'action' });

  const existing = await Game.findOne({ slug: 'breakout' });
  if (!existing) {
    await Game.create({
      title: 'Breakout',
      slug: 'breakout',
      description: 'Classic brick-breaker arcade game built with Phaser.js! Smash colorful brick walls with your ball and paddle. 6 rows, 3 lives, realistic bounce physics.',
      thumbnail: 'https://images.unsplash.com/photo-1540103711724-ebf833bde8d1?w=400&h=300&fit=crop',
      categories: [arcade?._id, action?._id].filter(Boolean),
      tags: ['breakout', 'bricks', 'arcade', 'phaser', 'ball'],
      gameType: 'phaser',
      phaserGameKey: 'breakout',
      width: 600, height: 500,
      featured: true, isActive: true, playCount: 540, rating: 4.6, sortOrder: 2,
      developer: 'FlipTrip Games',
      instructions: 'Left/Right arrows or mouse to move paddle. Click or Space to launch. Break all bricks to win! 3 lives.',
    });
    console.log('✅ Breakout game added!');
  } else {
    console.log('ℹ️  Breakout already exists, skipping.');
  }

  await mongoose.disconnect();
}

addBreakout().catch(err => { console.error('Failed:', err); process.exit(1); });
