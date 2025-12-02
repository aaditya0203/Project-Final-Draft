import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface SignoutProps {
    onSignout: () => void;
}

export function Signout({ onSignout }: SignoutProps) {
    return (
        <motion.div
            className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="rounded-lg bg-card/60 p-8 shadow-lg backdrop-blur-md">
                <h2 className="mb-4 text-2xl font-bold">Signed Out</h2>
                <p className="mb-6 text-muted-foreground">
                    You have been signed out. Click the button below to return to the welcome page.
                </p>
                <Button variant="default" onClick={onSignout} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Return Home
                </Button>
            </div>
        </motion.div>
    );
}
