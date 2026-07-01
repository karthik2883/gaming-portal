const { webcrypto } = require('crypto');
globalThis.crypto = webcrypto;

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  title: String, slug: String, width: Number, height: Number
});

const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const localGame = await Game.findOne({ slug: 'bubble-shooter' });
  console.log("Local Database bubble-shooter game:", localGame);
  await mongoose.disconnect();
}

run();
