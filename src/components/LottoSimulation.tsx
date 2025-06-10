// src/app/LottoSimulation.tsx

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from '@/styles/LottoSimulation.module.css';

// Import child components
import { LottoControls } from './lotto/LottoControls';
import { LottoDisplay } from './lotto/LottoDisplay';
import { LottoStats } from './lotto/LottoStats';
import { AchievementsPanel } from './lotto/AchievementsPanel';
import { ResetModal } from './lotto/ResetModal';
import { AchievementToast } from './lotto/AchievementToast';
import { LottoRecords } from './lotto/LottoRecords';

export interface LottoRecord {
  id: string;
  rank: number;
  myNumbers: number[];
  winningNumbers: number[];
  bonusNumber: number;
  matchedNumbers: number[];
}

const ACHIEVEMENTS = [
    {
        id: 'firstTry',
        title: '벼락부자를 꿈꾸며..',
        description: '로또를 처음 시작하셨습니다!',
        conditionDescription: '로또 시뮬레이션 최초 실행',
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
        condition: (stats: any, tryCount: number, net: number) => tryCount >= 100,
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

export default function LottoSimulation() {
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

  const [achievementsUnlocked, setAchievementsUnlocked] = useState<Record<string, boolean>>({});
  const [currentAchievementToast, setCurrentAchievementToast] = useState<{ id: string; title: string; description: string; } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const achievementSoundRef = useRef<HTMLAudioElement | null>(null);

  const min = 1;
  const max = 45;

  // ⭐⭐ 여기가 변경된 부분입니다. lottoRecords의 초기값을 빈 배열로 설정 ⭐⭐
  const [lottoRecords, setLottoRecords] = useState<LottoRecord[]>([]);

  // Effect to load audio and persisted state from localStorage
  useEffect(() => {
    achievementSoundRef.current = document.getElementById('achievement-sound') as HTMLAudioElement;

    // ⭐⭐ 기존 useEffect에 lottoRecords 로딩 로직 추가 ⭐⭐
    const savedTryCount = localStorage.getItem('lottoTryCount');
    const savedWinStats = localStorage.getItem('lottoWinStats');
    const savedAchievements = localStorage.getItem('lottoAchievements');
    const savedRecords = localStorage.getItem('lottoRecords'); // 새로 추가: lottoRecords 로딩

    if (savedTryCount) {
      setTryCount(parseInt(savedTryCount, 10));
    }
    if (savedWinStats) {
      setWinStats(JSON.parse(savedWinStats));
    }
    if (savedAchievements) {
      setAchievementsUnlocked(JSON.parse(savedAchievements));
    }
    // ⭐⭐ lottoRecords 상태 업데이트 ⭐⭐
    if (savedRecords) {
      try {
        setLottoRecords(JSON.parse(savedRecords));
      } catch (e) {
        console.error("Failed to parse lotto records from localStorage", e);
        setLottoRecords([]); // 파싱 실패 시 초기화
      }
    }
  }, []); // Run only once on mount

  // Effect to save state to localStorage whenever relevant state changes
  useEffect(() => {
    localStorage.setItem('lottoTryCount', tryCount.toString());
    localStorage.setItem('lottoWinStats', JSON.stringify(winStats));
    localStorage.setItem('lottoAchievements', JSON.stringify(achievementsUnlocked));
    localStorage.setItem('lottoRecords', JSON.stringify(lottoRecords));
  }, [tryCount, winStats, achievementsUnlocked, lottoRecords]);

  // Callback to play achievement sound
  const playAchievementSound = useCallback(() => {
    if (achievementSoundRef.current) {
      achievementSoundRef.current.currentTime = 0; // Rewind to start
      achievementSoundRef.current.play().catch(error => {
        // Handle play() promise rejection (e.g., user interaction required)
        console.log("Failed to play sound automatically. User interaction might be required.", error);
      });
    }
  }, []);

  // Effect to check and trigger achievements
  useEffect(() => {
    const totalSpent = tryCount * 1000;
    const totalWon = winStats.first * 2000000000 + winStats.second * 50000000 +
                     winStats.third * 1500000 + winStats.fourth * 50000 + winStats.fifth * 5000;
    const currentNet = totalWon - totalSpent;

    ACHIEVEMENTS.forEach(achievement => {
      // Check if achievement is not unlocked and its condition is met
      if (!achievementsUnlocked[achievement.id] && achievement.condition(winStats, tryCount, currentNet)) {
        setAchievementsUnlocked(prev => ({ ...prev, [achievement.id]: true })); // Unlock achievement
        // Show achievement toast
        setCurrentAchievementToast({ id: achievement.id, title: achievement.title, description: achievement.description });
        playAchievementSound(); // Play sound

        // Clear any existing toast timeout and set a new one
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = setTimeout(() => {
          setCurrentAchievementToast(null); // Hide toast after 5 seconds
          toastTimeoutRef.current = null;
        }, 5000);
      }
    });
  }, [tryCount, winStats, achievementsUnlocked, playAchievementSound]); // Dependencies for this effect

  // Callback to generate unique random numbers within min/max range
  const generateUniqueNumbers = useCallback((count: number, exclude: number[] = []): number[] => {
    const numbers: number[] = [];
    while (numbers.length < count) {
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(randomNumber) && !exclude.includes(randomNumber)) {
        numbers.push(randomNumber);
      }
    }
    return numbers.sort((a,b) => a-b); // Always return sorted numbers
  }, [min, max]);

  // Callback to calculate lotto rank and matched numbers
  const calculateRankAndMatches = useCallback((
    mySelectedNumbers: number[],
    actualWinningNumbers: number[],
    actualBonusNumber: number
  ): { rank: number; matchedNumbers: number[]; actualWinningNumbers: number[]; actualBonusNumber: number } => {
    let matchCount = 0;
    let bonusMatch = false;
    const currentMatchedNumbers: number[] = [];

    // Count matches with main winning numbers
    mySelectedNumbers.forEach(myNum => {
      if (actualWinningNumbers.includes(myNum)) {
        matchCount++;
        currentMatchedNumbers.push(myNum);
      }
    });

    // Check for bonus number match if it's not already a main match
    if (mySelectedNumbers.includes(actualBonusNumber) && !currentMatchedNumbers.includes(actualBonusNumber)) {
      bonusMatch = true;
    }

    let rank = 0;

    // Determine rank based on match count and bonus match
    if (matchCount === 6) {
      rank = 1;
    } else if (matchCount === 5 && bonusMatch) {
      rank = 2;
    } else if (matchCount === 5) {
      rank = 3;
    } else if (matchCount === 4) {
      rank = 4;
    } else if (matchCount === 3) {
      rank = 5;
    }

    return {
      rank: rank,
      matchedNumbers: currentMatchedNumbers,
      actualWinningNumbers: actualWinningNumbers,
      actualBonusNumber: actualBonusNumber,
    };
  }, []);

  // Callback to add a new lotto record
  const addRecord = useCallback((record: LottoRecord) => {
    setLottoRecords(prevRecords => {
      return [record, ...prevRecords]; // Add new record to the beginning (latest first)
    });
  }, []);

  // Callback to evaluate the result of a lotto draw
  const evaluateResult = useCallback((mine: number[], win: number[], bonus: number) => {
    const { rank, matchedNumbers, actualWinningNumbers, actualBonusNumber } =
      calculateRankAndMatches(mine, win, bonus);

    // Update win statistics
    setWinStats(prev => {
      const updated = { ...prev };
      if (rank === 1) updated.first++;
      else if (rank === 2) updated.second++;
      else if (rank === 3) updated.third++;
      else if (rank === 4) updated.fourth++;
      else if (rank === 5) updated.fifth++;
      else updated.none++;
      return updated;
    });

    setTryCount(prev => prev + 1); // Increment try count

    // Add record for 1st to 5th place wins
    if (rank > 0 && rank <= 5) {
      const newRecord: LottoRecord = {
        id: Date.now().toString(), // Unique ID for the record (timestamp)
        rank: rank,
        // ⭐ Save the exact `mine` numbers, ensuring they are sorted before saving
        myNumbers: [...mine].sort((a,b) => a-b),
        winningNumbers: actualWinningNumbers,
        bonusNumber: actualBonusNumber,
        matchedNumbers: matchedNumbers,
      };
      addRecord(newRecord);
    }
  }, [calculateRankAndMatches, addRecord]);

  // Callback to get winning numbers and evaluate the result
  const getWinningNumbers = useCallback(() => {
    if (myNumbers.length !== 6) return; // Ensure 6 numbers are selected
    const main = generateUniqueNumbers(6); // Generate 6 main winning numbers
    const bonus = generateUniqueNumbers(1, main)[0]; // Generate 1 bonus number, excluding main
    setWinningNumbers(main);
    setBonusNumber(bonus);
    evaluateResult(myNumbers, main, bonus); // Evaluate the current draw
  }, [myNumbers, generateUniqueNumbers, evaluateResult]);

  // Callback to generate and set a new set of 'myNumbers' (auto pick)
  const getMyNumbers = useCallback(() => {
    const mine = generateUniqueNumbers(6);
    setMyNumbers(mine);
  }, [generateUniqueNumbers]);

  // Callback for manual number selection
  const handleManualSelect = useCallback((num: number) => {
    setManualSelection(prev => {
      if (prev.includes(num)) {
        // If number is already selected, remove it
        const filtered = prev.filter(n => n !== num);
        // Update myNumbers based on mode and selection count
        if (mode === 'manual' || (mode === 'semi' && filtered.length === 6)) {
          setMyNumbers(filtered);
        } else if (mode === 'semi' && filtered.length < 6) {
          setMyNumbers([]); // Clear myNumbers if semi-auto selection becomes incomplete
        }
        return filtered;
      } else {
        // If number is not selected, add it (up to 6)
        if (prev.length >= 6) return prev; // Max 6 numbers
        const updated = [...prev, num].sort((a, b) => a - b); // Add and sort
        // Update myNumbers based on mode and selection count
        if (mode === 'manual' || (mode === 'semi' && updated.length === 6)) {
          setMyNumbers(updated);
        }
        return updated;
      }
    });
  }, [mode]);

  // Callback to fill remaining numbers for semi-auto mode
  const fillRemainingForSemiAuto = useCallback(() => {
    if (manualSelection.length === 0) {
      alert('먼저 번호를 선택해주세요!');
      return;
    }
    if (manualSelection.length === 6) {
      setMyNumbers([...manualSelection]); // If 6 already selected, just set them
      return;
    }
    const remaining = 6 - manualSelection.length;
    const autoPart = generateUniqueNumbers(remaining, manualSelection); // Generate unique remaining numbers
    const final = [...manualSelection, ...autoPart].sort((a, b) => a - b); // Combine and sort
    setMyNumbers(final);
  }, [manualSelection, generateUniqueNumbers]);

  // Callback to stop auto draw
  const stopAutoDraw = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Callback to reset manual selection and display
  const resetManual = useCallback(() => {
    setManualSelection([]);
    setMyNumbers([]);
    setWinningNumbers([]);
    setBonusNumber(null);
    stopAutoDraw();
    setIsAutoRunning(false);
  }, [stopAutoDraw]);

  // Callback to start auto draw interval
  const startAutoDraw = useCallback(() => {
    if (intervalRef.current) return; // Prevent multiple intervals

    intervalRef.current = setInterval(() => {
      const main = generateUniqueNumbers(6);
      const bonus = generateUniqueNumbers(1, main)[0];
      setWinningNumbers(main);
      setBonusNumber(bonus);

      let mine: number[] = [];

      // Determine 'myNumbers' based on current mode
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
        if (manualSelection.length === 6) {
          mine = [...manualSelection];
          setMyNumbers(mine);
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

      evaluateResult(mine, main, bonus); // Evaluate the result of this auto draw
    }, 500); // Draw every 500ms
  }, [mode, manualSelection, generateUniqueNumbers, evaluateResult, stopAutoDraw]);

  // Callback to toggle auto draw on/off
  const toggleAuto = useCallback(() => {
    if (isAutoRunning) {
      stopAutoDraw();
      setIsAutoRunning(false);
    } else {
      // Pre-checks for manual/semi-auto modes before starting auto draw
      if (mode === 'manual' && manualSelection.length !== 6) {
        alert('수동 모드에서는 번호를 6개 모두 선택해야 자동 추첨이 가능합니다.');
        return;
      }
      if (mode === 'semi' && manualSelection.length === 0) {
        alert('반자동 모드에서는 최소 1개 이상 번호를 선택해야 자동 추첨을 시작할 수 있습니다.');
        return;
      }
      if (mode === 'semi' && manualSelection.length > 0 && manualSelection.length < 6) {
        // If semi-auto and not all 6 numbers are selected, auto-fill them once
        const remaining = 6 - manualSelection.length;
        const autoPart = generateUniqueNumbers(remaining, manualSelection);
        setMyNumbers([...manualSelection, ...autoPart].sort((a,b) => a-b));
      } else if ((mode === 'manual' || mode === 'semi') && manualSelection.length === 6) {
        // If 6 numbers are already selected manually/semi-auto, just set them
        setMyNumbers([...manualSelection].sort((a,b) => a-b));
      } else if (mode === 'auto') {
        // No initial myNumbers generation needed for auto mode, interval handles it
      }

      startAutoDraw(); // Start the auto draw interval
      setIsAutoRunning(true);
    }
  }, [isAutoRunning, mode, manualSelection, stopAutoDraw, startAutoDraw, generateUniqueNumbers]);

  // Calculate total spent, won, and net
  const totalSpent = tryCount * 1000;
  const totalWon = winStats.first * 2000000000 + winStats.second * 50000000 +
                     winStats.third * 1500000 + winStats.fourth * 50000 + winStats.fifth * 5000;
  const net = totalWon - totalSpent;

  // Callback to get the message for the current draw result
  const getResultMessage = useCallback((): string | null => {
    if (myNumbers.length !== 6 || winningNumbers.length !== 6 || bonusNumber === null) return null;
    const match = myNumbers.filter(n => winningNumbers.includes(n)).length;
    const hasBonusMatch = myNumbers.includes(bonusNumber);

    if (match === 6) return '🎉 축하합니다! 1등입니다!';
    if (match === 5 && hasBonusMatch) return '🥳 축하합니다! 2등입니다!';
    if (match === 5) return '🎊 축하합니다! 3등입니다!';
    if (match === 4) return '🎉 축하합니다! 4등입니다!';
    if (match === 3) return '👏 축하합니다! 5등입니다!';
    return '😢 아쉽지만 다음 기회에!';
  }, [myNumbers, winningNumbers, bonusNumber]);

  // Callback to handle confirmation of reset
  const handleResetConfirm = useCallback(() => {
    // Clear all localStorage items related to the simulation
    localStorage.removeItem('lottoTryCount');
    localStorage.removeItem('lottoWinStats');
    localStorage.removeItem('lottoAchievements');
    localStorage.removeItem('lottoRecords');

    // Reset all relevant state variables to their initial values
    setTryCount(0);
    setWinStats({ first: 0, second: 0, third: 0, fourth: 0, fifth: 0, none: 0 });
    setAchievementsUnlocked({});
    setLottoRecords([]); // Clear all records

    setMyNumbers([]);
    setWinningNumbers([]);
    setBonusNumber(null);
    setManualSelection([]);
    stopAutoDraw();
    setIsAutoRunning(false);
    setShowResetModal(false); // Close reset modal
    setCurrentAchievementToast(null); // Clear any active toast
  }, [stopAutoDraw]);


  return (
    <div className={styles.flexWrapper}>
      {/* Achievement Toast notification */}
      <AchievementToast currentAchievementToast={currentAchievementToast} />

      {/* Hidden audio element for achievement sound */}
      <audio id="achievement-sound" src="/sounds/achievement_sound.mp3" preload="auto" style={{ display: 'none' }}></audio>

      <div className={styles.mainPanel}>
        <h1 className={styles.title}>🎰 LOTTO SIMULATION 🎰</h1>
        <hr className={styles.divider} />

        {/* Lotto Controls component */}
        <LottoControls
          mode={mode}
          setMode={setMode}
          myNumbers={myNumbers}
          getMyNumbers={getMyNumbers}
          manualSelection={manualSelection}
          handleManualSelect={handleManualSelect}
          fillRemainingForSemiAuto={fillRemainingForSemiAuto}
          resetManual={resetManual}
          winningNumbers={winningNumbers}
          getWinningNumbers={getWinningNumbers}
          min={min}
          max={max}
          isAutoRunning={isAutoRunning}
          bonusNumber={bonusNumber}
        />

        {/* Lotto Display component */}
        <LottoDisplay
          myNumbers={myNumbers}
          winningNumbers={winningNumbers}
          bonusNumber={bonusNumber}
          getResultMessage={getResultMessage}
        />

        {/* Lotto Records component, placed directly below LottoDisplay as requested */}
        <LottoRecords records={lottoRecords} />
      </div>

      {/* Statistics and Achievements Panel */}
      <div className={styles.statsAndAchievementsContainer}>
        {/* Lotto Stats component */}
        <LottoStats
          tryCount={tryCount}
          winStats={winStats}
          totalSpent={totalSpent}
          totalWon={totalWon}
          net={net}
          isAutoRunning={isAutoRunning}
          toggleAuto={toggleAuto}
          mode={mode}
          manualSelection={manualSelection}
          setShowResetModal={setShowResetModal}
        />

        {/* Achievements Panel component */}
        <AchievementsPanel
          achievements={ACHIEVEMENTS}
          achievementsUnlocked={achievementsUnlocked}
        />
      </div>

      {/* Reset Confirmation Modal */}
      <ResetModal
        showResetModal={showResetModal}
        setShowResetModal={setShowResetModal}
        handleResetConfirm={handleResetConfirm}
      />
    </div>
  );
}