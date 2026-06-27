import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [role, setRole] = useState('patient');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    age: '',
    gender: 'Male',
    specialization: '',
    experience: '',
    hospitalName: '',
    address: ''
  });

  const [error, setError] = useState('');
  const [dbStatus, setDbStatus] = useState('checking');

  const navigate = useNavigate();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get(
          'https://dhr-system.onrender.com/api/health'
        );

        setDbStatus(res.data.database);
      } catch (err) {
        setDbStatus('failed');
      }
    };

    checkHealth();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (dbStatus !== 'connected') {
      setError(
        'Database is not connected. Please check your configuration.'
      );
      return;
    }

    const endpoint =
      role === 'patient'
        ? 'https://dhr-system.onrender.com/api/auth/register/patient'
        : 'https://dhr-system.onrender.com/api/auth/register/doctor';

    try {
      await axios.post(endpoint, formData);

      navigate('/login');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed'
      );
    }
  };

  return (
    <div className="Register-container">
      <div className="Register-card">
        <h2
          style={{
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}
        >
          Create Account
        </h2>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            justifyContent: 'center'
          }}
        >
          <button
            className={`btn ${
              role === 'patient'
                ? 'btn-onclick'
                : 'btn-noclick'
            }`}
            onClick={() => setRole('patient')}
          >
            Patient Registration
          </button>

          <button
            className={`btn ${
              role === 'doctor'
                ? 'btn-onclick'
                : 'btn-noclick'
            }`}
            onClick={() => setRole('doctor')}
          >
            Doctor Registration
          </button>
        </div>

        {error && (
          <p
            style={{
              color: 'var(--danger)',
              marginBottom: '1rem'
            }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}
          >
            <div className="form-group">
              <label>Full Name</label>

              <input
                type="text"
                name="fullName"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>

              <input
                type="email"
                name="email"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem'
            }}
          >
            <div className="form-group">
              <label>Phone</label>

              <input
                type="text"
                name="phone"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                name="password"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {role === 'patient' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}
            >
              <div className="form-group">
                <label>Age</label>

                <input
                  type="number"
                  name="age"
                  className="form-control"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender</label>

                <select
                  name="gender"
                  className="form-control"
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}
              >
                <div className="form-group">
                  <label>Specialization</label>

                  <input
                    type="text"
                    name="specialization"
                    className="form-control"
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Experience (Years)</label>

                  <input
                    type="number"
                    name="experience"
                    className="form-control"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Hospital / Clinic Name</label>

                <input
                  type="text"
                  name="hospitalName"
                  className="form-control"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Clinic Address</label>

                <input
                  type="text"
                  name="address"
                  className="form-control"
                  onChange={handleChange}
                  required
                  placeholder="Enter full clinic address"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-Color"
            style={{
              width: '100%',
              marginTop: '1rem'
            }}
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;