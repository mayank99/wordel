import { ComponentProps, Fragment, JSX } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { GameContext } from '../contexts';
import { dictionary } from '../utils/dictionary';
import { useSafeContext } from '../utils/hooks';
import './WordsGrid.css';

export const WordsGrid = () => {
  const { answer, guesses, gameState, showToast, setGameState } = useSafeContext(GameContext);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (guesses[Math.max(guesses.length - 1, 0)] === answer) {
      setGameState('won');
      showToast();
    } else if (guesses.length === 6) {
      setGameState('lost');
      showToast();
    }
  }, [answer, guesses, showToast, setGameState]);

  useEffect(() => {
    const i = guesses.length;
    if (answer !== guesses[Math.max(0, i - 1)]) {
      setActiveIndex(i);
    } else {
      setActiveIndex(null);
    }
  }, [answer, guesses]);

  return (
    <>
      <output class='VisuallyHidden' role='status'>
        {activeIndex && gameState === 'pending' && `Guess ${activeIndex} incorrect.`}
      </output>
      <div class='WordsGrid'>
        {[...Array(6)].map((_, i) => (
          <WordGuess key={i} index={i} isActive={activeIndex === i} />
        ))}
      </div>
    </>
  );
};

export const WordGuess = ({ index, isActive = false }: { index: number; isActive?: boolean }) => {
  const { answer, guesses, setGuesses, showToast } = useSafeContext(GameContext);
  const [currentGuess, setCurrentGuess] = useState('');
  const guess = guesses[index];
  const motionOk = useRef(window.matchMedia('(prefers-reduced-motion: no-preference)').matches);

  const handleInput = ({ currentTarget }: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    if (
      currentTarget.value.length > 5 ||
      (currentTarget.value.length > 0 && !/^[A-Za-z]+$/.test([...currentTarget.value].pop()!))
    ) {
      currentTarget.value = currentGuess; // force only letters
      return;
    }
    setCurrentGuess(currentTarget.value);
  };

  const handleSubmit = (e: JSX.TargetedEvent<HTMLFormElement, Event>) => {
    e.preventDefault();
    if (!dictionary.includes(currentGuess)) {
      showToast();
      return;
    }
    setGuesses((old) => [...old, currentGuess]);
    setCurrentGuess('');
  };

  const [disabled, setDisabled] = useState(true);
  useEffect(() => {
    if (isActive) {
      const delay = motionOk.current && index > 0 ? 2500 : 0;
      window.setTimeout(() => setDisabled(false), delay); // wait for animation to complete
    }
  }, [index, isActive]);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isActive && !disabled) {
      inputRef.current?.focus();
    }
  });

  return (
    <div class='WordGuess'>
      {isActive && (
        <form class='VisuallyHidden' onSubmit={handleSubmit}>
          <input
            class='HiddenInput'
            aria-label={`Line ${index + 1}. Enter guess.`}
            value={currentGuess}
            onInput={handleInput}
            onBlur={() => isActive && inputRef.current?.focus()} // prevent losing focus
            maxLength={5}
            enterkeyhint='done'
            autoFocus
            ref={inputRef}
            disabled={disabled}
          />
        </form>
      )}
      {!isActive && <span class='VisuallyHidden'>Line {index + 1}: </span>}
      {[...Array(5)].map((_, i) => {
        const letterState = ((letter: string) => {
          if (isActive && !disabled) {
            return 'active';
          }

          if (!guess || !answer || !letter) return 'empty';

          if (answer[i] === letter) {
            return 'correct';
          }

          const answerHasMultiple = [...answer].filter((l) => l === letter).length > 1;
          const isDuplicateLetter = [...guess].filter((l) => l === letter).length > 1;
          const duplicateIndices = [...guess].flatMap((l, _i) => isDuplicateLetter && l === letter ? [_i] : []);

          if (answer.includes(letter)) {
            // if there is no duplicate, or if the answer has multiple instances of this letter, then we show yellow
            if (!isDuplicateLetter || answerHasMultiple) {
              return 'misplaced';
            }

            // if the answer doesn't have multiple instances, then skip this if the other instance is corrrect
            if (duplicateIndices.some((_i) => guess[_i] === answer[_i])) {
              return 'wrong';
            }

            // if the other instance is not correct, then we only show yellow on the first instance
            if (i === duplicateIndices[0]) {
              return 'misplaced';
            }
          }

          return 'wrong';
        })(guess?.[i] ?? '');

        return (
          <Letter
            key={i}
            state={letterState}
            aria-hidden={isActive ? true : undefined}
            style={{ '--delay': `${i * 0.5}s` }}
          >
            {currentGuess[i] ?? guess?.[i]}
            {!['active', 'empty'].includes(letterState) && <span class='VisuallyHidden'>({letterState})</span>}
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
    <div class='Letter' data-state={state !== 'empty' ? state : undefined} {...rest}>
      {children}
    </div>
  );
};
