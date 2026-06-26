import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await axios.post('/api/auth/reset-password-direct', { email, password });
      setMessage('Password updated successfully! You can now log in with your new password.');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'User not found or something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Reset-container">
      <div className="Reset-card">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {success ? 'Success!' : 'Reset Password'}
        </h2>
        
        {!success && (
          <p style={{ color: 'var(--gray)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            Enter your email and your new password to reset it immediately.
          </p>
        )}
        
        {message && <p style={{ color: '#059669', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{message}</p>}
        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</p>}
        
        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength="6"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                minLength="6"
              />
            </div>
            <button type="submit" className="btn btn-Color" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', display: 'block', textDecoration: 'none' }}>
              Go to Login
            </Link>
          </div>
        )}
        
        {!success && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>Back to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
