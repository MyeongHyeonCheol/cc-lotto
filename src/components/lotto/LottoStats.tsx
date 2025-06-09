import React from 'react';
import styles from '@/styles/LottoSimulation.module.css';

interface LottoStatsProps {
    tryCount: number;
    winStats: {
        first: number;
        second: number;
        third: number;
        fourth: number;
        fifth: number;
        none: number;
    };
    totalSpent: number;
    totalWon: number;
    net: number;
    isAutoRunning: boolean;
    toggleAuto: () => void;
    mode: 'auto' | 'manual' | 'semi';
    manualSelection: number[];
    setShowResetModal: (show: boolean) => void;
}

export const LottoStats: React.FC<LottoStatsProps> = ({
    tryCount,
    winStats,
    totalSpent,
    totalWon,
    net,
    isAutoRunning,
    toggleAuto,
    mode,
    manualSelection,
    setShowResetModal,
}) => {
    return (
        <div className={styles.statsPanel}>
            <h2 className={styles.panelTitle}>📊 통계</h2>
            <table className={styles.statsTable}>
                <tbody>
                    <tr><td>총 시도 횟수</td><td>{tryCount}</td></tr>
                    <tr><td>1등</td><td>{winStats.first}</td></tr>
                    <tr><td>2등</td><td>{winStats.second}</td></tr>
                    <tr><td>3등</td><td>{winStats.third}</td></tr>
                    <tr><td>4등</td><td>{winStats.fourth}</td></tr>
                    <tr><td>5등</td><td>{winStats.fifth}</td></tr>
                    <tr><td>낙첨</td><td>{winStats.none}</td></tr>
                    <tr><td>총 사용 금액</td><td>{totalSpent.toLocaleString()}원</td></tr>
                    <tr><td>총 당첨 금액</td><td>{totalWon.toLocaleString()}원</td></tr>
                    <tr>
                        <td>순이익</td>
                        <td style={{ color: net >= 0 ? 'green' : 'red' }}>
                            {net.toLocaleString()}원 ({net >= 0 ? '이득' : '손해'})
                        </td>
                    </tr>
                </tbody>
            </table>

            <h2 className={styles.panelTitle} style={{ marginTop: '2rem' }}>자동 추첨</h2>
            <button
                className={styles.button}
                onClick={toggleAuto}
                disabled={
                    (!isAutoRunning && mode === 'manual' && manualSelection.length !== 6) ||
                    (!isAutoRunning && mode === 'semi' && manualSelection.length === 0)
                }
            >
                {isAutoRunning ? '자동 추첨 중지' : '자동 추첨 시작'}
            </button>

            {(mode === 'manual' && manualSelection.length !== 6) && !isAutoRunning && (
                <p style={{ fontSize: '0.9rem', color: 'red', marginTop: '0.5rem' }}>
                    수동 모드에서는 번호를 6개 모두 선택해야 자동 추첨이 가능합니다.
                </p>
            )}
            {(mode === 'semi' && manualSelection.length === 0) && !isAutoRunning && (
                <p style={{ fontSize: '0.9rem', color: 'red', marginTop: '0.5rem' }}>
                    반자동 모드에서는 최소 1개 이상 번호를 선택해야 자동 추첨을 시작할 수 있습니다.
                </p>
            )}

            <div className={styles.buttonSeparator} />

            <h2 className={styles.panelTitle} style={{ marginTop: '2rem' }}>모든 통계 및 업적 초기화</h2>
            <button
                className={styles.button}
                onClick={() => setShowResetModal(true)}
                style={{ backgroundColor: '#dc3545' }}
            >
                모든 통계 및 업적 초기화
            </button>
        </div>
    );
};