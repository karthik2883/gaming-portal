const { webcrypto } = require('crypto');
globalThis.crypto = webcrypto;

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  title: String, slug: String, width: Number, height: Number
});

const Game = mongoose.models.Game || mongoose.model('Game', GameSchema);

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not defined");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB!");

  const res = await Game.updateOne(
    { slug: 'unblock-me' },
    { $set: { width: 800, height: 600 } }
  );

  console.log("Update result:", res);
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB!");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
