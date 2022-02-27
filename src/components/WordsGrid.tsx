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

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isActive) {
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
          />
        </form>
      )}
      {!isActive && <span class='VisuallyHidden'>Line {index + 1}: </span>}
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
          <Letter key={i} state={letterState} aria-hidden={isActive ? true : undefined}>
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
    <div class='Letter' data-state={state} {...rest}>
      {children}
    </div>
  );
};
