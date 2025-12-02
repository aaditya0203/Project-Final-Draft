import { useState, useEffect } from 'react';
import { Activity, RefreshCw, CheckCircle2, HardHat, CloudSun, FileSpreadsheet, FileText, ShieldCheck, Calendar, ArrowLeft, Image as ImageIcon, SplitSquareHorizontal, Trash2, LogOut, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/services/api';
import { UploadSection } from './UploadSection';



interface DashboardProps {
    projectData?: any;
    onBack?: () => void;
}

export function Dashboard({ projectData, onBack }: DashboardProps) {
    const [projectImages, setProjectImages] = useState<any[]>([]);
    const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);
    const [aiPredictions, setAiPredictions] = useState<{ score: number; time: number } | null>(null);

    // If no project data is provided, show empty state
    if (!projectData) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="p-6 rounded-full bg-primary/10 animate-pulse-glow">
                    <FolderOpen className="h-16 w-16 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">No Project Selected</h2>
                <p className="text-muted-foreground max-w-md text-center">
                    Please select a project from the list or create a new one to view the dashboard.
                </p>
                <Button onClick={onBack} className="mt-4 hover-lift">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Projects
                </Button>
            </div>
        );
    }

    const project = projectData;

    useEffect(() => {
        if (projectData?.id) {
            loadImages();
            loadPredictions();
        }
    }, [projectData?.id]);

    const loadPredictions = async () => {
        try {
            // Demo features: [timestamp, temp, humidity, vibration, material, machinery, workers, energy, progress, cost, time, safety, equip, shortage, risk, sim, update, opt]
            // In a real app, these would come from sensors or project data
            const demoFeatures = [
                Date.now(), 25, 60, 0.5,
                80, 1, 45,
                1200, 75, 5,
                2, 0, 0.85,
                0, 15, 0.1,
                24, 1
            ];
            const result = await api.getPrediction(demoFeatures);
            setAiPredictions({
                score: result.performance_score,
                time: result.time_estimate
            });
        } catch (error) {
            console.error('Failed to load predictions:', error);
        }
    };

    const loadImages = async () => {
        try {
            const images = await api.getProjectImages(projectData.id);
            setProjectImages(images.images || []);
        } catch (error) {
            console.error('Failed to load images:', error);
        }
    };

    const handleUploadComplete = () => {
        toast.success('Analysis Complete', { description: 'New images have been added to the gallery.' });
        loadImages();
    };

    const handleExport = async (format: 'excel' | 'pdf') => {
        if (!projectData?.id) {
            toast.error('No project selected', { description: 'Please select a project to export.' });
            return;
        }
        const formatName = format === 'excel' ? 'Excel' : 'PDF';
        toast.loading(`Generating ${formatName} report...`, { id: 'export' });
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:3002/api/export/${projectData.id}/${format}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
                throw new Error(errorData.error || 'Export failed');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.project}_report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(`${formatName} report downloaded!`, { id: 'export', description: `${project.project}_report.${format === 'excel' ? 'xlsx' : 'pdf'}` });
        } catch (error: any) {
            console.error('Export error:', error);
            toast.error('Export failed', { id: 'export', description: error.message || 'Failed to generate report. Please try again.' });
        }
    };

    const toggleImageSelection = (imageId: string) => {
        setSelectedForComparison((prev) => {
            if (prev.includes(imageId)) {
                return prev.filter((id) => id !== imageId);
            }
            if (prev.length >= 2) {
                toast.warning('Select only 2 images for comparison');
                return prev;
            }
            return [...prev, imageId];
        });
    };

    const handleSignOut = async () => {
        try {
            await api.signOut();
            localStorage.removeItem('auth_token');
            toast.success('Signed out successfully');
            window.location.href = '/login';
        } catch (error) {
            console.error('Sign out error:', error);
            toast.error('Failed to sign out');
        } finally {
            setShowSignOutDialog(false);
        }
    };

    const handleDeleteImage = async (imageId: string) => {
        try {
            await api.deleteImage(imageId);
            toast.success('Image deleted successfully');
            loadImages();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete image');
        }
    };

    return (
        <div className="space-y-6 ">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-secondary/20">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gradient-animated">{project.project}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse-glow">
                                {project.stage}
                            </Badge>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <CloudSun className="h-4 w-4" />
                                {project.aiAnalysis?.weather || 'Weather N/A'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="glass hover:bg-white/10" onClick={() => handleExport('excel')}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                    </Button>
                    <Button variant="outline" className="glass hover:bg-white/10" onClick={() => handleExport('pdf')}>
                        <FileText className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                    <Button onClick={() => window.location.reload()} className="hover-lift shadow-lg shadow-primary/20">
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
                    </Button>
                </div>
            </div>

            {/* No Analysis Data Message */}
            {!project.aiAnalysis && (
                <Card className="p-12 text-center glass border-white/10 animate-bounce-in">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-6 rounded-full bg-white/5 animate-float">
                            <HardHat className="h-16 w-16 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">No Analysis Data Yet</h3>
                            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                                This project doesn't have any uploaded images or analysis data yet. Upload construction site images to get AI-powered progress analysis.
                            </p>
                            <p className="text-sm text-primary font-medium animate-pulse">🚀 Ready to launch? Go to New Analysis!</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* KPI Cards */}
            {project.aiAnalysis && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="glass border-white/10 hover-lift transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
                            <Activity className="h-4 w-4 text-primary animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gradient-animated">
                                {aiPredictions ? aiPredictions.score.toFixed(1) : project.progress}%
                            </div>
                            <Progress value={aiPredictions ? aiPredictions.score : project.progress} className="mt-2 h-2" />
                            <p className="text-xs text-muted-foreground mt-2">
                                {aiPredictions ? 'AI Calculated Progress' : '+2.5% from last week'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="glass border-white/10 hover-lift transition-all duration-300 delay-75">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{project.aiAnalysis.confidence}</div>
                            <p className="text-xs text-muted-foreground mt-1">Based on latest scan</p>
                        </CardContent>
                    </Card>
                    <Card className="glass border-white/10 hover-lift transition-all duration-300 delay-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">98/100</div>
                            <p className="text-xs text-muted-foreground mt-1">{project.aiAnalysis.safety.length} issues detected</p>
                        </CardContent>
                    </Card>
                    <Card className="glass border-white/10 hover-lift transition-all duration-300 delay-150">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Est. Completion</CardTitle>
                            <Calendar className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">
                                {aiPredictions ? Math.round(aiPredictions.time) : (project.timeEstimate || 'N/A')} Days
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {aiPredictions ? 'AI Estimated Remaining' : 'On track with schedule'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Content Tabs */}
            {project.aiAnalysis && (
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="glass border-white/10 p-1">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">Overview</TabsTrigger>
                        <TabsTrigger value="gallery" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">Gallery & Compare</TabsTrigger>
                        <TabsTrigger value="analysis" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">AI Analysis</TabsTrigger>
                        <TabsTrigger value="reports" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">Reports</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Overview content omitted for brevity */}
                    </TabsContent>

                    <TabsContent value="gallery" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <UploadSection
                            onUploadComplete={handleUploadComplete}
                            existingProjectId={project.id}
                            existingProjectName={project.project}
                        />
                        <Card className="glass border-white/10">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Project Gallery</CardTitle>
                                    <CardDescription>View uploaded images and compare progress over time.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    {selectedForComparison.length === 2 && (
                                        <Button onClick={() => setIsCompareMode(!isCompareMode)}>
                                            <SplitSquareHorizontal className="mr-2 h-4 w-4" />
                                            {isCompareMode ? 'Exit Comparison' : 'Compare Selected'}
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isCompareMode && selectedForComparison.length === 2 ? (
                                    <div className="grid grid-cols-2 gap-4 h-[500px]">
                                        {selectedForComparison.map((id) => {
                                            const img = projectImages.find((i) => i.id === id);
                                            return (
                                                <div key={id} className="relative h-full rounded-lg overflow-hidden border border-border">
                                                    <img src={api.getImageUrl(id)} alt="Comparison" className="w-full h-full object-contain bg-black/5" />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
                                                        {new Date(img?.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-[500px] w-full rounded-md border p-4 overflow-y-auto">
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {projectImages.map((image) => (
                                                <div key={image.id} className="relative group rounded-lg overflow-hidden border border-border aspect-square">
                                                    <img src={api.getImageUrl(image.id)} alt="Project" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm('Are you sure you want to delete this image?')) {
                                                                    handleDeleteImage(image.id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        <input type="checkbox" checked={selectedForComparison.includes(image.id)} onChange={() => toggleImageSelection(image.id)} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {new Date(image.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                            {projectImages.length === 0 && (
                                                <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground">
                                                    <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                                                    <p>No images uploaded yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analysis" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Detailed AI Analysis content omitted for brevity */}
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Reports content omitted for brevity */}
                    </TabsContent>
                </Tabs>
            )}

            {/* Sign Out Confirmation Dialog */}
            <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
                <DialogContent className="glass border-white/10">
                    <DialogHeader>
                        <DialogTitle>Confirm Sign Out</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to sign out? You'll need to log in again to access your projects.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSignOutDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
