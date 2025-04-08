import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  itemName: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'Pending' },
  serviceId: { type: String },
  provider: { type: String, default: '711' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Purchase', purchaseSchema);