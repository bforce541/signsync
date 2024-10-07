from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import numpy as np
import tensorflow as tf
from PIL import Image
import io
import base64

app = Flask(__name__)

# Allow CORS for your S3 frontend
CORS(app, resources={r"/*": {"origins": "https://ssfrontend-dd34f5fd2abc.herokuapp.com"}})

# Initialize SocketIO with CORS allowed for the S3 frontend origin and WebSocket transports
socketio = SocketIO(app, cors_allowed_origins="https://ssfrontend-dd34f5fd2abc.herokuapp.com", transports=['websocket', 'polling'])

# Load the TensorFlow ASL model
model = tf.keras.models.load_model('./model/asl_model.h5')
print("Model loaded successfully")

# Class labels for ASL prediction
class_labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

# Function to process and predict from the received image data
def process_image(image_data):
    try:
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        image = image.resize((224, 224))  # Resize to match model input
        image_array = np.array(image) / 255.0  # Normalize image data
        image_array = np.expand_dims(image_array, axis=0)  # Add batch dimension

        # Make prediction using the model
        predictions = model.predict(image_array)
        predicted_class = np.argmax(predictions[0])
        predicted_label = class_labels[predicted_class]
        confidence = float(predictions[0][predicted_class])

        return predicted_label, confidence
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return None, None

# WebSocket event for analyzing frames
@socketio.on('analyze_frame')
def handle_frame(frame_data):
    try:
        predicted_label, confidence = process_image(frame_data)
        if predicted_label and confidence:
            print(f"Emitting prediction: {predicted_label}, {confidence}")
            emit('prediction_result', {
                'predicted_label': predicted_label,
                'confidence': confidence
            })
        else:
            emit('error', {'message': 'Failed to process image'})
    except Exception as e:
        print(f"Error handling frame: {str(e)}")
        emit('error', {'message': 'Error processing frame'})

# WebSocket event for client connection
@socketio.on('connect')
def handle_connect():
    print('Client connected')

# WebSocket event for client disconnection
@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, debug=False, host='0.0.0.0', port=8080)

@app.route('/health')
def health_check():
    return 'OK', 200