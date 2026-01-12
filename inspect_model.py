import tensorflow as tf
import sys
import os

model_path = '/home/aaditya/Desktop/Aadi Project/Constructify-main/construction_detector_final.h5'

if not os.path.exists(model_path):
    print(f"Error: File not found at {model_path}")
    sys.exit(1)

try:
    model = tf.keras.models.load_model(model_path)
    print("Model loaded successfully")
    print(f"Output Shape: {model.output_shape}")
    model.summary()
except Exception as e:
    print(f"Error loading model: {e}")
