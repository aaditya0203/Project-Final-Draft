import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, 'models/construction_detector/model.json');
let data = JSON.parse(fs.readFileSync(file, 'utf8'));

const config = data.modelTopology.model_config.config;

function fixInboundNodes(layers) {
    let fixed = 0;
    for (const layer of layers) {
        if (layer.inbound_nodes && layer.inbound_nodes.length > 0) {
            const firstNode = layer.inbound_nodes[0];
            if (!Array.isArray(firstNode) && typeof firstNode === 'object' && firstNode !== null) {
                if (firstNode.args) {
                    const newInbound = [];
                    for (const node of layer.inbound_nodes) {
                        const newArgs = [];
                        if (node.args) {
                            for (const arg of node.args) {
                                // For single tensors
                                if (arg && arg.class_name === "__keras_tensor__" && arg.config && arg.config.keras_history) {
                                    newArgs.push([...arg.config.keras_history, {}]);
                                }
                                // For multiple tensors (like in Add layers) argument is an array!
                                else if (Array.isArray(arg)) {
                                    for (const multiArg of arg) {
                                        if (multiArg.class_name === "__keras_tensor__" && multiArg.config && multiArg.config.keras_history) {
                                            newArgs.push([...multiArg.config.keras_history, {}]);
                                        }
                                    }
                                }
                            }
                        }
                        if (newArgs.length > 0) {
                            newInbound.push(newArgs);
                        }
                    }
                    if (newInbound.length > 0) {
                        layer.inbound_nodes = newInbound;
                        fixed++;
                    }
                }
            }
        }

        if (layer.class_name === 'Functional' && layer.config && layer.config.layers) {
            fixed += fixInboundNodes(layer.config.layers);
        }
    }
    return fixed;
}

if (config && config.layers) {
    const fixedLayers = fixInboundNodes(config.layers);
    console.log(`Fixed ${fixedLayers} layers with Keras 3 inbound_nodes.`);
    fs.writeFileSync(file, JSON.stringify(data));
    console.log("Saved patched model.json.");
}
