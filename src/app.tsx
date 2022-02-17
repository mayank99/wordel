import { ComponentProps, createContext } from 'preact';
import { StateUpdater, useContext, useEffect, useState } from 'preact/hooks';
import './app.css';

export const App = () => {
  useTheme();

  return (
    <>
      <h1>wordel</h1>
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
  const [answer] = useState('ARSED');
  const [guesses, setGuesses] = useState<string[]>([]);

  return (
    <GameContext.Provider value={{ answer, guesses, setGuesses }}>
      <WordsGrid />
    </GameContext.Provider>
  );
};

const WordsGrid = () => {
  return (
    <div class='WordsGrid'>
      {[...Array(6)].map((_, i) => (
        <WordGuess key={i}></WordGuess>
      ))}
    </div>
  );
};

const WordGuess = () => {
  return (
    <div class='WordGuess'>
      {[...Array(5)].map((_, i) => (
        <Letter key={i}>X</Letter>
      ))}
    </div>
  );
};

const Letter = ({
  state = 'empty',
  children,
  ...rest
}: { state?: 'empty' | 'wrong' | 'misplaced' | 'correct' } & ComponentProps<'div'>) => {
  return (
    <div class='Letter' data-state={state} {...rest}>
      <span>{children}</span>
    </div>
  );
};

export default App;
