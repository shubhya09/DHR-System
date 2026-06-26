import express from 'express';
import auth from '../middleware/auth.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Permission from '../models/Permission.js';
import Blockchain from '../blockchain/blockchain.js';
import PermissionRequest from '../models/PermissionRequest.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

const router = express.Router();

// Get doctor profile
router.get('/profile', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.profileId);
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update doctor profile (location and address)
router.patch('/profile', auth, async (req, res) => {
  try {
    const { location, address } = req.body;
    const updateData = {};
    if (location !== undefined) updateData.location = location;
    if (address !== undefined) updateData.address = address;
    
    const doctor = await Doctor.findByIdAndUpdate(req.user.profileId, updateData, { new: true });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get doctor appointments
router.get('/appointments', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.profileId }).populate('patientId');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update appointment status
router.patch('/appointments/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add medical record
router.post('/records', auth, async (req, res) => {
  try {
    const { patientId, description, diagnosis, prescription } = req.body;
    
    // Check if doctor has permission
    const permission = await Permission.findOne({ patientId, doctorId: req.user.profileId });
    if (!permission) {
      return res.status(403).json({ message: 'No permission to add records for this patient. Ask patient to grant access.' });
    }

    // Blockchain Hashing
    const recordData = { 
      patientId, 
      doctorId: req.user.profileId, 
      description, 
      diagnosis, 
      prescription, 
      date: new Date() 
    };
    
    // Add to blockchain
    const hash = await Blockchain.addBlock(recordData);

    const record = new MedicalRecord({
      patientId,
      doctorId: req.user.profileId,
      description,
      diagnosis,
      prescription,
      hash,
      date: recordData.date
    });

    await record.save();
    res.status(201).json(record);
  } catch (err) {
    console.error('Error adding medical record:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get patients who granted permission
router.get('/my-patients', auth, async (req, res) => {
  try {
    const permissions = await Permission.find({ doctorId: req.user.profileId }).populate('patientId');
    const patients = permissions.map(p => p.patientId);
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get patients from appointments with their permission status
router.get('/appointment-patients', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.profileId }).populate('patientId');
    
    // Get unique patients
    const patientMap = new Map();
    appointments.forEach(appt => {
      if (appt.patientId) {
        patientMap.set(appt.patientId._id.toString(), appt.patientId);
      }
    });

    const patientList = Array.from(patientMap.values());

    // Check permissions for each patient
    const patientsWithStatus = await Promise.all(patientList.map(async (patient) => {
      const permission = await Permission.findOne({ 
        patientId: patient._id, 
        doctorId: req.user.profileId 
      });
      
      const pendingRequest = await PermissionRequest.findOne({
        patientId: patient._id,
        doctorId: req.user.profileId,
        status: 'pending'
      });

      return {
        ...patient.toObject(),
        hasPermission: !!permission,
        hasPendingRequest: !!pendingRequest
      };
    }));

    res.json(patientsWithStatus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search for patient by email or phone
router.get('/search-patient', auth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Search query is required' });

    // Find user by email first
    const user = await User.findOne({ email: query, role: 'patient' });
    let patient;
    if (user) {
      patient = await Patient.findOne({ userId: user._id });
    } else {
      // Try searching by phone number in Patient model
      patient = await Patient.findOne({ phone: query });
    }

    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send permission request
router.post('/request-access', auth, async (req, res) => {
  try {
    const { patientId, message } = req.body;
    
    // Check if already has permission
    const existingPerm = await Permission.findOne({ patientId, doctorId: req.user.profileId });
    if (existingPerm) return res.status(400).json({ message: 'You already have access to this patient records' });

    // Check if a request is already pending
    const existingReq = await PermissionRequest.findOne({ patientId, doctorId: req.user.profileId, status: 'pending' });
    if (existingReq) return res.status(400).json({ message: 'A request is already pending for this patient' });

    const request = new PermissionRequest({
      patientId,
      doctorId: req.user.profileId,
      message
    });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get sent requests
router.get('/sent-requests', auth, async (req, res) => {
  try {
    const requests = await PermissionRequest.find({ doctorId: req.user.profileId }).populate('patientId');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get patient records (if permission exists)
router.get('/patient-records/:patientId', auth, async (req, res) => {
  try {
    const permission = await Permission.findOne({ patientId: req.params.patientId, doctorId: req.user.profileId });
    if (!permission) return res.status(403).json({ message: 'No permission to view this patient records' });

    const records = await MedicalRecord.find({ patientId: req.params.patientId }).populate('doctorId');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all appointments (Admin view)
router.get('/all-appointments', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('patientId doctorId');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all medical records (Admin view)
router.get('/all-records', auth, async (req, res) => {
  try {
    const records = await MedicalRecord.find().populate('patientId doctorId');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel appointment (Doctor)
router.delete('/appointments/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Check if the appointment belongs to the doctor
    if (appointment.doctorId.toString() !== req.user.profileId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment canceled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
