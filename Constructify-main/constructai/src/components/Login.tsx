import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import api from '@/services/api';
import { toast } from 'sonner';

interface LoginProps {
    onLoginSuccess: () => void;
    onSwitchToSignup: () => void;
    onNavigate: (view: string) => void;
}

export function Login({ onLoginSuccess, onSwitchToSignup, onNavigate }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isContractor, setIsContractor] = useState(false);

    // Forgot Password State
    const [resetEmail, setResetEmail] = useState('');
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await api.login(email, password, isContractor ? 'contractor' : 'user');
            toast.success('Welcome back!', { description: isContractor ? 'Contractor portal' : 'Client portal' });
            onLoginSuccess();
        } catch (err: any) {
            const msg = err.message || 'Login failed. Please try again.';
            setError(msg);
            toast.error('Login failed', { description: msg });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsResetting(true);

        try {
            await api.forgotPassword(resetEmail);
            setIsResetDialogOpen(false);
            toast.success('Reset link sent!', { description: `If an account exists for ${resetEmail}, you will receive an email shortly.` });
            setResetEmail('');
        } catch (error) {
            toast.error('Failed to send reset link');
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <motion.div
            className="relative min-h-screen w-full overflow-hidden bg-background gradient-animated"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
        >
            {/* Floating background circles */}
            <div className="absolute -left-[15%] -top-[15%] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] animate-float" />
            <div className="absolute -bottom-[15%] -right-[15%] h-[600px] w-[600px] rounded-full bg-secondary/10 blur-[120px] animate-float" />

            <div className="absolute top-4 left-4 z-50">
                <Button
                    variant="ghost"
                    onClick={() => onNavigate('welcome')}
                    className="flex items-center gap-2 hover:bg-white/10"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
            </div>

            <div className="flex min-h-screen items-center justify-center px-4 py-12">
                <div className="w-full max-w-md glass p-8 backdrop-blur-md border border-white/10 shadow-lg">
                    <h2 className="mb-6 text-2xl font-bold text-center text-foreground">
                        {isContractor ? 'Contractor Portal' : 'Sign In to Constructify'}
                    </h2>

                    <div className="flex justify-center mb-6">
                        <div className="flex items-center space-x-2 bg-muted/20 p-1 rounded-lg">
                            <Button
                                variant={!isContractor ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setIsContractor(false)}
                                className="text-xs"
                            >
                                Client
                            </Button>
                            <Button
                                variant={isContractor ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setIsContractor(true)}
                                className="text-xs"
                            >
                                Contractor
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive mb-4">
                            {error}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-1">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={isContractor ? 'contractor@constructify.com' : 'you@example.com'}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="bg-white/5 backdrop-blur-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="link" className="px-0 font-normal text-xs text-muted-foreground hover:text-primary h-auto">
                                            Forgot password?
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px] glass border-white/10">
                                        <DialogHeader>
                                            <DialogTitle>Reset Password</DialogTitle>
                                            <DialogDescription>
                                                Enter your email address and we'll send you a link to reset your password.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleForgotPassword} className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="reset-email">Email</Label>
                                                <Input
                                                    id="reset-email"
                                                    type="email"
                                                    placeholder="name@example.com"
                                                    value={resetEmail}
                                                    onChange={(e) => setResetEmail(e.target.value)}
                                                    required
                                                    className="bg-white/5"
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={isResetting}>
                                                    {isResetting ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        'Send Reset Link'
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="bg-white/5 backdrop-blur-sm pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="sr-only">
                                        {showPassword ? "Hide password" : "Show password"}
                                    </span>
                                </Button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Login <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            className="font-medium text-primary underline"
                            onClick={onSwitchToSignup}
                            disabled={isLoading}
                        >
                            Sign Up
                        </button>
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
