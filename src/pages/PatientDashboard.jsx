import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { MessageSquare, Star, Trash2, FileText, Download, ArrowLeft,X} 
from 'lucide-react';

import ChatComponent from '../components/ChatComponent';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const [selectedAppointmentForReceipt, setSelectedAppointmentForReceipt] = useState(null);
  const [showChatModal, setShowChatModal] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(null);
  const [rating, setRating] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [treatment, setTreatment] = useState(0);
  const [comment, setComment] = useState('');
  const [recommended, setRecommended] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showRecordDeleteConfirm, setShowRecordDeleteConfirm] = useState(null);
  const receiptRef = useRef(null);

  const fetchUnreadCounts = async () => {
    try {
      const res = await axios.get('https://dhr-system.onrender.com/api/chat/unread-counts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const counts = {};
      res.data.forEach(item => {
        counts[item._id] = item.count;
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error('Error fetching unread counts', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const [apptsRes, recordsRes, permsRes, reqsRes] = await Promise.all([
          axios.get('https://dhr-system.onrender.com/api/patient/appointments', config),
          axios.get('https://dhr-system.onrender.com/api/patient/records', config),
          axios.get('https://dhr-system.onrender.com/api/patient/permissions', config),
          axios.get('https://dhr-system.onrender.com/api/patient/requests', config)
        ]);
        setAppointments(apptsRes.data);
        setRecords(recordsRes.data);
        setPermissions(permsRes.data);
        setIncomingRequests(reqsRes.data);
        fetchUnreadCounts();
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!showChatModal) {
      fetchUnreadCounts();
    }
  }, [showChatModal]);

  const deleteAppointment = async (apptId) => {
    try {
      console.log('Deleting appointment:', apptId);
      await axios.delete(`https://dhr-system.onrender.com/api/patient/appointments/${apptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(appointments.filter(a => a._id !== apptId));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Delete appointment error:', err);
      alert('Failed to delete appointment: ' + (err.response?.data?.message || err.message));
    }
  };

  const downloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt-${selectedAppointmentForReceipt._id.slice(-6)}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      alert('Failed to download PDF');
    }
  };

  const handleRequestResponse = async (requestId, status) => {
    try {
      const res = await axios.patch(`https://dhr-system.onrender.com/api/patient/requests/${requestId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIncomingRequests(incomingRequests.filter(r => r._id !== requestId));
      if (status === 'accepted') {
        const permsRes = await axios.get('https://dhr-system.onrender.com/api/patient/permissions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPermissions(permsRes.data);
      }
      alert(`Request ${status}`);
    } catch (err) {
      alert('Failed to respond to request');
    }
  };

  const revokePermission = async (doctorId) => {
    try {
      await axios.delete(`https://dhr-system.onrender.com/api/patient/permissions/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPermissions(permissions.filter(p => p.doctorId._id !== doctorId));
    } catch (err) {
      alert('Failed to revoke permission');
    }
  };

  const deleteRecord = async (recordId) => {
    try {
      console.log('Deleting record:', recordId);
      await axios.delete(`https://dhr-system.onrender.com/api/patient/records/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(records.filter(r => r._id !== recordId));
      setShowRecordDeleteConfirm(null);
    } catch (err) {
      console.error('Delete record error:', err);
      alert('Failed to delete record: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRate = async () => {
    try {
      await axios.post(`https://dhr-system.onrender.com/api/patient/doctors/${showRatingModal.doctorId._id}/reviews`, {
        appointmentId: showRatingModal._id,
        rating,
        punctuality,
        communication,
        treatment,
        comment,
        recommended
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Thank you for your feedback!`);
      setShowRatingModal(null);
      setRating(0);
      setPunctuality(0);
      setCommunication(0);
      setTreatment(0);
      setComment('');
      setRecommended(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  return (
    <div className="patient-d-container">
      <div className="dashboard-grid">
        <aside className="sidebar">
          <h3>Patient Panel</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginBottom: '1.5rem' }}>{user.profile.fullName}</p>
          <Link to="/patient-dashboard" className="sidebar-link active">Dashboard Overview</Link>
          <Link to="/book-appointment" className="sidebar-link">Book Appointment</Link>
          <Link to="/medical-records" className="sidebar-link">My Medical Records</Link>
        </aside>

        <div className="dashboard-content">
          <div className="patient-d-card">
            <h2>Permission Requests</h2>
            <p style={{ color: 'var(--gray)', marginBottom: '1rem' }}>Doctors requesting access to your medical records:</p>
            {incomingRequests.length === 0 ? <p>No pending requests.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {incomingRequests.map(req => (
                  <div key={req._id} style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Dr. {req.doctorId.fullName}</strong>
                        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', margin: '0.2rem 0' }}>{req.doctorId.specialization}</p>
                        {req.message && <p style={{ fontSize: '0.9rem', fontStyle: 'italic', marginTop: '0.5rem' }}>"{req.message}"</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleRequestResponse(req._id, 'accepted')} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>Accept</button>
                        <button onClick={() => handleRequestResponse(req._id, 'rejected')} className="btn btn-secondary" style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="patient-d-card">
            <h2>Upcoming Appointments</h2>
            {appointments.length === 0 ? <p>No upcoming appointments.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Doctor</th>
                    <th style={{ padding: '0.5rem' }}>Date</th>
                    <th style={{ padding: '0.5rem' }}>Status</th>
                    <th style={{ padding: '0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appt => (
                    <tr key={appt._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.5rem' }}>Dr. {appt.doctorId.fullName}</td>
                      <td style={{ padding: '0.5rem' }}>{new Date(appt.date).toLocaleString()}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem',
                          background: appt.status === 'accepted' ? '#e6fffa' : '#fff5f5',
                          color: appt.status === 'accepted' ? '#2c7a7b' : '#c53030'
                        }}>
                          {appt.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {appt.status === 'accepted' && (
                            <>
                              <button 
                                onClick={() => setSelectedAppointmentForReceipt(appt)}
                                className="action-btn" 
                                title="View Receipt"
                                style={{ background: '#e2e8f0', color: '#475569' }}
                              >
                                <FileText size={16} />
                              </button>
                              <div style={{ position: 'relative' }}>
                                <button 
                                  onClick={() => setShowChatModal(appt)}
                                  className="action-btn" 
                                  title="Chat with Doctor"
                                  style={{ background: 'var(--primary)', color: 'white' }}
                                >
                                  <MessageSquare size={16} />
                                </button>
                                {unreadCounts[appt._id] > 0 && (
                                  <span style={{ 
                                    position: 'absolute', 
                                    top: '-5px', 
                                    right: '-5px', 
                                    background: 'var(--danger)', 
                                    color: 'white', 
                                    borderRadius: '50%', 
                                    width: '18px', 
                                    height: '18px', 
                                    fontSize: '0.6rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    border: '1.5px solid white',
                                    fontWeight: 'bold'
                                  }}>
                                    {unreadCounts[appt._id]}
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => setShowRatingModal(appt)}
                                className="action-btn" 
                                title="Rate Doctor"
                                style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #f59e0b' }}
                              >
                                <Star size={16} />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setShowDeleteConfirm(appt)}
                            className="action-btn" 
                            title="Cancel Appointment"
                            style={{ background: '#fee2e2', color: '#dc2626' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="patient-d-card">
            <h2>Recent Medical Records</h2>
            {records.length === 0 ? (
              <p>No records found. <Link to="/medical-records" style={{ color: 'var(--primary)' }}>View all records</Link></p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {records.slice(0, 3).map(record => (
                  <div key={record._id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{record.description}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{new Date(record.date).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Dr. {record.doctorId.fullName}</p>
                      <button 
                        onClick={() => setShowRecordDeleteConfirm(record)}
                        style={{ 
                          position: 'absolute', 
                          bottom: '0.5rem', 
                          right: '0.5rem', 
                          border: 'none', 
                          background: 'none', 
                          color: 'var(--danger)', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontSize: '0.7rem'
                        }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                  </div>
                ))}
                <Link to="/medical-records" className="btn btn-secondary" style={{ textAlign: 'center', fontSize: '0.8rem' }}>View All Records</Link>
              </div>
            )}
          </div>

          <div className="patient-d-card">
            <h2>Permission Management</h2>
            <p style={{ color: 'var(--gray)', marginBottom: '1rem' }}>Doctors with access to your medical records:</p>
            {permissions.length === 0 ? <p>No permissions granted.</p> : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {permissions.map(p => (
                  <li key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#f8f9fa', borderRadius: '6px' }}>
                    <span>Dr. {p.doctorId.fullName} ({p.doctorId.specialization})</span>
                    <button onClick={() => revokePermission(p.doctorId._id)} style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>Revoke Access</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {selectedAppointmentForReceipt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="patient-d-card receipt-patient-d-card" style={{ width: '450px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setSelectedAppointmentForReceipt(null)}
              className="close-modal"
            >
              <X size={24} />
            </button>
            
            <div ref={receiptRef} style={{ padding: '1rem', background: 'white' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h1 style={{ color: 'var(--primary)', margin: 0 }}>MEDITRUST</h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>Official Appointment Receipt</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>Receipt No:</span>
                  <strong>#REC-{selectedAppointmentForReceipt._id.slice(-6).toUpperCase()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>Patient Name:</span>
                  <strong>{user.profile.fullName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>Doctor:</span>
                  <strong>Dr. {selectedAppointmentForReceipt.doctorId.fullName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>Specialization:</span>
                  <strong>{selectedAppointmentForReceipt.doctorId.specialization}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>Hospital:</span>
                  <strong>{selectedAppointmentForReceipt.doctorId.hospitalName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>Address:</span>
                  <strong style={{ fontSize: '0.8rem', textAlign: 'right', maxWidth: '200px' }}>
                    {selectedAppointmentForReceipt.doctorId.address || selectedAppointmentForReceipt.doctorId.location || 'Not set'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>Date:</span>
                  <strong>{new Date(selectedAppointmentForReceipt.date).toLocaleDateString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray)' }}>Time:</span>
                  <strong>{new Date(selectedAppointmentForReceipt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #eee' }}>
                  <span style={{ color: 'var(--gray)' }}>Status:</span>
                  <strong style={{ color: '#2c7a7b' }}>CONFIRMED & PAID</strong>
                </div>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--gray)', marginTop: '1rem', textAlign: 'center' }}>Thank you for choosing MediChain Healthcare Services.</p>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button onClick={downloadPDF} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Download size={18} /> Download PDF
              </button>
              <button onClick={() => setSelectedAppointmentForReceipt(null)} className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={18} /> Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showChatModal && (
        <div className="modal-overlay">
          <div className="patient-d-card" style={{ width: '500px', padding: '0', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Chat with Dr. {showChatModal.doctorId.fullName}</h2>
              <button onClick={() => setShowChatModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray)' }}>
                <X size={24} />
              </button>
            </div>
            <ChatComponent appointment={showChatModal} currentUser={user} />
          </div>
        </div>
      )}

      {showRatingModal && (
        <div className="modal-overlay">
          <div className="patient-d-card" style={{ width: '500px', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowRatingModal(null)} className="close-modal"><X size={24} /></button>
            <h2>Rate Dr. {showRatingModal.doctorId.fullName}</h2>
            <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>Your feedback helps other patients choose the right care.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Overall Rating</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Star 
                      key={num} 
                      size={28} 
                      style={{ cursor: 'pointer', fill: rating >= num ? '#f59e0b' : 'none', color: '#f59e0b' }}
                      onClick={() => setRating(num)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Punctuality</label>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Star key={num} size={18} style={{ cursor: 'pointer', fill: punctuality >= num ? '#f59e0b' : 'none', color: '#f59e0b' }} onClick={() => setPunctuality(num)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Communication</label>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Star key={num} size={18} style={{ cursor: 'pointer', fill: communication >= num ? '#f59e0b' : 'none', color: '#f59e0b' }} onClick={() => setCommunication(num)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Treatment Quality</label>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Star key={num} size={18} style={{ cursor: 'pointer', fill: treatment >= num ? '#f59e0b' : 'none', color: '#f59e0b' }} onClick={() => setTreatment(num)} />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Comments</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="recommend" 
                  checked={recommended} 
                  onChange={(e) => setRecommended(e.target.checked)} 
                />
                <label htmlFor="recommend">I recommend this doctor</label>
              </div>
            </div>

            <button 
              onClick={handleRate} 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '2rem' }} 
              disabled={rating === 0}
            >
              Submit Detailed Review
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="patient-d-card" style={{ width: '400px', padding: '2rem', position: 'relative', textAlign: 'center' }}>
            <button onClick={() => setShowDeleteConfirm(null)} className="close-modal"><X size={24} /></button>
            <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
              <Trash2 size={48} />
            </div>
            <h2>Cancel Appointment?</h2>
            <p style={{ margin: '1rem 0', color: 'var(--gray)' }}>
              Are you sure you want to cancel your appointment with <strong>Dr. {showDeleteConfirm.doctorId.fullName}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setShowDeleteConfirm(null)} className="btn btn-secondary" style={{ flex: 1 }}>No, Keep it</button>
              <button onClick={() => deleteAppointment(showDeleteConfirm._id)} className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)' }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRecordDeleteConfirm && (
        <div className="modal-overlay">
          <div className="patient-d-card" style={{ width: '400px', padding: '2rem', position: 'relative', textAlign: 'center' }}>
            <button onClick={() => setShowRecordDeleteConfirm(null)} className="close-modal"><X size={24} /></button>
            <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
              <Trash2 size={48} />
            </div>
            <h2>Delete Medical Record?</h2>
            <p style={{ margin: '1rem 0', color: 'var(--gray)' }}>
              Are you sure you want to delete the record: <strong>{showRecordDeleteConfirm.description}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setShowRecordDeleteConfirm(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => deleteRecord(showRecordDeleteConfirm._id)} className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)' }}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .action-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }
        .action-btn:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          zIndex: 1000;
        }
        .close-modal {
          position: absolute;
          top: 1rem;
          right: 1rem;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--gray);
        }
        .close-modal:hover {
          color: var(--danger);
        }
      `}</style>
    </div>
  );
};

export default PatientDashboard;
