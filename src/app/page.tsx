'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/LottoSimulation.module.css';

export default function Home() {
  const [myNumbers, setMyNumbers] = useState<number[]>([]);
  const [manualSelection, setManualSelection] = useState<number[]>([]);
  const [winningNumbers, setWinningNumbers] = useState<number[]>([]);
  const [bonusNumber, setBonusNumber] = useState<number | null>(null);
  const [mode, setMode] = useState<'auto' | 'manual' | 'semi'>('auto');

  const [tryCount, setTryCount] = useState(0);
  const [winStats, setWinStats] = useState({
    first: 0, second: 0, third: 0, fourth: 0, fifth: 0, none: 0,
  });

  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const min = 1;
  const max = 45;

  const generateUniqueNumbers = (count: number, exclude: number[] = []): number[] => {
    const numbers: number[] = [];
    while (numbers.length < count) {
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(randomNumber) && !exclude.includes(randomNumber)) {
        numbers.push(randomNumber);
      }
    }
    return numbers;
  };

  const evaluateResult = (mine: number[], win: number[], bonus: number) => {
    const matchCount = mine.filter(n => win.includes(n)).length;
    const hasBonus = mine.includes(bonus);

    setWinStats(prev => {
      const updated = { ...prev };
      if (matchCount === 6) updated.first++;
      else if (matchCount === 5 && hasBonus) updated.second++;
      else if (matchCount === 5) updated.third++;
      else if (matchCount === 4) updated.fourth++;
      else if (matchCount === 3) updated.fifth++;
      else updated.none++;
      return updated;
    });

    setTryCount(prev => prev + 1);
  };

  const getWinningNumbers = () => {
    if (myNumbers.length !== 6) return;
    const main = generateUniqueNumbers(6);
    const bonus = generateUniqueNumbers(1, main)[0];
    setWinningNumbers(main);
    setBonusNumber(bonus);
    evaluateResult(myNumbers, main, bonus);
  };

  const getMyNumbers = () => {
    const mine = generateUniqueNumbers(6);
    setMyNumbers(mine);
  };

  const handleManualSelect = (num: number) => {
    if (manualSelection.includes(num) || manualSelection.length >= 6) return;
    const updated = [...manualSelection, num];
    setManualSelection(updated);
    if (mode === 'manual' && updated.length === 6) setMyNumbers(updated);
  };

  const fillRemainingForSemiAuto = () => {
    if (manualSelection.length === 0) return alert('먼저 번호를 선택해주세요!');
    const remaining = 6 - manualSelection.length;
    const autoPart = generateUniqueNumbers(remaining, manualSelection);
    const final = [...manualSelection, ...autoPart];
    setMyNumbers(final);
  };

  const resetManual = () => {
    setManualSelection([]);
    setMyNumbers([]);
  };

  const startAutoDraw = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      const main = generateUniqueNumbers(6);
      const bonus = generateUniqueNumbers(1, main)[0];
      setWinningNumbers(main);
      setBonusNumber(bonus);

      let mine: number[] = [];

      if (mode === 'auto') {
        mine = generateUniqueNumbers(6);
        setMyNumbers(mine);
      } else if (mode === 'semi') {
        if (manualSelection.length === 0) return;
        const remaining = 6 - manualSelection.length;
        const autoPart = generateUniqueNumbers(remaining, manualSelection);
        mine = [...manualSelection, ...autoPart];
        setMyNumbers(mine);
      } else if (mode === 'manual') {
        if (manualSelection.length !== 6) return;
        mine = [...manualSelection];
        setMyNumbers(mine);
      }

      evaluateResult(mine, main, bonus);
    }, 500);
  };

  const stopAutoDraw = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const toggleAuto = () => {
    if (isAutoRunning) {
      stopAutoDraw();
      setIsAutoRunning(false);
    } else {
      startAutoDraw();
      setIsAutoRunning(true);
    }
  };

  const totalSpent = tryCount * 1000;
  const totalWon = winStats.first * 2000000000 + winStats.second * 50000000 +
    winStats.third * 1500000 + winStats.fourth * 50000 + winStats.fifth * 5000;
  const net = totalWon - totalSpent;

  const getResultMessage = (): string | null => {
    if (myNumbers.length !== 6 || winningNumbers.length !== 6 || bonusNumber === null) return null;
    const match = myNumbers.filter(n => winningNumbers.includes(n)).length;
    const bonus = myNumbers.includes(bonusNumber);

    if (match === 6) return '🎉 축하합니다! 1등입니다!';
    if (match === 5 && bonus) return '🥳 축하합니다! 2등입니다!';
    if (match === 5) return '🎊 축하합니다! 3등입니다!';
    if (match === 4) return '🎉 축하합니다! 4등입니다!';
    if (match === 3) return '👏 축하합니다! 5등입니다!';
    return '😢 아쉽지만 다음 기회에!';
  };

  return (
    <div className={styles.flexWrapper}>
      <div className={styles.mainPanel}>
        <h1 className={styles.title}>🎰 LOTTO SIMULATION 🎰</h1>
        <hr />

        <div className={styles.section}>
          <label>방식을 선택해주세요!
            <select
              className={styles.dropdown}
              value={mode}
              onChange={(e) => {
                const selected = e.target.value as 'auto' | 'manual' | 'semi';
                setMode(selected);
                resetManual();
                if (isAutoRunning) {
                  stopAutoDraw();
                  setIsAutoRunning(false);
                }
              }}
            >
              <option value="auto">자동</option>
              <option value="manual">수동</option>
              <option value="semi">반자동</option>
            </select>
          </label>
        </div>

        <div className={styles.section}>
          <h2>내 번호</h2>
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
                    disabled={manualSelection.includes(num)}
                    className={`${styles.numberButton} ${manualSelection.includes(num) ? styles.selected : ''}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div>선택한 번호: {manualSelection.join(', ')}</div>
              {mode === 'manual' && manualSelection.length === 6 && (
                <div className={styles.complete}>✅ 번호 선택 완료!</div>
              )}
              {mode === 'semi' && (
                <button
                  className={styles.button}
                  onClick={fillRemainingForSemiAuto}
                  disabled={manualSelection.length > 6}
                >
                  번호 생성
                </button>
              )}
            </>
          )}
        </div>

        <div className={styles.section}>
          <h2>당첨 번호</h2>
          <div className={styles.numbers}>{winningNumbers.join(', ')}</div>
          <div className={styles.bonus}>보너스 번호: {bonusNumber ?? '-'}</div>
          <button
            className={styles.button}
            onClick={getWinningNumbers}
            disabled={myNumbers.length !== 6}
          >
            추첨 시작!
          </button>
        </div>

        <div className={styles.section}>
          <h2>결과</h2>
          <div>
            {myNumbers.length > 0 && winningNumbers.length > 0
              ? `당첨된 번호: ${myNumbers.filter(num => winningNumbers.includes(num)).join(', ')}`
              : '번호를 생성해주세요!'}
          </div>
          <div className={styles.resultMessage}>{getResultMessage()}</div>
        </div>
      </div>

      <div className={styles.statsPanel}>
        <h2>📊 통계</h2>
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

        <h2 style={{ marginTop: '2rem' }}>자동 추첨</h2>
        <button
          className={styles.button}
          onClick={toggleAuto}
          disabled={
            (mode === 'manual' && manualSelection.length !== 6) ||
            (mode === 'semi' && manualSelection.length === 0)
          }
        >
          {isAutoRunning ? '자동 추첨 중지' : '자동 추첨 시작'}
        </button>

        {(mode === 'manual' && manualSelection.length !== 6) && !isAutoRunning && (
          <div style={{ fontSize: '0.9rem', color: 'red', marginTop: '0.5rem' }}>
            수동 모드에서는 번호를 6개 모두 선택해야 자동 추첨이 가능합니다.
          </div>
        )}
        {(mode === 'semi' && manualSelection.length === 0) && !isAutoRunning && (
          <div style={{ fontSize: '0.9rem', color: 'red', marginTop: '0.5rem' }}>
            반자동 모드에서는 최소 1개 이상 번호를 선택해야 합니다.
          </div>
        )}
      </div>
    </div>
  );
}
