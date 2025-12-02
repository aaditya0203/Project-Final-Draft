import { motion } from 'framer-motion';
import { ArrowRight, Layers, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeProps {
    onGetStarted: () => void;
}

export function Welcome({ onGetStarted }: WelcomeProps) {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-background gradient-animated">
            {/* Animated Background Circles */}
            <div className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] animate-float" />
            <div className="absolute -bottom-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[120px] animate-float" />

            <div className="container relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="space-y-6"
                >
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
                        Next-Gen Construction Monitoring
                    </div>

                    <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-white">
                        Build Smarter With <br />
                        <span className="text-primary">
                            Constructify
                        </span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
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
                    className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {[{ icon: Layers, title: 'Structural Analysis', desc: 'Real-time detection of columns, beams, and slabs with millimeter precision.' },
                    { icon: Zap, title: 'Progress Velocity', desc: 'Track completion rates and predict delays before they impact the schedule.' },
                    { icon: ShieldCheck, title: 'Safety Compliance', desc: 'Automated PPE detection and hazard alerts to keep your site safe.' }].map((feature, i) => (
                        <div
                            key={i}
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 text-left backdrop-blur-md transition-all hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/5 hover-lift glass"
                        >
                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors animate-wiggle">
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-gradient-animated">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.desc}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
