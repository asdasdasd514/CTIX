import mongoose, { Schema, type Document } from 'mongoose';

export type UserRoleType = 'citizen' | 'officer' | 'leader' | 'volunteer';

export interface IUser extends Document {
  userId: string;
  name: string;
  title: string;
  role: UserRoleType;
  department: string;
  unitId?: string;
  phone: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    title: { type: String, default: 'Công dân Phường Trấn Biên' },
    role: {
      type: String,
      enum: ['citizen', 'officer', 'leader', 'volunteer'],
      default: 'citizen',
    },
    department: { type: String, default: 'Phường Trấn Biên, TP. Biên Hòa' },
    unitId: { type: String, default: undefined },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
