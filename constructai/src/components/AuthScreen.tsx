import { useState } from 'react';
import { motion } from 'framer-motion';
import { HardHat } from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import api from '@/services/api';
import { toast } from 'sonner';

interface AuthScreenProps {
    onLoginSuccess: () => void;
    onBack: () => void;
}

export function AuthScreen({ onLoginSuccess, onBack }: AuthScreenProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        setIsLoading(true);
        try {
            if (credentialResponse.credential) {
                await api.googleLogin(credentialResponse.credential);
                toast.success('Successfully signed in!');
                onLoginSuccess();
            } else {
                toast.error('Google Sign-In failed', { description: 'No credential received from Google.' });
            }
        } catch (error: any) {
            toast.error('Authentication Failed', { 
                description: error.message || 'Could not authenticate with our servers.' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="relative min-h-screen w-full overflow-hidden bg-background gradient-animated flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Dynamic Background Elements */}
            <div className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] animate-rotate-slow pointer-events-none" />
            <div className="absolute -bottom-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-secondary/20 blur-[120px] animate-rotate-slow pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-accent/5 blur-[100px] animate-float pointer-events-none" />

            <motion.div 
                className="relative z-10 w-full max-w-md"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            >
                <div className="glass-strong p-8 rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    
                    <div className="flex flex-col items-center text-center space-y-6">
                        <motion.div 
                            className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-5 ring-1 ring-primary/20 backdrop-blur-sm"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.4 }}
                        >
                            <HardHat className="h-12 w-12 text-primary" />
                        </motion.div>

                        <div className="space-y-2">
                            <motion.h2 
                                className="text-4xl font-extrabold tracking-tight text-gradient-animated"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                Welcome Back
                            </motion.h2>
                            <motion.p 
                                className="text-sm text-black/60 font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                            >
                                Access your smart construction hub
                            </motion.p>
                        </div>

                        <motion.div 
                            className="w-full h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 1, duration: 1 }}
                        />

                        <div className="flex flex-col items-center justify-center w-full min-h-[80px]">
                            {isLoading ? (
                                <motion.div 
                                    className="flex flex-col items-center space-y-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    <div className="text-sm font-semibold text-primary animate-pulse">
                                        Validating Secure Connection...
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.2 }}
                                    className="hover-lift w-full flex justify-center"
                                >
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => {
                                            toast.error('Google Sign-In failed');
                                        }}
                                        useOneTap
                                        context="use"
                                        theme="filled_black"
                                        shape="pill"
                                        size="large"
                                        width="320"
                                    />
                                </motion.div>
                            )}
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.4 }}
                        >
                            <button
                                type="button"
                                onClick={onBack}
                                className="text-sm font-medium text-black/40 hover:text-primary transition-all flex items-center gap-2"
                            >
                                <span className="h-4 w-4 border-l-2 border-b-2 border-current rotate-45 mb-0.5" />
                                Return to Landing
                            </button>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
