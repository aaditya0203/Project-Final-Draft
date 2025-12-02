// AuthTransition.tsx
// This component provides fade/slide animation for authentication pages (Welcome, Login, Signup).
// It uses framer-motion to animate its children when they mount/unmount.

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AuthTransitionProps {
    children: ReactNode;
}

const pageVariants = {
    initial: { opacity: 0, y: 10 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -10 },
};

const pageTransition = {
    ease: 'easeInOut',
    duration: 0.3,
} as const;

export function AuthTransition({ children }: AuthTransitionProps) {
    return (
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full min-h-screen"
        >
            {children}
        </motion.div>
    );
}
