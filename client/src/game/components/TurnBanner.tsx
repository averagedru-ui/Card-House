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
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        >
          <div className={`px-8 py-4 rounded-2xl shadow-2xl ${
            isMyTurn
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/30'
              : 'bg-gradient-to-r from-gray-700 to-gray-800 shadow-gray-900/50'
          }`}>
            <div className={`text-2xl md:text-3xl font-black text-center ${
              isMyTurn ? 'text-white' : 'text-gray-300'
            }`}>
              {isMyTurn ? 'Your Turn!' : `${currentPlayer.name}'s Turn`}
            </div>
            <div className="text-center text-sm mt-1 text-white/60">
              Turn {turnNumber}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
