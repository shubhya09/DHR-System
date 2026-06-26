import express from 'express';
import mongoose from 'mongoose';
import auth from '../middleware/auth.js';
import Message from '../models/Message.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

const router = express.Router();

// Get unread counts for all appointments
router.get('/unread-counts', auth, async (req, res) => {
  try {
    const unreadCounts = await Message.aggregate([
      { 
        $match: { 
          receiverId: new mongoose.Types.ObjectId(req.user.id),
          read: false 
        } 
      },
      { 
        $group: { 
          _id: '$appointmentId', 
          count: { $sum: 1 } 
        } 
      }
    ]);
    res.json(unreadCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get total unread count for the logged-in user
router.get('/total-unread', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user.id,
      read: false
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages for an appointment
router.get('/:appointmentId', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Check if user is part of the appointment
    const isPatient = appointment.patientId.toString() === req.user.profileId.toString();
    const isDoctor = appointment.doctorId.toString() === req.user.profileId.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'Unauthorized access to chat' });
    }

    const messages = await Message.find({ appointmentId: req.params.appointmentId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark messages as read
router.patch('/:appointmentId/read', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { 
        appointmentId: req.params.appointmentId, 
        receiverId: req.user.id,
        read: false 
      },
      { $set: { read: true } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send a message
router.post('/:appointmentId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate({ path: 'patientId', populate: { path: 'userId' } })
      .populate({ path: 'doctorId', populate: { path: 'userId' } });
      
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const isPatient = appointment.patientId._id.toString() === req.user.profileId.toString();
    const isDoctor = appointment.doctorId._id.toString() === req.user.profileId.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'Unauthorized access to chat' });
    }

    // Determine receiverId
    let receiverId;
    if (isPatient) {
      receiverId = appointment.doctorId.userId._id;
    } else {
      receiverId = appointment.patientId.userId._id;
    }

    const message = new Message({
      appointmentId: req.params.appointmentId,
      senderId: req.user.id,
      receiverId,
      text
    });

    await message.save();
    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
