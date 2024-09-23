from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import numpy as np
import tensorflow as tf
from PIL import Image
import io
import base64

app = Flask(__name__)

# Ensure CORS allows requests from your frontend (localhost:3000)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Allow socket.io connections from frontend (localhost:3000)
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

# Load the model
model = tf.keras.models.load_model('model/asl_model.h5')
print("Model loaded successfully")

# Define the class labels
class_labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

def process_image(image_data):
    # Decode the base64 image
    image_bytes = base64.b64decode(image_data.split(',')[1])
    image = Image.open(io.BytesIO(image_bytes))
    image = image.resize((224, 224))
    image_array = np.array(image) / 255.0
    image_array = np.expand_dims(image_array, axis=0)

    predictions = model.predict(image_array)
    predicted_class = np.argmax(predictions[0])
    predicted_label = class_labels[predicted_class]
    confidence = float(predictions[0][predicted_class])

    return predicted_label, confidence

@socketio.on('analyze_frame')
def handle_frame(frame_data):
    predicted_label, confidence = process_image(frame_data)
    emit('prediction_result', {
        'predicted_label': predicted_label,
        'confidence': confidence
    })

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, debug=True)
