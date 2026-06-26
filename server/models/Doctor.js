import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  hospitalName: { type: String, required: true },
  location: { type: String, default: 'Not set' },
  address: { type: String, default: 'Not set' },
  rating: { type: Number, default: 0 },
  avgPunctuality: { type: Number, default: 0 },
  avgCommunication: { type: Number, default: 0 },
  avgTreatment: { type: Number, default: 0 },
  recommendationRate: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 }
});

export default mongoose.model('Doctor', doctorSchema);
