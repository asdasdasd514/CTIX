import mongoose, { Schema, type Document } from 'mongoose';

export interface IFeedback extends Document {
  feedbackId: string;
  senderName: string;
  senderPhone?: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    feedbackId: { type: String, required: true, unique: true, index: true },
    senderName: { type: String, default: 'Công dân Phường Trấn Biên', trim: true },
    senderPhone: { type: String, default: '', trim: true },
    content: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const FeedbackModel = mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export function serializeFeedback(doc: IFeedback) {
  return {
    id: doc.feedbackId,
    senderName: doc.senderName || 'Công dân Phường Trấn Biên',
    senderPhone: doc.senderPhone || '',
    content: doc.content,
    isRead: Boolean(doc.isRead),
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
  };
}
