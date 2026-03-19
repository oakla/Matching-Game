import { useGameState } from '../hooks/useGameState';
import type { GameConfig } from '../types/game';
import { CardTile } from './Card';
import { Scoreboard } from './Scoreboard';
import './GameBoard.css';

interface GameBoardProps {
  /** Configuration for the current game session. */
  config: GameConfig;
  /** Called when the player clicks "Back to Setup". */
  onExit: () => void;
}

/**
 * Main game view.
 *
 * Renders the {@link Scoreboard} above a responsive grid of {@link CardTile}s.
 * Delegates all state management to the {@link useGameState} hook.
 */
export function GameBoard({ config, onExit }: GameBoardProps) {
  const { state, flipCard, requestHint, hintCardId, resetGame } =
    useGameState(config);

  const { cards, turnPhase, gameOver } = state;

  // Cards are disabled while evaluating, during no-match pause, or game over
  const cardsDisabled =
    turnPhase === 'evaluating' || turnPhase === 'no-match' || gameOver;

  return (
    <div className="game-board-wrapper">
      <Scoreboard
        state={state}
        onReset={resetGame}
        onHint={requestHint}
      />

      <div className="card-grid">
        {cards.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            onClick={flipCard}
            isHinted={hintCardId === card.id}
            disabled={cardsDisabled}
          />
        ))}
      </div>

      <button className="exit-btn" onClick={onExit}>
        ← Back to Setup
      </button>
    </div>
  );
}
