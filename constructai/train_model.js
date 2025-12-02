// train_model.js – train a regression model using a CSV dataset
// ------------------------------------------------------------
// Run with: node train_model.js --csv <path> --target <column>
// ------------------------------------------------------------
import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// ---------- 1️⃣ Parse command line arguments ----------
const args = process.argv.slice(2);
let csvPath = 'C:/Users/jaisw/OneDrive/Desktop/Aadi project/archive/construction_project_dataset.csv';
let targetColumn = 'performance_score';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--csv' || args[i] === '-c') {
    csvPath = args[i + 1];
    i++;
  } else if (args[i] === '--target' || args[i] === '-t') {
    targetColumn = args[i + 1];
    i++;
  }
}

csvPath = path.resolve(csvPath);

if (!fs.existsSync(csvPath)) {
  console.error(`❌ CSV file not found at ${csvPath}`);
  process.exit(1);
}

console.log(`📊 Loading dataset from: ${csvPath}`);
console.log(`🎯 Target column: ${targetColumn}`);

// ---------- 2️⃣ Load and parse CSV dataset ----------
function loadDataset(csvFilePath, targetCol) {
  const content = fs.readFileSync(csvFilePath, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true });

  if (records.length === 0) {
    throw new Error('CSV file is empty');
  }

  const featureCols = Object.keys(records[0]).filter(col => col !== targetCol);

  if (!records[0][targetCol]) {
    throw new Error(`Target column "${targetCol}" not found in CSV`);
  }

  const features = records.map(r => featureCols.map(col => parseFloat(r[col]) || 0));
  const targets = records.map(r => parseFloat(r[targetCol]) || 0);

  console.log(`✅ Loaded ${records.length} records`);
  console.log(`📋 Feature columns (${featureCols.length}): ${featureCols.join(', ')}`);

  return { features, targets, featureCols };
}

const { features, targets, featureCols } = loadDataset(csvPath, targetColumn);

// Create a tf.data.Dataset for batching using a generator
function* dataGenerator() {
  for (let i = 0; i < features.length; i++) {
    const xs = tf.tensor1d(features[i]);
    const ys = tf.tensor1d([targets[i]]);
    yield { xs, ys };
  }
}
const ds = tf.data.generator(dataGenerator).batch(32);

// ---------- 3️⃣ Build a simple regression model ----------
function createModel(inputDim) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [inputDim] }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1 })); // linear output for regression
  return model;
}

async function train() {
  const inputDim = featureCols.length;
  const model = createModel(inputDim);
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mse']
  });

  console.log('\n🚀 Starting training...');
  console.log(`📐 Model architecture: ${inputDim} → 64 → 32 → 1`);
  console.log('─'.repeat(50));

  await model.fitDataset(ds, {
    epochs: 20,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        const loss = logs?.loss?.toFixed(6) || 'N/A';
        const mse = logs?.mse?.toFixed(6) || 'N/A';
        console.log(`Epoch ${String(epoch + 1).padStart(2, ' ')}/20 | Loss: ${loss} | MSE: ${mse}`);
      },
    },
  });

  console.log('─'.repeat(50));
  const outDir = path.resolve('model');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Save model weights as JSON (browser TensorFlow.js compatible)
  const modelJSON = await model.toJSON();
  const weightsData = await model.getWeights();

  fs.writeFileSync(path.join(outDir, 'model.json'), JSON.stringify(modelJSON, null, 2));
  console.log(`✅ Model architecture saved to: ${path.join(outDir, 'model.json')}`);
}

train().catch(err => {
  console.error('❌ Training failed:', err);
  process.exit(1);
});
