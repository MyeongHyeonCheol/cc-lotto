'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/LottoSimulation.module.css';

// 하위 컴포넌트 임포트
import { LottoControls } from './lotto/LottoControls';
import { LottoDisplay } from './lotto/LottoDisplay';
import { LottoStats } from './lotto/LottoStats';
import { AchievementsPanel } from './lotto/AchievementsPanel';
import { ResetModal } from './lotto/ResetModal';
import { AchievementToast } from './lotto/AchievementToast';

// 업적 데이터 정의 (메인 컴포넌트 또는 별도 유틸리티 파일에 유지)
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

    useEffect(() => {
        achievementSoundRef.current = document.getElementById('achievement-sound') as HTMLAudioElement;

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

    useEffect(() => {
        localStorage.setItem('lottoTryCount', tryCount.toString());
        localStorage.setItem('lottoWinStats', JSON.stringify(winStats));
        localStorage.setItem('lottoAchievements', JSON.stringify(achievementsUnlocked));
    }, [tryCount, winStats, achievementsUnlocked]);

    const playAchievementSound = () => {
        if (achievementSoundRef.current) {
            achievementSoundRef.current.currentTime = 0;
            achievementSoundRef.current.play().catch(error => {
                console.log("Failed to play sound automatically. User interaction might be required.", error);
            });
        }
    };

    useEffect(() => {
        const totalSpent = tryCount * 1000;
        const totalWon = winStats.first * 2000000000 + winStats.second * 50000000 +
                         winStats.third * 1500000 + winStats.fourth * 50000 + winStats.fifth * 5000;
        const currentNet = totalWon - totalSpent;

        ACHIEVEMENTS.forEach(achievement => {
            if (!achievementsUnlocked[achievement.id] && achievement.condition(winStats, tryCount, currentNet)) {
                setAchievementsUnlocked(prev => ({ ...prev, [achievement.id]: true }));
                setCurrentAchievementToast({ id: achievement.id, title: achievement.title, description: achievement.description });
                playAchievementSound();

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
        if (manualSelection.includes(num)) {
            setManualSelection(prev => prev.filter(n => n !== num));
        } else {
            if (manualSelection.length >= 6) return;
            const updated = [...manualSelection, num].sort((a, b) => a - b);
            setManualSelection(updated);
            if (mode === 'semi' && updated.length === 6) {
                setMyNumbers(updated);
            }
            if (mode === 'manual' && updated.length === 6) {
                setMyNumbers(updated);
            }
        }
    };

    const fillRemainingForSemiAuto = () => {
        if (manualSelection.length === 0) return alert('먼저 번호를 선택해주세요!');
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
        const hasBonusMatch = myNumbers.includes(bonusNumber);

        if (match === 6) return '🎉 축하합니다! 1등입니다!';
        if (match === 5 && hasBonusMatch) return '🥳 축하합니다! 2등입니다!';
        if (match === 5) return '🎊 축하합니다! 3등입니다!';
        if (match === 4) return '🎉 축하합니다! 4등입니다!';
        if (match === 3) return '👏 축하합니다! 5등입니다!';
        return '😢 아쉽지만 다음 기회에!';
    };

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
            <AchievementToast currentAchievementToast={currentAchievementToast} />

            <audio id="achievement-sound" src="/sounds/achievement_sound.mp3" preload="auto" style={{ display: 'none' }}></audio>

            <div className={styles.mainPanel}>
                <h1 className={styles.title}>🎰 LOTTO SIMULATION 🎰</h1>
                <hr className={styles.divider} />

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
                    isAutoRunning={isAutoRunning} // LottoControls 내부에서 resetManual 시 자동 추첨 중지
                    bonusNumber={bonusNumber}
                />

                <LottoDisplay
                    myNumbers={myNumbers}
                    winningNumbers={winningNumbers}
                    bonusNumber={bonusNumber}
                    getResultMessage={getResultMessage}
                />
            </div>

            <div className={styles.statsAndAchievementsContainer}>
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

                <AchievementsPanel
                    achievements={ACHIEVEMENTS}
                    achievementsUnlocked={achievementsUnlocked}
                />
            </div>

            <ResetModal
                showResetModal={showResetModal}
                setShowResetModal={setShowResetModal}
                handleResetConfirm={handleResetConfirm}
            />
        </div>
    );
}