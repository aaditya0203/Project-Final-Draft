import { useState, useEffect } from 'react';
import { CloudUpload, CheckCircle2, Camera, ArrowLeft } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/services/api';

const stages = [
    'Site Prep',
    'Foundation',
    'Structural',
    'Envelope',
    'Interior',
    'Commissioning',
];

interface UploadSectionProps {
    onUploadComplete: (data: any) => void;
    existingProjectId?: string;
    existingProjectName?: string;
    onBack?: () => void;
}

export function UploadSection({ onUploadComplete, existingProjectId, existingProjectName, onBack }: UploadSectionProps) {
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [stage, setStage] = useState(stages[2]);
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [processingStep, setProcessingStep] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [projectId, setProjectId] = useState<string | null>(existingProjectId || null);

    useEffect(() => {
        if (existingProjectId) {
            setProjectId(existingProjectId);
        }
    }, [existingProjectId]);

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...acceptedFiles]);
            toast.success(`${acceptedFiles.length} image(s) selected`);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        multiple: true,
    });

    // Check if running on mobile
    const isMobile = Capacitor.isNativePlatform();

    // Camera capture function
    const takePicture = async () => {
        try {
            const image = await CapacitorCamera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera,
            });

            // Convert base64 to File
            if (image.dataUrl) {
                const response = await fetch(image.dataUrl);
                const blob = await response.blob();
                const file = new File([blob], `camera-${Date.now()}.${image.format}`, {
                    type: `image/${image.format}`,
                });
                setSelectedFiles(prev => [...prev, file]);
                toast.success('Photo captured successfully');
            }
        } catch (error) {
            console.error('Camera error:', error);
            toast.error('Failed to capture photo');
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (!existingProjectId && !projectName) {
            toast.error('Project name required', { description: 'Please enter a project name before uploading.' });
            return;
        }
        if (selectedFiles.length === 0) {
            toast.error('No images selected', { description: 'Please select at least one image to upload.' });
            return;
        }
        setUploading(true);
        setProgress(0);
        try {
            // Create project if needed
            let currentProjectId = existingProjectId ? String(existingProjectId) : projectId;

            if (!currentProjectId) {
                const projectResponse = await api.createProject({
                    name: projectName,
                    stage,
                    location,
                    description: notes,
                });
                currentProjectId = projectResponse.project.id;
                setProjectId(currentProjectId);
            }

            const totalFiles = selectedFiles.length;
            let completedFiles = 0;
            let lastAnalysis: any = null;

            for (const file of selectedFiles) {
                setProcessingStep(`Uploading ${file.name} (${completedFiles + 1}/${totalFiles})...`);
                const uploadResponse: any = await api.uploadImage(
                    currentProjectId as string,
                    file,
                    (uploadProgress: number) => {
                        const filePortion = 95 / totalFiles;
                        const base = 5 + completedFiles * filePortion;
                        const overall = base + uploadProgress * filePortion * 0.5;
                        setProgress(Math.round(overall));
                    }
                );
                setProcessingStep(`Analyzing ${file.name}...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                completedFiles++;
                const progressNow = 5 + completedFiles * (95 / totalFiles);
                setProgress(Math.round(progressNow));
                lastAnalysis = uploadResponse.analysis;
            }

            setProcessingStep('All files processed!');
            setProgress(100);
            toast.success('Upload Complete', { description: `${selectedFiles.length} images processed successfully.` });

            if (lastAnalysis) {
                onUploadComplete({
                    id: currentProjectId,
                    project: existingProjectName || projectName,
                    stage,
                    updated: 'Just now',
                    progress: lastAnalysis.progressPercentage,
                    ssim: lastAnalysis.confidenceScore,
                    aiAnalysis: {
                        structural: Object.entries(lastAnalysis.structuralElements)
                            .filter(([_, count]) => (count as number) > 0)
                            .map(([type, count]) => `${count} ${type}`),
                        safety: lastAnalysis.safetyIssues.length > 0
                            ? lastAnalysis.safetyIssues.map((issue: any) => issue.description)
                            : ['No safety issues detected'],
                        weather: lastAnalysis.weatherConditions,
                        confidence: `${(lastAnalysis.confidenceScore * 100).toFixed(1)}%`,
                    },
                    timeEstimate: lastAnalysis.timeEstimateDays,
                });
            }

            // Reset form
            setSelectedFiles([]);
            setProgress(0);
            setProcessingStep('');
            if (!existingProjectId) {
                setProjectName('');
                setLocation('');
                setNotes('');
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Upload failed', { description: error.message || 'Failed to upload and analyze images.' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="glass border-white/10 shadow-xl">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-white/10 shrink-0">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    )}
                    <div>
                        <CardTitle className="text-2xl text-gradient-animated">
                            {existingProjectName ? `Add Images to ${existingProjectName}` : 'Upload Construction Site Images'}
                        </CardTitle>
                        <CardDescription>
                            Upload photos of your construction site for AI-powered progress analysis.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Drag & Drop Zone */}
                    <div
                        {...getRootProps()}
                        className={`
                            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300
                            ${isDragActive
                                ? 'border-primary bg-primary/10 scale-105 animate-pulse-glow'
                                : 'border-white/20 hover:border-primary/50 hover:bg-white/5 hover:scale-[1.02]'
                            } 
                            ${selectedFiles.length > 0 ? 'bg-primary/5 border-primary/50' : ''}
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-4">
                            <div className={`p-4 rounded-full bg-white/5 transition-transform duration-300 ${isDragActive ? 'scale-110 rotate-12' : 'group-hover:scale-110'}`}>
                                <CloudUpload className={`h-12 w-12 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                                <p className="text-lg font-medium mb-1">
                                    {isDragActive ? 'Drop it like it\'s hot! 🔥' : 'Drag & drop images here'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    or click to browse from your computer
                                </p>
                            </div>
                            <p className="text-xs text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
                                Supports: JPG, JPEG, PNG, WEBP (Max 10MB)
                            </p>
                        </div>
                    </div>

                    {/* Camera Button - Show only on mobile */}
                    {isMobile && (
                        <div className="flex justify-center">
                            <Button
                                variant="outline"
                                onClick={takePicture}
                                disabled={uploading}
                                className="w-full max-w-xs border-primary/50 hover:bg-primary/10"
                            >
                                <Camera className="mr-2 h-5 w-5" />
                                Take Photo with Camera
                            </Button>
                        </div>
                    )}

                    {/* Selected Files */}
                    {selectedFiles.length > 0 && (
                        <div className="space-y-3 animate-slide-up">
                            <p className="text-sm font-medium text-muted-foreground">Selected Files ({selectedFiles.length})</p>
                            <div className="grid gap-2 max-h-40 overflow-y-auto pr-2">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 animate-bounce-in" />
                                            <span className="text-sm truncate font-medium">{file.name}</span>
                                            <span className="text-xs text-muted-foreground flex-shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                            disabled={uploading}
                                        >
                                            <span className="sr-only">Remove</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Project Details - Only show if creating new project */}
                    {!existingProjectId && (
                        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-2">
                                <Label htmlFor="project">Project Name *</Label>
                                <Input
                                    id="project"
                                    placeholder="e.g., Aurora Tower"
                                    value={projectName}
                                    onChange={e => setProjectName(e.target.value)}
                                    disabled={uploading}
                                    className="bg-white/5 border-white/10 focus:bg-white/10 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stage">Construction Stage</Label>
                                <Select value={stage} onValueChange={setStage} disabled={uploading}>
                                    <SelectTrigger id="stage" className="bg-white/5 border-white/10 focus:bg-white/10 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stages.map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location (Optional)</Label>
                                <Input
                                    id="location"
                                    placeholder="e.g., Downtown District, City"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    disabled={uploading}
                                    className="bg-white/5 border-white/10 focus:bg-white/10 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Additional project notes..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    disabled={uploading}
                                    className="bg-white/5 border-white/10 focus:bg-white/10 transition-all min-h-[80px]"
                                />
                            </div>
                        </div>
                    )}

                    {/* Upload Button & Progress */}
                    <div className="pt-4">
                        <Button
                            onClick={handleUpload}
                            disabled={uploading}
                            className={`w-full h-12 text-lg font-medium transition-all duration-300 ${uploading ? 'opacity-80' : 'hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25'}`}
                            size="lg"
                        >
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin">⏳</span> Uploading...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Start Analysis <CloudUpload className="h-5 w-5" />
                                </span>
                            )}
                        </Button>

                        {uploading && (
                            <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-primary font-medium animate-pulse">{processingStep}</span>
                                    <span className="text-muted-foreground">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
