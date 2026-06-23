import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAd {
  position: 'leaderboard' | 'skyscraper-left' | 'skyscraper-right' | 'in-grid';
  gridIndex?: number;
  title: string;
  description: string;
  icon: string;
  link: string;
  size?: '2x2' | '2x1';
  colorTheme: string;
  isActive: boolean;
}

export interface IHomepageConfig extends Document {
  key: string;
  title: string;
  subtitle: string;
  ads: IAd[];
  createdAt: Date;
  updatedAt: Date;
}

const AdSchema = new Schema<IAd>({
  position: { type: String, required: true, enum: ['leaderboard', 'skyscraper-left', 'skyscraper-right', 'in-grid'] },
  gridIndex: { type: Number, default: 0 },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '📢' },
  link: { type: String, default: '#' },
  size: { type: String, enum: ['2x2', '2x1'], default: '2x1' },
  colorTheme: { type: String, default: 'cyan' },
  isActive: { type: Boolean, default: true }
});

const HomepageConfigSchema = new Schema<IHomepageConfig>(
  {
    key: { type: String, default: 'main', unique: true },
    title: { type: String, default: 'FLIPTRIP GAMES' },
    subtitle: { type: String, default: 'Play free online games instantly. No downloads, no signup!' },
    ads: [AdSchema]
  },
  { timestamps: true }
);

const HomepageConfig: Model<IHomepageConfig> =
  mongoose.models.HomepageConfig || mongoose.model<IHomepageConfig>('HomepageConfig', HomepageConfigSchema);

export default HomepageConfig;
