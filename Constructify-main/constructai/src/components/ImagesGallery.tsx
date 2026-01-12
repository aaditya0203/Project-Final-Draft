import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

interface ImagesGalleryProps {
    projectId: string;
}

export function ImagesGallery({ projectId }: ImagesGalleryProps) {
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadImages = async () => {
        try {
            setLoading(true);
            const data = await api.getProjectImages(projectId);
            setImages(data.images || []);
        } catch (err: any) {
            toast.error('Failed to load images', { description: err.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadImages();
    }, [projectId]);

    const refresh = () => {
        loadImages();
        toast.success('Images refreshed');
    };

    return (
        <Card className="glass p-4 backdrop-blur-md border border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Project Images</CardTitle>
                <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
            </CardHeader>
            <CardContent>
                {loading && <p className="text-muted-foreground">Loading images...</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                    {images.map((img) => (
                        <div key={img.id} className="border rounded overflow-hidden">
                            <img
                                src={api.getImageUrl(img.id)}
                                alt={img.file_name}
                                className="w-full h-32 object-cover"
                            />
                        </div>
                    ))}
                </div>
                {images.length === 0 && !loading && (
                    <p className="text-muted-foreground text-center mt-4">No images uploaded yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
