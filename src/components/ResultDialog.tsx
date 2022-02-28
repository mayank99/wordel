import { Fragment } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { GameContext, GameStatsContext } from '../contexts';
import { getAnalyzerUrl } from '../utils/analyze';
import { answerList } from '../utils/answerList';
import { useSafeContext } from '../utils/hooks';
import { getAltText, getEmojiGrid } from '../utils/share';
import './ResultDialog.css';

declare interface HTMLDialogElement extends HTMLElement {
  showModal: () => void;
  close: () => void;
  open: boolean;
}

export const ResultDialog = () => {
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
    let delay = justMounted.current ? 500 : gameState === 'won' ? 2500 : 3500;

    if (justMounted.current) {
      justMounted.current = false;
    }

    if (isOpen) {
      setTimeout(() => dialogRef.current?.showModal(), delay);
    } else {
      setIsSharing(false);

      if (dialogRef.current?.open) {
        dialogRef.current?.close?.();
      }
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

export const Distribution = () => {
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

export const Timer = () => {
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

export const ResultDialogActionBar = ({ onShare }: { onShare?: () => void }) => {
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

export const ResultDialogShare = () => {
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
