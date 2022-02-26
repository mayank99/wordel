import { ComponentProps, createContext, Fragment } from 'preact';
import { StateUpdater, useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useTheme, useStoredState, useSafeContext } from './utils/hooks';
import { dictionary } from './utils/dictionary';
import { answerList } from './utils/answerList';
import { getAnalyzerUrl } from './utils/analyze';
import { getAltText, getEmojiGrid } from './utils/share';
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

const GameContext = createContext<
  | {
      answer: string;
      setAnswer: StateUpdater<string>;
      guesses: string[];
      setGuesses: StateUpdater<string[]>;
      showToast: () => void;
      gameState: 'won' | 'lost' | 'pending';
      setGameState: StateUpdater<'won' | 'lost' | 'pending'>;
    }
  | undefined
>(undefined);
GameContext.displayName = 'GameContext';

const GameStatsContext = createContext<
  | {
      streak: number;
      maxStreak: number;
      gamesPlayed: number;
      gamesWon: number;
      distribution: { [key: string]: number };
    }
  | undefined
>(undefined);
GameStatsContext.displayName = 'GameStatsContext';

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
    toastTimeout.current = setTimeout(() => {
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
      <GameStatsContext.Provider value={{ streak, maxStreak, gamesPlayed, gamesWon, distribution }}>
        <WordsGrid />
        <ResultDialog />
      </GameStatsContext.Provider>
    </GameContext.Provider>
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
      {gameState === 'won'
        ? resultMessages[guesses.length - 1]
        : gameState === 'lost'
        ? `it was ${answer.toUpperCase()} smh`
        : 'Not in word list'}
    </div>
  );
};

declare interface HTMLDialogElement extends HTMLElement {
  showModal: () => void;
  close: () => void;
}

const ResultDialog = () => {
  const { gameState } = useSafeContext(GameContext);
  const { gamesPlayed, gamesWon, streak, maxStreak } = useSafeContext(GameStatsContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const justMounted = useRef(true);

  useEffect(() => {
    setIsOpen(gameState !== 'pending');
  }, [gameState]);

  useEffect(() => {
    let delay = justMounted.current ? 500 : gameState === 'won' ? 1500 : 3500;

    if (justMounted.current) {
      justMounted.current = false;
    }

    if (isOpen) {
      setTimeout(() => dialogRef.current?.showModal(), delay);
    } else {
      setIsSharing(false);
      dialogRef.current?.close();
    }
  }, [isOpen, gameState]);

  useEffect(() => {
    if (isSharing) {
      closeRef.current?.focus();
    }
  }, [isSharing]);

  return (
    <dialog class='ResultDialog' ref={dialogRef} hidden={!isOpen ? true : undefined} open={undefined}>
      <button class='ResultDialog__Close' onClick={() => setIsOpen(false)} aria-label='Close dialog' ref={closeRef} />
      {isOpen && !isSharing && (
        <>
          <article>
            <h2>Statistics</h2>
            <section class='ResultDialog__Stats'>
              <div>
                {gamesPlayed} {'\n'} played
              </div>
              <div>
                {Number((gamesWon / Math.max(gamesPlayed, 1)) * 100).toFixed(0)} {'\n'} win %
              </div>
              <div>
                {streak} {'\n'} current streak
              </div>
              <div>
                {maxStreak} {'\n'} max streak
              </div>
            </section>
          </article>

          <article>
            <h2>Guess distribution</h2>
            <Distribution />
          </article>

          <article>
            <h2>Next wordel</h2>
            <Timer />
          </article>

          <ResultDialogActionBar onShare={() => setIsSharing(true)} />
        </>
      )}
      {isOpen && isSharing && <ResultDialogShare />}
    </dialog>
  );
};

const Distribution = () => {
  const { gameState, guesses } = useSafeContext(GameContext);
  const { distribution } = useSafeContext(GameStatsContext);

  const maxFreq = Math.max(...Object.values(distribution));
  const a11yLabel = `List where each term represents the number of guesses to complete the game, and the corresponding description is the number of games completed in that number of guesses.`;

  return (
    <dl class='Distribution' aria-label={a11yLabel}>
      {Object.entries(distribution).map(([guessCount, frequency]) => (
        <Fragment key={guessCount}>
          <dt>
            {guessCount} <span class='VisuallyHidden'>guesses</span>
          </dt>
          <dd
            data-current={gameState === 'won' && guesses.length === Number(guessCount) ? 'true' : undefined}
            style={{ maxWidth: `${Number((frequency / maxFreq) * 100).toFixed(0)}%` }}
          >
            {frequency} <span class='VisuallyHidden'>times</span>
          </dd>
        </Fragment>
      ))}
    </dl>
  );
};

const Timer = () => {
  const { setAnswer } = useSafeContext(GameContext);

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

  useEffect(() => {
    const [hours, minutes, seconds] = time;
    if (hours === '00' && minutes === '00' && seconds === '00') {
      setAnswer(''); // trigger new game
    }
  }, [setAnswer, time]);

  return (
    <div class='Timer'>
      {time[0]}:{time[1]}:{time[2]}
    </div>
  );
};

const ResultDialogActionBar = ({ onShare }: { onShare?: () => void }) => {
  const { guesses, answer } = useSafeContext(GameContext);
  const wordsToAnalyze = guesses[Math.max(0, guesses.length - 1)] === answer ? guesses : [...guesses, answer];

  return (
    <section class='ResultDialog__ActionBar'>
      <button class='ResultDialog__Action' onClick={onShare}>
        Share
      </button>
      <a class='ResultDialog__Action' href={getAnalyzerUrl(wordsToAnalyze)}>
        Analyze
      </a>
    </section>
  );
};

const ResultDialogShare = () => {
  const { guesses, answer } = useSafeContext(GameContext);
  const gameNumber = answerList.indexOf(answer) + 243;
  const altText = getAltText(guesses, answer, gameNumber);
  const emojiGrid = getEmojiGrid(guesses, answer, gameNumber);

  const [isCopiedMessageVisible, setIsCopiedMessageVisible] = useState(false);
  const copiedMessageTimeout = useRef<number>(0);
  const a11yLink = 'https://slate.com/culture/2022/02/wordle-word-game-results-accessibility-twitter.html';

  return (
    <article>
      <h2>Share your result</h2>
      <aside class='ResultDialog__ShareNote'>
        <p>
          Note: For <a href={a11yLink}>accessibility reasons</a>, instead of sharing the emojis as plain text, you
          should take a screenshot of this grid and share it with the provided alt text.
        </p>
      </aside>

      <div class='VisuallyHidden'>{altText}</div>
      <div class='ResultDialog__EmojiGrid' aria-hidden>
        {emojiGrid}
      </div>

      <div class='ResultDialog__ShareActions'>
        <button
          class='ResultDialog__Action'
          onClick={async () => {
            await navigator.clipboard.writeText(altText);
            setIsCopiedMessageVisible(true);
            clearTimeout(copiedMessageTimeout.current);
            copiedMessageTimeout.current = setTimeout(() => setIsCopiedMessageVisible(false), 3000);
          }}
        >
          Copy alt text
        </button>
        <output role='status'>
          {isCopiedMessageVisible && (
            <div class='ResultDialog__Copied'>
              <span class='VisuallyHidden'>Copied to clipboard.</span>
            </div>
          )}
        </output>
      </div>
    </article>
  );
};

const WordsGrid = () => {
  const { answer, guesses, showToast, setGameState } = useSafeContext(GameContext);

  useEffect(() => {
    if (guesses[Math.max(guesses.length - 1, 0)] === answer) {
      setGameState('won');
      showToast();
    } else if (guesses.length === 6) {
      setGameState('lost');
      showToast();
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
  const { answer, setGuesses, showToast } = useSafeContext(GameContext);
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
      {children}
    </div>
  );
};

export default App;
