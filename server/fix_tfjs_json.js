import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, 'models/construction_detector/model.json');
let data = fs.readFileSync(file, 'utf8');

// The replacement should happen universally for Keras JSON configurations
const originalCount = (data.match(/"batch_shape":/g) || []).length;
data = data.replace(/"batch_shape":/g, '"batchInputShape":');

fs.writeFileSync(file, data);
console.log(`Fixed ${originalCount} occurrences of batch_shape in model.json`);
