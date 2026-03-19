/** A word/definition pair provided by the game configurator */
export interface WordDefinitionPair {
  word: string;
  definition: string;
}

/** The type of a card on the board */
export type CardType = 'word' | 'definition';

/** The state of a single card on the board */
export interface Card {
  id: string;          // unique id, e.g. "word-0" or "def-0"
  pairIndex: number;   // index into the original word_definition_pairs array
  type: CardType;
  content: string;     // the word or definition text
  state: CardState;
}

export type CardState = 'face-down' | 'face-up' | 'matched';

/** Configuration passed when creating a new game */
export interface GameConfig {
  word_definition_pairs: WordDefinitionPair[];
  num_players: number;
  timed?: boolean;
  hints_allowed?: boolean;
  /** Time per turn in seconds (only used when timed=true) */
  turn_time_limit?: number;
}

/** Runtime state of the game */
export interface GameState {
  config: GameConfig;
  cards: Card[];
  /** Index of the current player (0-based) */
  currentPlayerIndex: number;
  /** Scores indexed by player index */
  scores: number[];
  /** Cards currently face-up this turn (max 2: one word, one definition) */
  faceUpThisTurn: [string | null, string | null]; // [wordCardId, defCardId]
  /** Phase of the current turn */
  turnPhase: TurnPhase;
  /** Whether the game is over */
  gameOver: boolean;
  /** Seconds remaining in current turn (only relevant when timed=true) */
  secondsRemaining: number | null;
  /** Number of hints used this game */
  hintsUsed: number;
}

/**
 * Phases within a single turn:
 *   'pick-word'      – waiting for the player to pick a word card
 *   'pick-definition'– word card is face-up, waiting for a definition card
 *   'evaluating'     – both cards are face-up, checking for a match
 *   'no-match'       – result shown briefly before cards are flipped back
 */
export type TurnPhase =
  | 'pick-word'
  | 'pick-definition'
  | 'evaluating'
  | 'no-match';

/** Result from the match validator */
export interface MatchResult {
  isMatch: boolean;
  explanation?: string;
}
