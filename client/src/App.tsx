import React, { useState, useEffect } from 'react';
import { CardHouseHome } from './game/components/CardHouseHome';
import { MultiplayerLobby } from './game/components/MultiplayerLobby';
import { GameBoard } from './game/components/GameBoard';
import { RulesScreen } from './game/components/RulesScreen';
import { ProfileScreen } from './game/components/ProfileScreen';
import { QuestScreen } from './game/components/QuestScreen';
import { useCardGame } from './game/useCardGame';

type Screen = 'home' | 'multiplayer' | 'rules' | 'profile' | 'quests';

function App() {
  const phase = useCardGame(s => s.phase);
  const isMultiplayer = useCardGame(s => s.isMultiplayer);
  const players = useCardGame(s => s.players);
  const startGame = useCardGame(s => s.startGame);
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
      setScreen('multiplayer');
    }
  }, []);

  // Multiplayer lobby takes priority — stay here until game is fully loaded
  if (screen === 'multiplayer' || (isMultiplayer && phase === 'menu')) {
    return <MultiplayerLobby onBack={() => setScreen('home')} />;
  }

  // Solo game or multiplayer game in progress — need real players loaded
  if (phase !== 'menu' && players.length > 0) {
    return <GameBoard />;
  }

  if (screen === 'rules') {
    return <RulesScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'profile') {
    return <ProfileScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'quests') {
    return <QuestScreen onBack={() => setScreen('home')} />;
  }

  return (
    <CardHouseHome
      onPlayItsADeal={(playerCount, playerName) => startGame(playerCount, playerName)}
      onMultiplayerItsADeal={() => setScreen('multiplayer')}
      onRules={() => setScreen('rules')}
      onProfile={() => setScreen('profile')}
      onQuests={() => setScreen('quests')}
    />
  );
}

export default App;
