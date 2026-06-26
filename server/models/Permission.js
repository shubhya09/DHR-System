import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  grantedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Permission', permissionSchema);
