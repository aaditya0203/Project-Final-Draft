import React from 'react';
import styles from './InteractiveFeatureCard.module.css';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveFeatureCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    imageUrl: string;
    className?: string;
}

export const InteractiveFeatureCard: React.FC<InteractiveFeatureCardProps> = ({
    title,
    description,
    icon: Icon,
    imageUrl,
    className
}) => {
    return (
        <div className={cn(styles.wrap, className)}>
            {/* The Image (Background layer) */}
            <div
                className={styles.imageContent}
                style={{ backgroundImage: `url(${imageUrl})` }}
            />

            {/* The Overlay (Foreground layer that slides away) */}
            <div className={styles.overlay}>
                <div className={styles.overlayContent}>
                    <div>
                        <div className={styles.iconWrapper}>
                            <Icon size={28} />
                        </div>
                        <h3 className={styles.title}>{title}</h3>
                        <p className={styles.description}>{description}</p>
                    </div>

                    {/* Decorative dots included in overlay so they move with it (or keep static?) 
                        User CSS had dots moving. Let's keep them separate if we want them static indication 
                        or inside overlay to slide. 
                        User CSS: .wrap:hover .dots { transform: translateX(1rem); } -> implies movement.
                    */}
                    <div className={styles.dots}>
                        <div className={styles.dot} />
                        <div className={styles.dot} />
                        <div className={styles.dot} />
                    </div>
                </div>
            </div>
        </div>
    );
};
