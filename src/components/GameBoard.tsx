import { useGameState } from '../hooks/useGameState';
import type { GameConfig } from '../types/game';
import { CardTile } from './Card';
import { Scoreboard } from './Scoreboard';
import './GameBoard.css';

interface GameBoardProps {
  config: GameConfig;
  onExit: () => void;
}

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
