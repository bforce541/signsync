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
const QUICK_STATS = [
  { label: "Interface", value: "React + Tailwind" },
  { label: "Backend", value: "Flask + TensorFlow" },
  { label: "Transport", value: "REST + Socket.IO" },
];
const FEATURE_CARDS = [
  {
    title: "Real-Time Translation",
    copy: "Capture live webcam frames, route them to the model, and surface the best ASL letter prediction with confidence in under a second.",
  },
  {
    title: "Confidence-Aware Transcript",
    copy: "Build words from stable predictions, then refine them with one-tap controls for space, backspace, and copy.",
  },
  {
    title: "Transfer-Learning Backbone",
    copy: "The inference service ships with a working classifier and a training pipeline for ResNet50, VGG16, InceptionV3, and MobileNetV2.",
  },
];

function statusClasses(status) {
  if (status === "Connected") {
    return "border-signal/40 bg-signal/10 text-signal";
  }
  if (status === "Analyzing") {
    return "border-aurora/40 bg-aurora/10 text-aurora";
  }
  return "border-ember/40 bg-ember/10 text-amber-100";
}

function StatusChip({ label, value }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-[0.18em] text-slate-200">
      <span className="mr-2 text-white">{label}</span>
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
    <main className="pb-20">
      <section className="section-shell pt-6 sm:pt-10">
        <div className="panel-shell signal-grid relative overflow-hidden px-6 py-8 sm:px-8 lg:px-10">
          <div className="absolute -left-12 top-10 h-32 w-32 rounded-full bg-aurora/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-signal/15 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div className="animate-reveal space-y-6">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-signal">
                AI-Powered American Sign Language Translator
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl font-serif text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
                  Translate ASL in real time with a faster interface and a real model behind it.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                  SignSync captures live hand gestures, runs TensorFlow inference through Flask, and turns confident predictions
                  into a running transcript you can refine in place.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <StatusChip label="API" value={healthStatus} />
                <StatusChip label="Socket" value={socketStatus} />
                <StatusChip label="Model" value="26 ASL classes" />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {QUICK_STATS.map((stat, index) => (
                  <div
                    key={stat.label}
                    className="rounded-[22px] border border-white/10 bg-slate/60 px-4 py-5 shadow-halo"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-aurora">{stat.label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-drift">
              <div className="rounded-[32px] border border-white/10 bg-slate/70 p-4 shadow-halo sm:p-5">
                <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#030c16]">
                  <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusClasses(isAnalyzing ? "Analyzing" : socketStatus)}`}>
                      {isAnalyzing ? "Analyzing" : socketStatus}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-300">Live camera</span>
                  </div>

                  <div className="relative aspect-square bg-black">
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
                      <div className="h-full rounded-[32px] border border-dashed border-white/40">
                        <div className="mx-auto mt-[18%] flex h-[46%] w-[46%] items-center justify-center rounded-[28px] border border-signal/70 bg-signal/5">
                          <span className="px-6 text-center text-xs font-semibold uppercase tracking-[0.24em] text-signal">
                            Keep your signing hand inside the guide box
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Live Prediction</p>
                      <div className="mt-2 flex items-end gap-3">
                        <span className="font-serif text-5xl text-white">{prediction.predicted_label}</span>
                        <span className="pb-2 text-sm text-slate-300">{confidencePercent} confidence</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">Updated {lastUpdated}</p>
                    </div>

                    <button
                      type="button"
                      onClick={toggleAnalyzing}
                      className="rounded-full bg-gradient-to-r from-signal to-aurora px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ink transition hover:scale-[1.02]"
                    >
                      {isAnalyzing ? "Pause capture" : "Start capture"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="translator" className="section-shell mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel-shell px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Transcript</p>
              <h2 className="mt-2 font-serif text-3xl text-white">Build words from stable predictions</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-300">
              SignSync auto-commits repeated high-confidence predictions and still leaves manual controls for cleanup.
            </p>
          </div>

          <div className="mt-6 rounded-[26px] border border-white/10 bg-[#091422] p-5">
            <p className="min-h-[150px] whitespace-pre-wrap text-2xl leading-relaxed text-white sm:text-3xl">
              {transcript || "Your translated text will appear here as confident gestures are recognized."}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => commitLetter(prediction.predicted_label)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Add current letter
            </button>
            <button
              type="button"
              onClick={appendSpace}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Add space
            </button>
            <button
              type="button"
              onClick={backspace}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Backspace
            </button>
            <button
              type="button"
              onClick={clearTranscript}
              className="rounded-full border border-ember/30 bg-ember/10 px-4 py-3 text-sm font-semibold text-amber-100 transition hover:bg-ember/20"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={copyTranscript}
              className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-slate-100"
            >
              {copyLabel}
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-ember/30 bg-ember/10 px-4 py-4 text-sm leading-6 text-amber-100">
              {error}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="panel-shell px-6 py-7 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-signal">Top Predictions</p>
            <div className="mt-5 space-y-3">
              {(prediction.top_predictions.length ? prediction.top_predictions : [{ label: "Waiting", confidence: 0 }]).map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-3xl text-white">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-300">{Math.round(item.confidence * 100)}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-signal to-aurora" style={{ width: `${Math.max(8, item.confidence * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-shell px-6 py-7 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-aurora">What changed</p>
            <div className="mt-5 grid gap-4">
              {FEATURE_CARDS.map((card) => (
                <div key={card.title} className="rounded-[24px] border border-white/10 bg-slate/60 p-5">
                  <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{card.copy}</p>
                </div>
              ))}
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
        <div className="panel-shell flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link to="/" className="font-serif text-3xl tracking-[0.08em] text-white">
            SIGNSYNC
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-200">
            <Link to="/" className="transition hover:text-white">
              Translator
            </Link>
            <Link to="/about" className="transition hover:text-white">
              About
            </Link>
            <a href="https://forms.gle/vdX9KEm1Z4HhUfkFA" className="transition hover:text-white">
              Contribute Data
            </a>
            <a href="mailto:info.signsync@gmail.com" className="transition hover:text-white">
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
        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
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
