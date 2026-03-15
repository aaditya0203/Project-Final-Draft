import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, HardHat, Sparkles, Upload, LayoutPanelLeft } from 'lucide-react';

interface Step {
    title: string;
    description: string;
    targetId?: string;
    icon: React.ElementType;
}

const STEPS: Step[] = [
    {
        title: "Welcome to Constructify",
        description: "Let's take a quick tour of your new AI-powered construction hub. It'll only take a minute!",
        icon: HardHat
    },
    {
        title: "Manage Your Projects",
        description: "This is where all your construction sites are listed. You can create as many as you need.",
        targetId: "tutorial-projects-list",
        icon: LayoutPanelLeft
    },
    {
        title: "Smart Uploads",
        description: "Click here to upload jobsite photos. Our AI will automatically analyze them for progress and safety.",
        targetId: "tutorial-upload-btn",
        icon: Upload
    },
    {
        title: "AI Analysis",
        description: "Once analyzed, check your Dashboard for structural detection, PPE compliance, and progress metrics.",
        icon: Sparkles
    }
];

export function OnboardingTutorial() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenTutorial');
        if (!hasSeen) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('hasSeenTutorial', 'true');
    };

    if (!isVisible) return null;

    const step = STEPS[currentStep];
    const Icon = step.icon;

    return (
        <AnimatePresence>
            <motion.div 
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div 
                    className="relative w-full max-w-md glass-strong rounded-3xl border border-white/20 shadow-2xl p-8 overflow-hidden"
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                        <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                        />
                    </div>

                    <button 
                        onClick={handleComplete}
                        className="absolute top-4 right-4 p-2 text-black/30 hover:text-black transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                                <Icon className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-black tracking-tight leading-tight">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-primary font-bold uppercase tracking-wider">
                                    Step {currentStep + 1} of {STEPS.length}
                                </p>
                            </div>
                        </div>

                        <p className="text-xl text-zinc-800 font-medium leading-relaxed min-h-[100px]">
                            {step.description}
                        </p>

                        <div className="flex items-center justify-between pt-4">
                            <Button 
                                variant="ghost" 
                                className="text-black/50 hover:text-black hover:bg-black/5 transition-all"
                                onClick={handleComplete}
                            >
                                Skip Tour
                            </Button>
                            <Button 
                                onClick={handleNext}
                                className="rounded-full px-8 h-12 shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-all font-bold text-base bg-black text-white"
                            >
                                {currentStep === STEPS.length - 1 ? "Get Started" : "Continue"}
                                <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Decorative Background */}
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
