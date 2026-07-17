import mongoose, { Schema, Document } from 'mongoose';

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChatConversation extends Document {
  user: mongoose.Types.ObjectId;
  messages: IChatMessage[];
}

const chatConversationSchema = new Schema<IChatConversation>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model<IChatConversation>(
  'ChatConversation',
  chatConversationSchema,
);
