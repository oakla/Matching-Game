import type { GameState } from '../types/game';
import { getWinners } from '../gameLogic';
import './Scoreboard.css';

interface ScoreboardProps {
  /** Current game state (scores, turn info, config flags, etc.). */
  state: GameState;
  /** Called when the player clicks "New Game". */
  onReset: () => void;
  /** Called when the player clicks the hint button. */
  onHint: () => void;
}

/**
 * Scoreboard component.
 *
 * Displays the current player's turn, the countdown timer (when timed mode is
 * active), per-player scores, a hint button (when hints are allowed), and a
 * "New Game" reset button. Shows a game-over banner once all pairs are matched.
 */
export function Scoreboard({ state, onReset, onHint }: ScoreboardProps) {
  const { scores, currentPlayerIndex, gameOver, config, secondsRemaining, turnPhase, hintsUsed } = state;
  const winners = gameOver ? getWinners(scores) : [];

  const playerLabel = (i: number) =>
    config.num_players === 1 ? 'You' : `Player ${i + 1}`;

  return (
    <div className="scoreboard">
      {gameOver ? (
        <div className="game-over-banner">
          🎉{' '}
          {winners.length === 1
            ? `${playerLabel(winners[0])} wins!`
            : `It's a tie between ${winners.map((w) => playerLabel(w)).join(' & ')}!`}
        </div>
      ) : (
        <div className="turn-indicator">
          {turnPhase === 'no-match' && (
            <span className="no-match-label">❌ No match — switching turn…</span>
          )}
          {turnPhase === 'evaluating' && (
            <span className="evaluating-label">🤔 Checking…</span>
          )}
          {(turnPhase === 'pick-word' || turnPhase === 'pick-definition') && (
            <span>
              {playerLabel(currentPlayerIndex)}'s turn —{' '}
              {turnPhase === 'pick-word'
                ? 'Pick a Word card'
                : 'Now pick a Definition card'}
            </span>
          )}
          {config.timed && secondsRemaining !== null && (
            <span
              className={`timer ${secondsRemaining <= 5 ? 'timer-warning' : ''}`}
            >
              ⏱ {secondsRemaining}s
            </span>
          )}
        </div>
      )}

      <div className="scores-row">
        {scores.map((score, i) => (
          <div
            key={i}
            className={`score-chip ${i === currentPlayerIndex && !gameOver ? 'active' : ''}`}
          >
            <span className="player-name">{playerLabel(i)}</span>
            <span className="player-score">{score}</span>
          </div>
        ))}
      </div>

      <div className="action-row">
        {config.hints_allowed && !gameOver && state.turnPhase === 'pick-definition' && (
          <button className="btn btn-hint" onClick={onHint}>
            💡 Hint {hintsUsed > 0 ? `(${hintsUsed} used)` : ''}
          </button>
        )}
        <button className="btn btn-reset" onClick={onReset}>
          🔄 New Game
        </button>
      </div>
    </div>
  );
}
