import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGame extends Document {
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  categories: mongoose.Types.ObjectId[];
  tags: string[];
  gameType: 'iframe' | 'phaser';
  iframeUrl?: string;
  phaserGameKey?: string;
  width: number;
  height: number;
  featured: boolean;
  isActive: boolean;
  playCount: number;
  rating: number;
  sortOrder: number;
  developer?: string;
  instructions?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    tags: [{ type: String, lowercase: true, trim: true }],
    gameType: { type: String, enum: ['iframe', 'phaser'], default: 'iframe' },
    iframeUrl: { type: String, default: '' },
    phaserGameKey: { type: String, default: '' },
    width: { type: Number, default: 800 },
    height: { type: Number, default: 600 },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    playCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    sortOrder: { type: Number, default: 0 },
    developer: { type: String, default: '' },
    instructions: { type: String, default: '' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seoKeywords: { type: String, default: '' },
  },
  { timestamps: true }
);

// slug index is created automatically via unique: true on the field
GameSchema.index({ categories: 1, isActive: 1 });
GameSchema.index({ featured: 1, isActive: 1 });
GameSchema.index({ playCount: -1 });
GameSchema.index({ createdAt: -1 });

const Game: Model<IGame> =
  mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema);

export default Game;
