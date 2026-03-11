import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HardHat } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { cn } from "@/lib/utils";

interface NavbarProps {
    currentView: string;
    isAuthenticated: boolean;
    onNavigate: (view: string) => void;
    onLogout: () => void;
    className?: string;
}

export function Navbar({ currentView, isAuthenticated, onNavigate, onLogout, className }: NavbarProps) {
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

    return (
        <header className={cn("sticky top-0 z-50 w-full border-b border-white/10 glass supports-[backdrop-filter]:bg-background/20", className)}>
            <div className="w-full px-6 sm:px-12 flex h-14 items-center justify-between">
                <div
                    className="flex items-center gap-2 font-bold cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onNavigate('welcome')}
                    role="button"
                >
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary animate-pulse-glow">
                        <HardHat className="h-5 w-5" />
                    </div>
                    <span className="text-gradient font-extrabold">Constructify</span>
                </div>
                <nav className="flex items-center gap-4 text-sm font-medium">
                    {isAuthenticated ? (
                        <Dialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={`hover:bg-primary/10 hover:text-primary transition-colors ${currentView === 'signout' ? 'bg-primary/10 text-primary' : ''}`}
                                >
                                    Sign Out
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass border-white/10">
                                <DialogHeader>
                                    <DialogTitle>Sign Out</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to sign out? You will need to log in again to access your projects.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowSignOutConfirm(false)} className="hover:bg-white/5">Cancel</Button>
                                    <Button variant="destructive" onClick={() => {
                                        setShowSignOutConfirm(false);
                                        onLogout();
                                    }}>Sign Out</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => onNavigate('login')} className="hover:bg-primary/10 hover:text-primary">Login</Button>
                            <Button variant="ghost" onClick={() => onNavigate('signup')} className="hover:bg-primary/10 hover:text-primary">Sign Up</Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        onClick={() => onNavigate('projects')}
                        className={`hover:bg-primary/10 hover:text-primary transition-colors ${currentView === 'projects' ? 'bg-primary/10 text-primary' : ''}`}
                    >
                        Projects
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => onNavigate('upload')}
                        className={`hover:bg-primary/10 hover:text-primary transition-colors ${currentView === 'upload' ? 'bg-primary/10 text-primary' : ''}`}
                    >
                        New Analysis
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => onNavigate('dashboard')}
                        className={`hover:bg-primary/10 hover:text-primary transition-colors ${currentView === 'dashboard' ? 'bg-primary/10 text-primary' : ''}`}
                    >
                        Dashboard
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => onNavigate('about')}
                        className={`hover:bg-primary/10 hover:text-primary transition-colors ${currentView === 'about' ? 'bg-primary/10 text-primary' : ''}`}
                    >
                        About Us
                    </Button>
                </nav>
            </div>
        </header >
    );
}
