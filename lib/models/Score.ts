import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScore extends Document {
  gameSlug: string;
  name: string;
  email?: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScoreSchema = new Schema<IScore>(
  {
    gameSlug: { type: String, required: true, trim: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, select: false }, // selected false by default to prevent exposing it in regular API calls
    score: { type: Number, required: true },
  },
  { timestamps: true }
);

// Enforce unique name per game (so each player has at most one high score entry per game)
ScoreSchema.index({ gameSlug: 1, name: 1 }, { unique: true });

// Optimize sorting for leaderboards
ScoreSchema.index({ gameSlug: 1, score: -1, createdAt: 1 });

const Score: Model<IScore> =
  mongoose.models.Score || mongoose.model<IScore>('Score', ScoreSchema);

export default Score;
