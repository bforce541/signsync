import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import About from './About';

// Hardcoded socket status and simulate server down message
function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('Disconnected');
  const [serverDown, setServerDown] = useState(true); // Simulating server down
  const [darkMode, setDarkMode] = useState(false); // Light mode as default
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Set the theme based on saved preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    } else {
      setDarkMode(false);
      document.body.classList.add('light-mode');
    }

    // Access the webcam (camera should still work)
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        setError("Failed to access webcam. Please ensure you have given permission.");
      });
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
    document.body.classList.toggle('dark-mode', !darkMode);
    document.body.classList.toggle('light-mode', darkMode);
  };

  return (
    <div className="App">
      <div className="toggle-container">
        <label className="toggle-label">Change Mode</label>
        <label className="toggle-switch">
          <input type="checkbox" checked={darkMode} onChange={toggleTheme} />
          <span className="slider"></span>
        </label>
      </div>

      {/* Display hardcoded socket status */}
      <p className="socket-status">Socket Status: {socketStatus}</p>

      {/* Camera feed */}
      <div className="video-container">
        <video ref={videoRef} autoPlay />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Popup message for server down */}
      {serverDown && (
        <div className="server-down-popup">
          <p>Our server is currently experiencing issues. Please check back later.</p>
        </div>
      )}

      {/* Optional error display (camera errors) */}
      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <header className="navbar">
          <div className="nav-left">
            <Link className="nav-link" to="/">Home</Link>
          </div>
          <div className="nav-center">
            <Link className="nav-link" to="/about">About</Link>
            <h1 className="logo">SIGNSYNC</h1>
            <a className="nav-link" href="/#">Join Us</a>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>

        <footer className="footer">
          <div className="footer-left">
            <p>&copy; 2024 SignSync. All rights reserved</p>
            <p>Developed by Yoshua Alexander</p>
          </div>
          <div className="footer-right">
            <p><a href="https://forms.gle/vdX9KEm1Z4HhUfkFA">Contribute hand sign data!</a></p>
            <p><a href="mailto:info.signsync@gmail.com">Contact</a></p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
