import mongoose from 'mongoose';

// Uploaded image kept in MongoDB. Used in production, where the server has no writable disk (e.g. Vercel).
const fileSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('File', fileSchema);
