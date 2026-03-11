import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Trash2, Plus, Play, Save, Upload, Brain, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Define types
type ClassData = {
    id: string;
    name: string;
    images: HTMLImageElement[];
    imageSrcs: string[];
};
interface TrainingPageProps {
    onBack?: () => void;
}

export function TrainingPage({ onBack }: TrainingPageProps) {
    const [classes, setClasses] = useState<ClassData[]>([
        { id: '1', name: 'Foundation', images: [], imageSrcs: [] },
        { id: '2', name: 'Framing', images: [], imageSrcs: [] }
    ]);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [isTraining, setIsTraining] = useState(false);
    const [loss, setLoss] = useState<number | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [trainingProgress, setTrainingProgress] = useState(0);
    const [status, setStatus] = useState('Initializing...');

    // TensorFlow references
    const mobilenetModel = useRef<mobilenet.MobileNet | null>(null);
    const classifier = useRef<tf.Sequential | null>(null);

    useEffect(() => {
        loadBaseModel();
    }, []);

    const loadBaseModel = async () => {
        try {
            setStatus('Loading MobileNet base model...');
            // Load MobileNet
            mobilenetModel.current = await mobilenet.load({ version: 2, alpha: 1.0 });
            setStatus('Ready');
            setIsModelLoading(false);
            toast.success('AI Engine Ready');
        } catch (err) {
            console.error(err);
            toast.error('Failed to load base model');
            setStatus('Error loading model');
        }
    };

    const addClass = () => {
        setClasses([...classes, {
            id: Math.random().toString(36).substring(7),
            name: `Class ${classes.length + 1}`,
            images: [],
            imageSrcs: []
        }]);
    };

    const removeClass = (index: number) => {
        if (classes.length <= 2) {
            toast.error('At least 2 classes are required');
            return;
        }
        const newClasses = [...classes];
        newClasses.splice(index, 1);
        setClasses(newClasses);
    };

    const updateClassName = (index: number, name: string) => {
        const newClasses = [...classes];
        newClasses[index].name = name;
        setClasses(newClasses);
    };

    const handleImageUpload = (index: number, files: File[]) => {
        const newClasses = [...classes];

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const src = e.target?.result as string;
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    newClasses[index].images.push(img);
                    // Only force update if it's the last image to avoid excessive re-renders
                };
                newClasses[index].imageSrcs.push(src);
                setClasses([...newClasses]);
            };
            reader.readAsDataURL(file);
        });
    };

    const trainModel = async () => {
        if (!mobilenetModel.current) return;

        // Validation
        const emptyClasses = classes.filter(c => c.images.length === 0);
        if (emptyClasses.length > 0) {
            toast.error(`Please add images to: ${emptyClasses.map(c => c.name).join(', ')}`);
            return;
        }

        setIsTraining(true);
        setStatus('Processing images...');
        setTrainingProgress(5);

        try {
            // 1. Prepare Data
            // We will extract embeddings from MobileNet for each image
            const xs: tf.Tensor[] = [];
            const ys: number[] = [];

            let processedCount = 0;
            const totalImages = classes.reduce((acc, c) => acc + c.images.length, 0);

            // Loop through classes and images
            for (let i = 0; i < classes.length; i++) {
                for (let j = 0; j < classes[i].images.length; j++) {
                    const img = classes[i].images[j];
                    // Get embedding (infer without classification head)
                    const embedding = mobilenetModel.current.infer(img, true) as tf.Tensor;
                    xs.push(embedding);
                    ys.push(i);

                    processedCount++;
                    setTrainingProgress(5 + (processedCount / totalImages) * 20); // Upto 25%

                    // Yield to UI thread occasionally
                    if (processedCount % 5 === 0) await tf.nextFrame();
                }
            }

            setStatus('Stacking tensors...');
            const xDataset = tf.concat(xs);
            const yDataset = tf.oneHot(tf.tensor1d(ys, 'int32'), classes.length);

            // 2. Create Transfer Learning Model
            setStatus('Compiling model...');
            const model = tf.sequential();
            model.add(tf.layers.dense({
                units: 128,
                activation: 'relu',
                inputShape: [1280], // MobileNetV2 embedding size
            }));
            model.add(tf.layers.dropout({ rate: 0.2 })); // Reduce overfitting
            model.add(tf.layers.dense({
                units: classes.length,
                activation: 'softmax',
            }));

            model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy'],
            });

            classifier.current = model;

            // 3. Train
            setStatus('Training...');

            const epochs = 20;
            await model.fit(xDataset, yDataset, {
                epochs: epochs,
                batchSize: 8,
                validationSplit: 0.1,
                callbacks: {
                    onEpochEnd: (epoch, logs) => {
                        setLoss(logs?.loss || 0);
                        setAccuracy(logs?.acc || logs?.accuracy || 0);
                        setTrainingProgress(25 + ((epoch + 1) / epochs) * 75);
                        setStatus(`Epoch ${epoch + 1}/${epochs} - Loss: ${logs?.loss.toFixed(4)}`);
                    }
                }
            });

            // Cleanup
            xDataset.dispose();
            yDataset.dispose();

            setIsTraining(false);
            setTrainingProgress(100);
            setStatus('Training Complete!');
            toast.success('Model Trained Successfully! Accuracy: ' + ((accuracy || 0) * 100).toFixed(1) + '%');

        } catch (err: any) {
            console.error(err);
            toast.error('Training Error: ' + err.message);
            setIsTraining(false);
            setStatus('Error: ' + err.message);
        }
    };

    const saveModel = async () => {
        if (!classifier.current) return;
        try {
            await classifier.current.save('downloads://my-construction-model');

            // Also save class labels
            const labels = classes.map(c => c.name);
            const blob = new Blob([JSON.stringify(labels)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'model_labels.json';
            a.click();

            toast.success('Model downloaded');
        } catch (err) {
            toast.error('Failed to save model');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-8 pt-8">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-white/10 shrink-0">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-gradient-animated flex items-center gap-3">
                            <Brain className="h-8 w-8 text-primary" />
                            AI Model Trainer
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Train a custom AI model right in your browser. Identify exactly what matters to your project.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {accuracy !== null && (
                        <Button onClick={saveModel} variant="outline" className="border-primary/50 text-white hover:bg-primary/10">
                            <Save className="mr-2 h-4 w-4" />
                            Save Model
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Grid */}
            <div className="container mx-auto px-4 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Class Definitions */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass border-white/10">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Training Classes</span>
                                <Button onClick={addClass} size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20">
                                    <Plus className="h-4 w-4 mr-1" /> Add Class
                                </Button>
                            </CardTitle>
                            <CardDescription>
                                Define categories (e.g., "Foundation", "Walls") and upload 5-10 example photos for each.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {classes.map((cls, index) => (
                                <div key={cls.id} className="p-4 rounded-xl bg-white/5 border border-white/5 transition-all hover:border-white/10">
                                    <div className="flex justify-between items-center mb-4">
                                        <Input
                                            value={cls.name}
                                            onChange={(e) => updateClassName(index, e.target.value)}
                                            className="max-w-[200px] border-none bg-transparent text-lg font-semibold focus-visible:ring-0 px-0"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeClass(index)}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Image Grid */}
                                    <div className="flex flex-wrap gap-2 mb-3 min-h-[80px]">
                                        {cls.imageSrcs.map((src, i) => (
                                            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 group">
                                                <img src={src} className="w-full h-full object-cover" />
                                            </div>
                                        ))}

                                        {/* Dropzone */}
                                        <Dropzone onUpload={(files) => handleImageUpload(index, files)} />
                                    </div>

                                    <div className="text-xs text-muted-foreground text-right">
                                        {cls.images.length} images loaded
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Training Controls & Stats */}
                <div className="space-y-6">
                    <Card className="glass border-white/10 sticky top-24">
                        <CardHeader>
                            <CardTitle>Training Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Status Indicator */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20">
                                <Activity className={`h-5 w-5 ${isTraining ? 'text-blue-400 animate-pulse' : 'text-muted-foreground'}`} />
                                <div className="flex-1">
                                    <div className="text-sm font-medium">{status}</div>
                                    {isTraining && <Progress value={trainingProgress} className="h-1 mt-2" />}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 rounded-lg bg-white/5">
                                    <div className="text-2xl font-bold text-white">{loss !== null ? loss.toFixed(4) : '-'}</div>
                                    <div className="text-xs text-muted-foreground">Loss</div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-white/5">
                                    <div className="text-2xl font-bold text-green-400">{accuracy !== null ? (accuracy * 100).toFixed(1) + '%' : '-'}</div>
                                    <div className="text-xs text-muted-foreground">Accuracy</div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <Button
                                onClick={trainModel}
                                disabled={isTraining || isModelLoading}
                                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-all"
                            >
                                {isTraining ? 'Training...' : (
                                    <>
                                        <Play className="mr-2 h-5 w-5 fill-current" /> Start Training
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-muted-foreground text-center">
                                This runs entirely in your browser using your GPU/CPU. Your photos never leave your device.
                            </p>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Simple internal Dropzone component
function Dropzone({ onUpload }: { onUpload: (files: File[]) => void }) {
    const onDrop = (acceptedFiles: File[]) => {
        onUpload(acceptedFiles);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] }
    });

    return (
        <div
            {...getRootProps()}
            className={`
        w-20 h-20 rounded-lg flex items-center justify-center cursor-pointer border border-dashed transition-all
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
      `}
        >
            <input {...getInputProps()} />
            <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
    );
}
