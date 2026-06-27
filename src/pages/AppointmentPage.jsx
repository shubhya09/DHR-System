
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Star, X, ThumbsUp, Clock, MessageCircle, Activity } from 'lucide-react';
import MaleDoctor from '../images/MaleDoctor.jpg';

const AppointmentPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showReviews, setShowReviews] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [date, setDate] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, apptsRes] = await Promise.all([
          axios.get(
            'https://dhr-system.onrender.com/api/patient/doctors',
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          ),

          axios.get(
            'https://dhr-system.onrender.com/api/patient/appointments',
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          )
        ]);

        setDoctors(docsRes.data);
        setAppointments(apptsRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [token]);

  const isAlreadyBooked = (doctorId) => {
    return appointments.some(
      appt =>
        appt.doctorId._id === doctorId &&
        (appt.status === 'pending' ||
          appt.status === 'accepted')
    );
  };

  const handleBook = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        'https://dhr-system.onrender.com/api/patient/appointments',
        {
          doctorId: selectedDoctor._id,
          date
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Appointment booked successfully!');
      setSelectedDoctor(null);
      setDate('');
    } catch (err) {
      alert(
        err.response?.data?.message ||
          'Booking failed'
      );
    }
  };

  const handleGrantPermission = async (
    doctorId
  ) => {
    try {
      await axios.post(
        'https://dhr-system.onrender.com/api/patient/permissions',
        {
          doctorId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Permission granted to doctor!');
    } catch (err) {
      alert(
        err.response?.data?.message ||
          'Failed to grant permission'
      );
    }
  };

  const fetchReviews = async (doctorId) => {
    try {
      const res = await axios.get(
        `https://dhr-system.onrender.com/api/patient/doctors/${doctorId}/reviews`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setReviews(res.data);
      setShowReviews(
        doctors.find(
          d => d._id === doctorId
        )
      );
    } catch (err) {
      console.error(
        'Error fetching reviews',
        err
      );
    }
  };

  // KEEP ALL YOUR EXISTING JSX BELOW THIS LINE

  // ONLY CHANGE THIS IMAGE:
  // FROM:
  // <img src="src/images/MaleDoctor.jpg"/>

  // TO:
  // <img src={MaleDoctor} alt="Doctor" />
};

export default AppointmentPage;

