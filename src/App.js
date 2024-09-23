import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000', { withCredentials: false });

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState({ label: '', confidence: 0 });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("Error accessing the webcam", err));

    socket.on('prediction_result', (data) => {
      setPrediction(data);
    });

    return () => {
      socket.off('prediction_result');
    };
  }, []);

  const toggleAnalyzing = () => {
    setIsAnalyzing(!isAnalyzing);
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
          socket.emit('analyze_frame', imageData);
        }
      }, 100); // Adjust interval as needed
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAnalyzing]);

  return (
    <div className="App">
      <h1>SIGNSYNC</h1>
      <div className="video-container">
        <video ref={videoRef} autoPlay />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      <button onClick={toggleAnalyzing}>
        {isAnalyzing ? 'Stop Analyzing' : 'Start Analyzing'}
      </button>
      {isAnalyzing && (
        <div className="prediction">
          <h2>Predicted Letter: {prediction.predicted_label}</h2>
          <p>Confidence: {(prediction.confidence * 100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
}

export default App;