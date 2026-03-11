import * as tf from '@tensorflow/tfjs-node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testLoad() {
    try {
        const modelPath = path.join(__dirname, 'models/construction_detector/model.json');
        console.log(`Loading from file://${modelPath}`);
        const model = await tf.loadLayersModel(`file://${modelPath}`);
        console.log("SUCCESS! Model loaded. Summary:");
        model.summary();
    } catch (e) {
        console.error("FAILED to load:", e);
    }
}

testLoad();
