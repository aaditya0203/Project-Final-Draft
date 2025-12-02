import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FolderOpen, MapPin, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/services/api';

interface ProjectsListProps {
    onSelectProject: (project: any) => void;
}

export function ProjectsList({ onSelectProject }: ProjectsListProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setIsLoading(true);
            const data = await api.getProjects();
            setProjects(data.projects || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        try {
            await api.deleteProject(projectId);
            toast.success('Project deleted successfully');
            loadProjects();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete project');
        }
    };

    const filteredProjects = projects.filter(project => {
        const query = searchQuery.toLowerCase();
        return (
            project.name?.toLowerCase().includes(query) ||
            project.location?.toLowerCase().includes(query) ||
            project.description?.toLowerCase().includes(query)
        );
    });

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">My Projects</h1>
                    <p className="text-gray-300">
                        View and manage all your construction projects
                    </p>
                </div>
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search projects..."
                        className="pl-8 bg-white/5 border-white/10 focus:bg-white/10 transition-all hover:border-primary/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-bounce-in">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="glass border-white/10 animate-pulse">
                            <CardHeader>
                                <div className="h-6 bg-white/10 rounded w-3/4"></div>
                                <div className="h-4 bg-white/5 rounded w-1/2 mt-2"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-4 bg-white/5 rounded w-full"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <Card className="p-12 text-center glass border-white/10">
                    <div className="animate-float inline-block">
                        <FolderOpen className="h-16 w-16 mx-auto text-primary/50 mb-4" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                        {searchQuery ? 'No projects found' : 'No projects yet'}
                    </h3>
                    <p className="text-muted-foreground">
                        {searchQuery
                            ? 'Try adjusting your search query'
                            : 'Create your first project to get started'}
                    </p>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card
                                className="cursor-pointer glass border-white/10 hover-lift hover:border-primary/30 transition-all group"
                                onClick={() => onSelectProject(project)}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-xl text-white group-hover:text-primary transition-colors">{project.name}</CardTitle>
                                            <CardDescription className="mt-1 text-gray-400">
                                                {project.stage || 'Planning'}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                onClick={(e) => handleDeleteProject(e, project.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors">
                                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {project.location && (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <MapPin className="h-4 w-4" />
                                            {project.location}
                                        </div>
                                    )}
                                    {project.created_at && (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(project.created_at).toLocaleDateString()}
                                        </div>
                                    )}
                                    {project.description && (
                                        <p className="text-sm text-gray-400 line-clamp-2 mt-2">
                                            {project.description}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
