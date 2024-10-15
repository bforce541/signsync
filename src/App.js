import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';
import About from './About';

// Initialize the WebSocket connection to the backend (simulate "server down")
const socket = io('https://agile-shelf-19406.herokuapp.com', {
  withCredentials: false,
});

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
        <h1>SignSync AI</h1>
        <p>SignSync AI offers real-time sign language translation powered by advanced AI technology. Explore our features and learn more about sign language translation.</p>
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
      console.log('Attempting to connect to socket...');

      socket.on('connect', () => {
        console.log('Socket connected');
        setSocketStatus('Connected');
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setSocketStatus('Disconnected');
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setSocketStatus('Error: ' + err.message);
      });

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

      socket.on('prediction_result', (data) => {
        console.log('Received prediction:', data);
        setPrediction(data);
        setError(null);
      });

      socket.on('error', (errorMessage) => {
        console.error('Received error from server:', errorMessage);
        setError(errorMessage.message);
      });

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('prediction_result');
        socket.off('error');
      };
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

  useEffect(() => {
    let intervalId;
    if (isAnalyzing) {
      intervalId = setInterval(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (canvas && video) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg');
          console.log('Sending frame to server (but server is down)');
          socket.emit('analyze_frame', imageData);  // Simulate sending to backend
        }
      }, 1000); // 1-second interval for frame analysis
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAnalyzing]);

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
