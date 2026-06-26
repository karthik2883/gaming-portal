import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  value: Map<string, string>;
}

const SettingsSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
