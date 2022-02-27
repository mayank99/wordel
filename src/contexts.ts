import { createContext } from 'preact';
import { StateUpdater } from 'preact/hooks';

export const GameContext = createContext<
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

export const GameStatsContext = createContext<
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
