import { Fragment } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useTheme, useStoredState, useSafeContext } from './utils/hooks';
import { answerList } from './utils/answerList';
import { ResultDialog } from './components/ResultDialog';
import { WordsGrid } from './components/WordsGrid';
import { GameContext, GameStatsContext } from './contexts';
import { useRegisterSW } from 'virtual:pwa-register/preact';
import './app.css';

export const App = () => {
  useRegisterSW();
  useTheme();

  return <Game />;
};

const Game = () => {
  const [guesses, setGuesses] = useStoredState<string[]>('guesses', []);
  const [gameState, setGameState] = useStoredState<'won' | 'lost' | 'pending'>('gameState', 'pending');
  const [streak, setStreak] = useStoredState('streak', 0);
  const [maxStreak, setMaxStreak] = useStoredState('maxStreak', 0);
  const [gamesPlayed, setGamesPlayed] = useStoredState('gamesPlayed', 0);
  const [gamesWon, setGamesWon] = useStoredState('gamesWon', 0);
  const [distribution, setDistribution] = useStoredState(
    'distribution',
    Object.fromEntries([...Array(6)].map((_, i) => [i + 1, 0]))
  );

  const [answer, setAnswer] = useStoredState('answer', '');
  useEffect(() => {
    // 0-based index starts on Feb 17, 2022
    const origin = new Date(2022, 1, 17).getTime();
    const today = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const days = Math.floor((today - origin) / (1000 * 60 * 60 * 24));
    const todaysAnswer = answerList[days];

    // reset the streak if previous answer doesn't match
    if (![answer, answerList[Math.max(0, days - 1)]].includes(guesses[Math.max(0, guesses.length - 1)])) {
      setStreak(0);
    }

    // new day, new word
    if (todaysAnswer !== answer) {
      setAnswer(todaysAnswer);
      setGuesses([]);
      setGameState('pending');
    }
  }, [answer, guesses, setAnswer, setGameState, setGuesses, setStreak]);

  const justMounted = useRef(true);

  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastTimeout = useRef<number | undefined>(undefined);
  const showToast = useCallback(() => {
    if (justMounted.current) {
      return;
    }
    setIsToastVisible(true);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => {
      setIsToastVisible(false);
    }, 5000);
  }, []);

  useEffect(() => {
    if (justMounted.current) {
      justMounted.current = false;
      return;
    }

    if (gameState === 'won') {
      setStreak((old) => old + 1);
      setGamesPlayed((old) => old + 1);
      setGamesWon((old) => old + 1);
      setDistribution((old) => ({ ...old, [guesses.length]: Number(old[guesses.length]) + 1 }));
    } else if (gameState === 'lost') {
      setStreak(0);
      setGamesPlayed((old) => old + 1);
    }
  }, [gameState, guesses.length, setDistribution, setGamesPlayed, setGamesWon, setMaxStreak, setStreak]);

  useEffect(() => {
    setMaxStreak((old) => Math.max(old, streak));
  }, [streak, setMaxStreak]);

  return (
    <GameContext.Provider value={{ answer, guesses, setAnswer, setGuesses, showToast, gameState, setGameState }}>
      <output role='status'>{isToastVisible && <Toast />}</output>
      <Heading />
      <main>
        <GameStatsContext.Provider value={{ streak, maxStreak, gamesPlayed, gamesWon, distribution }}>
          <WordsGrid />
          <ResultDialog />
        </GameStatsContext.Provider>
      </main>
    </GameContext.Provider>
  );
};

const Heading = () => {
  const { answer } = useSafeContext(GameContext);

  const answerHasDuplicates = [...answer].some((letter, index) => answer.indexOf(letter) !== index);

  return (
    <>
      <h1 class='Heading'>
        wordel
        {answerHasDuplicates && (
          <span class='Heading__DuplicateLetter' aria-hidden>
            w
          </span>
        )}
      </h1>
      {answerHasDuplicates && <span class='VisuallyHidden'>Today's word has a duplicate letter</span>}
    </>
  );
};

const Toast = () => {
  const { answer, guesses, gameState } = useSafeContext(GameContext);

  // some of these were suggested by copilot lol
  const resultMessages = [
    'Are you sure you are human?',
    'Show-off!',
    'You used your brain!',
    'Not bad',
    'That was okay, I guess',
    'Phew',
  ];

  return (
    <div class='Toast'>
      {gameState === 'won' ? (
        <>
          <span class='VisuallyHidden'>Game won.</span>
          {resultMessages[guesses.length - 1]}
        </>
      ) : gameState === 'lost' ? (
        <>
          <span class='VisuallyHidden'>Game lost.</span>
          it was {answer.toUpperCase()} smh
        </>
      ) : (
        'Not in word list'
      )}
    </div>
  );
};

export default App;
