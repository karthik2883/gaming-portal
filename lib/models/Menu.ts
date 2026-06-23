import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMenu extends Document {
  label: string;
  slug: string;
  type: 'category' | 'custom';
  categoryRef?: mongoose.Types.ObjectId;
  url?: string;
  parentMenu?: mongoose.Types.ObjectId;
  position: 'header' | 'footer' | 'sidebar';
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuSchema = new Schema<IMenu>(
  {
    label: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    type: { type: String, enum: ['category', 'custom'], default: 'custom' },
    categoryRef: { type: Schema.Types.ObjectId, ref: 'Category' },
    url: { type: String, default: '' },
    parentMenu: { type: Schema.Types.ObjectId, ref: 'Menu' },
    position: { type: String, enum: ['header', 'footer', 'sidebar'], default: 'header' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MenuSchema.index({ position: 1, sortOrder: 1 });
MenuSchema.index({ isActive: 1 });

const Menu: Model<IMenu> =
  mongoose.models.Menu || mongoose.model<IMenu>('Menu', MenuSchema);

export default Menu;
