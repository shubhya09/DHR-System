import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Star, X, ThumbsUp, Clock, MessageCircle, Activity } from 'lucide-react';

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
          axios.get('/api/patient/doctors', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/patient/appointments', { headers: { Authorization: `Bearer ${token}` } })
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
    return appointments.some(appt => 
      appt.doctorId._id === doctorId && 
      (appt.status === 'pending' || appt.status === 'accepted')
    );
  };

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/patient/appointments', { doctorId: selectedDoctor._id, date }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Appointment booked successfully!');
      setSelectedDoctor(null);
      setDate('');
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed');
    }
  };

  const handleGrantPermission = async (doctorId) => {
    try {
      await axios.post('/api/patient/permissions', { doctorId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Permission granted to doctor!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to grant permission');
    }
  };

  const fetchReviews = async (doctorId) => {
    try {
      const res = await axios.get(`/api/patient/doctors/${doctorId}/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data);
      setShowReviews(doctors.find(d => d._id === doctorId));
    } catch (err) {
      console.error('Error fetching reviews', err);
    }
  };

  return (
    <div className="Appnmnt-container">
      <h2 style={{ marginBottom: '2rem' }}>Book a Consultation</h2>
      <div className="grid-3">
        {doctors.map(doc => (
          <div key={doc._id} className="A-card doctor-card">
            <img src="src/images/MaleDoctor.jpg"/>
            <h3>Dr. {doc.fullName}</h3>
            <p style={{ color: 'var(--primary)', fontWeight: '600' }}>{doc.specialization}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>{doc.hospitalName}</p>
            {doc.location && doc.location !== 'Not set' && (
              <p style={{ fontSize: '0.8rem', color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                <MapPin size={14} /> {doc.location}
              </p>
            )}
            <p style={{ fontSize: '0.8rem', margin: '0.5rem 0' }}>{doc.experience} Years Experience</p>
            
            <div style={{ margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Star size={14} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{doc.rating?.toFixed(1) || 'N/A'}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>({doc.numReviews || 0} reviews)</span>
              </div>
              {doc.recommendationRate > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '500' }}>
                  {Math.round(doc.recommendationRate)}% recommend this doctor
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={() => fetchReviews(doc._id)} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>View Reviews</button>
              {isAlreadyBooked(doc._id) ? (
                <button disabled className="btn btn-secondary" style={{ cursor: 'not-allowed', opacity: 0.7 }}>Already Booked</button>
              ) : (
                <button onClick={() => setSelectedDoctor(doc)} className="btn btn-primary">Book Now</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedDoctor && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="doctor-A-card" style={{ width: '400px' }}>
            <h3>Book with Dr. {selectedDoctor.fullName}</h3>
            <form onSubmit={handleBook} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>Select Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="form-control" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm</button>
                <button type="button" onClick={() => setSelectedDoctor(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReviews && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="doctor-A-card" style={{ width: '600px', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowReviews(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
            <h2>Reviews for Dr. {showReviews.fullName}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', margin: '1.5rem 0', padding: '1rem', background: '#f8f9fa', borderRadius: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{showReviews.rating?.toFixed(1) || 'N/A'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray)', textTransform: 'uppercase' }}>Overall</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{showReviews.avgPunctuality?.toFixed(1) || 'N/A'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray)', textTransform: 'uppercase' }}>Punctuality</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{showReviews.avgCommunication?.toFixed(1) || 'N/A'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray)', textTransform: 'uppercase' }}>Comm.</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{showReviews.avgTreatment?.toFixed(1) || 'N/A'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray)', textTransform: 'uppercase' }}>Treatment</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.length === 0 ? <p>No reviews yet.</p> : reviews.map(rev => (
                <div key={rev._id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{rev.patientId.fullName}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} size={14} style={{ fill: rev.rating >= n ? '#f59e0b' : 'none', color: '#f59e0b' }} />
                    ))}
                  </div>
                  {rev.comment && <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: '#444' }}>"{rev.comment}"</p>}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--gray)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Clock size={12} /> Punctuality: {rev.punctuality}/5</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><MessageCircle size={12} /> Comm: {rev.communication}/5</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Activity size={12} /> Treatment: {rev.treatment}/5</span>
                  </div>
                  {rev.recommended && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <ThumbsUp size={12} /> Recommended
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentPage;
