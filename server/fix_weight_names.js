import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, 'models/construction_detector/model.json');
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Find all DepthwiseConv2D layers
const depthwiseLayerNames = new Set();
function findDepthwiseLayers(layers) {
    for (const layer of layers) {
        if (layer.class_name === 'DepthwiseConv2D') {
            depthwiseLayerNames.add(layer.name);
        }
        if (layer.class_name === 'Functional' && layer.config && layer.config.layers) {
            findDepthwiseLayers(layer.config.layers);
        }
    }
}
findDepthwiseLayers(data.modelTopology.model_config.config.layers);

let renamedSequential = 0;
let renamedDepthwise = 0;

if (data.weightsManifest) {
    for (const manifest of data.weightsManifest) {
        if (manifest.weights) {
            for (const weight of manifest.weights) {
                // Remove sequential_1/ prefix
                if (weight.name && weight.name.startsWith('sequential_1/')) {
                    weight.name = weight.name.replace('sequential_1/', '');
                    renamedSequential++;
                }

                // If it's a DepthwiseConv2D layer, Keras 3 writes "layer_name/kernel" instead of "layer_name/depthwise_kernel"
                for (const dwName of depthwiseLayerNames) {
                    if (weight.name === `${dwName}/kernel`) {
                        weight.name = `${dwName}/depthwise_kernel`;
                        renamedDepthwise++;
                    }
                }
            }
        }
    }
}

console.log(`Stripped 'sequential_1/' from ${renamedSequential} weights.`);
console.log(`Renamed 'kernel' to 'depthwise_kernel' for ${renamedDepthwise} DepthwiseConv2D weights.`);
fs.writeFileSync(file, JSON.stringify(data));
console.log("Saved patched weightsManifest in model.json.");
