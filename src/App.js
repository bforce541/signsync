import React, { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom";
import Webcam from "react-webcam";
import { io } from "socket.io-client";

import About from "./About";

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const DEFAULT_PREDICTION = {
  predicted_label: "Waiting",
  confidence: 0,
  top_predictions: [],
  timestamp: null,
};
const OVERVIEW_POINTS = [
  "Live webcam capture routed to the backend classifier.",
  "Confidence-aware transcript editing with simple controls.",
  "Real model inference over REST and Socket.IO.",
];

function statusClasses(status) {
  if (status === "Connected") {
    return "border-signal/20 bg-green-50 text-signal";
  }
  if (status === "Analyzing") {
    return "border-aurora/20 bg-blue-50 text-aurora";
  }
  return "border-ember/20 bg-orange-50 text-ember";
}

function StatusChip({ label, value }) {
  return (
    <div className="rounded-full border border-black/5 bg-[#fbfaf7] px-3 py-2 text-xs font-medium tracking-[0.16em] text-slate">
      <span className="mr-2 text-ink">{label}</span>
      {value}
    </div>
  );
}

function Home() {
  const webcamRef = useRef(null);
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const requestTimeoutRef = useRef(null);
  const pendingRequestRef = useRef(false);
  const predictionHistoryRef = useRef([]);
  const lastCommittedRef = useRef({ label: "", at: 0 });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState(DEFAULT_PREDICTION);
  const [transcript, setTranscript] = useState("");
  const [socketStatus, setSocketStatus] = useState("Connecting");
  const [healthStatus, setHealthStatus] = useState("Checking backend");
  const [error, setError] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy transcript");

  const resetAutoCommitState = useCallback(() => {
    predictionHistoryRef.current = [];
    lastCommittedRef.current = { label: "", at: 0 };
  }, []);

  const commitLetter = useCallback((letter) => {
    if (!letter || letter === "Waiting") {
      return;
    }

    setTranscript((current) => `${current}${letter}`);
  }, []);

  const maybeCommitPrediction = useCallback((nextPrediction) => {
    const confidence = Number(nextPrediction?.confidence || 0);
    const label = nextPrediction?.predicted_label;

    if (!label || confidence < 0.7) {
      predictionHistoryRef.current = [];
      return;
    }

    const history = [...predictionHistoryRef.current, label].slice(-4);
    predictionHistoryRef.current = history;

    if (history.length < 3 || !history.every((entry) => entry === label)) {
      return;
    }

    const now = Date.now();
    const recentlyCommittedSameLabel =
      lastCommittedRef.current.label === label && now - lastCommittedRef.current.at < 1600;

    if (recentlyCommittedSameLabel) {
      return;
    }

    commitLetter(label);
    lastCommittedRef.current = { label, at: now };
    predictionHistoryRef.current = [];
  }, [commitLetter]);

  const applyPrediction = useCallback((nextPrediction) => {
    setPrediction(nextPrediction);
    setError("");
    setSocketStatus(socketRef.current?.connected ? "Connected" : "Disconnected");
    maybeCommitPrediction(nextPrediction);
  }, [maybeCommitPrediction]);

  const requestPredictionOverHttp = useCallback(async (image) => {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image }),
    });

    if (!response.ok) {
      throw new Error("Prediction request failed.");
    }

    return response.json();
  }, []);

  const analyzeFrame = useCallback(async () => {
    if (!webcamRef.current || pendingRequestRef.current) {
      return;
    }

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      return;
    }

    pendingRequestRef.current = true;

    if (socketRef.current?.connected) {
      setSocketStatus("Analyzing");
      requestTimeoutRef.current = window.setTimeout(() => {
        pendingRequestRef.current = false;
        setSocketStatus(socketRef.current?.connected ? "Connected" : "Disconnected");
      }, 1500);
      socketRef.current.emit("analyze_frame", { image: screenshot });
      return;
    }

    try {
      const payload = await requestPredictionOverHttp(screenshot);
      applyPrediction(payload);
    } catch (predictionError) {
      setError(predictionError.message);
    } finally {
      pendingRequestRef.current = false;
    }
  }, [applyPrediction, requestPredictionOverHttp]);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (!response.ok) {
          throw new Error("Backend health check failed.");
        }
        if (!cancelled) {
          setHealthStatus("Backend ready");
        }
      } catch (fetchError) {
        if (!cancelled) {
          setHealthStatus("Backend unavailable");
          setError("The backend is not reachable. Start the Flask service to enable translation.");
        }
      }
    }

    loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    if (!socket || typeof socket.on !== "function") {
      setSocketStatus("Disconnected");
      return undefined;
    }

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("Connected");
      setError("");
    });

    socket.on("disconnect", () => {
      setSocketStatus("Disconnected");
    });

    socket.on("connection_status", () => {
      setSocketStatus("Connected");
    });

    socket.on("prediction_result", (payload) => {
      pendingRequestRef.current = false;
      if (requestTimeoutRef.current) {
        window.clearTimeout(requestTimeoutRef.current);
      }
      applyPrediction(payload);
    });

    socket.on("prediction_error", (payload) => {
      pendingRequestRef.current = false;
      if (requestTimeoutRef.current) {
        window.clearTimeout(requestTimeoutRef.current);
      }
      setError(payload?.error || "Prediction failed.");
    });

    socket.on("connect_error", () => {
      setSocketStatus("Disconnected");
    });

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      if (requestTimeoutRef.current) {
        window.clearTimeout(requestTimeoutRef.current);
      }
      if (typeof socket.disconnect === "function") {
        socket.disconnect();
      }
    };
  }, [applyPrediction]);

  useEffect(() => {
    if (!isAnalyzing) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      pendingRequestRef.current = false;
      return undefined;
    }

    intervalRef.current = window.setInterval(() => {
      analyzeFrame();
    }, 500);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [analyzeFrame, isAnalyzing]);

  function toggleAnalyzing() {
    setError("");
    if (!isAnalyzing) {
      setPrediction(DEFAULT_PREDICTION);
      resetAutoCommitState();
    }
    setIsAnalyzing((current) => !current);
  }

  async function copyTranscript() {
    if (!transcript.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(transcript);
      setCopyLabel("Copied");
      window.setTimeout(() => {
        setCopyLabel("Copy transcript");
      }, 1400);
    } catch (copyError) {
      setCopyLabel("Copy failed");
    }
  }

  function appendSpace() {
    setTranscript((current) => (current.endsWith(" ") || current.length === 0 ? current : `${current} `));
  }

  function backspace() {
    setTranscript((current) => current.slice(0, -1));
  }

  function clearTranscript() {
    setTranscript("");
    resetAutoCommitState();
  }

  const confidencePercent = `${Math.round(Number(prediction.confidence || 0) * 100)}%`;
  const lastUpdated = prediction.timestamp ? new Date(prediction.timestamp).toLocaleTimeString() : "Waiting for signal";

  return (
    <main className="pb-16">
      <section className="section-shell pt-6 sm:pt-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="soft-label">AI-Powered ASL Translator</p>
              <h1 className="max-w-2xl font-serif text-4xl leading-tight text-ink sm:text-5xl">
                Real-time ASL translation without the extra visual noise.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate sm:text-lg">
                SignSync captures live gestures, sends frames to the model, and turns confident predictions into an editable transcript.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <StatusChip label="API" value={healthStatus} />
              <StatusChip label="Socket" value={socketStatus} />
              <StatusChip label="Model" value="26 classes" />
            </div>

            <div className="panel-shell px-6 py-6">
              <p className="soft-label">How it works</p>
              <div className="mt-4 space-y-3">
                {OVERVIEW_POINTS.map((point) => (
                  <p key={point} className="border-l-2 border-slate-200 pl-4 text-sm leading-6 text-slate">
                    {point}
                  </p>
                ))}
              </div>

              <div className="mt-6 rounded-[18px] bg-[#fbfaf7] p-5">
                <p className="soft-label">Current prediction</p>
                <div className="mt-2 flex items-end gap-3">
                  <span className="font-serif text-5xl text-ink">{prediction.predicted_label}</span>
                  <span className="pb-2 text-sm text-slate">{confidencePercent} confidence</span>
                </div>
                <p className="mt-2 text-sm text-slate">Updated {lastUpdated}</p>
              </div>
            </div>
          </div>

          <div className="panel-shell overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <div>
                <p className="soft-label">Translator</p>
                <p className="mt-1 text-sm text-slate">Keep your hand inside the guide box for the cleanest frame.</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClasses(isAnalyzing ? "Analyzing" : socketStatus)}`}>
                {isAnalyzing ? "Analyzing" : socketStatus}
              </span>
            </div>

            <div className="relative aspect-square bg-[#1f2933]">
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored
                screenshotFormat="image/jpeg"
                screenshotQuality={0.9}
                videoConstraints={{ facingMode: "user", width: 720, height: 720 }}
                onUserMedia={() => setError("")}
                onUserMediaError={() => setError("Camera access is required for live translation.")}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 p-6">
                <div className="h-full rounded-[28px] border border-dashed border-white/50">
                  <div className="mx-auto mt-[20%] flex h-[42%] w-[42%] items-center justify-center rounded-[24px] border border-white/70 bg-black/10">
                    <span className="px-5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white">
                      Signing area
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-black/5 px-5 py-5">
              <button
                type="button"
                onClick={toggleAnalyzing}
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {isAnalyzing ? "Pause capture" : "Start capture"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="translator" className="section-shell mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel-shell px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="soft-label">Transcript</p>
              <h2 className="mt-2 font-serif text-3xl text-ink">Build text from stable predictions</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate">
              Repeated high-confidence predictions are added automatically, and the controls stay available for quick cleanup.
            </p>
          </div>

          <div className="mt-6 rounded-[22px] border border-black/5 bg-[#fbfaf7] p-5">
            <p className="min-h-[150px] whitespace-pre-wrap text-2xl leading-relaxed text-ink sm:text-3xl">
              {transcript || "Translated text will appear here as gestures are recognized."}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => commitLetter(prediction.predicted_label)}
              className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
            >
              Add current letter
            </button>
            <button
              type="button"
              onClick={appendSpace}
              className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
            >
              Add space
            </button>
            <button
              type="button"
              onClick={backspace}
              className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
            >
              Backspace
            </button>
            <button
              type="button"
              onClick={clearTranscript}
              className="rounded-full border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-ember transition hover:bg-orange-100"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={copyTranscript}
              className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {copyLabel}
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm leading-6 text-ember">
              {error}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="panel-shell px-6 py-7 sm:px-8">
            <p className="soft-label">Top predictions</p>
            <div className="mt-5 space-y-3">
              {(prediction.top_predictions.length ? prediction.top_predictions : [{ label: "Waiting", confidence: 0 }]).map((item) => (
                <div key={item.label} className="rounded-[18px] border border-black/5 bg-[#fbfaf7] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-3xl text-ink">{item.label}</span>
                    <span className="text-sm font-semibold text-slate">{Math.round(item.confidence * 100)}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(8, item.confidence * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-shell px-6 py-7 sm:px-8">
            <p className="soft-label">Session notes</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate">
              <p>The camera feed stays front and center so the translator feels like a tool, not a landing page.</p>
              <p>Status, prediction, and transcript are separated into calmer blocks with fewer competing accents.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AppShell() {
  return (
    <div className="min-h-screen">
      <header className="section-shell pt-5 sm:pt-7">
        <div className="flex flex-col gap-4 border-b border-black/10 px-1 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="font-serif text-3xl tracking-[0.06em] text-ink">
            SIGNSYNC
          </Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate">
            <Link to="/" className="transition hover:text-ink">
              Translator
            </Link>
            <Link to="/about" className="transition hover:text-ink">
              About
            </Link>
            <a href="https://forms.gle/vdX9KEm1Z4HhUfkFA" className="transition hover:text-ink">
              Contribute Data
            </a>
            <a href="mailto:info.signsync@gmail.com" className="transition hover:text-ink">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>

      <footer className="section-shell pb-8 pt-8 sm:pb-10">
        <div className="flex flex-col gap-4 border-t border-black/10 pt-6 text-sm text-slate sm:flex-row sm:items-center sm:justify-between">
          <p>SignSync bridges ASL and text with React, Tailwind, Flask, and TensorFlow.</p>
          <p>Built for real-time translation and ready for deeper model iteration.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
