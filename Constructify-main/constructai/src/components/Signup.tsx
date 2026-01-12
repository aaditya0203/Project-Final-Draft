import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

interface SignupProps {
    onSignupSuccess: () => void;
    onSwitchToLogin: () => void;
}

export function Signup({ onSignupSuccess, onSwitchToLogin }: SignupProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isContractor, setIsContractor] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Client-side validation for contractor email
        if (isContractor && !email.endsWith('@constructify.com')) {
            const msg = 'Contractors must use a @constructify.com email address';
            setError(msg);
            toast.error('Invalid Email', { description: msg });
            return;
        }

        setIsLoading(true);

        try {
            const role = isContractor ? 'contractor' : 'user';
            await api.register(email, password, name, role);
            toast.success('Account created!', { description: 'Please sign in with your new account.' });
            onSignupSuccess();
        } catch (err: any) {
            const msg = err.message || 'Registration failed. Please try again.';
            setError(msg);
            toast.error('Registration failed', { description: msg });
        } finally {
            setIsLoading(false);
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

            <div className="flex min-h-screen items-center justify-center px-4 py-12">
                <div className="w-full max-w-md glass p-8 backdrop-blur-md border border-white/10 shadow-lg">
                    <h2 className="mb-6 text-2xl font-bold text-center text-foreground">
                        {isContractor ? 'Contractor Registration' : 'Create Your Constructify Account'}
                    </h2>

                    <div className="flex justify-center mb-6">
                        <div className="flex items-center space-x-2 bg-muted/20 p-1 rounded-lg">
                            <Button
                                variant={!isContractor ? 'secondary' : 'ghost'}
                                size="sm"
                                type="button"
                                onClick={() => setIsContractor(false)}
                                className="text-xs"
                            >
                                Client
                            </Button>
                            <Button
                                variant={isContractor ? 'secondary' : 'ghost'}
                                size="sm"
                                type="button"
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
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isLoading}
                                className="bg-white/5 backdrop-blur-sm"
                            />
                        </div>
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
                            {isContractor && (
                                <p className="text-xs text-muted-foreground">
                                    Contractors must use @constructify.com email
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
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
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Sign Up <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <button
                            type="button"
                            className="font-medium text-primary underline"
                            onClick={onSwitchToLogin}
                            disabled={isLoading}
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
