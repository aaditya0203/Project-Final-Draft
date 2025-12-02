# Model Integration Guide

## After Training is Complete

Once you've downloaded `construction_model_package.zip` from Google Colab, follow these steps to integrate the custom model into your ConstructAI backend.

## Step 1: Extract and Place Model Files

```bash
# Extract the zip file
unzip construction_model_package.zip

# Create models directory if it doesn't exist
mkdir -p server/models

# Move files to models directory
mv tfjs_model server/models/construction_detector
mv class_labels.json server/models/
```

Your directory structure should look like:
```
server/
├── models/
│   ├── construction_detector/
│   │   ├── model.json
│   │   ├── group1-shard1of1.bin
│   │   └── ...
│   └── class_labels.json
└── src/
    └── services/
        └── aiAnalysis.js
```

## Step 2: Update AI Analysis Service

Open `server/src/services/aiAnalysis.js` and replace the model loading section:

```javascript
// OLD CODE (remove this):
const cocoSsd = require('@tensorflow-models/coco-ssd');
let model = null;

async function loadModel() {
    if (!model) {
        console.log('Loading COCO-SSD model...');
        model = await cocoSsd.load();
        console.log('✅ Model loaded successfully');
    }
    return model;
}

// NEW CODE (add this):
const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');

let model = null;
let classLabels = null;

async function loadModel() {
    if (!model) {
        console.log('Loading custom construction detection model...');
        
        // Load the model
        const modelPath = path.join(__dirname, '../../models/construction_detector/model.json');
        model = await tf.loadLayersModel(`file://${modelPath}`);
        
        // Load class labels
        const labelsPath = path.join(__dirname, '../../models/class_labels.json');
        classLabels = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));
        
        console.log('✅ Custom model loaded successfully');
        console.log(`✅ Loaded ${Object.keys(classLabels).length} construction classes`);
    }
    return model;
}
```

## Step 3: Update Image Analysis Function

Update the `analyzeImage` function to use the custom model:

```javascript
async function analyzeImage(imagePath) {
    try {
        await loadModel();
        
        // Load and preprocess image
        const imageBuffer = fs.readFileSync(imagePath);
        const tfimage = tf.node.decodeImage(imageBuffer);
        
        // Resize to model input size (224x224)
        const resized = tf.image.resizeBilinear(tfimage, [224, 224]);
        const normalized = resized.div(255.0);
        const batched = normalized.expandDims(0);
        
        // Run prediction
        const predictions = await model.predict(batched);
        const predArray = await predictions.data();
        
        // Get top prediction
        const maxIndex = predArray.indexOf(Math.max(...predArray));
        const confidence = predArray[maxIndex];
        const predictedClass = classLabels[maxIndex];
        
        // Clean up tensors
        tfimage.dispose();
        resized.dispose();
        normalized.dispose();
        batched.dispose();
        predictions.dispose();
        
        // Map predictions to construction elements
        const structuralElements = mapToStructuralElements(predictedClass, confidence);
        const safetyIssues = detectSafetyIssues(predictedClass, confidence);
        
        return {
            progressPercentage: calculateProgress(predictedClass, confidence),
            confidenceScore: confidence,
            structuralElements,
            safetyIssues,
            weatherConditions: 'Clear',
            timeEstimateDays: estimateTimeRemaining(predictedClass, confidence),
            detectedClass: predictedClass
        };
    } catch (error) {
        console.error('Image analysis error:', error);
        throw error;
    }
}

// Helper functions
function mapToStructuralElements(className, confidence) {
    // Map model predictions to structural elements
    const elements = {
        columns: 0,
        beams: 0,
        walls: 0,
        foundation: 0
    };
    
    // Customize based on your model's classes
    if (className.includes('brick') || className.includes('wall')) {
        elements.walls = Math.floor(confidence * 10);
    }
    if (className.includes('column') || className.includes('pillar')) {
        elements.columns = Math.floor(confidence * 5);
    }
    
    return elements;
}

function detectSafetyIssues(className, confidence) {
    const issues = [];
    
    // Add safety checks based on detected class
    if (confidence < 0.7) {
        issues.push({
            severity: 'medium',
            description: 'Low confidence detection - manual verification recommended'
        });
    }
    
    return issues;
}

function calculateProgress(className, confidence) {
    // Calculate progress based on detected construction stage
    // Customize based on your model's classes
    if (className.includes('foundation')) return 20;
    if (className.includes('structural')) return 50;
    if (className.includes('finishing')) return 80;
    return 40; // default
}

function estimateTimeRemaining(className, confidence) {
    // Estimate days remaining based on current stage
    if (className.includes('foundation')) return 90;
    if (className.includes('structural')) return 60;
    if (className.includes('finishing')) return 30;
    return 45; // default
}
```

## Step 4: Install TensorFlow.js Node

```bash
cd server
npm install @tensorflow/tfjs-node
```

## Step 5: Test the Integration

1. Start the server:
```bash
npm start
```

2. Upload a construction image through the frontend

3. Check the console for:
```
Loading custom construction detection model...
✅ Custom model loaded successfully
✅ Loaded X construction classes
```

4. Verify the analysis results in the Dashboard

## Step 6: Fine-Tune Helper Functions

Based on your model's actual class labels (in `class_labels.json`), customize:
- `mapToStructuralElements()` - Map classes to structural elements
- `detectSafetyIssues()` - Add safety checks
- `calculateProgress()` - Calculate progress percentage
- `estimateTimeRemaining()` - Estimate completion time

## Troubleshooting

### "Cannot find module '@tensorflow/tfjs-node'"
```bash
npm install @tensorflow/tfjs-node
```

### "Model file not found"
- Check that `tfjs_model` folder is in `server/models/construction_detector/`
- Verify `model.json` exists in that folder

### "Low accuracy predictions"
- The model needs more training data
- Consider adding more construction datasets
- Increase training epochs in Colab

### "Out of memory errors"
- TensorFlow.js Node uses system memory
- Reduce image size before analysis
- Process images one at a time

## Performance Optimization

For better performance:
1. Cache the model in memory (already done)
2. Batch process multiple images if needed
3. Use GPU version: `npm install @tensorflow/tfjs-node-gpu` (requires CUDA)

## Next Steps

1. Test with various construction images
2. Monitor accuracy and adjust helper functions
3. Consider retraining with more data if accuracy is low
4. Add more sophisticated progress calculation logic
