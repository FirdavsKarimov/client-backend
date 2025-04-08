import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be at least 0.01'],
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['topup', 'purchase', 'extension'],
        message: 'Invalid transaction type',
      },
    },
    status: {
      type: String,
      default: 'pending',
      enum: {
        values: ['pending', 'completed', 'failed', 'cancelled'],
        message: 'Invalid transaction status',
      },
    },
    providerData: {
      type: mongoose.Schema.Types.Mixed,
      select: false,
    },
    serviceDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

transactionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Transaction', transactionSchema);