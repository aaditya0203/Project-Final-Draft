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

// Shuffle data
function shuffleData(features, targets) {
  let indices = features.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    features: indices.map(i => features[i]),
    targets: indices.map(i => targets[i])
  };
}

const { features: allFeatures, targets: allTargets, featureCols } = loadDataset(csvPath, targetColumn);

// Split 80-20
const shuffled = shuffleData(allFeatures, allTargets);
const splitIdx = Math.floor(shuffled.features.length * 0.8);

const trainFeatures = shuffled.features.slice(0, splitIdx);
const trainTargets = shuffled.targets.slice(0, splitIdx);
const testFeatures = shuffled.features.slice(splitIdx);
const testTargets = shuffled.targets.slice(splitIdx);

console.log(`\n✂️  Data Split:`);
console.log(`   Train: ${trainFeatures.length} samples`);
console.log(`   Test:  ${testFeatures.length} samples`);

// Create a tf.data.Dataset for training
function* trainDataGenerator() {
  for (let i = 0; i < trainFeatures.length; i++) {
    const xs = tf.tensor1d(trainFeatures[i]);
    const ys = tf.tensor1d([trainTargets[i]]);
    yield { xs, ys };
  }
}
const trainDs = tf.data.generator(trainDataGenerator).batch(32);

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

  await model.fitDataset(trainDs, {
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

  // ---------- 4️⃣ Evaluate on Test Set ----------
  console.log('\n🧪 Evaluating on Test Set...');

  const testTensor = tf.tensor2d(testFeatures);
  const predictions = model.predict(testTensor);
  const predData = await predictions.data();

  let totalMse = 0;
  let totalMae = 0;

  // Calculate metrics manually for clarity
  for (let i = 0; i < testTargets.length; i++) {
    const actual = testTargets[i];
    const pred = predData[i];
    const diff = actual - pred;
    totalMse += diff * diff;
    totalMae += Math.abs(diff);
  }

  const mse = totalMse / testTargets.length;
  const mae = totalMae / testTargets.length;
  const rmse = Math.sqrt(mse);

  console.log(`📊 Test Results:`);
  console.log(`   MSE (Mean Squared Error): ${mse.toFixed(4)}`);
  console.log(`   RMSE (Root Mean Squared Error): ${rmse.toFixed(4)}`);
  console.log(`   MAE (Mean Absolute Error): ${mae.toFixed(4)}`);

  // Show a few examples
  console.log('\n🔍 Sample Predictions vs Actual:');
  for (let i = 0; i < Math.min(5, testTargets.length); i++) {
    console.log(`   Actual: ${testTargets[i].toFixed(2)} | Pred: ${predData[i].toFixed(2)} | Diff: ${(predData[i] - testTargets[i]).toFixed(2)}`);
  }

  testTensor.dispose();
  predictions.dispose();

  const outDir = path.resolve('model');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Save model weights as JSON (browser TensorFlow.js compatible)
  const modelJSON = await model.toJSON();

  fs.writeFileSync(path.join(outDir, 'model.json'), JSON.stringify(modelJSON, null, 2));
  console.log(`\n✅ Model architecture saved to: ${path.join(outDir, 'model.json')}`);
}

train().catch(err => {
  console.error('❌ Training failed:', err);
  process.exit(1);
});
