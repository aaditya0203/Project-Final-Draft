import { motion } from 'framer-motion';
import { HardHat, Activity, ShieldCheck, CheckCircle2, Zap, Users, Target, Award, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AboutProps {
    onBack?: () => void;
}

export function About({ onBack }: AboutProps) {
    return (
        <div className="min-h-screen w-full bg-background gradient-animated">
            <div className="container mx-auto px-4 py-12 space-y-12 relative">
                {onBack && (
                    <Button variant="ghost" onClick={onBack} className="absolute top-4 left-4 hover:bg-white/10 z-10 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                )}
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center space-y-6"
                >
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
                        AI-Powered Construction Intelligence
                    </div>

                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gradient-animated">
                        About Constructify
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                        Revolutionizing construction site monitoring through advanced artificial intelligence,
                        computer vision, and real-time analytics.
                    </p>
                </motion.div>

                {/* Mission Statement */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Card className="glass border-white/10 hover-lift">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-primary/10">
                                    <Target className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">Our Mission</CardTitle>
                                    <CardDescription>Building the future of construction monitoring</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground leading-relaxed">
                                At Constructify, we're on a mission to transform the construction industry by making advanced AI technology
                                accessible to every construction project. We believe that real-time insights, automated progress tracking,
                                and intelligent safety monitoring should be standard tools for every construction manager and site supervisor.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                Our platform combines cutting-edge computer vision, machine learning, and intuitive design to deliver
                                actionable insights that help teams build safer, faster, and more efficiently.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Key Features */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="space-y-6"
                >
                    <h2 className="text-3xl font-bold text-center">What We Offer</h2>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="glass border-white/10 hover-lift transition-all duration-300">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <Activity className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle>Progress Tracking</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Automated progress analysis using AI to detect structural elements and calculate
                                    completion percentages in real-time. Track your project's advancement with precision.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glass border-white/10 hover-lift transition-all duration-300 delay-75">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <ShieldCheck className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle>Safety Monitoring</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Continuous safety compliance checks, PPE detection, and hazard identification to keep
                                    your site secure and compliant with safety regulations.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glass border-white/10 hover-lift transition-all duration-300 delay-100">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <CheckCircle2 className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle>Structural Analysis</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Intelligent detection of columns, beams, slabs, and other structural components with
                                    high precision using advanced computer vision algorithms.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glass border-white/10 hover-lift transition-all duration-300 delay-150">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <Zap className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle>Real-Time Analytics</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Get instant insights from uploaded images with our AI models that process and analyze
                                    construction site data in seconds, not hours.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glass border-white/10 hover-lift transition-all duration-300 delay-200">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <HardHat className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle>Project Management</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Organize multiple projects, track progress over time, and generate comprehensive
                                    reports in Excel or PDF format for stakeholders.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="glass border-white/10 hover-lift transition-all duration-300 delay-250">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <Award className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle>Custom AI Training</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Train custom AI models on your specific construction types and requirements for
                                    even more accurate and tailored analysis results.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </motion.div>

                {/* Technology Stack */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <Card className="glass border-white/10">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-primary/10">
                                    <Zap className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">Powered by Advanced Technology</CardTitle>
                                    <CardDescription>Built with cutting-edge tools and frameworks</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-lg">AI & Machine Learning</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">TensorFlow.js</Badge>
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Computer Vision</Badge>
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Deep Learning</Badge>
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Object Detection</Badge>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-lg">Web Technologies</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">React</Badge>
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">TypeScript</Badge>
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Vite</Badge>
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Tailwind CSS</Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Team/Vision */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    <Card className="glass border-white/10">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-primary/10">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl">Our Vision</CardTitle>
                                    <CardDescription>Shaping the future of construction</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground leading-relaxed">
                                We envision a future where every construction site is equipped with intelligent monitoring systems
                                that prevent accidents, optimize workflows, and ensure projects are completed on time and within budget.
                                Through continuous innovation and dedication to excellence, we're making this vision a reality.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                Join us in revolutionizing the construction industry—one project at a time.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
