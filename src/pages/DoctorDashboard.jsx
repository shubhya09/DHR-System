import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, Trash2, Check, XCircle, MapPin, X, MessageSquare } from 'lucide-react';
import ChatComponent from '../components/ChatComponent';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [activeTab, setActiveTab] = useState('appointments');
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);
  const [showChatModal, setShowChatModal] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const fetchUnreadCounts = async () => {
    try {
      const res = await axios.get('/api/chat/unread-counts', {
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

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('/api/doctor/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(res.data);
      fetchUnreadCounts();
    } catch (err) {
      console.error('Error fetching appointments', err);
    }
  };

  useEffect(() => {
    if (!showChatModal) {
      fetchUnreadCounts();
    }
  }, [showChatModal]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/doctor/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctorProfile(res.data);
    } catch (err) {
      console.error('Error fetching profile', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchProfile();
  }, [token]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.patch(`/api/doctor/appointments/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(appointments.map(a => a._id === id ? { ...a, status } : a));
    } catch (err) {
      alert('Update failed');
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await axios.delete(`/api/doctor/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(appointments.filter(a => a._id !== id));
      setShowCancelConfirm(null);
    } catch (err) {
      console.error('Cancel appointment error:', err);
      alert('Failed to cancel appointment: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="doctor-d-container">
      <div className="dashboard-grid">
        <aside className="sidebar">
          <h3>Doctor Panel</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginBottom: '1.5rem' }}>Dr. {user.profile.fullName}</p>
          <button 
            className={`sidebar-link ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
            style={{ width: '100%', textAlign: 'left', background: 'none' }}
          >
            Appointments
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
            style={{ width: '100%', textAlign: 'left', background: 'none' }}
          >
            Add Medical Record
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'request' ? 'active' : ''}`}
            onClick={() => setActiveTab('request')}
            style={{ width: '100%', textAlign: 'left', background: 'none' }}
          >
            Patient Access
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'location' ? 'active' : ''}`}
            onClick={() => setActiveTab('location')}
            style={{ width: '100%', textAlign: 'left', background: 'none' }}
          >
            My Location
          </button>
        </aside>

        <div className="dashboard-content">
          {activeTab === 'appointments' ? (
            <div className="doctor-d-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Patient Consultations</h2>
                <button onClick={fetchAppointments} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>
              {appointments.length === 0 ? <p>No appointments scheduled.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem' }}>Patient</th>
                      <th style={{ padding: '0.5rem' }}>Date</th>
                      <th style={{ padding: '0.5rem' }}>Type/Location</th>
                      <th style={{ padding: '0.5rem' }}>Status</th>
                      <th style={{ padding: '0.5rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(appt => (
                      <tr key={appt._id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '0.5rem' }}>{appt.patientId?.fullName || 'Deleted Patient'}</td>
                        <td style={{ padding: '0.5rem' }}>{new Date(appt.date).toLocaleString()}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{appt.type === 'virtual' ? 'Virtual' : 'Physical'}</span>
                            {appt.type === 'physical' && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <MapPin size={12} /> {doctorProfile?.location || 'Location not set'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <span style={{ 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.8rem',
                            background: appt.status === 'accepted' ? '#e6fffa' : appt.status === 'rejected' ? '#fff5f5' : '#f0f0f0',
                            color: appt.status === 'accepted' ? '#2c7a7b' : appt.status === 'rejected' ? '#c53030' : '#666'
                          }}>
                            {appt.status}
                          </span>
                        </td>
                         <td style={{ padding: '0.5rem' }}>
                           <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                             {appt.status === 'pending' ? (
                               <>
                                 <button onClick={() => handleStatusUpdate(appt._id, 'accepted')} title="Accept" style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}><Check size={18} /></button>
                                 <button onClick={() => handleStatusUpdate(appt._id, 'rejected')} title="Reject" style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><XCircle size={18} /></button>
                               </>
                             ) : appt.status === 'accepted' ? (
                               <>
                                 <button onClick={() => setActiveTab('request')} className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Request Access</button>
                                 <div style={{ position: 'relative' }}>
                                   <button 
                                     onClick={() => setShowChatModal(appt)} 
                                     title="Chat with Patient" 
                                     style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                                   >
                                     <MessageSquare size={18} />
                                   </button>
                                   {unreadCounts[appt._id] > 0 && (
                                     <span style={{ 
                                       position: 'absolute', 
                                       top: '-5px', 
                                       right: '-5px', 
                                       background: 'var(--danger)', 
                                       color: 'white', 
                                       borderRadius: '50%', 
                                       width: '16px', 
                                       height: '16px', 
                                       fontSize: '0.6rem', 
                                       display: 'flex', 
                                       alignItems: 'center', 
                                       justifyContent: 'center',
                                       border: '1px solid white',
                                       fontWeight: 'bold'
                                     }}>
                                       {unreadCounts[appt._id]}
                                     </span>
                                   )}
                                 </div>
                               </>
                             ) : null}
                             <button onClick={() => setShowCancelConfirm(appt)} title="Cancel Appointment" style={{ color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                           </div>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : activeTab === 'records' ? (
            <RecordUpload />
          ) : activeTab === 'request' ? (
            <PatientAccess />
          ) : (
            <DoctorLocation profile={doctorProfile} onUpdate={fetchProfile} />
          )}
        </div>
      </div>

      {showChatModal && (
        <div className="modal-overlay">
          <div className="doctor-d-card" style={{ width: '500px', padding: '0', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Chat with {showChatModal.patientId?.fullName}</h2>
              <button onClick={() => setShowChatModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray)' }}>
                <X size={24} />
              </button>
            </div>
            <ChatComponent appointment={showChatModal} currentUser={user} />
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="modal-overlay">
          <div className="doctor-d-card" style={{ width: '400px', padding: '2rem', position: 'relative', textAlign: 'center' }}>
            <button onClick={() => setShowCancelConfirm(null)} className="close-modal"><X size={24} /></button>
            <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
              <Trash2 size={48} />
            </div>
            <h2>Cancel Appointment?</h2>
            <p style={{ margin: '1rem 0', color: 'var(--gray)' }}>
              Are you sure you want to cancel the appointment with <strong>{showCancelConfirm.patientId?.fullName || 'this patient'}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setShowCancelConfirm(null)} className="btn btn-secondary" style={{ flex: 1 }}>No, Keep it</button>
              <button onClick={() => cancelAppointment(showCancelConfirm._id)} className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)' }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
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
          z-index: 1000;
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

const DoctorLocation = ({ profile, onUpdate }) => {
  const [location, setLocation] = useState(profile?.location || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (profile) {
      setLocation(profile.location);
      setAddress(profile.address);
    }
  }, [profile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.patch('/api/doctor/profile', { location, address }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profile updated successfully!');
      onUpdate();
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-d-card">
      <h2>My Consultation Details</h2>
      <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
        Set your clinic or hospital location and full address. This will be shown to patients on their receipts and during booking.
      </p>
      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label>City / Area (Short Location)</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. Manhattan, NY"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Full Clinic Address</label>
          <div style={{ position: 'relative' }}>
            <MapPin size={20} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--gray)' }} />
            <textarea 
              className="form-control" 
              style={{ paddingLeft: '3rem', minHeight: '100px' }}
              placeholder="Enter your full consultation address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Updating...' : 'Update Details'}
        </button>
      </form>

      {(profile?.address || profile?.location) && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
          <strong>Current Active Address:</strong>
          <p style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <MapPin size={16} color="var(--primary)" style={{ marginTop: '0.2rem' }} /> 
            <span>
              {profile.address && profile.address !== 'Not set' ? profile.address : profile.location}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

const PatientAccess = () => {
  const [appointmentPatients, setAppointmentPatients] = useState([]);
  const [message, setMessage] = useState('');
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [patientsRes, requestsRes] = await Promise.all([
          axios.get('/api/doctor/appointment-patients', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/api/doctor/sent-requests', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setAppointmentPatients(patientsRes.data);
        setSentRequests(requestsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleSendRequest = async (patientId) => {
    try {
      const res = await axios.post('/api/doctor/request-access', { patientId, message }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Request sent successfully!');
      setSentRequests([res.data, ...sentRequests]);
      setAppointmentPatients(appointmentPatients.map(p => 
        p._id === patientId ? { ...p, hasPendingRequest: true } : p
      ));
      setMessage('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const viewRecords = async (patient) => {
    try {
      const res = await axios.get(`/api/doctor/patient-records/${patient._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatientRecords(res.data);
      setSelectedPatient(patient);
    } catch (err) {
      alert('Failed to fetch patient records');
    }
  };

  if (selectedPatient) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <button onClick={() => setSelectedPatient(null)} className="btn btn-secondary" style={{ width: 'fit-content' }}>
          &larr; Back to Patient List
        </button>
        <div className="doctor-d-card">
          <h2>Medical History: {selectedPatient.fullName}</h2>
          {patientRecords.length === 0 ? (
            <p>No medical records found for this patient.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              {patientRecords.map(record => (
                <div key={record._id} style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ color: 'var(--secondary)', margin: 0 }}>{record.description}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray)', margin: '0.2rem 0' }}>
                        By Dr. {record.doctorId.fullName} on {new Date(record.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.6rem', background: '#e6fffa', color: '#2c7a7b', padding: '0.2rem 0.5rem', borderRadius: '10px' }}>
                        BLOCKCHAIN VERIFIED
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <div>
                      <strong>Diagnosis:</strong>
                      <p style={{ fontSize: '0.9rem', marginTop: '0.3rem' }}>{record.diagnosis}</p>
                    </div>
                    <div>
                      <strong>Prescription:</strong>
                      <p style={{ fontSize: '0.9rem', marginTop: '0.3rem', whiteSpace: 'pre-wrap' }}>{record.prescription}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="doctor-d-card">
        <h2>Patient Access Management</h2>
        <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
          Manage access to medical records for patients who have booked appointments with you.
        </p>

        {loading ? (
          <p>Loading patients...</p>
        ) : appointmentPatients.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', background: '#f8f9fa', borderRadius: '12px' }}>
            No patients found from your appointments.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {appointmentPatients.map(patient => (
              <div key={patient._id} style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{patient.fullName}</h3>
                    <p style={{ margin: '0.2rem 0', color: 'var(--gray)' }}>{patient.phone}</p>
                  </div>
                  <div style={{ width: '350px' }}>
                    {patient.hasPermission ? (
                      <button onClick={() => viewRecords(patient)} className="btn btn-primary" style={{ width: '100%' }}>
                        View Medical Records
                      </button>
                    ) : patient.hasPendingRequest ? (
                      <span style={{ 
                        display: 'block', 
                        textAlign: 'center', 
                        padding: '0.8rem', 
                        background: '#fff', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px',
                        color: 'var(--gray)',
                        fontSize: '0.9rem'
                      }}>
                        Request Pending
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <textarea 
                          className="form-control" 
                          placeholder="Add a message (optional)..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows="2"
                        ></textarea>
                        <button onClick={() => handleSendRequest(patient._id)} className="btn btn-primary" style={{ width: '100%' }}>
                          Send Access Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="doctor-d-card">
        <h3>Sent Requests History</h3>
        {sentRequests.length === 0 ? <p>No requests sent yet.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Patient</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {sentRequests.map(req => (
                <tr key={req._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>{req.patientId.fullName}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem',
                      background: req.status === 'accepted' ? '#e6fffa' : req.status === 'rejected' ? '#fff5f5' : '#f0f0f0',
                      color: req.status === 'accepted' ? '#2c7a7b' : req.status === 'rejected' ? '#c53030' : '#666'
                    }}>
                      {req.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem', fontSize: '0.8rem' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const RecordUpload = () => {
  const [formData, setFormData] = useState({ patientId: '', description: '', diagnosis: '', prescription: '' });
  const [patients, setPatients] = useState([]);
  const [existingRecords, setExistingRecords] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get('/api/doctor/my-patients', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatients(res.data);
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };
    fetchPatients();
  }, [token]);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!formData.patientId) {
        setExistingRecords([]);
        return;
      }
      try {
        const res = await axios.get(`/api/doctor/patient-records/${formData.patientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExistingRecords(res.data);
      } catch (err) {
        console.error('Error fetching patient records:', err);
      }
    };
    fetchRecords();
  }, [formData.patientId, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/doctor/records', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Record added and hashed to blockchain!');
      setFormData({ patientId: '', description: '', diagnosis: '', prescription: '' });
      setExistingRecords([res.data, ...existingRecords]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add record');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="doctor-d-card">
        <h2>Add Medical Record</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Patient</label>
            <select 
              className="form-control" 
              value={formData.patientId} 
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
            >
              <option value="">-- Select Patient --</option>
              {patients.map(p => <option key={p._id} value={p._id}>{p.fullName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              className="form-control" 
              rows="3" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            ></textarea>
          </div>
          <div className="form-group">
            <label>Diagnosis</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.diagnosis} 
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Prescription</label>
            <textarea 
              className="form-control" 
              rows="3" 
              value={formData.prescription} 
              onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Upload & Verify Integrity</button>
        </form>
      </div>

      {formData.patientId && (
        <div className="doctor-d-card">
          <h3>Existing Records for this Patient</h3>
          {existingRecords.length === 0 ? <p>No records found for this patient.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {existingRecords.map(record => (
                <div key={record._id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{record.description}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{new Date(record.date).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{record.diagnosis}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
