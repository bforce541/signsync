import os
from datetime import datetime, timezone

from flask import Flask, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit

from asl_service import get_model_summary, predict_from_data_url

FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173,http://127.0.0.1:5173,https://signsyncai.org",
    ).split(",")
    if origin.strip()
]

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
CORS(app, resources={r"/api/*": {"origins": FRONTEND_ORIGINS}, r"/health": {"origins": FRONTEND_ORIGINS}})
socketio = SocketIO(
    app,
    async_mode=os.getenv("SOCKETIO_ASYNC_MODE"),
    cors_allowed_origins=FRONTEND_ORIGINS,
    transports=["websocket", "polling"],
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def prediction_payload(image_data: str) -> dict[str, object]:
    prediction = predict_from_data_url(image_data)
    return {
        "predicted_label": prediction.label,
        "confidence": prediction.confidence,
        "top_predictions": prediction.top_predictions,
        "timestamp": now_iso(),
    }


@app.get("/")
def index() -> tuple[dict[str, object], int]:
    return {
        "name": "SignSync API",
        "status": "ok",
        "endpoints": ["/health", "/api/health", "/api/model-info", "/api/predict"],
    }, 200


@app.get("/health")
@app.get("/api/health")
def health_check() -> tuple[dict[str, object], int]:
    try:
        model_info_payload = get_model_summary()
        model_loaded = True
        class_count = model_info_payload["class_count"]
    except Exception:
        model_loaded = False
        class_count = 0

    return {
        "status": "ok",
        "timestamp": now_iso(),
        "model_loaded": model_loaded,
        "class_count": class_count,
        "frontend_origins": FRONTEND_ORIGINS,
    }, 200


@app.get("/api/model-info")
def model_info() -> tuple[dict[str, object], int]:
    return get_model_summary(), 200


@app.post("/api/predict")
def predict() -> tuple[dict[str, object], int]:
    payload = request.get_json(silent=True) or {}
    image_data = payload.get("image")
    if not image_data:
        return {"error": "Missing 'image' field in request body."}, 400

    try:
        return prediction_payload(image_data), 200
    except Exception as exc:
        return {"error": str(exc)}, 500


@socketio.on("connect")
def handle_connect() -> None:
    emit("connection_status", {"status": "connected", "timestamp": now_iso()})


@socketio.on("analyze_frame")
def handle_frame(frame_data: dict[str, object]) -> None:
    image_data = frame_data.get("image") if isinstance(frame_data, dict) else None
    if not image_data:
        emit("prediction_error", {"error": "Missing image payload."})
        return

    try:
        emit("prediction_result", prediction_payload(str(image_data)))
    except Exception as exc:
        emit("prediction_error", {"error": str(exc)})


@socketio.on("disconnect")
def handle_disconnect() -> None:
    return None


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    socketio.run(app, debug=False, host="0.0.0.0", port=port, allow_unsafe_werkzeug=True)
