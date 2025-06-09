import React from 'react';
import styles from '@/styles/LottoSimulation.module.css';

interface Achievement {
    id: string;
    title: string;
    description: string;
    conditionDescription: string;
    condition: (stats: any, tryCount: number, net: number) => boolean;
}

interface AchievementsPanelProps {
    achievements: Achievement[];
    achievementsUnlocked: Record<string, boolean>;
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({
    achievements,
    achievementsUnlocked,
}) => {
    return (
        <div className={styles.achievementsPanel}>
            <h2 className={styles.panelTitle}>🏆 업적</h2>
            <ul className={styles.achievementsList}>
                {achievements.map(achievement => (
                    <li
                        key={achievement.id}
                        className={`${styles.achievementItem} ${achievementsUnlocked[achievement.id] ? styles.achievementUnlocked : ''}`}
                    >
                        {achievementsUnlocked[achievement.id] ? (
                            <>
                                <span className={styles.achievementTitle}>{achievement.title}</span>
                                <span className={styles.achievementDescription}>{achievement.description}</span>
                                <div className={styles.achievementTooltip}>
                                    {achievement.conditionDescription || achievement.description}
                                </div>
                            </>
                        ) : (
                            <>
                                <span className={styles.achievementTitle}>???</span>
                                <span className={styles.achievementDescription}>???</span>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};