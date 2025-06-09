import React from 'react';
import styles from '@/styles/LottoSimulation.module.css';

interface AchievementToastProps {
    currentAchievementToast: { id: string; title: string; description: string; } | null;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
    currentAchievementToast,
}) => {
    if (!currentAchievementToast) return null;

    return (
        <div className={styles.achievementToastContainer}>
            <div className={styles.achievementToast}>
                <h4>✨ 업적 달성! ✨</h4>
                <h5>{currentAchievementToast.title}</h5>
                <p>{currentAchievementToast.description}</p>
            </div>
        </div>
    );
};