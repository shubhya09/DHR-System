import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  punctuality: { type: Number, min: 1, max: 5 },
  communication: { type: Number, min: 1, max: 5 },
  treatment: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  recommended: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Review', reviewSchema);
