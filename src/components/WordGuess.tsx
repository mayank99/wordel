import { ComponentProps } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { GameContext } from '../contexts';
import { dictionary } from '../utils/dictionary';
import { useSafeContext } from '../utils/hooks';
import './WordGuess.css';

export const WordGuess = ({ guess, isActive = false }: { guess?: string; isActive?: boolean }) => {
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
