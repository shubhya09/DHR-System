import express from 'express';
import auth from '../middleware/auth.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Permission from '../models/Permission.js';
import Blockchain from '../blockchain/blockchain.js';
import PermissionRequest from '../models/PermissionRequest.js';

import Review from '../models/Review.js';

const router = express.Router();

// Submit a review for a doctor
router.post('/doctors/:doctorId/reviews', auth, async (req, res) => {
  try {
    const { appointmentId, rating, punctuality, communication, treatment, comment, recommended } = req.body;
    const { doctorId } = req.params;

    // Check if appointment exists and belongs to patient
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.patientId.toString() !== req.user.profileId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if review already exists for this appointment
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) return res.status(400).json({ message: 'Review already submitted for this appointment' });

    const review = new Review({
      patientId: req.user.profileId,
      doctorId,
      appointmentId,
      rating,
      punctuality,
      communication,
      treatment,
      comment,
      recommended
    });

    await review.save();

    // Update doctor's average rating
    const doctor = await Doctor.findById(doctorId);
    const reviews = await Review.find({ doctorId });
    
    const numReviews = reviews.length;
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / numReviews;
    const avgPunctuality = reviews.reduce((acc, r) => acc + (r.punctuality || 0), 0) / reviews.filter(r => r.punctuality).length || 0;
    const avgCommunication = reviews.reduce((acc, r) => acc + (r.communication || 0), 0) / reviews.filter(r => r.communication).length || 0;
    const avgTreatment = reviews.reduce((acc, r) => acc + (r.treatment || 0), 0) / reviews.filter(r => r.treatment).length || 0;
    const recommendationRate = (reviews.filter(r => r.recommended).length / numReviews) * 100;

    doctor.rating = avgRating;
    doctor.avgPunctuality = avgPunctuality;
    doctor.avgCommunication = avgCommunication;
    doctor.avgTreatment = avgTreatment;
    doctor.recommendationRate = recommendationRate;
    doctor.numReviews = numReviews;
    
    await doctor.save();

    res.status(201).json(review);
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get reviews for a doctor
router.get('/doctors/:doctorId/reviews', auth, async (req, res) => {
  try {
    const reviews = await Review.find({ doctorId: req.params.doctorId })
      .populate('patientId', 'fullName')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all doctors
router.get('/doctors', auth, async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ rating: -1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Book appointment
router.post('/appointments', auth, async (req, res) => {
  try {
    const { doctorId, date } = req.body;

    // Check if patient already has an appointment with this doctor
    const existingAppointment = await Appointment.findOne({
      patientId: req.user.profileId,
      doctorId: doctorId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Already booked' });
    }

    const appointment = new Appointment({
      patientId: req.user.profileId,
      doctorId,
      date
    });
    await appointment.save();

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get patient appointments
router.get('/appointments', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.profileId }).populate('doctorId');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get patient medical records
router.get('/records', auth, async (req, res) => {
  try {
    // Ensure we are fetching records for the logged-in patient
    const records = await MedicalRecord.find({ patientId: req.user.profileId })
      .populate('doctorId')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Grant permission
router.post('/permissions', auth, async (req, res) => {
  try {
    const { doctorId } = req.body;
    const existing = await Permission.findOne({ patientId: req.user.profileId, doctorId });
    if (existing) return res.status(400).json({ message: 'Permission already granted' });

    const permission = new Permission({ patientId: req.user.profileId, doctorId });
    await permission.save();
    res.status(201).json(permission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Revoke permission
router.delete('/permissions/:doctorId', auth, async (req, res) => {
  try {
    await Permission.findOneAndDelete({ patientId: req.user.profileId, doctorId: req.params.doctorId });
    res.json({ message: 'Permission revoked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get granted permissions
router.get('/permissions', auth, async (req, res) => {
  try {
    const permissions = await Permission.find({ patientId: req.user.profileId }).populate('doctorId');
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get incoming permission requests
router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await PermissionRequest.find({ patientId: req.user.profileId, status: 'pending' }).populate('doctorId');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Respond to permission request
router.patch('/requests/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const request = await PermissionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.patientId.toString() !== req.user.profileId.toString()) return res.status(403).json({ message: 'Unauthorized' });

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      const existing = await Permission.findOne({ patientId: request.patientId, doctorId: request.doctorId });
      if (!existing) {
        const permission = new Permission({ patientId: request.patientId, doctorId: request.doctorId });
        await permission.save();
      }
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete appointment
router.delete('/appointments/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Check if the appointment belongs to the patient
    if (appointment.patientId.toString() !== req.user.profileId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete medical record
router.delete('/records/:id', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    
    // Check if the record belongs to the patient
    if (record.patientId.toString() !== req.user.profileId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await MedicalRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
