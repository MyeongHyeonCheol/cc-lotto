import React from 'react';
import styles from '@/styles/LottoSimulation.module.css';

interface ResetModalProps {
    showResetModal: boolean;
    setShowResetModal: (show: boolean) => void;
    handleResetConfirm: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({
    showResetModal,
    setShowResetModal,
    handleResetConfirm,
}) => {
    if (!showResetModal) return null;

    return (
        <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
                <h3>모든 통계 및 업적 초기화</h3>
                <p>모든 시뮬레이션 통계 정보와 달성된 업적이 <br/>초기화됩니다. 계속하시겠습니까?</p>
                <div className={styles.modalActions}>
                    <button
                        className={`${styles.modalButton} ${styles.confirm}`}
                        onClick={handleResetConfirm}
                    >
                        확인
                    </button>
                    <button
                        className={`${styles.modalButton} ${styles.cancel}`}
                        onClick={() => setShowResetModal(false)}
                    >
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};