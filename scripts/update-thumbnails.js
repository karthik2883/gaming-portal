const { webcrypto } = require('crypto');
globalThis.crypto = webcrypto;

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  title: String, slug: String, thumbnail: String,
}, { timestamps: true, strict: false });

const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);

const THUMBNAILS = {
  'snake':             '/thumbnails/snake.png',
  'breakout':          '/thumbnails/breakout.png',
  'water-sort-puzzle': '/thumbnails/water-sort.png',
  'unblock-me':        '/thumbnails/unblock-me.png',
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const [slug, thumbnail] of Object.entries(THUMBNAILS)) {
    const result = await Game.updateOne({ slug }, { $set: { thumbnail } });
    if (result.modifiedCount > 0) {
      console.log(`✅  Updated thumbnail for: ${slug}`);
    } else {
      console.log(`⚠️   No game found with slug: ${slug}`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDone!');
}

run().catch(err => { console.error(err); process.exit(1); });
