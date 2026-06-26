import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  diagnosis: { type: String },
  prescription: { type: String },
  fileUrl: { type: String }, // In a real app, this would be a path to S3/Cloudinary
  hash: { type: String, required: true }, // Blockchain hash for integrity
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('MedicalRecord', medicalRecordSchema);
