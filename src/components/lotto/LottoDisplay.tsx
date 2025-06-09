import React from 'react';
import styles from '@/styles/LottoSimulation.module.css';

interface LottoDisplayProps {
    myNumbers: number[];
    winningNumbers: number[];
    bonusNumber: number | null;
    getResultMessage: () => string | null;
}

export const LottoDisplay: React.FC<LottoDisplayProps> = ({
    myNumbers,
    winningNumbers,
    bonusNumber,
    getResultMessage,
}) => {
    return (
        <div className={styles.section}>
            <h2 className={styles.panelTitle}>결과</h2>
            <div
                className={styles.matchedNumbersDisplay}
            >
                {myNumbers.length > 0 && winningNumbers.length > 0
                    ? `당첨된 번호: ${myNumbers.filter(num => winningNumbers.includes(num)).join(', ')}`
                    : '번호를 생성해주세요!'}
            </div>
            <div className={styles.resultMessage}>{getResultMessage()}</div>
        </div>
    );
};