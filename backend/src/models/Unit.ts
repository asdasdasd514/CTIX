import mongoose, { Schema, type Document } from 'mongoose';

export type IncidentCategoryType =
  | 'street_light'
  | 'flooding'
  | 'waste'
  | 'road_damage'
  | 'other';

export interface IUnit extends Document {
  unitId: string;
  name: string;
  category: IncidentCategoryType;
  description: string;
  hotline: string;
  createdAt: Date;
  updatedAt: Date;
}

const UnitSchema = new Schema<IUnit>(
  {
    unitId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: ['street_light', 'flooding', 'waste', 'road_damage', 'other'],
      required: true,
    },
    description: { type: String, default: 'Tổ đội tiếp ứng xử lý sự cố hạ tầng đô thị.' },
    hotline: { type: String, default: '0251.382.1100' },
  },
  { timestamps: true }
);

export const UnitModel = mongoose.model<IUnit>('Unit', UnitSchema);
