import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MapPin,
  Star,
  X
} from 'lucide-react';

import MaleDoctor from '../images/MaleDoctor.jpg';

const AppointmentPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [date, setDate] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

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

      setDoctors(docsRes.data || []);
      setAppointments(apptsRes.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const isAlreadyBooked = (doctorId) => {
    return appointments.some(
      (appt) =>
        appt?.doctorId?._id === doctorId &&
        (
          appt.status === 'pending' ||
          appt.status === 'accepted'
        )
    );
  };

  const handleBook = async () => {
    if (!selectedDoctor || !date) {
      alert('Please select a date');
      return;
    }

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

      alert('Appointment booked successfully');
      setSelectedDoctor(null);
      setDate('');
      fetchData();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Booking failed'
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

      setReviews(res.data || []);
      setShowReviews(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>
        Book Appointment
      </h1>

      {doctors.length === 0 ? (
        <div className="card">
          <h3>No doctors available</h3>
          <p>
            Register a doctor account first
            or check backend connectivity.
          </p>
        </div>
      ) : (
        <div className="grid-3">
          {doctors.map((doctor) => (
            <div
              key={doctor._id}
              className="card"
            >
              <img
                src={MaleDoctor}
                alt="Doctor"
                style={{
                  width: '100%',
                  borderRadius: '10px'
                }}
              />

              <h3>
                Dr. {doctor.fullName}
              </h3>

              <p>
                {doctor.specialization}
              </p>

              <p>
                {doctor.hospitalName}
              </p>

              {doctor.location && (
                <p>
                  <MapPin size={14} />
                  {' '}
                  {doctor.location}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Star size={14} />
                {doctor.rating || 0}
              </div>

              <button
                onClick={() =>
                  fetchReviews(doctor._id)
                }
                className="btn btn-secondary"
              >
                Reviews
              </button>

              {isAlreadyBooked(
                doctor._id
              ) ? (
                <button
                  disabled
                  className="btn"
                >
                  Already Booked
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    setSelectedDoctor(
                      doctor
                    )
                  }
                >
                  Book Now
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedDoctor && (
        <div className="modal">
          <div className="card">
            <h2>
              Dr.
              {' '}
              {selectedDoctor.fullName}
            </h2>

            <input
              type="datetime-local"
              value={date}
              onChange={(e) =>
                setDate(
                  e.target.value
                )
              }
            />

            <br />
            <br />

            <button
              className="btn btn-primary"
              onClick={handleBook}
            >
              Confirm Booking
            </button>

            <button
              className="btn btn-secondary"
              onClick={() =>
                setSelectedDoctor(
                  null
                )
              }
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showReviews && (
        <div className="modal">
          <div className="card">
            <button
              onClick={() =>
                setShowReviews(false)
              }
            >
              <X />
            </button>

            <h2>Reviews</h2>

            {reviews.length === 0 ? (
              <p>No reviews available</p>
            ) : (
              reviews.map((review) => (
                <div
                  key={review._id}
                >
                  <strong>
                    {
                      review
                        ?.patientId
                        ?.fullName
                    }
                  </strong>

                  <p>
                    {review.comment}
                  </p>

                  <hr />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentPage;