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

const Game     = mongoose.models.Game     || mongoose.model('Game',     GameSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const puzzle = await Category.findOne({ slug: 'puzzle' });
  const casual = await Category.findOne({ slug: 'casual' });

  const existing = await Game.findOne({ slug: 'unblock-me' });

  if (!existing) {
    await Game.create({
      title:       'Unblock Me',
      slug:        'unblock-me',
      description: 'A classic sliding-block puzzle. Slide wooden planks out of the way to free the red block and guide it to the exit. 8 hand-crafted levels from beginner to expert — can you solve them all?',
      thumbnail:   'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=300&fit=crop',
      categories:  [puzzle?._id, casual?._id].filter(Boolean),
      tags:        ['puzzle', 'sliding', 'block', 'logic', 'casual', 'phaser'],
      gameType:    'phaser',
      phaserGameKey: 'unblock-me',
      width:       480,
      height:      580,
      featured:    true,
      isActive:    true,
      playCount:   2180,
      rating:      4.7,
      sortOrder:   2,
      developer:   'FlipTrip Games',
      instructions: 'Drag the wooden blocks left/right or up/down to clear a path for the red block. Slide the red block all the way to the right exit arrow to win. Horizontal blocks only slide sideways; vertical blocks only slide up and down.',
    });
    console.log('✅  Unblock Me added to the database!');
  } else {
    console.log('ℹ️   Unblock Me already exists — skipping.');
  }

  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
