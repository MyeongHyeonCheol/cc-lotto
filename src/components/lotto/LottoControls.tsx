import React from 'react';
import styles from '@/styles/LottoSimulation.module.css';

interface LottoControlsProps {
    mode: 'auto' | 'manual' | 'semi';
    setMode: (mode: 'auto' | 'manual' | 'semi') => void;
    myNumbers: number[];
    getMyNumbers: () => void;
    manualSelection: number[];
    handleManualSelect: (num: number) => void;
    fillRemainingForSemiAuto: () => void;
    resetManual: () => void;
    winningNumbers: number[];
    getWinningNumbers: () => void;
    min: number;
    max: number;
    isAutoRunning: boolean; // 추가: 모드 변경 시 자동 추첨 중지
    bonusNumber: number | null;
}

export const LottoControls: React.FC<LottoControlsProps> = ({
    mode,
    setMode,
    myNumbers,
    getMyNumbers,
    manualSelection,
    handleManualSelect,
    fillRemainingForSemiAuto,
    resetManual,
    winningNumbers,
    getWinningNumbers,
    min,
    max,
    isAutoRunning,
    bonusNumber
}) => {
    return (
        <>
            <div className={styles.section}>
                <label>방식을 선택해주세요!
                    <select
                        className={styles.dropdown}
                        value={mode}
                        onChange={(e) => {
                            const selected = e.target.value as 'auto' | 'manual' | 'semi';
                            setMode(selected);
                            resetManual(); // 모드 변경 시 수동/반자동 초기화 및 자동 추첨 중지
                        }}
                    >
                        <option value="auto">자동</option>
                        <option value="manual">수동</option>
                        <option value="semi">반자동</option>
                    </select>
                </label>
            </div>

            <div className={styles.section}>
                <h2 className={styles.panelTitle}>내 번호</h2>
                <div className={styles.numbers}>{myNumbers.join(', ')}</div>
                {mode === 'auto' && (
                    <button className={styles.button} onClick={getMyNumbers}>번호 생성</button>
                )}
                {(mode === 'manual' || mode === 'semi') && (
                    <>
                        <div className={styles.numberGrid}>
                            {Array.from({ length: max }, (_, i) => i + 1).map((num) => (
                                <button
                                    key={num}
                                    onClick={() => handleManualSelect(num)}
                                    disabled={manualSelection.length === 6 && !manualSelection.includes(num)}
                                    className={`${styles.numberButton} ${manualSelection.includes(num) ? styles.selected : ''}`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div>선택한 번호: {manualSelection.join(', ')}</div>
                        {mode === 'semi' && manualSelection.length === 6 && (
                            <div className={styles.complete}>✅ 반자동 번호 선택 완료!</div>
                        )}
                        {mode === 'manual' && manualSelection.length === 6 && (
                            <div className={styles.complete}>✅ 수동 번호 선택 완료!</div>
                        )}

                        {mode === 'semi' && manualSelection.length < 6 && (
                            <button
                                className={styles.button}
                                onClick={fillRemainingForSemiAuto}
                                disabled={manualSelection.length === 0}
                            >
                                나머지 번호 채우기
                            </button>
                        )}
                        {(mode === 'manual' || mode === 'semi') && (
                            <button
                                className={styles.button}
                                onClick={resetManual}
                                style={{ marginLeft: '10px' }}
                            >
                                선택 초기화
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className={styles.section}>
                <h2 className={styles.panelTitle}>당첨 번호</h2>
                <div className={styles.numbers}>{winningNumbers.join(', ')}</div>
                <div className={styles.bonus}>보너스 번호: {winningNumbers.length > 0 && bonusNumber !== null ? bonusNumber : '-'}</div>
                <button
                    className={styles.button}
                    onClick={getWinningNumbers}
                    disabled={myNumbers.length !== 6}
                >
                    추첨 시작!
                </button>
            </div>
        </>
    );
};