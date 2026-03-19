import type { Card, GameConfig, GameState, WordDefinitionPair } from './types/game';

/** Fisher-Yates shuffle – returns a new array */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build the initial shuffled deck from the config */
export function buildDeck(pairs: WordDefinitionPair[]): Card[] {
  const cards: Card[] = [];
  pairs.forEach((pair, idx) => {
    cards.push({
      id: `word-${idx}`,
      pairIndex: idx,
      type: 'word',
      content: pair.word,
      state: 'face-down',
    });
    cards.push({
      id: `def-${idx}`,
      pairIndex: idx,
      type: 'definition',
      content: pair.definition,
      state: 'face-down',
    });
  });
  return shuffle(cards);
}

/** Create the initial GameState from a GameConfig */
export function createGameState(config: GameConfig): GameState {
  return {
    config,
    cards: buildDeck(config.word_definition_pairs),
    currentPlayerIndex: 0,
    scores: Array(config.num_players).fill(0) as number[],
    faceUpThisTurn: [null, null],
    turnPhase: 'pick-word',
    gameOver: false,
    secondsRemaining: config.timed ? (config.turn_time_limit ?? 30) : null,
    hintsUsed: 0,
  };
}

/**
 * Validate a word/definition pair semantically.
 *
 * The primary validation is structural: word and definition are from the
 * same pair as supplied by the game configurator, which is considered
 * the authoritative semantic truth.  This guards against positional
 * cheating (e.g. player 0 always picks card 0).
 *
 * For future extensibility, callers may pass an optional AI validator
 * function that receives the word and definition text and returns a
 * promise<boolean>.
 */
export function validateMatch(
  cards: Card[],
  wordCardId: string,
  defCardId: string,
  pairs: WordDefinitionPair[],
  aiValidator?: (word: string, definition: string) => Promise<boolean>,
): Promise<{ isMatch: boolean; explanation?: string }> {
  const wordCard = cards.find((c: Card) => c.id === wordCardId);
  const defCard = cards.find((c: Card) => c.id === defCardId);

  if (!wordCard || !defCard) {
    return Promise.resolve({ isMatch: false, explanation: 'Card not found.' });
  }

  // Semantic check: look up the correct definition for this word in the pairs
  const correctPair = pairs[wordCard.pairIndex];

  if (aiValidator) {
    return aiValidator(wordCard.content, defCard.content).then((result) => ({
      isMatch: result,
      explanation: result
        ? `"${wordCard.content}" correctly matches the definition.`
        : `"${defCard.content}" is not the correct definition for "${wordCard.content}".`,
    }));
  }

  // Structural/semantic match: both cards must have the same pairIndex
  const structuralMatch = wordCard.pairIndex === defCard.pairIndex;

  // Additional semantic check: the definition text must equal the pair's definition
  const semanticMatch =
    structuralMatch &&
    defCard.content.trim().toLowerCase() ===
      correctPair.definition.trim().toLowerCase();

  const isMatch = semanticMatch;
  return Promise.resolve({
    isMatch,
    explanation: isMatch
      ? `"${wordCard.content}" correctly matches the definition.`
      : `"${defCard.content}" is not the correct definition for "${wordCard.content}".`,
  });
}

/** Apply a confirmed match to the state (remove the pair from the board) */
export function applyMatch(state: GameState, wordCardId: string, defCardId: string): GameState {
  const newCards = state.cards.map((c: Card) => {
    if (c.id === wordCardId || c.id === defCardId) {
      return { ...c, state: 'matched' as const };
    }
    return c;
  });

  const newScores = [...state.scores];
  newScores[state.currentPlayerIndex] += 1;

  const allMatched = newCards.every((c: Card) => c.state === 'matched');
  const turnTimeLimit = state.config.timed
    ? (state.config.turn_time_limit ?? 30)
    : null;

  return {
    ...state,
    cards: newCards,
    scores: newScores,
    faceUpThisTurn: [null, null],
    turnPhase: 'pick-word',
    gameOver: allMatched,
    secondsRemaining: turnTimeLimit,
  };
}

/** Apply a no-match result to the state (flip cards back, advance turn) */
export function applyNoMatch(state: GameState): GameState {
  const [wordCardId, defCardId] = state.faceUpThisTurn;
  const newCards = state.cards.map((c: Card) => {
    if (c.id === wordCardId || c.id === defCardId) {
      return { ...c, state: 'face-down' as const };
    }
    return c;
  });

  const nextPlayerIndex =
    (state.currentPlayerIndex + 1) % state.config.num_players;
  const turnTimeLimit = state.config.timed
    ? (state.config.turn_time_limit ?? 30)
    : null;

  return {
    ...state,
    cards: newCards,
    faceUpThisTurn: [null, null],
    currentPlayerIndex: nextPlayerIndex,
    turnPhase: 'pick-word',
    secondsRemaining: turnTimeLimit,
  };
}

/** Determine the winner(s) once the game is over */
export function getWinners(scores: number[]): number[] {
  const maxScore = Math.max(...scores);
  return scores
    .map((s, i) => (s === maxScore ? i : -1))
    .filter((i) => i !== -1);
}

/**
 * Find a valid hint for the given word card:
 * returns the id of the matching definition card that is still face-down.
 */
export function getHint(cards: Card[], wordCardId: string): string | null {
  const wordCard = cards.find((c: Card) => c.id === wordCardId);
  if (!wordCard) return null;
  const matchingDef = cards.find(
    (c: Card) =>
      c.type === 'definition' &&
      c.pairIndex === wordCard.pairIndex &&
      c.state === 'face-down',
  );
  return matchingDef ? matchingDef.id : null;
}
