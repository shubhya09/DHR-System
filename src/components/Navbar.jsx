import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../images/Logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [dbStatus, setDbStatus] = useState('checking');
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);


  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get('/api/health');
        setDbStatus(res.data.database);
      } catch (err) {
        setDbStatus('failed');
      }
    };

    const fetchUnreadTotal = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get('/api/chat/total-unread', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadTotal(res.data.count);
      } catch (err) {
        console.error('Error fetching unread total:', err);
      }
    };

    checkHealth();
    fetchUnreadTotal();

    const healthInterval = setInterval(checkHealth, 30000);
    const unreadInterval = setInterval(fetchUnreadTotal, 10000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(unreadInterval);
    };
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="nav-logo">
            <img src="src/images/Logo.png" alt="Logo" />
            &nbsp;MEDITRUST
          </Link>
        </div>

        <button className="menu-toggle" onClick={toggleMenu}>
          ☰ Menu
        </button>

        <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link href="/#about" to="/" className="nav-link" onClick={() => setMenuOpen(false)}>About-Us</Link>
          <Link href="/#services" to="/" className="nav-link" onClick={() => setMenuOpen(false)}>Our-Services</Link>

          {!user ? (
            <>
              <Link to="/login" className="btn-nav btn-Color" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn-nav btn-Color" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                to={user.role === 'patient' ? '/patient-dashboard' : '/doctor-dashboard'}
                className="nav-link"
                style={{ position: 'relative' }}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
                {unreadTotal > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-8px',
                      width: '8px',
                      height: '8px',
                      background: '#ef4444',
                      borderRadius: '50%',
                      border: '1px solid white'
                    }}
                  ></span>
                )}
              </Link>

              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="btn-nav btn-Color" >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;