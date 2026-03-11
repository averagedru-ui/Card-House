import React, { useEffect, useRef } from 'react';
import { useCardGame } from '../useCardGame';
import { PlayerHand } from './PlayerHand';
import { OpponentArea } from './OpponentArea';
import { PropertyArea } from './PropertyArea';
import { ActionPanel } from './ActionPanel';
import { GameOverScreen } from './GameOverScreen';
import { GameLog } from './GameLog';
import { TurnBanner } from './TurnBanner';
import { ActionNotification } from './ActionNotification';
import { GameMenu } from './GameMenu';
import { ChatPanel } from './ChatPanel';
import { TableCenter } from './TableCenter';
import { PropertyColor } from '../types';
import { getCompleteSets, getTotalBankValue, endTurn } from '../engine';

export const GameBoard: React.FC = () => {
  const phase = useCardGame(s => s.phase);
  const players = useCardGame(s => s.players);
  const currentPlayerIndex = useCardGame(s => s.currentPlayerIndex);
  const message = useCardGame(s => s.message);
  const turnNumber = useCardGame(s => s.turnNumber);
  const cardsPlayedThisTurn = useCardGame(s => s.cardsPlayedThisTurn);
  const pendingAction = useCardGame(s => s.pendingAction);
  const processAITurns = useCardGame(s => s.processAITurns);
  const selectTarget = useCardGame(s => s.selectTarget);
  const myPlayerIndex = useCardGame(s => s.myPlayerIndex);
  const isMultiplayer = useCardGame(s => s.isMultiplayer);

  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (phase === 'game_over' || isMultiplayer) return;

    let shouldProcess = false;

    if (phase === 'trade_response') {
      const trade = useCardGame.getState().pendingTrade;
      if (trade) {
        const target = players.find(p => p.id === trade.toPlayerId);
        if (target?.isAI) shouldProcess = true;
      }
    } else if (phase === 'action_response') {
      const responderId = pendingAction?.targetPlayerId;
      const responder = players.find(p => p.id === responderId);
      if (responder?.isAI) shouldProcess = true;
    } else if (phase === 'pay_debt') {
      const responderId = pendingAction?.currentResponder;
      if (responderId !== undefined) {
        const responder = players.find(p => p.id === responderId);
        if (responder?.isAI) shouldProcess = true;
      }
    } else {
      const currentPlayer = players[currentPlayerIndex];
      if (currentPlayer?.isAI) shouldProcess = true;
    }

    if (!shouldProcess) return;

    aiTimerRef.current = setTimeout(() => {
      const currentState = useCardGame.getState();
      if (currentState.phase === 'draw') {
        currentState.draw();
      } else {
        currentState.processAITurns();
      }
    }, 800);

    // Watchdog: if AI hasn't advanced after 5s, force un-stick
    watchdogRef.current = setTimeout(() => {
      const s = useCardGame.getState();
      if (s.phase === 'game_over' || s.isMultiplayer) return;
      const isAIStuck =
        (s.phase === 'pay_debt' && s.players.find(p => p.id === s.pendingAction?.currentResponder)?.isAI) ||
        (s.phase === 'action_response' && s.players.find(p => p.id === s.pendingAction?.targetPlayerId)?.isAI) ||
        s.players[s.currentPlayerIndex]?.isAI;
      if (isAIStuck) {
        console.warn('[Watchdog] AI stuck at:', s.phase, '— forcing advance');
        if (s.phase === 'draw') {
          s.draw();
        } else if (s.phase === 'pay_debt' || s.phase === 'action_response') {
          s.processAITurns();
        } else {
          useCardGame.setState(st => ({ ...endTurn(st) }));
        }
      }
    }, 5000);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
  }, [phase, currentPlayerIndex, turnNumber, cardsPlayedThisTurn, pendingAction?.currentResponder, pendingAction?.targetPlayerId, pendingAction?.respondingPlayers?.length]);

  // Desktop responsive: remove old mobile-scale approach, use flex layout instead
  useEffect(() => {
    // Clear any leftover scale from previous renders
    document.documentElement.style.removeProperty('--board-scale');
    const scaler = document.querySelector('.game-board-scaler') as HTMLElement;
    if (scaler) { scaler.style.marginLeft = ''; }
  }, []);

  if (phase === 'game_over') {
    return <GameOverScreen />;
  }

  const humanPlayer = players[myPlayerIndex];
  const opponents = players.filter((_, i) => i !== myPlayerIndex);

  if (!humanPlayer) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gray-900">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }
  const completeSets = humanPlayer ? getCompleteSets(humanPlayer) : [];
  const bankValue = humanPlayer ? getTotalBankValue(humanPlayer) : 0;
  const isMyTurn = currentPlayerIndex === myPlayerIndex;

  const handleOpponentPropertyClick = (color: PropertyColor, cardId: string, playerId: number) => {
    if (phase === 'action_target' && pendingAction && isMyTurn) {
      if (pendingAction.type === 'sly_deal' || pendingAction.type === 'forced_deal') {
        selectTarget(playerId, color, cardId);
      }
    }
  };

  return (
    <div className="h-[100dvh] bg-gray-900 flex flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div
        className="bg-gray-900 border-b border-gray-800 px-3 py-2 flex items-center justify-between flex-shrink-0"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2">
          <GameMenu />
          <span className="text-yellow-500 font-black text-sm tracking-tight">IT'S A DEAL</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-[11px]">T{turnNumber}</span>
          <div className="flex items-center gap-1 bg-emerald-900/30 rounded-lg px-2 py-0.5">
            <span className="text-emerald-400 text-[11px] font-bold">${bankValue}M</span>
          </div>
          <div className="flex items-center gap-1 bg-yellow-900/30 rounded-lg px-2 py-0.5">
            <span className="text-yellow-400 text-[11px] font-bold">{completeSets.length}/3</span>
          </div>
          {isMultiplayer && <span className="text-indigo-400 text-[9px] font-semibold px-1.5 py-0.5 bg-indigo-900/40 rounded-md">LIVE</span>}
          <GameLog />
          <ChatPanel />
        </div>
      </div>

      <TurnBanner />
      <ActionNotification />

      {/* ── Status message ──────────────────────────────────────── */}
      <div className={`text-center py-1 px-3 text-xs font-medium flex-shrink-0 ${
        isMyTurn ? 'bg-indigo-900/30 text-indigo-300' : 'bg-gray-800/30 text-gray-400'
      }`}>
        {message}
        {phase === 'play' && isMyTurn && (
          <span className="ml-1.5 text-gray-500">({3 - cardsPlayedThisTurn} left)</span>
        )}
      </div>

      {/* ── Main game area ──────────────────────────────────────── */}
      {/* On desktop (md+): two-column layout. On mobile: single column scroll */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">

        {/* Left / main column: opponents + table center */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 flex flex-col gap-2"
             style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className={`grid gap-2 ${opponents.length >= 2 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {opponents.map(opp => (
              <OpponentArea
                key={opp.id}
                player={opp}
                isCurrentTurn={currentPlayerIndex === opp.id}
                onPropertyClick={handleOpponentPropertyClick}
              />
            ))}
          </div>

          <div className="flex-1 flex items-center justify-center min-h-[80px]">
            <TableCenter />
          </div>
        </div>

        {/* Right panel on desktop: human player properties + bank */}
        {humanPlayer && (
          <div className="md:w-72 lg:w-80 flex-shrink-0 md:border-l md:border-gray-800 flex flex-col">
            {/* Player info row */}
            <div className={`px-3 py-2 border-b border-gray-800 flex items-center justify-between flex-shrink-0 ${
              isMyTurn ? 'bg-indigo-950/30' : 'bg-gray-900/50'
            }`}>
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isMyTurn ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}>
                  {humanPlayer.name[0]}
                </div>
                <span className="text-white text-xs font-semibold">{humanPlayer.name}</span>
                {isMyTurn && <span className="text-indigo-400 text-[9px] font-medium animate-pulse">Your Turn</span>}
              </div>
              <div className="flex items-center gap-1">
                {humanPlayer.bank.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {humanPlayer.bank.slice(0, 5).map((card, i) => (
                        <div
                          key={card.id}
                          className="w-5 h-7 rounded border border-emerald-600/40 bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-emerald-300 text-[6px] font-bold"
                          style={{ marginLeft: i > 0 ? '-3px' : 0, zIndex: i }}
                        >
                          ${card.value}M
                        </div>
                      ))}
                      {humanPlayer.bank.length > 5 && (
                        <span className="text-gray-500 text-[7px] ml-0.5">+{humanPlayer.bank.length - 5}</span>
                      )}
                    </div>
                    <span className="text-emerald-400 text-[10px] font-bold">${bankValue}M</span>
                  </div>
                )}
              </div>
            </div>

            {/* Property area */}
            <div className="flex-1 overflow-y-auto md:block hidden">
              <PropertyArea player={humanPlayer} compact={false} highlightComplete isMyBoard />
            </div>
            {/* Mobile: compact inline property area */}
            <div className="md:hidden px-2 py-1 border-t border-gray-800">
              <PropertyArea player={humanPlayer} compact highlightComplete isMyBoard />
            </div>
          </div>
        )}
      </div>

      {/* ── Player hand (bottom, full width) ───────────────────── */}
      <PlayerHand />
      <ActionPanel />
    </div>
  );
  );
};
