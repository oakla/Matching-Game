# 🃏 Word Matching Game

A browser-based platform for creating and playing custom word-matching games. Configure your own word/definition pairs, invite multiple players, and race to match them all!

## Features

- **Custom word/definition pairs** – Add any words and definitions you like before starting a game.
- **Multiplayer** – Supports 1–6 players taking turns on the same device.
- **Timed turns** – Optionally enable a per-turn countdown (5–120 seconds). Time-outs automatically advance to the next player.
- **Hints** – Optionally allow players to reveal the matching definition card during their turn (tracks how many hints were used).
- **Score tracking** – Points are awarded for every successful match; a winner (or tie) is announced when all pairs are matched.
- **Accessible** – Cards support keyboard navigation (Tab + Enter) and include descriptive `aria-label` attributes.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm (comes with Node.js)

### Installation

```bash
git clone https://github.com/oakla/Matching-Game.git
cd Matching-Game
npm install
```

### Running the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for production

```bash
npm run build       # type-check + Vite production build
npm run preview     # preview the production build locally
```

## How to Play

1. **Setup screen** – Edit the word/definition pairs (at least 2 complete pairs are required), choose the number of players, and optionally enable timed turns or hints. Click **Start Game →**.
2. **Game board** – Cards are laid out face-down in a grid. Word cards show a **W** badge; definition cards show a **D** badge.
3. **On your turn:**
   - Click a **Word** card to reveal it.
   - Click a **Definition** card to reveal it.
   - If they match, both cards are removed from the board and you score a point.
   - If they don't match, both cards flip back over and the turn passes to the next player.
4. **Hints** – When hints are enabled and a word card is face-up, click the 💡 **Hint** button to briefly highlight the matching definition card.
5. **End of game** – When all pairs are matched, the player(s) with the highest score are declared the winner. Click **🔄 New Game** to play again or **← Back to Setup** to change the configuration.

## Project Structure

```
src/
├── main.tsx               # React entry point
├── App.tsx                # Root component – manages setup ↔ game view
├── gameLogic.ts           # Pure game logic (shuffle, build deck, validate match, …)
├── types/
│   └── game.ts            # TypeScript types and interfaces (Card, GameState, …)
├── hooks/
│   └── useGameState.ts    # React hook that encapsulates all runtime game state
└── components/
    ├── Setup.tsx          # Configuration screen (pairs editor + options)
    ├── GameBoard.tsx      # Main game view (card grid + scoreboard)
    ├── Card.tsx           # Individual card tile component
    └── Scoreboard.tsx     # Score display, turn indicator, hint & reset buttons
```

## Tech Stack

| Tool | Purpose |
|---|---|
| [React 18](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Static typing |
| [Vite](https://vitejs.dev/) | Dev server & bundler |
| [Vitest](https://vitest.dev/) | Unit test runner |
| [Testing Library](https://testing-library.com/) | React component test utilities |
| [ESLint](https://eslint.org/) | Linting |

## Development Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest test suite |

## Running Tests

```bash
npm test
```

Tests live in `src/tests/` and cover the core game logic in `gameLogic.ts`.
