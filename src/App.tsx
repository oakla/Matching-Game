import { useState } from 'react';
import type { GameConfig } from './types/game';
import { Setup } from './components/Setup';
import { GameBoard } from './components/GameBoard';
import './App.css';

type AppView = 'setup' | 'game';

function App() {
  const [view, setView] = useState<AppView>('setup');
  const [config, setConfig] = useState<GameConfig | null>(null);

  const handleStart = (cfg: GameConfig) => {
    setConfig(cfg);
    setView('game');
  };

  const handleExit = () => {
    setView('setup');
    setConfig(null);
  };

  return (
    <>
      {view === 'setup' && <Setup onStart={handleStart} />}
      {view === 'game' && config && (
        <GameBoard config={config} onExit={handleExit} />
      )}
    </>
  );
}

export default App;
