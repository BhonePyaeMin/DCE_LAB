import mongoose from 'mongoose';

// One counter visit: a student borrowing one or more items, signed by the student and the lab assistant.
const itemSchema = new mongoose.Schema(
  {
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    borrowing: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrowing', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // receipt number, e.g. BR-00012
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assistant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    purpose: { type: String, trim: true, maxlength: 500 },
    dueDate: { type: Date, required: true },
    studentSignature: { type: String, required: true }, // PNG data URL
    studentSignedAt: { type: Date, required: true },
    assistantSignature: { type: String, required: true }, // PNG data URL
    assistantSignedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('BorrowTransaction', transactionSchema);
