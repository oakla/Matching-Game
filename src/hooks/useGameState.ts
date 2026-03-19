import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameConfig, GameState } from '../types/game';
import {
  applyMatch,
  applyNoMatch,
  createGameState,
  getHint,
  validateMatch,
} from '../gameLogic';

const NO_MATCH_DISPLAY_MS = 1200;

export function useGameState(config: GameConfig) {
  const [state, setState] = useState<GameState>(() => createGameState(config));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (!config.timed) return;
    clearTimer();
    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.secondsRemaining === null) return prev;
        const next = prev.secondsRemaining - 1;
        if (next <= 0) {
          clearTimer();
          // Time up: treat as no-match and advance turn
          return applyNoMatch({ ...prev, secondsRemaining: 0 });
        }
        return { ...prev, secondsRemaining: next };
      });
    }, 1000);
  }, [config.timed, clearTimer]);

  useEffect(() => {
    if (state.gameOver) {
      clearTimer();
      return;
    }
    if (config.timed && state.turnPhase === 'pick-word') {
      startTimer();
    }
    return clearTimer;
  }, [state.turnPhase, state.gameOver, config.timed, startTimer, clearTimer]);

  // ── Card Flip ──────────────────────────────────────────────────────────────
  const flipCard = useCallback(
    (cardId: string) => {
      setState((prev) => {
        if (prev.gameOver) return prev;
        if (prev.turnPhase === 'evaluating' || prev.turnPhase === 'no-match')
          return prev;

        const card = prev.cards.find((c) => c.id === cardId);
        if (!card || card.state !== 'face-down') return prev;

        const [wordId] = prev.faceUpThisTurn;

        if (prev.turnPhase === 'pick-word') {
          if (card.type !== 'word') return prev; // must flip a word card first
          const newCards = prev.cards.map((c) =>
            c.id === cardId ? { ...c, state: 'face-up' as const } : c,
          );
          return {
            ...prev,
            cards: newCards,
            faceUpThisTurn: [cardId, null],
            turnPhase: 'pick-definition',
          };
        }

        if (prev.turnPhase === 'pick-definition') {
          if (card.type !== 'definition') return prev; // must flip a definition card
          const newCards = prev.cards.map((c) =>
            c.id === cardId ? { ...c, state: 'face-up' as const } : c,
          );

          // Kick off async validation after state update
          const nextState: GameState = {
            ...prev,
            cards: newCards,
            faceUpThisTurn: [wordId, cardId],
            turnPhase: 'evaluating',
          };

          // Validate asynchronously (side-effect scheduled after return)
          setTimeout(async () => {
            const result = await validateMatch(
              nextState.cards,
              wordId!,
              cardId,
              nextState.config.word_definition_pairs,
            );

            setState((current) => {
              if (current.turnPhase !== 'evaluating') return current;
              if (result.isMatch) {
                return applyMatch(current, wordId!, cardId);
              }
              // Show no-match briefly then flip back
              const noMatchState = { ...current, turnPhase: 'no-match' as const };
              setTimeout(() => {
                setState((s) =>
                  s.turnPhase === 'no-match' ? applyNoMatch(s) : s,
                );
              }, NO_MATCH_DISPLAY_MS);
              return noMatchState;
            });
          }, 0);

          return nextState;
        }

        return prev;
      });
    },
    [],
  );

  // ── Hint ───────────────────────────────────────────────────────────────────
  const [hintCardId, setHintCardId] = useState<string | null>(null);

  const requestHint = useCallback(() => {
    if (!config.hints_allowed) return;
    setState((prev) => {
      const [wordId] = prev.faceUpThisTurn;
      if (!wordId) return prev;
      const hint = getHint(prev.cards, wordId);
      setHintCardId(hint);
      return { ...prev, hintsUsed: prev.hintsUsed + 1 };
    });
    // Clear hint after 2 s
    setTimeout(() => setHintCardId(null), 2000);
  }, [config.hints_allowed]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    clearTimer();
    setHintCardId(null);
    setState(createGameState(config));
  }, [config, clearTimer]);

  return { state, flipCard, requestHint, hintCardId, resetGame };
}
