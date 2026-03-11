import json
import os

model_path = 'server/models/construction_detector/model.json'

with open(model_path, 'r') as f:
    data = json.load(f)

print("Patching model.json...")
fixed = 0

# The JSON structure contains modelTopology
topology = data.get('modelTopology')
if topology:
    if 'keras_version' in topology:
        # Standard Keras JSON
        config = topology.get('model_config', {}).get('config', {})
        if config.get('layers'):
            for layer in config['layers']:
                if layer.get('class_name') == 'InputLayer':
                    if 'batch_shape' in layer['config']:
                        layer['config']['batchInputShape'] = layer['config']['batch_shape']
                        del layer['config']['batch_shape']
                        fixed += 1
                # Nested functional models
                elif layer.get('class_name') == 'Functional':
                    inner_layers = layer.get('config', {}).get('layers', [])
                    for inner_layer in inner_layers:
                        if inner_layer.get('class_name') == 'InputLayer':
                            if 'batch_shape' in inner_layer['config']:
                                inner_layer['config']['batchInputShape'] = inner_layer['config']['batch_shape']
                                del inner_layer['config']['batch_shape']
                                fixed += 1

print(f"Fixed {fixed} input layers.")

with open(model_path, 'w') as f:
    json.dump(data, f)
print("Saved patched model.json.")
