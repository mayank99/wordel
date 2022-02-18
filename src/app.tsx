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
  const showToast = () => {
    setIsToastVisible(true);
    clearTimeout(toastInterval.current);
    toastInterval.current = setTimeout(() => {
      setIsToastVisible(false);
    }, 5000);
  };

  return (
    <GameContext.Provider value={{ answer, guesses, setGuesses, showToast }}>
      {isToastVisible && <Toast />}
      <WordsGrid />
    </GameContext.Provider>
  );
};

const Toast = () => {
  return (
    <output class='Toast' role='status'>
      Not in word list
    </output>
  );
};

const WordsGrid = () => {
  const { answer, guesses } = useGameContext();

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
            console.log('Boo!');
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
  }, [answer, isActive, activeLetterIndex, currentGuess]);

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

          if (!answer.includes(letter) || (isDuplicateLetter && answerHasMultiple)) {
            return 'wrong';
          } else if (answer[i] === letter) {
            return 'correct';
          } else {
            return 'misplaced';
          }
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
