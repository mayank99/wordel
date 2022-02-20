import { ComponentProps, createContext } from 'preact';
import { StateUpdater, useCallback, useContext, useEffect, useRef, useState } from 'preact/hooks';
import { dictionary } from './dictionary';
import { answerList } from './answerList';
import './app.css';

export const App = () => {
  useTheme();

  return (
    <>
      <h1>hello wordle</h1>
      <main>
        <Game />
      </main>
    </>
  );
};

const useTheme = () => {
  const [theme, setTheme] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
      setTheme(matches ? 'dark' : 'light');
    });
  }, []);

  return theme;
};

const GameContext = createContext<
  | {
      answer: string;
      guesses: string[];
      setGuesses: StateUpdater<string[]>;
      showToast: () => void;
      gameState: 'won' | 'lost' | 'pending';
      setGameState: StateUpdater<'won' | 'lost' | 'pending'>;
    }
  | undefined
>(undefined);

const useGameContext = () => {
  const value = useContext(GameContext);
  if (value === undefined) {
    throw new Error('useGameContext must be used within a GameContext provider');
  }
  return value;
};

const Game = () => {
  const [guesses, setGuesses] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'won' | 'lost' | 'pending'>('pending');

  const [answer, setAnswer] = useState('arsed');
  useEffect(() => {
    // 0-based index starts on Feb 17, 2022
    const origin = new Date(2022, 1, 17).getTime();
    const today = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const days = Math.floor((today - origin) / (1000 * 60 * 60 * 24));
    setAnswer(answerList[days]);
  }, []);

  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastInterval = useRef<number | undefined>(undefined);
  const showToast = useCallback(() => {
    setIsToastVisible(true);
    clearTimeout(toastInterval.current);
    toastInterval.current = setTimeout(() => {
      setIsToastVisible(false);
    }, 5000);
  }, []);

  useEffect(() => {
    if (gameState === 'won') {
      const stored = localStorage.getItem('distribution');
      const oldDistribution = stored ? JSON.parse(stored) : Object.fromEntries([...Array(6)].map((_, i) => [i + 1, 0]));
      const newDistribution = { ...oldDistribution, [guesses.length]: Number(oldDistribution[guesses.length]) + 1 };
      localStorage.setItem('distribution', JSON.stringify(newDistribution));

      const oldStreak = Number(localStorage.getItem('streak'));
      localStorage.setItem('streak', String(oldStreak + 1));

      const oldMaxStreak = Number(localStorage.getItem('maxStreak'));
      localStorage.setItem('maxStreak', String(Math.max(oldMaxStreak, oldStreak + 1)));

      const oldGamesPlayed = Number(localStorage.getItem('gamesPlayed'));
      localStorage.setItem('gamesPlayed', String(oldGamesPlayed + 1));

      const oldGamesWon = Number(localStorage.getItem('gamesWon'));
      localStorage.setItem('gamesWon', String(oldGamesWon + 1));
    } else if (gameState === 'lost') {
      localStorage.setItem('streak', '0');
      localStorage.setItem('gamesPlayed', String(Number(localStorage.getItem('gamesPlayed')) + 1));
    }
  }, [gameState, guesses.length]);

  return (
    <GameContext.Provider value={{ answer, guesses, setGuesses, showToast, gameState, setGameState }}>
      {isToastVisible && <Toast />}
      <WordsGrid />
      <ResultDialog />
    </GameContext.Provider>
  );
};

const Toast = () => {
  const { answer, guesses, gameState } = useGameContext();

  const resultMessages = [
    'Are you sure you are human?',
    'Show-off!',
    'You *are* a human!',
    'Not bad',
    'That was okay, I guess',
    'Phew',
  ];

  return (
    <output class='Toast' role='status'>
      {gameState === 'won'
        ? resultMessages[guesses.length - 1]
        : gameState === 'lost'
        ? `it was ${answer.toUpperCase()} smh`
        : 'Not in word list'}
    </output>
  );
};

const ResultDialog = () => {
  const { gameState } = useGameContext();
  const [isOpen, setIsOpen] = useState(() => gameState !== 'pending');

  useEffect(() => {
    setIsOpen(gameState !== 'pending');
  }, [gameState]);

  return isOpen ? (
    <dialog class='ResultDialog' open={isOpen}>
      <button onClick={() => setIsOpen(false)}>❌</button>
      <h2>Guess distribution</h2>
      <Distribution />

      <h2>Next wordle</h2>
      <Timer />
    </dialog>
  ) : null;
};

const Distribution = () => <></>;

const Timer = () => {
  const getTimeDiff = () => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24);
    const diff = tomorrow.getTime() - now.getTime();

    const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
    const minutes = String(Math.floor(diff / (1000 * 60)) % 60).padStart(2, '0');
    const seconds = String(Math.floor(diff / 1000) % 60).padStart(2, '0');

    return [hours, minutes, seconds];
  };
  const [time, setTime] = useState(() => getTimeDiff());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeDiff());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div class='Timer'>
      {time[0]}:{time[1]}:{time[2]}
    </div>
  );
};

const WordsGrid = () => {
  const { answer, guesses, showToast, setGameState } = useGameContext();

  useEffect(() => {
    if (guesses[Math.max(guesses.length - 1, 0)] === answer) {
      setGameState('won');
      showToast();
    } else if (guesses.length === 6) {
      setGameState('lost');
    }
  }, [answer, guesses, showToast, setGameState]);

  return (
    <div class='WordsGrid'>
      {[...Array(6)].map((_, i) => (
        <WordGuess
          key={i}
          guess={guesses[i]}
          isActive={i === guesses.length && answer !== guesses[Math.max(0, i - 1)]}
        />
      ))}
    </div>
  );
};

const WordGuess = ({ guess, isActive = false }: { guess?: string; isActive?: boolean }) => {
  const { answer, setGuesses, showToast } = useGameContext();
  const [currentGuess, setCurrentGuess] = useState('');
  const [activeLetterIndex, setActiveLetterIndex] = useState(0);

  useEffect(() => {
    if (isActive) {
      const handleKeyDown = ({ key, altKey, ctrlKey }: KeyboardEvent) => {
        if (altKey || ctrlKey) {
          return;
        }
        if (key.match(/^[a-z]$/i) && activeLetterIndex < 5) {
          setCurrentGuess((old) => old + key);
          setActiveLetterIndex((old) => old + 1);
        } else if (key === 'Backspace') {
          setCurrentGuess((old) => old.slice(0, -1));
          setActiveLetterIndex((old) => Math.max(0, old - 1));
        } else if (key === 'Enter' && activeLetterIndex === 5) {
          if (!dictionary.includes(currentGuess)) {
            showToast();
            return;
          }
          setGuesses((old) => [...old, currentGuess]);
          setCurrentGuess('');
          setActiveLetterIndex(0);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [answer, isActive, activeLetterIndex, currentGuess, showToast, setGuesses]);

  return (
    <div class='WordGuess'>
      {[...Array(5)].map((_, i) => {
        const letterState = ((letter: string) => {
          if (isActive) {
            return 'active';
          }

          if (!guess || !answer || !letter) return 'empty';

          const isDuplicateLetter = [...guess].filter((l) => l === letter).length > 1;
          const answerHasMultiple = [...answer].filter((l) => l === letter).length > 1;

          if (answer[i] === letter) {
            return 'correct';
          } else if (answer.includes(letter) && (!isDuplicateLetter || answerHasMultiple)) {
            return 'misplaced';
          }
          return 'wrong';
        })(guess?.[i] ?? '');

        return (
          <Letter key={i} state={letterState}>
            {currentGuess[i] ?? guess?.[i]}
          </Letter>
        );
      })}
    </div>
  );
};

const Letter = ({
  state = 'empty',
  children,
  ...rest
}: { state?: 'empty' | 'active' | 'wrong' | 'misplaced' | 'correct' } & ComponentProps<'div'>) => {
  return (
    <div class='Letter' data-state={state} {...rest}>
      <span>{children}</span>
    </div>
  );
};

export default App;
