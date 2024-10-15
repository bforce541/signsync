import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import About from './About';

// Function to detect if it's a crawler
function isCrawler() {
  const userAgent = navigator.userAgent.toLowerCase();
  const crawlers = ['googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider'];
  return crawlers.some(crawler => userAgent.includes(crawler));
}

function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState({ predicted_label: 'Waiting...', confidence: 'N/A' });
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('Disconnected');
  const [darkMode, setDarkMode] = useState(false); // Light mode as default
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isCrawler()) {
      document.body.innerHTML = `
        <h1>Welcome to SignSync AI</h1>
        <p>SignSync AI is a cutting-edge platform designed to translate sign language into text using advanced AI and machine learning technology. 
        Whether you're learning ASL or need a tool to assist in real-time communication, SignSync AI offers high accuracy and user-friendly interaction. 
        Learn more about our mission to bridge communication gaps and revolutionize the way we connect with the hearing-impaired community.</p>
        <h2>Key Features of SignSync AI</h2>
        <ul>
          <li>Real-time sign language translation</li>
          <li>Powered by advanced AI models</li>
          <li>Easy-to-use interface for seamless communication</li>
          <li>Ongoing improvements with user-contributed hand sign data</li>
        </ul>
        <a href="https://signsyncai.org">Learn More</a>
      `;
      return;
    }

    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    } else {
      setDarkMode(false);
      document.body.classList.add('light-mode');
    }
  }, []);

  useEffect(() => {
    if (!isCrawler()) {
      console.log('Skipping WebSocket connection due to server simulation.');

      // Access the webcam
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          console.log('Webcam access granted');
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing the webcam", err);
          setError("Failed to access webcam. Please ensure you have given permission and try again.");
        });

    }
  }, []);

  const toggleAnalyzing = () => {
    setIsAnalyzing(!isAnalyzing);
    if (!isAnalyzing) {
      setError(null);
      setPrediction({ predicted_label: 'Waiting...', confidence: 'N/A' });
      console.log('Starting analysis');
    } else {
      console.log('Stopping analysis');
    }
  };

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

      <p className="socket-status">Socket Status: {socketStatus}</p>
      <div className="video-container">
        <video ref={videoRef} autoPlay />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      <button onClick={toggleAnalyzing}>
        {isAnalyzing ? 'Stop Analyzing' : 'Start Analyzing'}
      </button>
      {isAnalyzing && !error && (
        <div className="prediction">
          <h2>Translation: {prediction.predicted_label}</h2>
          <p>Confidence: {prediction.confidence}</p>
        </div>
      )}
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
            <p>
              <a href="https://forms.gle/vdX9KEm1Z4HhUfkFA">Contribute hand sign data!</a>
            </p>
            <p><a href="mailto:info.signsync@gmail.com">Contact</a></p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
