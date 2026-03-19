import { useState } from 'react';
import type { GameConfig, WordDefinitionPair } from '../types/game';
import './Setup.css';

const DEFAULT_PAIRS: WordDefinitionPair[] = [
  { word: 'Photosynthesis', definition: 'The process by which plants convert sunlight into food' },
  { word: 'Mitosis', definition: 'Cell division that produces two genetically identical daughter cells' },
  { word: 'Osmosis', definition: 'The movement of water through a semi-permeable membrane from low to high solute concentration' },
  { word: 'Ecosystem', definition: 'A community of living organisms interacting with their environment' },
  { word: 'Evolution', definition: 'Change in the heritable characteristics of populations over successive generations' },
];

interface SetupProps {
  onStart: (config: GameConfig) => void;
}

export function Setup({ onStart }: SetupProps) {
  const [pairs, setPairs] = useState<WordDefinitionPair[]>(DEFAULT_PAIRS);
  const [numPlayers, setNumPlayers] = useState(2);
  const [timed, setTimed] = useState(false);
  const [turnTimeLimit, setTurnTimeLimit] = useState(30);
  const [hintsAllowed, setHintsAllowed] = useState(false);
  const [error, setError] = useState('');

  const updatePair = (idx: number, field: keyof WordDefinitionPair, value: string) => {
    setPairs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addPair = () =>
    setPairs((prev) => [...prev, { word: '', definition: '' }]);

  const removePair = (idx: number) =>
    setPairs((prev) => prev.filter((_, i) => i !== idx));

  const handleStart = () => {
    const valid = pairs.filter((p) => p.word.trim() && p.definition.trim());
    if (valid.length < 2) {
      setError('Please add at least 2 complete word/definition pairs.');
      return;
    }
    setError('');
    onStart({
      word_definition_pairs: valid,
      num_players: numPlayers,
      timed,
      hints_allowed: hintsAllowed,
      turn_time_limit: timed ? turnTimeLimit : undefined,
    });
  };

  return (
    <div className="setup-wrapper">
      <header className="setup-header">
        <h1>🃏 Word Matching Game</h1>
        <p className="setup-subtitle">Match every word to its correct definition!</p>
      </header>

      <section className="setup-section">
        <h2>Word / Definition Pairs</h2>
        <div className="pairs-list">
          {pairs.map((pair, idx) => (
            <div key={idx} className="pair-row">
              <span className="pair-num">{idx + 1}</span>
              <input
                className="pair-input"
                placeholder="Word"
                value={pair.word}
                onChange={(e) => updatePair(idx, 'word', e.target.value)}
              />
              <input
                className="pair-input def-input"
                placeholder="Definition"
                value={pair.definition}
                onChange={(e) => updatePair(idx, 'definition', e.target.value)}
              />
              <button
                className="remove-btn"
                onClick={() => removePair(idx)}
                aria-label="Remove pair"
                disabled={pairs.length <= 2}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button className="add-pair-btn" onClick={addPair}>
          + Add pair
        </button>
      </section>

      <section className="setup-section options-section">
        <h2>Options</h2>

        <label className="option-row">
          <span>Number of players</span>
          <input
            type="number"
            min={1}
            max={6}
            value={numPlayers}
            onChange={(e) => setNumPlayers(Math.max(1, Math.min(6, Number(e.target.value))))}
            className="number-input"
          />
        </label>

        <label className="option-row">
          <span>Timed turns</span>
          <input
            type="checkbox"
            checked={timed}
            onChange={(e) => setTimed(e.target.checked)}
          />
        </label>

        {timed && (
          <label className="option-row sub-option">
            <span>Seconds per turn</span>
            <input
              type="number"
              min={5}
              max={120}
              value={turnTimeLimit}
              onChange={(e) =>
                setTurnTimeLimit(Math.max(5, Math.min(120, Number(e.target.value))))
              }
              className="number-input"
            />
          </label>
        )}

        <label className="option-row">
          <span>Hints allowed</span>
          <input
            type="checkbox"
            checked={hintsAllowed}
            onChange={(e) => setHintsAllowed(e.target.checked)}
          />
        </label>
      </section>

      {error && <p className="setup-error">{error}</p>}

      <button className="start-btn" onClick={handleStart}>
        Start Game →
      </button>
    </div>
  );
}
