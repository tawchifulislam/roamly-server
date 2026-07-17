import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  role: 'user' | 'admin';
  preferences: {
    interests: string[];
    budgetRange: 'low' | 'medium' | 'high';
  };
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    preferences: {
      interests: [{ type: String }],
      budgetRange: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>('User', userSchema);
