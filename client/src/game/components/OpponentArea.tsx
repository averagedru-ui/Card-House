import React from 'react';
import { Player, PropertyColor } from '../types';
import { PropertyArea } from './PropertyArea';
import { getCompleteSets, getTotalBankValue } from '../engine';

interface OpponentAreaProps {
  player: Player;
  isCurrentTurn: boolean;
  onPropertyClick?: (color: PropertyColor, cardId: string, playerId: number) => void;
}

export const OpponentArea: React.FC<OpponentAreaProps> = ({ player, isCurrentTurn, onPropertyClick }) => {
  const completeSets = getCompleteSets(player);
  const bankValue = getTotalBankValue(player);

  return (
    <div className={`rounded-2xl border p-2.5 transition-all ${
      isCurrentTurn
        ? 'border-yellow-500/70 bg-yellow-500/5 shadow-sm shadow-yellow-500/10'
        : 'border-gray-700/60 bg-gray-800/30'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isCurrentTurn ? 'bg-yellow-500 text-yellow-900' : 'bg-gray-700 text-gray-300'
          }`}>
            {player.name[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-semibold leading-tight">{player.name}</span>
            {isCurrentTurn && <span className="text-yellow-400 text-[10px] font-medium animate-pulse">Playing...</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0">
          <div className="bg-gray-700/40 rounded-md px-1.5 py-0.5">
            <span className="text-yellow-400 text-[10px] font-bold">{completeSets.length}/3</span>
          </div>
          <div className="bg-gray-700/40 rounded-md px-1.5 py-0.5">
            <span className="text-emerald-400 text-[10px] font-bold">${bankValue}M</span>
          </div>
          <div className="bg-gray-700/40 rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
            <div className="flex">
              {Array.from({ length: Math.min(player.hand.length, 3) }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-3.5 rounded-sm bg-gradient-to-br from-indigo-700 to-purple-800 border border-gray-600/50"
                  style={{ marginLeft: i > 0 ? '-3px' : 0, zIndex: i }}
                />
              ))}
            </div>
            <span className="text-gray-400 text-[9px] font-medium">{player.hand.length}</span>
          </div>
        </div>
      </div>

      <PropertyArea player={player} compact onPropertyClick={onPropertyClick} />

      {player.bank.length > 0 && (
        <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-gray-700/30">
          <span className="text-gray-500 text-[9px] flex-shrink-0">Bank:</span>
          <div className="flex items-center overflow-hidden">
            {player.bank.slice(0, 6).map((card, i) => (
              <div
                key={card.id}
                className="w-6 h-8 rounded-md border border-emerald-600/40 bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-emerald-300 text-[7px] font-bold flex-shrink-0"
                style={{ marginLeft: i > 0 ? '-3px' : 0, zIndex: i }}
              >
                ${card.value}M
              </div>
            ))}
            {player.bank.length > 6 && (
              <span className="text-gray-500 text-[8px] ml-1 flex-shrink-0">+{player.bank.length - 6}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
