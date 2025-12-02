# ConstructAI - Custom Model Training Guide

## Quick Start with Google Colab

### Step 1: Open Google Colab
1. Go to [Google Colab](https://colab.research.google.com/)
2. Click **File → New Notebook**
3. Click **Runtime → Change runtime type**
4. Select **T4 GPU** as Hardware accelerator
5. Click **Save**

### Step 2: Copy and Run the Training Code

Copy the entire training script from `train_model.py` in this directory and paste it into Colab cells (or upload the file directly).

### Step 3: Download the Trained Model

After training completes (2-4 hours), download these files:
- `construction_model_package.zip` - Contains all model files
- Extract and place in `server/models/` directory

### Step 4: Integrate with Backend

Follow the integration instructions in `INTEGRATION.md`

## What This Training Does

1. **Downloads** the Kaggle construction dataset
2. **Preprocesses** images (resize, normalize, augment)
3. **Trains** a MobileNetV2 model using transfer learning
4. **Fine-tunes** the model for better accuracy
5. **Converts** to TensorFlow.js format for Node.js
6. **Packages** everything for easy download

## Expected Results

- **Training Time**: 2-4 hours on GPU
- **Accuracy**: 85-95% (depends on dataset quality)
- **Model Size**: ~15MB (TensorFlow.js format)

## Troubleshooting

### "No GPU available"
- Make sure you selected T4 GPU in Runtime settings
- Free Colab has limited GPU hours - try again later if quota exceeded

### "Dataset download failed"
- Check your internet connection
- Kaggle dataset might be temporarily unavailable

### "Out of memory"
- Reduce `BATCH_SIZE` from 32 to 16 or 8
- This will make training slower but use less memory

## Additional Datasets (Optional)

If you want to improve accuracy, you can add more construction datasets:

1. [Construction Site Safety](https://www.kaggle.com/datasets/snehilsanyal/construction-site-safety-image-dataset-roboflow)
2. [Building Construction](https://www.kaggle.com/datasets/aryashah2k/building-construction-image-dataset)
3. [Construction Equipment](https://www.kaggle.com/datasets/dataclusterlabs/construction-equipment-image-dataset)

Simply download and merge with the existing dataset before training.

## Need Help?

If you encounter any issues, check:
1. Colab GPU is enabled
2. All code cells ran successfully
3. Files downloaded correctly
4. Model files placed in correct directory
