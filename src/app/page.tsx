'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/LottoSimulation.module.css';

// 업적 데이터 정의
const ACHIEVEMENTS = [
  {
    id: 'firstTry',
    title: '벼락부자를 꿈꾸며..',
    description: '로또를 처음 시작하셨습니다!', // 달성 후 설명
    conditionDescription: '로또 시뮬레이션 최초 실행', // 해금 조건 설명
    condition: (stats: any, tryCount: number, net: number) => tryCount === 1,
  },
  {
    id: 'lostChicken',
    title: '먹는게 남는 장사',
    description: '당신은 치킨 한마리를 잃었습니다..',
    conditionDescription: '순이익 -20,000원 이하',
    condition: (stats: any, tryCount: number, net: number) => net <= -20000,
  },
  {
    id: 'maxAmountLimit',
    title: '최대 금액 한도',
    description: '로또는 매주 최대 1인당 10만원까지 구매 가능합니다.',
    conditionDescription: '로또 시뮬레이션 100회 이상 진행',
    condition: (stats: any, tryCount: number, net: number) => tryCount >= 100, // 100회 시도 (10만원)
  },
  {
    id: 'fifthWin20',
    title: '생각보다 5등도 당첨되기 힘들죠?',
    description: '실제로 로또 5등 당첨 확률은 불과 2.2%입니다.',
    conditionDescription: '5등 당첨 횟수가 20회',
    condition: (stats: any, tryCount: number, net: number) => stats.fifth >= 20,
  },
  {
    id: 'lost1000Times',
    title: '이정도면 하나 줄 때 됐잖아!',
    description: '딱 한 장만 더 사볼까요..?',
    conditionDescription: '낙첨 횟수가 1,000회',
    condition: (stats: any, tryCount: number, net: number) => stats.none >= 1000,
  },
  {
    id: 'thirdWin',
    title: '3등 당첨을 진심으로 축하합니다!',
    description: '당신은 150만원의 주인이 되셨습니다!', 
    conditionDescription: '3등 당첨',
    condition: (stats: any, tryCount: number, net: number) => stats.third >= 1,
  },
  {
    id: 'secondWin',
    title: '그거 아시나요?',
    description: '올림픽 은메달리스트들은 동메달리스트들에 비해 행복지수가 낮답니다.. 왜일까요?',
    conditionDescription: '2등 당첨',
    condition: (stats: any, tryCount: number, net: number) => stats.second >= 1,
  },
  {
    id: 'firstWin',
    title: '1등 당첨을 축하드립니다만',
    description: '돈은 드릴 수 없습니다.. 그러게 왜 여기서..',
    conditionDescription: '1등 당첨',
    condition: (stats: any, tryCount: number, net: number) => stats.first >= 1,
  },
];


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

  const [showResetModal, setShowResetModal] = useState(false);

  // 업적 달성 상태 관리 (id: boolean)
  const [achievementsUnlocked, setAchievementsUnlocked] = useState<Record<string, boolean>>({});
  // 현재 표시할 업적 알림 (Toast)
  const [currentAchievementToast, setCurrentAchievementToast] = useState<{ id: string; title: string; description: string; } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const min = 1;
  const max = 45;

  // 로컬 스토리지에서 통계 및 업적 상태 불러오기
  useEffect(() => {
    const savedTryCount = localStorage.getItem('lottoTryCount');
    const savedWinStats = localStorage.getItem('lottoWinStats');
    const savedAchievements = localStorage.getItem('lottoAchievements');

    if (savedTryCount) {
      setTryCount(parseInt(savedTryCount, 10));
    }
    if (savedWinStats) {
      setWinStats(JSON.parse(savedWinStats));
    }
    if (savedAchievements) {
      setAchievementsUnlocked(JSON.parse(savedAchievements));
    }
  }, []);

  // 통계 및 업적 상태 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('lottoTryCount', tryCount.toString());
    localStorage.setItem('lottoWinStats', JSON.stringify(winStats));
    localStorage.setItem('lottoAchievements', JSON.stringify(achievementsUnlocked));
  }, [tryCount, winStats, achievementsUnlocked]);

  // 업적 달성 로직 (tryCount, winStats, net이 변경될 때마다 실행)
  useEffect(() => {
    const totalSpent = tryCount * 1000;
    const totalWon = winStats.first * 2000000000 + winStats.second * 50000000 +
                      winStats.third * 1500000 + winStats.fourth * 50000 + winStats.fifth * 5000;
    const currentNet = totalWon - totalSpent;

    ACHIEVEMENTS.forEach(achievement => {
      // 아직 달성하지 않은 업적만 검사
      if (!achievementsUnlocked[achievement.id] && achievement.condition(winStats, tryCount, currentNet)) {
        setAchievementsUnlocked(prev => ({ ...prev, [achievement.id]: true }));
        // 업적 달성 알림 표시
        setCurrentAchievementToast({ id: achievement.id, title: achievement.title, description: achievement.description });

        // 5초 후에 알림 사라지게 설정
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = setTimeout(() => {
          setCurrentAchievementToast(null);
          toastTimeoutRef.current = null;
        }, 5000);
      }
    });
  }, [tryCount, winStats, achievementsUnlocked]);


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
    if (manualSelection.includes(num)) { // 이미 선택된 번호는 해제
        setManualSelection(prev => prev.filter(n => n !== num));
    } else { // 새로운 번호 선택
      if (manualSelection.length >= 6) return; // 6개 이상 선택 불가
      const updated = [...manualSelection, num].sort((a, b) => a - b); // 정렬하여 저장
      setManualSelection(updated);
      // 반자동 모드에서 6개 모두 선택 시 내 번호로 자동 설정
      if (mode === 'semi' && updated.length === 6) {
          setMyNumbers(updated);
      }
      // 수동 모드에서 6개 모두 선택 시 내 번호로 자동 설정
      if (mode === 'manual' && updated.length === 6) {
          setMyNumbers(updated);
      }
    }
  };


  const fillRemainingForSemiAuto = () => {
    if (manualSelection.length === 0) return alert('먼저 번호를 선택해주세요!');
    // 6개를 모두 선택한 경우, 추가로 채울 번호가 없으므로 바로 setMyNumbers
    if (manualSelection.length === 6) {
        setMyNumbers([...manualSelection]);
        return;
    }
    const remaining = 6 - manualSelection.length;
    const autoPart = generateUniqueNumbers(remaining, manualSelection);
    const final = [...manualSelection, ...autoPart].sort((a, b) => a - b);
    setMyNumbers(final);
  };

  const resetManual = () => {
    setManualSelection([]);
    setMyNumbers([]);
    setWinningNumbers([]);
    setBonusNumber(null);
    // ✨ 자동 추첨 중지 로직 추가
    stopAutoDraw();
    setIsAutoRunning(false);
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
        if (manualSelection.length === 0) {
          stopAutoDraw();
          setIsAutoRunning(false);
          alert('반자동 모드에서는 최소 1개 이상 번호를 선택해야 자동 추첨을 시작할 수 있습니다.');
          return;
        }
        // 반자동 모드에서 6개 모두 선택했을 경우 수동처럼 동작
        if (manualSelection.length === 6) {
            mine = [...manualSelection];
            setMyNumbers(mine); // 내 번호는 이미 manualSelection으로 설정됨
        } else {
            const remaining = 6 - manualSelection.length;
            const autoPart = generateUniqueNumbers(remaining, manualSelection);
            mine = [...manualSelection, ...autoPart].sort((a, b) => a - b);
            setMyNumbers(mine);
        }
      } else if (mode === 'manual') {
        if (manualSelection.length !== 6) {
          stopAutoDraw();
          setIsAutoRunning(false);
          alert('수동 모드에서는 번호를 6개 모두 선택해야 자동 추첨이 가능합니다.');
          return;
        }
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
      // 자동 추첨 시작 전에 현재 선택된 번호가 6개인지 확인하여 myNumbers 설정
      if (mode === 'manual' && manualSelection.length !== 6) {
        alert('수동 모드에서는 번호를 6개 모두 선택해야 자동 추첨이 가능합니다.');
        return;
      }
      if (mode === 'semi' && manualSelection.length === 0) {
        alert('반자동 모드에서는 최소 1개 이상 번호를 선택해야 자동 추첨을 시작할 수 있습니다.');
        return;
      }
      if ((mode === 'manual' || (mode === 'semi' && manualSelection.length === 6)) && manualSelection.length === 6) {
          setMyNumbers([...manualSelection].sort((a,b) => a-b));
      } else if (mode === 'semi' && manualSelection.length > 0 && manualSelection.length < 6) {
          // 반자동인데 6개 미만이면 자동 채워야 함
          const remaining = 6 - manualSelection.length;
          const autoPart = generateUniqueNumbers(remaining, manualSelection);
          setMyNumbers([...manualSelection, ...autoPart].sort((a,b) => a-b));
      } else if (mode === 'auto') {
          // 자동 모드는 시작 시 myNumbers를 생성할 필요 없음 (interval에서 처리)
      }

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

  // 통계 및 업적 초기화 로직
  const handleResetConfirm = () => {
    localStorage.removeItem('lottoTryCount');
    localStorage.removeItem('lottoWinStats');
    localStorage.removeItem('lottoAchievements');

    setTryCount(0);
    setWinStats({ first: 0, second: 0, third: 0, fourth: 0, fifth: 0, none: 0 });
    setAchievementsUnlocked({});

    setMyNumbers([]);
    setWinningNumbers([]);
    setBonusNumber(null);
    setManualSelection([]);
    stopAutoDraw();
    setIsAutoRunning(false);
    setShowResetModal(false);
    setCurrentAchievementToast(null);
  };

  return (
    <div className={styles.flexWrapper}>
      {/* 업적 알림 (Toast) 컨테이너 */}
      {currentAchievementToast && (
        <div className={styles.achievementToastContainer}>
          <div className={styles.achievementToast}>
            <h4>✨ 업적 달성! ✨</h4>
            <h5>{currentAchievementToast.title}</h5>
            <p>{currentAchievementToast.description}</p>
          </div>
        </div>
      )}

      <div className={styles.mainPanel}>
        <h1 className={styles.title}>🎰 LOTTO SIMULATION 🎰</h1>
        <hr className={styles.divider} />

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
                    // 6개 선택 완료 시 비활성화 (수동, 반자동 모두)
                    disabled={manualSelection.length === 6 && !manualSelection.includes(num)}
                    className={`${styles.numberButton} ${manualSelection.includes(num) ? styles.selected : ''}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div>선택한 번호: {manualSelection.join(', ')}</div>
              {/* 반자동 모드에서 6개 선택 완료 시 메시지 */}
              {mode === 'semi' && manualSelection.length === 6 && (
                <div className={styles.complete}>✅ 반자동 번호 선택 완료!</div>
              )}
              {/* 수동 모드에서 6개 선택 완료 시 메시지 */}
              {mode === 'manual' && manualSelection.length === 6 && (
                <div className={styles.complete}>✅ 수동 번호 선택 완료!</div>
              )}
              
              {mode === 'semi' && manualSelection.length < 6 && ( // 6개 미만일 때만 '번호 생성' 버튼 표시
                <button
                  className={styles.button}
                  onClick={fillRemainingForSemiAuto}
                  disabled={manualSelection.length === 0} // 반자동 시 선택 번호 없으면 비활성화
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
      </div>

      {/* 새로운 컨테이너: statsPanel과 achievementsPanel을 함께 묶음 */}
      <div className={styles.statsAndAchievementsContainer}>
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
              // 자동 추첨 시작 시, 각 모드별 번호 선택 상태 확인
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

        {/* 🏆 업적 패널 */}
        <div className={styles.achievementsPanel}>
          <h2 className={styles.panelTitle}>🏆 업적</h2>
          <ul className={styles.achievementsList}>
            {ACHIEVEMENTS.map(achievement => (
              <li 
                key={achievement.id} 
                className={`${styles.achievementItem} ${achievementsUnlocked[achievement.id] ? styles.achievementUnlocked : ''}`}
              >
                {achievementsUnlocked[achievement.id] ? (
                  <>
                    {/* 업적 달성 시: 제목과 설명 (description) 표시, 툴팁으로 조건 설명 제공 */}
                    <span className={styles.achievementTitle}>{achievement.title}</span>
                    <span className={styles.achievementDescription}>{achievement.description}</span>
                    <div className={styles.achievementTooltip}>
                      {achievement.conditionDescription || achievement.description}
                    </div>
                  </>
                ) : (
                  <>
                    {/* 업적 미달성 시: '???' 표시, 툴팁 없음 */}
                    <span className={styles.achievementTitle}>???</span>
                    <span className={styles.achievementDescription}>???</span>
                    {/* 미달성 업적에는 툴팁을 표시하지 않습니다. */}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 모달 렌더링 */}
      {showResetModal && (
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
      )}
    </div>
  );
}