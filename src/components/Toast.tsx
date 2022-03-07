import { GameContext } from '../contexts';
import { useSafeContext } from '../utils/hooks';
import './Toast.css';

export const Toast = ({ visible = false }) => {
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
    <output role='status'>
      {visible && (
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
      )}
    </output>
  );
};
