import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

// Initialize the WebSocket connection to the backend
const socket = io('http://localhost:5000', {
  withCredentials: false,
});

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState({ predicted_label: '', confidence: 0 });
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('Disconnected');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    console.log('Attempting to connect to socket...');

    // Socket connection event listeners
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

    // Request webcam access
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

    // Handle prediction results from the server
    socket.on('prediction_result', (data) => {
      console.log('Received prediction:', data);
      setPrediction(data);
      setError(null);
    });

    // Handle error from the server
    socket.on('error', (errorMessage) => {
      console.error('Received error from server:', errorMessage);
      setError(errorMessage.message);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('prediction_result');
      socket.off('error');
    };
  }, []);

  const toggleAnalyzing = () => {
    setIsAnalyzing(!isAnalyzing);
    if (!isAnalyzing) {
      setError(null);
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
          console.log('Sending frame to server');
          socket.emit('analyze_frame', imageData);
        }
      }, 1000); // 1-second interval for frame analysis
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAnalyzing]);

  return (
    <div className="App">
      <h1>SIGNSYNC</h1>
      <p>Socket Status: {socketStatus}</p>
      <div className="video-container">
        <video ref={videoRef} autoPlay />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      <button onClick={toggleAnalyzing}>
        {isAnalyzing ? 'Stop Analyzing' : 'Start Analyzing'}
      </button>
      {isAnalyzing && !error && (
        <div className="prediction">
          <h2>Predicted Letter: {prediction.predicted_label || 'Waiting...'}</h2>
          <p>Confidence: {prediction.confidence ? `${(prediction.confidence * 100).toFixed(2)}%` : 'N/A'}</p>
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

export default App;
