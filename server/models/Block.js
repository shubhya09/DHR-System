import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  timestamp: { type: String, required: true },
  data: { type: Object, required: true },
  previousHash: { type: String, required: true },
  hash: { type: String, required: true }
});

export default mongoose.model('Block', blockSchema);
