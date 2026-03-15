import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HardHat, Menu, X } from 'lucide-react';
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { label: 'Projects', view: 'projects' },
        { label: 'New Analysis', view: 'upload' },
        { label: 'Dashboard', view: 'dashboard' },
        { label: 'About Us', view: 'about' },
    ];

    const handleNavigate = (view: string) => {
        onNavigate(view);
        setMobileMenuOpen(false);
    };

    return (
        <header className={cn("sticky top-0 z-50 w-full border-b border-white/10 glass supports-[backdrop-filter]:bg-background/20", className)}>
            <div className="w-full px-4 sm:px-6 lg:px-12 flex h-14 items-center justify-between">
                {/* Logo */}
                <div
                    className="flex items-center gap-2 font-bold cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleNavigate('welcome')}
                    role="button"
                >
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary animate-pulse-glow">
                        <HardHat className="h-5 w-5" />
                    </div>
                    <span className="text-gradient font-extrabold">Constructify</span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
                    {navItems.map((item) => (
                        <Button
                            key={item.view}
                            id={item.view === 'projects' ? 'tutorial-projects-list' : item.view === 'upload' ? 'tutorial-upload-btn' : undefined}
                            variant="ghost"
                            onClick={() => handleNavigate(item.view)}
                            className={`hover:bg-primary/10 hover:text-primary transition-colors ${currentView === item.view ? 'bg-primary/10 text-primary' : ''}`}
                        >
                            {item.label}
                        </Button>
                    ))}
                    {isAuthenticated ? (
                        <Dialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors">
                                    Sign Out
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="glass border-white/10">
                                <DialogHeader>
                                    <DialogTitle>Sign Out</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to sign out?
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowSignOutConfirm(false)}>Cancel</Button>
                                    <Button variant="destructive" onClick={() => { setShowSignOutConfirm(false); onLogout(); }}>Sign Out</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => handleNavigate('auth')} className="hover:bg-primary/10 hover:text-primary">Sign In</Button>
                        </>
                    )}
                </nav>

                {/* Mobile Hamburger */}
                <button
                    className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-white/10 glass px-4 py-3 flex flex-col gap-1">
                    {navItems.map((item) => (
                        <button
                            key={item.view}
                            onClick={() => handleNavigate(item.view)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                currentView === item.view
                                    ? 'bg-primary/20 text-primary'
                                    : 'hover:bg-white/10'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                    <div className="border-t border-white/10 mt-1 pt-2">
                        {isAuthenticated ? (
                            <button
                                onClick={() => { setMobileMenuOpen(false); setShowSignOutConfirm(true); }}
                                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <>
                                <button onClick={() => handleNavigate('auth')} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">Sign In</button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Sign out dialog for mobile */}
            <Dialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
                <DialogContent className="glass border-white/10">
                    <DialogHeader>
                        <DialogTitle>Sign Out</DialogTitle>
                        <DialogDescription>Are you sure you want to sign out?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSignOutConfirm(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => { setShowSignOutConfirm(false); onLogout(); }}>Sign Out</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </header>
    );
}
