import React, { useState, useEffect } from 'react';
import { MainMenu } from './game/components/MainMenu';
import { MultiplayerLobby } from './game/components/MultiplayerLobby';
import { GameBoard } from './game/components/GameBoard';
import { useCardGame } from './game/useCardGame';

function App() {
  const phase = useCardGame(s => s.phase);
  const isMultiplayer = useCardGame(s => s.isMultiplayer);
  const [screen, setScreen] = useState<'menu' | 'multiplayer'>('menu');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      setScreen('multiplayer');
    }
  }, []);

  if (phase !== 'menu' || isMultiplayer) {
    return <GameBoard />;
  }

  if (screen === 'multiplayer') {
    return <MultiplayerLobby onBack={() => setScreen('menu')} />;
  }

  return <MainMenu onMultiplayer={() => setScreen('multiplayer')} />;
}

export default App;
