import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

// Polyfill for fetch if needed by mobilenet (it might be needed)
// Polyfill for fetch if needed by mobilenet (it might be needed)
// import { fetch } from 'undici'; 
// Note: Node 18+ has global fetch, so we might be fine.

class ImageAnalysisService {
    constructor() {
        this.baseModel = null;
        this.classifier = null;
        this.labels = [];
        this.isLoaded = false;

        // Define paths
        this.modelDir = '/home/aaditya/Desktop/Aadi Project/Constructify-main/server/model/tfjs_model';
        this.modelPath = `file://${this.modelDir}/my-construction-model.json`;
        this.labelsPath = `${this.modelDir}/model_labels.json`;
    }

    async loadModel() {
        if (this.isLoaded) return;

        try {
            console.log('🔄 Initializing AI Engine (Lightweight Mode)...');

            // 1. Load MobileNet (Feature Extractor) - OFFLINE MODE
            console.log('Loading Base Model (MobileNetV2) from local source...');
            // We use our custom loader for the GraphModel (MobileNet)
            this.baseModel = await this.loadLocalGraphModel(
                path.join(this.modelDir, '../mobilenet'),
                'model.json'
            );

            // 2. Load Custom Classifier
            console.log(`Loading Custom Model from ${this.modelDir}...`);
            this.classifier = await this.loadLocalModel(this.modelDir, 'my-construction-model.json');

            // 3. Load Labels
            console.log('Loading Class Labels...');
            const labelsData = await fs.readFile(this.labelsPath, 'utf-8');
            this.labels = JSON.parse(labelsData);

            this.isLoaded = true;
            console.log('✅ AI System Ready & Loaded (Offline Mode)');
            console.log('Classes:', this.labels);

        } catch (error) {
            console.error('❌ FATAL: Failed to load AI models.');
            console.error(error);
            // Don't throw, let the app run but analysis will fail gracefully
        }
    }

    // Custom Model Loader for Node.js without tfjs-node
    async loadLocalModel(dirPath, modelFileName) {
        const modelJsonPath = path.join(dirPath, modelFileName);
        const modelJson = JSON.parse(await fs.readFile(modelJsonPath, 'utf-8'));

        // Collect weight specs and load weight buffers
        const weightSpecs = [];
        const weightBuffers = [];

        if (modelJson.weightsManifest) {
            for (const group of modelJson.weightsManifest) {
                weightSpecs.push(...group.weights);
                const groupBuffers = await Promise.all(
                    group.paths.map(name => fs.readFile(path.join(dirPath, name)))
                );
                weightBuffers.push(...groupBuffers);
            }
        }

        // Concatenate weights
        const totalLength = weightBuffers.reduce((acc, buf) => acc + buf.length, 0);
        const weightData = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of weightBuffers) {
            weightData.set(new Uint8Array(buf), offset);
            offset += buf.length;
        }

        const artifacts = {
            modelTopology: modelJson.modelTopology,
            format: modelJson.format,
            generatedBy: modelJson.generatedBy,
            convertedBy: modelJson.convertedBy,
            weightSpecs: weightSpecs,
            weightData: weightData.buffer
        };

        const model = await tf.loadLayersModel(tf.io.fromMemory(artifacts));
        return model;
    }

    // Custom Graph Model Loader (for MobileNet)
    async loadLocalGraphModel(dirPath, modelFileName) {
        const modelJsonPath = path.join(dirPath, modelFileName);
        const modelJson = JSON.parse(await fs.readFile(modelJsonPath, 'utf-8'));

        const weightSpecs = [];
        const weightBuffers = [];

        if (modelJson.weightsManifest) {
            for (const group of modelJson.weightsManifest) {
                weightSpecs.push(...group.weights);
                const groupBuffers = await Promise.all(
                    group.paths.map(name => fs.readFile(path.join(dirPath, name)))
                );
                weightBuffers.push(...groupBuffers);
            }
        }

        const totalLength = weightBuffers.reduce((acc, buf) => acc + buf.length, 0);
        const weightData = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of weightBuffers) {
            weightData.set(new Uint8Array(buf), offset);
            offset += buf.length;
        }

        const artifacts = {
            modelTopology: modelJson.modelTopology,
            format: modelJson.format,
            generatedBy: modelJson.generatedBy,
            convertedBy: modelJson.convertedBy,
            weightSpecs: weightSpecs,
            weightData: weightData.buffer
        };

        console.log(`Loading Graph Model from ${dirPath} with ${weightSpecs.length} weights...`);
        const model = await tf.loadGraphModel(tf.io.fromMemory(artifacts));
        return model;
    }

    async analyzeImage(imagePath) {
        if (!this.isLoaded) {
            await this.loadModel();
            if (!this.isLoaded) return this.getFallbackAnalysis();
        }

        try {
            // 1. Decode Image using Sharp
            // MobileNetV2 expects 224x224 RGB images, values -1 to 1 (or 0-255 handled by library?)
            // The mobilenet library's 'infer' method handles normalization usually if given ImageData
            // We will resize to 224x224 to be safe and get raw buffer

            const { data, info } = await sharp(imagePath)
                .resize(224, 224, { fit: 'fill' }) // Force resize to input shape
                .removeAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true });

            // Create Tensor from buffer
            // shape: [224, 224, 3]
            const tfimage = tf.tensor3d(new Uint8Array(data), [224, 224, 3]);

            // 2. Extract Features (Embeddings)
            // Manual Preprocessing for MobileNet: (img / 127.5) - 1
            const normalized = tfimage.toFloat().div(127.5).sub(1);
            const expanded = normalized.expandDims(0);

            // Execute GraphModel to get embeddings. 
            // Input node: 'images', Output node: 'module_apply_default/MobilenetV2/Logits/AvgPool'
            let embeddings;
            try {
                embeddings = this.baseModel.execute(
                    { 'images': expanded },
                    'module_apply_default/MobilenetV2/Logits/AvgPool'
                );
            } catch (exeError) {
                console.error('Graph Execution Failed:', exeError);
                throw exeError;
            }

            // 3. Predict using Custom Classifier
            const prediction = this.classifier.predict(embeddings);

            // 4. Extract Top Prediction
            const values = await prediction.data();
            const maxVal = Math.max(...values);
            const maxIdx = values.indexOf(maxVal);
            const predictedLabel = this.labels[maxIdx];

            // Cleanup
            tfimage.dispose();
            normalized.dispose();
            expanded.dispose();
            embeddings.dispose();
            prediction.dispose();

            return this.formatResult(predictedLabel, maxVal);

        } catch (error) {
            console.error('Analysis Failed Stack:', error.stack);
            console.error('Analysis Failed Message:', error.message);
            if (error.message.includes('Input tensor')) {
                console.error('Shape Mismatch. Make sure the model was trained correctly.');
            }
            return this.getFallbackAnalysis();
        }
    }

    formatResult(label, confidence) {
        let progress = 0;
        let stage = label;
        let timeEstimate = 30;
        const lowerLabel = label ? label.toLowerCase() : 'unknown';

        if (lowerLabel.includes('foundation') || lowerLabel.includes('site') || lowerLabel.includes('excavation')) {
            progress = 25;
            stage = 'Foundation Works';
            timeEstimate = 120;
        } else if (lowerLabel.includes('framing') || lowerLabel.includes('structure') || lowerLabel.includes('steel')) {
            progress = 50;
            stage = 'Structural Framing';
            timeEstimate = 90;
        } else if (lowerLabel.includes('exterior') || lowerLabel.includes('wall') || lowerLabel.includes('roof')) {
            progress = 75;
            stage = 'Enclosure / Exterior';
            timeEstimate = 60;
        } else if (lowerLabel.includes('finish') || lowerLabel.includes('interior')) {
            progress = 90;
            stage = 'Finishing Works';
            timeEstimate = 30;
        }

        return {
            progressPercentage: progress,
            confidenceScore: Number(confidence.toFixed(4)),
            structuralElements: this.inferStructuralElements(stage),
            safetyIssues: [],
            weatherConditions: 'Clear',
            timeEstimateDays: timeEstimate,
            detectedClass: label
        };
    }

    inferStructuralElements(stage) {
        const elements = { columns: 0, beams: 0, walls: 0, foundation: 0 };
        if (stage.includes('Foundation')) elements.foundation = 1;
        if (stage.includes('Framing')) { elements.columns = 10; elements.beams = 20; }
        if (stage.includes('Enclosure')) { elements.walls = 4; elements.columns = 10; }
        return elements;
    }

    getFallbackAnalysis() {
        return {
            progressPercentage: 0,
            confidenceScore: 0,
            structuralElements: {},
            safetyIssues: [{ type: 'error', severity: 'low', description: 'AI Analysis Failed. Please try again.' }],
            weatherConditions: 'Unknown',
            timeEstimateDays: 0,
            detectedClass: 'Error'
        };
    }
}

export default new ImageAnalysisService();
