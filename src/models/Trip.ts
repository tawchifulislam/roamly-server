import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  type: 'package' | 'destination';
  title: string;
  images: string[];
  location: string;
  shortDescription: string;
  fullDescription: string;
  price?: number;
  duration?: string;
  rating: number;
  tags: string[];
  itinerary?: { day: number; title: string; details: string }[];
  bestTimeToVisit?: string;
  createdBy: mongoose.Types.ObjectId;
}

const tripSchema = new Schema<ITrip>(
  {
    type: { type: String, enum: ['package', 'destination'], required: true },
    title: { type: String, required: true },
    images: [{ type: String }],
    location: { type: String, required: true },
    shortDescription: String,
    fullDescription: String,
    price: Number,
    duration: String,
    rating: { type: Number, default: 0 },
    tags: [{ type: String }],
    itinerary: [{ day: Number, title: String, details: String }],
    bestTimeToVisit: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export default mongoose.model<ITrip>('Trip', tripSchema);
