const { webcrypto } = require('crypto');
globalThis.crypto = webcrypto;

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  title: String, slug: String, description: String, thumbnail: String,
  categories: [mongoose.Types.ObjectId], tags: [String],
  gameType: String, phaserGameKey: String,
  width: Number, height: Number,
  featured: Boolean, isActive: Boolean,
  playCount: Number, rating: Number, sortOrder: Number,
  developer: String, instructions: String,
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({ name: String, slug: String });

const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const puzzle  = await Category.findOne({ slug: 'puzzle' });
  const casual  = await Category.findOne({ slug: 'casual' });

  const existing = await Game.findOne({ slug: 'water-sort-puzzle' });
  if (!existing) {
    await Game.create({
      title: 'Water Sort Puzzle',
      slug: 'water-sort-puzzle',
      description: 'Sort the coloured water so every tube holds only one colour! A relaxing yet challenging puzzle game with 5 levels. Pour water between tubes by tapping — match colours to move them.',
      thumbnail: 'https://images.unsplash.com/photo-1559386484-97dfc0e15539?w=400&h=300&fit=crop',
      categories: [puzzle?._id, casual?._id].filter(Boolean),
      tags: ['puzzle', 'water', 'sort', 'casual', 'phaser', 'color'],
      gameType: 'phaser',
      phaserGameKey: 'water-sort',
      width: 480,
      height: 600,
      featured: true,
      isActive: true,
      playCount: 1240,
      rating: 4.8,
      sortOrder: 1,
      developer: 'FlipTrip Games',
      instructions: 'Tap a tube to select it, then tap another tube to pour water. You can only pour if the colours match or the destination is empty. Sort all tubes so each holds a single colour to win!',
    });
    console.log('✅ Water Sort Puzzle added!');
  } else {
    console.log('ℹ️  Water Sort Puzzle already exists, skipping.');
  }

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
