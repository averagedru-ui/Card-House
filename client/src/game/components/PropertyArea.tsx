import React from 'react';
import { Player, PropertyColor } from '../types';
import { PROPERTY_SETS } from '../cards';
import { getCompleteSets, getRentAmount } from '../engine';

interface PropertyAreaProps {
  player: Player;
  compact?: boolean;
  onPropertyClick?: (color: PropertyColor, cardId: string, playerId: number) => void;
  highlightComplete?: boolean;
}

const colorGradients: Record<PropertyColor, string> = {
  brown: 'from-amber-800 to-amber-900',
  blue: 'from-blue-500 to-blue-700',
  green: 'from-green-500 to-green-700',
  red: 'from-red-500 to-red-700',
  yellow: 'from-yellow-400 to-yellow-600',
  orange: 'from-orange-400 to-orange-600',
  pink: 'from-pink-400 to-pink-600',
  teal: 'from-teal-400 to-teal-600',
  purple: 'from-purple-500 to-purple-700',
  black: 'from-gray-600 to-gray-800',
};

const textColors: Record<PropertyColor, string> = {
  brown: 'text-amber-100',
  blue: 'text-blue-100',
  green: 'text-green-100',
  red: 'text-red-100',
  yellow: 'text-yellow-900',
  orange: 'text-orange-100',
  pink: 'text-pink-100',
  teal: 'text-teal-100',
  purple: 'text-purple-100',
  black: 'text-gray-100',
};

export const PropertyArea: React.FC<PropertyAreaProps> = ({ player, compact, onPropertyClick, highlightComplete }) => {
  const completeSets = getCompleteSets(player);
  const colors = (Object.keys(PROPERTY_SETS) as PropertyColor[]).filter(c => player.properties[c].length > 0);

  if (colors.length === 0) {
    return null;
  }

  const cardW = compact ? 'w-10' : 'w-14';
  const cardH = compact ? 'h-14' : 'h-[4.5rem]';
  const containerH = compact ? '3.5rem' : '4.5rem';
  const headerText = compact ? 'text-[6px]' : 'text-[7px]';
  const nameText = compact ? 'text-[5px]' : 'text-[7px]';
  const valueText = compact ? 'text-[5px]' : 'text-[6px]';
  const overlapOffset = compact ? 10 : 16;

  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map(color => {
        const setInfo = PROPERTY_SETS[color];
        const cards = player.properties[color];
        const isComplete = completeSets.includes(color);
        const rent = getRentAmount(player, color);
        const stackW = cards.length > 1
          ? (compact ? 40 : 56) + (cards.length - 1) * overlapOffset
          : (compact ? 40 : 56);

        return (
          <div key={color} className="flex flex-col items-start">
            <div
              className={`relative rounded-lg ${
                isComplete
                  ? 'ring-1 ring-yellow-400/80 shadow-sm shadow-yellow-500/15'
                  : ''
              } ${highlightComplete && isComplete ? 'animate-pulse' : ''}`}
              style={{ width: `${stackW}px`, height: containerH }}
            >
              {cards.map((card, i) => (
                <div
                  key={card.id}
                  className={`absolute top-0 ${cardW} ${cardH} rounded-lg border bg-gradient-to-br ${colorGradients[color]} shadow flex flex-col overflow-hidden ${
                    isComplete ? 'border-yellow-400/50' : 'border-white/15'
                  } ${onPropertyClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
                  style={{ left: `${i * overlapOffset}px`, zIndex: i }}
                  onClick={onPropertyClick ? () => onPropertyClick(color, card.id, player.id) : undefined}
                >
                  <div className={`bg-white/20 text-center ${headerText} ${textColors[color]} font-bold uppercase px-0.5 leading-relaxed`}>
                    {card.type === 'wildcard' ? 'W' : setInfo.label.slice(0, 4)}
                  </div>
                  <div className={`flex-1 flex items-center justify-center px-0.5 ${nameText} ${textColors[color]} font-semibold text-center leading-tight`}>
                    {card.type === 'wildcard' ? 'Wild' : card.name.length > 8 ? card.name.slice(0, 7) + '.' : card.name}
                  </div>
                  <div className={`bg-black/25 text-white text-center ${valueText} font-mono leading-relaxed`}>
                    ${card.value}M
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-0.5 mt-0.5 px-0.5">
              <span className={`${compact ? 'text-[7px]' : 'text-[8px]'} text-gray-400`}>
                {cards.length}/{setInfo.needed}
              </span>
              {isComplete && <span className="text-[7px]">&#x2B50;</span>}
              {!compact && (
                <span className="text-[7px] text-gray-500">
                  ${rent}M
                  {player.hasHouse[color] && ' 🏡'}
                  {player.hasHotel[color] && ' 🏨'}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
