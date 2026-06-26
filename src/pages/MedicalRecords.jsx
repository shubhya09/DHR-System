import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, X } from 'lucide-react';

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axios.get('/api/patient/records', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecords(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRecords();
  }, [token]);

  const deleteRecord = async (recordId) => {
    try {
      await axios.delete(`/api/patient/records/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(records.filter(r => r._id !== recordId));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Delete record error:', err);
      alert('Failed to delete record: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: '2rem' }}>My Medical Records</h2>
      {records.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>No medical records found. Your doctor will upload them after your consultation.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {records.map(record => (
            <div key={record._id} className="card" style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowDeleteConfirm(record)}
                style={{ 
                  position: 'absolute', 
                  top: '1rem', 
                  right: '1rem', 
                  border: 'none', 
                  background: 'none', 
                  color: 'var(--danger)', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8rem'
                }}
              >
                <Trash2 size={16} /> Delete
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', paddingRight: '5rem' }}>
                <div>
                  <h3 style={{ color: 'var(--secondary)' }}>{record.description}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>By Dr. {record.doctorId.fullName} on {new Date(record.date).toLocaleDateString()}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    background: '#e6fffa', 
                    color: '#2c7a7b', 
                    padding: '0.3rem 0.6rem', 
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '0.5rem'
                  }}>
                    BLOCKCHAIN VERIFIED
                  </span>
                  <code style={{ fontSize: '0.6rem', color: '#999' }}>Hash: {record.hash.substring(0, 20)}...</code>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <div>
                  <h4 style={{ marginBottom: '0.5rem' }}>Diagnosis</h4>
                  <p>{record.diagnosis || 'No diagnosis notes provided.'}</p>
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.5rem' }}>Prescription</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{record.prescription || 'No prescription provided.'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showDeleteConfirm && (
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
          <div className="card" style={{ width: '400px', padding: '2rem', position: 'relative', textAlign: 'center' }}>
            <button onClick={() => setShowDeleteConfirm(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray)' }}><X size={24} /></button>
            <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
              <Trash2 size={48} />
            </div>
            <h2>Delete Medical Record?</h2>
            <p style={{ margin: '1rem 0', color: 'var(--gray)' }}>
              Are you sure you want to delete the record: <strong>{showDeleteConfirm.description}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setShowDeleteConfirm(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => deleteRecord(showDeleteConfirm._id)} className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)' }}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
