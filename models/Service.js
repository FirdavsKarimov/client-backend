import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  providerData: { type: Object, default: {} },
});

export default mongoose.model('Service', serviceSchema);