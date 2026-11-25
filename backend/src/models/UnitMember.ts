import mongoose, { Schema, type Document } from 'mongoose';

export interface IUnitMember extends Document {
  memberId: string;
  name: string;
  role: string;
  phone: string;
  unitId: string;
  status: 'available' | 'busy' | 'off_duty';
  createdAt: Date;
  updatedAt: Date;
}

const UnitMemberSchema = new Schema<IUnitMember>(
  {
    memberId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: 'Tổ viên hiện trường', trim: true },
    phone: { type: String, default: 'Chưa cập nhật', trim: true },
    unitId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['available', 'busy', 'off_duty'],
      default: 'available',
    },
  },
  { timestamps: true }
);

export const UnitMemberModel = mongoose.model<IUnitMember>('UnitMember', UnitMemberSchema);
