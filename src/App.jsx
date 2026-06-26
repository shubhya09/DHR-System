import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import AppointmentPage from './pages/AppointmentPage.jsx';
import MedicalRecords from './pages/MedicalRecords.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import './App.css';
import './Patient-D.css';
import './Doctor-D.css';
import './Appointment.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/book-appointment" element={<AppointmentPage />} />
            <Route path="/medical-records" element={<MedicalRecords />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
