import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  medicalHistory: { type: String, default: '' }
});

export default mongoose.model('Patient', patientSchema);
