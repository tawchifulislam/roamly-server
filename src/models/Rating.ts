import mongoose, { Schema, Document } from 'mongoose';

export interface IRating extends Document {
  trip: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  value: number;
}

const ratingSchema = new Schema<IRating>(
  {
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true },
);

// One rating per user per trip — resubmitting updates the existing one
ratingSchema.index({ trip: 1, user: 1 }, { unique: true });

export default mongoose.model<IRating>('Rating', ratingSchema);
