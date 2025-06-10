// src/components/lotto/LottoRecords.tsx

'use client';

import React, { useMemo } from 'react';
import styles from '@/styles/LottoSimulation.module.css';

export interface LottoRecord {
  id: string; // Used to identify the record uniquely (timestamp)
  rank: number;
  myNumbers: number[]; // My chosen numbers (saved in sorted order)
  winningNumbers: number[]; // Actual winning numbers (6 numbers)
  bonusNumber: number; // Actual winning bonus number
  matchedNumbers: number[]; // Numbers from myNumbers that match winningNumbers
}

interface LottoRecordsProps {
  records: LottoRecord[];
}

export const LottoRecords: React.FC<LottoRecordsProps> = ({ records }) => {
  // Memoize the latest record for each rank (1st to 5th)
  const latestRecordsByRank = useMemo(() => {
    const latest: Record<number, LottoRecord | undefined> = {};
    // Sort records by ID (timestamp) in descending order to get the latest
    const sortedRecords = [...records].sort((a, b) => parseInt(b.id) - parseInt(a.id));

    for (const record of sortedRecords) {
      // If we haven't found a record for this rank yet, and it's between 1st and 5th
      if (!latest[record.rank] && record.rank >= 1 && record.rank <= 5) {
        latest[record.rank] = record;
      }
    }
    return latest;
  }, [records]);

  // Define the order of ranks to display
  const ranksToDisplay = [1, 2, 3, 4, 5];

  return (
    <div className={styles.recordsContainer}>
      <h2 className={styles.panelTitle}>당첨기록</h2>

      {ranksToDisplay.map(rank => {
        const record = latestRecordsByRank[rank];
        // Display the numbers exactly as they were saved in `myNumbers`.
        // `myNumbers` is already sorted when saved in LottoSimulation.tsx.
        const displayNumbers = record ? record.myNumbers : [];

        return (
          <div className={styles.rankSection} key={rank}>
            <h3 className={styles.rankSectionTitle}>{rank}등 당첨 기록</h3>
            {record ? (
              <div className={styles.recordItem}>
                <div className={styles.recordHeader}>
                  <h3 className={styles.rankDisplay}>{record.rank}등</h3>
                  {/* Date/timestamp is removed as requested */}
                </div>

                <div className={styles.numbersSection}>
                  <p className={styles.numbersLabel}>나의 번호:</p>
                  <div className={styles.numbersContainer}>
                    {displayNumbers.map(num => (
                      <span
                        key={`${record.id}-${rank}-${num}`} // Use rank in key for uniqueness
                        // Apply 'matched' class if the number is in matchedNumbers (for blue highlight)
                        className={`${styles.numberBall} ${record.matchedNumbers.includes(num) ? styles.matched : ''}`}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className={styles.noRecordsMessage}>아직 {rank}등 당첨 기록이 없습니다.</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LottoRecords;