import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildDeck,
  createGameState,
  validateMatch,
  applyMatch,
  applyNoMatch,
  getWinners,
  getHint,
  shuffle,
} from '../gameLogic';
import type { GameConfig, GameState, WordDefinitionPair } from '../types/game';

const PAIRS: WordDefinitionPair[] = [
  { word: 'Photosynthesis', definition: 'The process by which plants make food from sunlight' },
  { word: 'Mitosis', definition: 'Cell division producing identical daughter cells' },
  { word: 'Osmosis', definition: 'Movement of water across a semi-permeable membrane' },
];

const CONFIG: GameConfig = {
  word_definition_pairs: PAIRS,
  num_players: 2,
};

// ── shuffle ──────────────────────────────────────────────────────────────────

describe('shuffle', () => {
  it('returns an array with the same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toHaveLength(arr.length);
    expect(result.sort()).toEqual([...arr].sort());
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });
});

// ── buildDeck ────────────────────────────────────────────────────────────────

describe('buildDeck', () => {
  it('creates 2N cards for N pairs', () => {
    const deck = buildDeck(PAIRS);
    expect(deck).toHaveLength(PAIRS.length * 2);
  });

  it('creates equal numbers of word and definition cards', () => {
    const deck = buildDeck(PAIRS);
    const words = deck.filter((c) => c.type === 'word');
    const defs = deck.filter((c) => c.type === 'definition');
    expect(words).toHaveLength(PAIRS.length);
    expect(defs).toHaveLength(PAIRS.length);
  });

  it('all cards start face-down', () => {
    const deck = buildDeck(PAIRS);
    expect(deck.every((c) => c.state === 'face-down')).toBe(true);
  });

  it('each word card has matching pairIndex with its definition', () => {
    const deck = buildDeck(PAIRS);
    PAIRS.forEach((pair, idx) => {
      const wordCard = deck.find((c) => c.type === 'word' && c.pairIndex === idx);
      const defCard = deck.find((c) => c.type === 'definition' && c.pairIndex === idx);
      expect(wordCard?.content).toBe(pair.word);
      expect(defCard?.content).toBe(pair.definition);
    });
  });
});

// ── createGameState ──────────────────────────────────────────────────────────

describe('createGameState', () => {
  it('initialises scores to zero for each player', () => {
    const state = createGameState(CONFIG);
    expect(state.scores).toEqual([0, 0]);
  });

  it('starts at player 0', () => {
    const state = createGameState(CONFIG);
    expect(state.currentPlayerIndex).toBe(0);
  });

  it('starts in pick-word phase', () => {
    const state = createGameState(CONFIG);
    expect(state.turnPhase).toBe('pick-word');
  });

  it('gameOver is false initially', () => {
    const state = createGameState(CONFIG);
    expect(state.gameOver).toBe(false);
  });

  it('sets timed secondsRemaining from config', () => {
    const timedConfig: GameConfig = { ...CONFIG, timed: true, turn_time_limit: 45 };
    const state = createGameState(timedConfig);
    expect(state.secondsRemaining).toBe(45);
  });

  it('secondsRemaining is null when not timed', () => {
    const state = createGameState(CONFIG);
    expect(state.secondsRemaining).toBeNull();
  });
});

// ── validateMatch ────────────────────────────────────────────────────────────

describe('validateMatch', () => {
  let state: GameState;

  beforeEach(() => {
    state = createGameState(CONFIG);
    // Use a deterministic deck for tests
    state.cards = buildDeck(PAIRS);
  });

  it('returns isMatch=true for a correct word-definition pair', async () => {
    const wordCard = state.cards.find((c) => c.type === 'word' && c.pairIndex === 0)!;
    const defCard = state.cards.find((c) => c.type === 'definition' && c.pairIndex === 0)!;
    const result = await validateMatch(state.cards, wordCard.id, defCard.id, PAIRS);
    expect(result.isMatch).toBe(true);
  });

  it('returns isMatch=false for a wrong word-definition pair', async () => {
    const wordCard = state.cards.find((c) => c.type === 'word' && c.pairIndex === 0)!;
    const defCard = state.cards.find((c) => c.type === 'definition' && c.pairIndex === 1)!;
    const result = await validateMatch(state.cards, wordCard.id, defCard.id, PAIRS);
    expect(result.isMatch).toBe(false);
  });

  it('includes an explanation', async () => {
    const wordCard = state.cards.find((c) => c.type === 'word' && c.pairIndex === 0)!;
    const defCard = state.cards.find((c) => c.type === 'definition' && c.pairIndex === 0)!;
    const result = await validateMatch(state.cards, wordCard.id, defCard.id, PAIRS);
    expect(typeof result.explanation).toBe('string');
    expect(result.explanation!.length).toBeGreaterThan(0);
  });

  it('uses aiValidator when provided', async () => {
    const wordCard = state.cards.find((c) => c.type === 'word' && c.pairIndex === 0)!;
    const defCard = state.cards.find((c) => c.type === 'definition' && c.pairIndex === 1)!;
    // Override with always-true AI validator
    const result = await validateMatch(
      state.cards,
      wordCard.id,
      defCard.id,
      PAIRS,
      async () => true,
    );
    expect(result.isMatch).toBe(true);
  });

  it('returns isMatch=false for unknown card ids', async () => {
    const result = await validateMatch(state.cards, 'unknown-word', 'unknown-def', PAIRS);
    expect(result.isMatch).toBe(false);
  });
});

// ── applyMatch ───────────────────────────────────────────────────────────────

describe('applyMatch', () => {
  it('marks both cards as matched', () => {
    const state = createGameState(CONFIG);
    const cards = buildDeck(PAIRS);
    const wordCard = cards.find((c) => c.type === 'word' && c.pairIndex === 0)!;
    const defCard = cards.find((c) => c.type === 'definition' && c.pairIndex === 0)!;
    const workState: GameState = { ...state, cards };

    const next = applyMatch(workState, wordCard.id, defCard.id);
    expect(next.cards.find((c) => c.id === wordCard.id)?.state).toBe('matched');
    expect(next.cards.find((c) => c.id === defCard.id)?.state).toBe('matched');
  });

  it('increments current player score', () => {
    const state = { ...createGameState(CONFIG), currentPlayerIndex: 1 };
    const cards = buildDeck(PAIRS);
    const wordCard = cards.find((c) => c.type === 'word' && c.pairIndex === 0)!;
    const defCard = cards.find((c) => c.type === 'definition' && c.pairIndex === 0)!;
    const next = applyMatch({ ...state, cards }, wordCard.id, defCard.id);
    expect(next.scores[1]).toBe(1);
    expect(next.scores[0]).toBe(0);
  });

  it('sets gameOver when all pairs matched', () => {
    const state = createGameState({ ...CONFIG, word_definition_pairs: [PAIRS[0]] });
    const wordCard = state.cards.find((c) => c.type === 'word')!;
    const defCard = state.cards.find((c) => c.type === 'definition')!;
    const next = applyMatch(state, wordCard.id, defCard.id);
    expect(next.gameOver).toBe(true);
  });

  it('resets faceUpThisTurn', () => {
    const state = createGameState(CONFIG);
    const cards = buildDeck(PAIRS);
    const wordCard = cards.find((c) => c.type === 'word' && c.pairIndex === 0)!;
    const defCard = cards.find((c) => c.type === 'definition' && c.pairIndex === 0)!;
    const next = applyMatch(
      { ...state, cards, faceUpThisTurn: [wordCard.id, defCard.id] },
      wordCard.id,
      defCard.id,
    );
    expect(next.faceUpThisTurn).toEqual([null, null]);
  });
});

// ── applyNoMatch ─────────────────────────────────────────────────────────────

describe('applyNoMatch', () => {
  it('flips cards back to face-down', () => {
    const base = createGameState(CONFIG);
    const cards = base.cards.map((c, i) =>
      i < 2 ? { ...c, state: 'face-up' as const } : c,
    );
    const wordCard = cards.find((c) => c.type === 'word')!;
    const defCard = cards.find((c) => c.type === 'definition')!;
    const state: GameState = {
      ...base,
      cards,
      faceUpThisTurn: [wordCard.id, defCard.id],
    };
    const next = applyNoMatch(state);
    expect(next.cards.find((c) => c.id === wordCard.id)?.state).toBe('face-down');
    expect(next.cards.find((c) => c.id === defCard.id)?.state).toBe('face-down');
  });

  it('advances to the next player', () => {
    const state = createGameState(CONFIG); // 2 players
    const next = applyNoMatch(state);
    expect(next.currentPlayerIndex).toBe(1);
  });

  it('wraps around to player 0 after last player', () => {
    const state = { ...createGameState(CONFIG), currentPlayerIndex: 1 };
    const next = applyNoMatch(state);
    expect(next.currentPlayerIndex).toBe(0);
  });
});

// ── getWinners ───────────────────────────────────────────────────────────────

describe('getWinners', () => {
  it('returns the index of the player with the highest score', () => {
    expect(getWinners([3, 5, 2])).toEqual([1]);
  });

  it('returns multiple indices on a tie', () => {
    expect(getWinners([4, 4, 2])).toEqual([0, 1]);
  });

  it('handles a single player', () => {
    expect(getWinners([7])).toEqual([0]);
  });
});

// ── getHint ──────────────────────────────────────────────────────────────────

describe('getHint', () => {
  it('returns the id of the matching face-down definition card', () => {
    const cards = buildDeck(PAIRS);
    const wordCard = cards.find((c) => c.type === 'word' && c.pairIndex === 0)!;
    const expectedDefId = `def-0`;
    const hintId = getHint(cards, wordCard.id);
    expect(hintId).toBe(expectedDefId);
  });

  it('returns null when the definition is already matched', () => {
    const cards = buildDeck(PAIRS).map((c) =>
      c.id === 'def-0' ? { ...c, state: 'matched' as const } : c,
    );
    const hintId = getHint(cards, 'word-0');
    expect(hintId).toBeNull();
  });

  it('returns null for an unknown word card id', () => {
    const cards = buildDeck(PAIRS);
    expect(getHint(cards, 'nonexistent')).toBeNull();
  });
});
