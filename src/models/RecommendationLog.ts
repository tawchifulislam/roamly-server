import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendationLog extends Document {
  user: mongoose.Types.ObjectId;
  interactedTrips: mongoose.Types.ObjectId[];
  generatedRecommendations: mongoose.Types.ObjectId[];
}

const recommendationLogSchema = new Schema<IRecommendationLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    interactedTrips: [{ type: Schema.Types.ObjectId, ref: 'Trip' }],
    generatedRecommendations: [{ type: Schema.Types.ObjectId, ref: 'Trip' }],
  },
  { timestamps: true },
);

export default mongoose.model<IRecommendationLog>(
  'RecommendationLog',
  recommendationLogSchema,
);
