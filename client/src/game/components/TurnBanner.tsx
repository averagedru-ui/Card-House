import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardGame } from '../useCardGame';

export const TurnBanner: React.FC = () => {
  const turnNumber = useCardGame(s => s.turnNumber);
  const players = useCardGame(s => s.players);
  const currentPlayerIndex = useCardGame(s => s.currentPlayerIndex);
  const myPlayerIndex = useCardGame(s => s.myPlayerIndex);
  const phase = useCardGame(s => s.phase);
  const [showBanner, setShowBanner] = useState(false);
  const [lastTurn, setLastTurn] = useState(0);

  useEffect(() => {
    if (turnNumber !== lastTurn && phase === 'draw') {
      setShowBanner(true);
      setLastTurn(turnNumber);
      const timer = setTimeout(() => setShowBanner(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [turnNumber, phase]);

  const currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer) return null;

  const isMyTurn = currentPlayerIndex === myPlayerIndex;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        >
          <div className={`px-4 py-1.5 rounded-xl shadow-lg ${
            isMyTurn
              ? 'bg-indigo-600/90 shadow-indigo-500/30'
              : 'bg-gray-700/90 shadow-gray-900/50'
          }`}>
            <div className={`text-sm font-bold text-center ${
              isMyTurn ? 'text-white' : 'text-gray-200'
            }`}>
              {isMyTurn ? '⚡ Your Turn!' : `${currentPlayer.name}'s Turn`}
            </div>
            <div className="text-center text-[10px] text-white/50">
              Turn {turnNumber}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
