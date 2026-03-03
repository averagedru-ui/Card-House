import React, { useState } from 'react';
import { useCardGame } from '../useCardGame';
import { getCompleteSets, getTotalBankValue } from '../engine';

export const GameMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const players = useCardGame(s => s.players);
  const myPlayerIndex = useCardGame(s => s.myPlayerIndex);
  const isMultiplayer = useCardGame(s => s.isMultiplayer);
  const saveGame = useCardGame(s => s.saveGame);
  const returnToMenu = useCardGame(s => s.returnToMenu);
  const clearSavedGame = useCardGame(s => s.clearSavedGame);

  const humanPlayer = players[myPlayerIndex];
  const completeSets = humanPlayer ? getCompleteSets(humanPlayer) : [];
  const bankValue = humanPlayer ? getTotalBankValue(humanPlayer) : 0;

  const handleSaveAndQuit = () => {
    if (!isMultiplayer) {
      saveGame();
    }
    returnToMenu();
  };

  const handleQuitWithoutSaving = () => {
    if (!isMultiplayer) {
      clearSavedGame();
    }
    returnToMenu();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-700/80 hover:bg-gray-600 transition-colors"
        aria-label="Menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect y="2" width="16" height="2" rx="1" fill="currentColor" className="text-gray-300" />
          <rect y="7" width="16" height="2" rx="1" fill="currentColor" className="text-gray-300" />
          <rect y="12" width="16" height="2" rx="1" fill="currentColor" className="text-gray-300" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-gray-700">
              <h2 className="text-white text-xl font-bold text-center">Menu</h2>
            </div>

            {humanPlayer && (
              <div className="px-5 py-4 border-b border-gray-700/50 bg-gray-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {humanPlayer.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{humanPlayer.name}</p>
                    <p className="text-gray-400 text-xs">{isMultiplayer ? 'Online Game' : 'vs AI'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-700/50 rounded-lg py-2 px-1">
                    <p className="text-yellow-400 font-bold text-lg">{completeSets.length}</p>
                    <p className="text-gray-400 text-[10px]">Sets</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg py-2 px-1">
                    <p className="text-emerald-400 font-bold text-lg">${bankValue}M</p>
                    <p className="text-gray-400 text-[10px]">Bank</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg py-2 px-1">
                    <p className="text-indigo-400 font-bold text-lg">{humanPlayer.hand.length}</p>
                    <p className="text-gray-400 text-[10px]">Cards</p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 space-y-2">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
              >
                Resume Game
              </button>

              {!isMultiplayer && (
                <button
                  onClick={handleSaveAndQuit}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
                >
                  Save & Quit
                </button>
              )}

              <button
                onClick={handleQuitWithoutSaving}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded-xl transition-colors"
              >
                {isMultiplayer ? 'Leave Game' : 'Quit Without Saving'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
