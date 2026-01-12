import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Layers, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { InteractiveFeatureCard } from '@/components/InteractiveFeatureCard';
import RotatingText from '@/components/RotatingText';

interface WelcomeProps {
    onGetStarted: () => void;
    currentView: string;
    isAuthenticated: boolean;
    onNavigate: (view: string) => void;
    onLogout: () => void;
}

export function Welcome({ onGetStarted, currentView, isAuthenticated, onNavigate, onLogout }: WelcomeProps) {
    const [isHeaderHovered, setIsHeaderHovered] = useState(false);

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-background gradient-animated text-foreground">
            {/* Navbar */}
            <Navbar
                className="relative z-50"
                currentView={currentView}
                isAuthenticated={isAuthenticated}
                onNavigate={onNavigate}
                onLogout={onLogout}
            />

            <div className="container mx-auto relative z-10 flex flex-col items-center justify-center px-4 py-8 lg:py-16 text-center">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="max-w-4xl space-y-8"
                >
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
                        Next-Gen Construction Monitoring
                    </div>

                    <h1
                        className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-white"
                        onMouseEnter={() => setIsHeaderHovered(true)}
                        onMouseLeave={() => setIsHeaderHovered(false)}
                    >
                        Build Smarter With <br />
                        <motion.span
                            className="text-primary inline-flex h-[1.1em] overflow-hidden"
                            animate={{ scale: isHeaderHovered ? 1.1 : 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <RotatingText
                                texts={['Constructify', 'Precision', 'Safety', 'Efficiency']}
                                mainClassName="text-primary px-2 sm:px-3 md:px-0 overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
                                staggerFrom="last"
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "-120%" }}
                                staggerDuration={0.025}
                                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                                rotationInterval={2000}
                                auto={isHeaderHovered}
                            />
                        </motion.span>
                    </h1>

                    <p className="mx-auto max-w-3xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
                        Automated progress tracking, structural integrity analysis, and real-time safety monitoring powered by advanced computer vision.
                    </p>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            size="lg"
                            className="h-14 rounded-full px-8 text-lg shadow-lg shadow-primary/25 animate-bounce-in"
                            onClick={onGetStarted}
                        >
                            Get Started
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                    className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
                >
                    {[{
                        icon: Layers,
                        title: 'Structural Analysis',
                        desc: 'Real-time detection of columns, beams, and slabs with millimeter precision.',
                        img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop'
                    },
                    {
                        icon: Zap,
                        title: 'Progress Velocity',
                        desc: 'Track completion rates and predict delays before they impact the schedule.',
                        img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop'
                    },
                    {
                        icon: ShieldCheck,
                        title: 'Safety Compliance',
                        desc: 'Automated PPE detection and hazard alerts to keep your site safe.',
                        img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop'
                    }].map((feature, i) => (
                        <InteractiveFeatureCard
                            key={i}
                            title={feature.title}
                            description={feature.desc}
                            icon={feature.icon}
                            imageUrl={feature.img}
                        />
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
