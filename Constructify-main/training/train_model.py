"""
ConstructAI - Custom Construction Detection Model Training
Transfer Learning with MobileNetV2

INSTRUCTIONS:
1. Open Google Colab: https://colab.research.google.com/
2. Enable GPU: Runtime → Change runtime type → T4 GPU
3. Copy this entire file into a new Colab notebook
4. Run all cells sequentially
5. Download the generated model files

Training Time: 2-4 hours on GPU
"""

# ============================================================================
# STEP 1: Install Dependencies
# ============================================================================

!pip install -q kagglehub tensorflow pillow matplotlib scikit-learn tensorflowjs

# ============================================================================
# STEP 2: Import Libraries
# ============================================================================

import kagglehub
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
import matplotlib.pyplot as plt
import os
from pathlib import Path
from sklearn.model_selection import train_test_split
import shutil
import glob
import json

print(f"TensorFlow version: {tf.__version__}")
print(f"GPU Available: {tf.config.list_physical_devices('GPU')}")

# ============================================================================
# STEP 3: Download Kaggle Dataset
# ============================================================================

print("Downloading construction dataset from Kaggle...")
dataset_path = kagglehub.dataset_download("mumeryasin/bricks-under-construction-or-old-building-houses")
print(f"Dataset downloaded to: {dataset_path}")

# Find all images
image_files = glob.glob(f"{dataset_path}/**/*.jpg", recursive=True) + \
              glob.glob(f"{dataset_path}/**/*.jpeg", recursive=True) + \
              glob.glob(f"{dataset_path}/**/*.png", recursive=True)

print(f"Total images found: {len(image_files)}")

# ============================================================================
# STEP 4: Organize Dataset
# ============================================================================

base_dir = '/content/construction_data'
train_dir = os.path.join(base_dir, 'train', 'construction')
val_dir = os.path.join(base_dir, 'val', 'construction')

os.makedirs(train_dir, exist_ok=True)
os.makedirs(val_dir, exist_ok=True)

# Split 80/20
train_files, val_files = train_test_split(image_files, test_size=0.2, random_state=42)

print(f"Training images: {len(train_files)}")
print(f"Validation images: {len(val_files)}")

# Copy files
for i, img_path in enumerate(train_files):
    shutil.copy(img_path, os.path.join(train_dir, f"train_{i}.jpg"))

for i, img_path in enumerate(val_files):
    shutil.copy(img_path, os.path.join(val_dir, f"val_{i}.jpg"))

print("Dataset organized!")

# ============================================================================
# STEP 5: Data Preprocessing
# ============================================================================

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 20

train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1./255)

train_generator = train_datagen.flow_from_directory(
    os.path.join(base_dir, 'train'),
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

val_generator = val_datagen.flow_from_directory(
    os.path.join(base_dir, 'val'),
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical'
)

num_classes = len(train_generator.class_indices)
print(f"Number of classes: {num_classes}")
print(f"Class labels: {train_generator.class_indices}")

# ============================================================================
# STEP 6: Build Model
# ============================================================================

base_model = MobileNetV2(
    input_shape=(*IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)

base_model.trainable = False

model = keras.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.3),
    layers.Dense(256, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(num_classes, activation='softmax')
])

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# ============================================================================
# STEP 7: Train Model
# ============================================================================

callbacks = [
    keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True
    ),
    keras.callbacks.ModelCheckpoint(
        'construction_detector_best.h5',
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=3,
        min_lr=1e-7,
        verbose=1
    )
]

print("Starting training...")
history = model.fit(
    train_generator,
    epochs=EPOCHS,
    validation_data=val_generator,
    callbacks=callbacks,
    verbose=1
)

print("Training complete!")

# ============================================================================
# STEP 8: Fine-Tuning
# ============================================================================

base_model.trainable = True

for layer in base_model.layers[:-20]:
    layer.trainable = False

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-5),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("Fine-tuning...")
history_fine = model.fit(
    train_generator,
    epochs=10,
    validation_data=val_generator,
    callbacks=callbacks,
    verbose=1
)

print("Fine-tuning complete!")

# ============================================================================
# STEP 9: Evaluate Model
# ============================================================================

val_loss, val_accuracy = model.evaluate(val_generator)
print(f"\nFinal Validation Accuracy: {val_accuracy:.4f}")

# Plot training history
acc = history.history['accuracy'] + history_fine.history['accuracy']
val_acc = history.history['val_accuracy'] + history_fine.history['val_accuracy']

plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 1)
plt.plot(acc, label='Training Accuracy')
plt.plot(val_acc, label='Validation Accuracy')
plt.legend()
plt.title('Model Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')

loss = history.history['loss'] + history_fine.history['loss']
val_loss_hist = history.history['val_loss'] + history_fine.history['val_loss']

plt.subplot(1, 2, 2)
plt.plot(loss, label='Training Loss')
plt.plot(val_loss_hist, label='Validation Loss')
plt.legend()
plt.title('Model Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.tight_layout()
plt.show()

# ============================================================================
# STEP 10: Save Model
# ============================================================================

# Save H5 format
model.save('construction_detector_final.h5')
print("✅ Saved as .h5 file")

# Save class labels
class_labels = {v: k for k, v in train_generator.class_indices.items()}
with open('class_labels.json', 'w') as f:
    json.dump(class_labels, f)
print("✅ Saved class labels")

# Convert to TensorFlow.js
!tensorflowjs_converter \
    --input_format=keras \
    construction_detector_final.h5 \
    tfjs_model

print("✅ Model converted to TensorFlow.js format!")

# ============================================================================
# STEP 11: Package Files
# ============================================================================

!zip -r construction_model_package.zip \
    construction_detector_final.h5 \
    tfjs_model \
    class_labels.json

print("\n" + "="*60)
print("✅ TRAINING COMPLETE!")
print("="*60)
print(f"\nFinal Accuracy: {val_accuracy:.2%}")
print("\n📥 Download 'construction_model_package.zip' from Files panel")
print("\nNext Steps:")
print("1. Download the zip file")
print("2. Extract it")
print("3. Place contents in server/models/ directory")
print("4. Follow integration instructions in INTEGRATION.md")
print("="*60)
