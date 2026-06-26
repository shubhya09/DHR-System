import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [dbStatus, setDbStatus] = useState('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get('/api/health');
        setDbStatus(res.data.database);
      } catch (err) {
        setDbStatus('failed');
      }
    };
    checkHealth();
  }, []);

  const handleBookClick = () => {
    if (dbStatus !== 'connected') {
      alert('Database connection is not ready. Please wait or check your configuration.');
      return;
    }
    if (!user) {
      navigate('/register');
    } else {
      navigate('/book-appointment');
    }
  };

  return (
    <div className="container">
      {dbStatus === 'disconnected' || dbStatus === 'failed' ? (
        <div style={{
          background: '#fff5f5',
          color: '#c53030',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          textAlign: 'center',
          border: '1px solid #feb2b2'
        }}>
          <strong>Database Connection Error:</strong> The application is unable to connect to MongoDB.
          Please ensure you have set a valid <code>MONGODB_URI</code> in your Secrets panel.
        </div>
      ) : null}

      <section className="hero">
        <div className="hero-content">
          <h1>MEDITRUST</h1>
          <p><b> It's Trusted Healthcare Records System,</b> Manage appointments, medical history, and records in one secure place.</p>
          <button onClick={handleBookClick} className="btn btn-Color">Book Appointment</button>
        </div>
      </section>

      <section className="about" id="about">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Why Choose Meditrust?</h2>
        <div className="about-cont">
          <div className="Home-card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Data Integrity</h3>
            <p>Every medical record is hashed and stored on a blockchain ledger to ensure it can never be tampered with.</p>
          </div>
          <div className="Home-card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Patient Control</h3>
            <p>Patients have full control over who can access their medical history. Grant or revoke access at any time.</p>
          </div>
          <div className="Home-card" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Seamless Appointments</h3>
            <p>Book consultations with top specialists and manage your healthcare schedule in one place.</p>
          </div>
        </div>
      </section>
      <section className="service" id="services">
        <div className="service services-container">
          <div className="services-cont">
            <div className="services-txt">
              <h2>Our Services</h2>
              <p className="service-subtitle">
                Our platform offers trusted digital solutions for managing healthcare records with ease.
              </p>
            </div>
            <div className="doctor-card">
              <div className="patient-grid">
                <div className="patient-card">
                  <img src="src/images/MaleDoctor.jpg" alt="patient" />
                  <h4>Dr. Arjun Kumar</h4>
                  <p>Dermatologist</p>
                </div>
                <div className="patient-card">
                  <img src="src/images/MaleDoctor.jpg" alt="patient" />
                  <h4>Dr. Rahul Kumar</h4>
                  <p>Neurologist</p>
                </div>
                <div className="patient-card">
                  <img src="src/images/FemaleDoctor.jpg" alt="patient" />
                  <h4>Dr. Priya </h4>
                  <p>Pediatrician</p>
                </div>
                <div className="patient-card">
                  <img src="src/images/MaleDoctor.jpg" alt="patient" />
                  <h4>Dr. Vikram Kumar</h4>
                  <p>Dentist</p>
                </div>
                <div className="patient-card">
                  <img src="src/images/MaleDoctor.jpg" alt="patient" />
                  <h4>Dr. Karan Kumar</h4>
                  <p>Gastroenterologist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer class="footer">
        <h1 class="credit">Develop By <span>@ MEDITRUST</span> | all rights reserved. </h1>
      </footer>
    </div>
  );
};

export default Home;
