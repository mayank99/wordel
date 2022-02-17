import { ComponentProps, createContext } from 'preact';
import { StateUpdater, useContext, useEffect, useState } from 'preact/hooks';
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
  { answer: string; guesses: string[]; setGuesses: StateUpdater<string[]> } | undefined
>(undefined);

const useGameContext = () => {
  const value = useContext(GameContext);
  if (value === undefined) {
    throw new Error('useGameContext must be used within a GameContext provider');
  }
  return value;
};

const Game = () => {
  const [answer] = useState('arsed');
  const [guesses, setGuesses] = useState<string[]>([]);

  return (
    <GameContext.Provider value={{ answer, guesses, setGuesses }}>
      <WordsGrid />
    </GameContext.Provider>
  );
};

const WordsGrid = () => {
  const { answer, guesses } = useGameContext();

  return (
    <div class='WordsGrid'>
      {[...Array(6)].map((_, i) => (
        <WordGuess key={i} guess={guesses[i]} isActive={i === guesses.length && answer !== guesses[i - 1]} />
      ))}
    </div>
  );
};

const WordGuess = ({ guess, isActive = false }: { guess?: string; isActive?: boolean }) => {
  const { answer, setGuesses } = useGameContext();
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
          setGuesses((old) => [...old, currentGuess]);
          setCurrentGuess('');
          setActiveLetterIndex(0);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [answer, isActive, activeLetterIndex]);

  return (
    <div class='WordGuess'>
      {[...Array(5)].map((_, i) => {
        const checkLetter = (letter: string) => {
          if (!guess || !answer) return;
          const isDuplicateLetter = [...guess].filter((l) => l === letter).length > 1;
          const hasMultiple = [...answer].filter((l) => l === letter).length > 1;

          return answer[i] === letter
            ? 'correct'
            : !answer.includes(letter)
            ? 'wrong'
            : !isDuplicateLetter
            ? 'misplaced'
            : hasMultiple
            ? 'misplaced'
            : 'wrong';
        };

        const letterState = isActive ? 'active' : !!guess?.[i] ? checkLetter(guess[i]) : 'empty';
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
