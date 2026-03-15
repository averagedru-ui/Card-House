import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCardGame } from '../useCardGame';
import { PropertyColor } from '../types';
import { PROPERTY_SETS } from '../cards';
import { getCompleteSets, getRentAmount, getTotalBankValue } from '../engine';

// Plain modal shell — no animation so pointer events always fire immediately
const Modal: React.FC<{ children: React.ReactNode; scrollable?: boolean }> = ({ children, scrollable }) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <div
      className={`bg-gray-800 rounded-2xl p-4 md:p-6 max-w-md w-full border border-gray-600 ${scrollable ? 'max-h-[80vh] overflow-y-auto' : ''}`}
      style={scrollable ? { touchAction: 'pan-y' } : undefined}
    >
      {children}
    </div>
  </div>
);

export const ActionPanel: React.FC = () => {
  const phase = useCardGame(s => s.phase);
  const players = useCardGame(s => s.players);
  const pendingAction = useCardGame(s => s.pendingAction);
  const pendingTrade = useCardGame(s => s.pendingTrade);
  const selectTarget = useCardGame(s => s.selectTarget);
  const payDebt = useCardGame(s => s.payDebt);
  const setForcedDealOffer = useCardGame(s => s.setForcedDealOffer);
  const respondAction = useCardGame(s => s.respondAction);
  const cancelAction = useCardGame(s => s.cancelAction);
  const startTrade = useCardGame(s => s.startTrade);
  const respondTrade = useCardGame(s => s.respondTrade);
  const currentPlayerIndex = useCardGame(s => s.currentPlayerIndex);
  const pendingDoubleRent = useCardGame(s => (s as any).pendingDoubleRent || 0);
  const myPlayerIndex = useCardGame(s => s.myPlayerIndex);

  const [selectedPayCards, setSelectedPayCards] = useState<string[]>([]);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeStep, setTradeStep] = useState<'pick_mine' | 'pick_opponent' | 'pick_theirs'>('pick_mine');
  const [tradeMyCards, setTradeMyCards] = useState<{ color: PropertyColor; cardId: string }[]>([]);
  const [tradeTheirCards, setTradeTheirCards] = useState<{ color: PropertyColor; cardId: string }[]>([]);
  const [tradeOpponentId, setTradeOpponentId] = useState<number | null>(null);

  useEffect(() => {
    const handler = () => setShowTradeModal(true);
    window.addEventListener('open-trade-modal', handler);
    return () => window.removeEventListener('open-trade-modal', handler);
  }, []);

  const humanPlayer = players[myPlayerIndex];
  if (!humanPlayer) return null;

  const pd = (e: React.PointerEvent) => e.preventDefault();

  const CancelBtn = ({ label = 'Cancel' }: { label?: string }) => (
    <button onPointerDown={(e) => { pd(e); cancelAction(); }}
      className="w-full mt-3 py-3 rounded-xl bg-gray-700/60 text-gray-300 text-sm font-semibold">
      {label}
    </button>
  );

  // ── Action Response (JSN / Accept) ────────────────────────────────────────
  if (phase === 'action_response' && pendingAction?.targetPlayerId === myPlayerIndex) {
    const source = players.find(p => p.id === pendingAction.sourcePlayerId);
    const isCounterJsn = (pendingAction as any).blockedPlayers?.length > 0;
    const hasJSN = humanPlayer.hand.some(c => c.actionType === 'just_say_no');
    const actionLabels: Record<string, string> = {
      debt_collector: 'Debt Collector ($5M)', sly_deal: 'Sly Deal', deal_breaker: 'Deal Breaker',
      forced_deal: 'Forced Deal', rent: `Rent ($${pendingAction.amount}M)`, birthday: 'Birthday ($2M)',
    };
    if (isCounterJsn) {
      const blocker = players.find(p => (pendingAction as any).blockedPlayers?.includes(p.id));
      return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-5 max-w-md w-full border border-cyan-500/30">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🚫↔🚫</div>
              <h3 className="text-white text-xl font-bold">Just Say No Standoff!</h3>
              <p className="text-gray-400 text-sm mt-1"><span className="text-cyan-400 font-semibold">{blocker?.name}</span> blocked your action!</p>
            </div>
            <div className="flex flex-col gap-2">
              {hasJSN && (
                <button onPointerDown={(e) => { pd(e); respondAction(true); }}
                  className="py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  <span className="text-xl">🚫</span> Counter with Just Say No!
                </button>
              )}
              <button onPointerDown={(e) => { pd(e); respondAction(false); }}
                className="py-3 px-4 bg-gray-700 text-gray-300 font-semibold rounded-xl">Accept the block</button>
            </div>
          </motion.div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800 rounded-2xl p-5 max-w-md w-full border border-red-500/30">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">🚨</div>
            <h3 className="text-white text-xl font-bold">Incoming Action!</h3>
            <p className="text-gray-400 text-sm mt-1">{source?.name} plays <span className="text-yellow-400 font-semibold">{actionLabels[pendingAction.type] || pendingAction.type}</span></p>
          </div>
          <div className="flex flex-col gap-2">
            {hasJSN && (
              <button onPointerDown={(e) => { pd(e); respondAction(true); }}
                className="py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <span className="text-xl">🚫</span> Play Just Say No!
              </button>
            )}
            <button onPointerDown={(e) => { pd(e); respondAction(false); }}
              className="py-3 px-4 bg-gray-700 text-gray-300 font-semibold rounded-xl">
              {hasJSN ? "Accept (Don't Block)" : 'Accept'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Pay Debt ───────────────────────────────────────────────────────────────
  if (phase === 'pay_debt' && pendingAction?.currentResponder === myPlayerIndex) {
    const amount = pendingAction.amount || 0;
    const selectedTotal = selectedPayCards.reduce((sum, id) => {
      const bc = humanPlayer.bank.find(c => c.id === id);
      if (bc) return sum + bc.value;
      for (const color of Object.keys(humanPlayer.properties) as PropertyColor[]) {
        const pc = humanPlayer.properties[color].find(c => c.id === id);
        if (pc) return sum + pc.value;
      }
      return sum;
    }, 0);
    const totalAssets = getTotalBankValue(humanPlayer) +
      (Object.values(humanPlayer.properties) as any[]).flat().reduce((s: number, c: any) => s + c.value, 0);
    const canPay = selectedTotal >= amount || selectedTotal >= totalAssets;
    const togglePay = (id: string) => setSelectedPayCards(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

    return (
      <Modal scrollable>
        <h3 className="text-white text-lg font-bold mb-1">Pay ${amount}M</h3>
        <p className="text-gray-400 text-sm mb-3">Selected: ${selectedTotal}M {selectedTotal >= amount ? '✓ enough' : `(need $${amount - selectedTotal}M more)`}</p>
        {humanPlayer.bank.length > 0 && (
          <div className="mb-3">
            <h4 className="text-gray-300 text-xs font-semibold mb-1">Bank</h4>
            <div className="flex flex-wrap gap-1">
              {humanPlayer.bank.map(card => (
                <button key={card.id} onPointerDown={(e) => { pd(e); togglePay(card.id); }}
                  className={`px-2 py-1 rounded text-xs font-bold ${selectedPayCards.includes(card.id) ? 'bg-yellow-500 text-yellow-900' : 'bg-emerald-700 text-emerald-200'}`}>
                  ${card.value}M
                </button>
              ))}
            </div>
          </div>
        )}
        {(Object.keys(humanPlayer.properties) as PropertyColor[]).filter(c => humanPlayer.properties[c].length > 0).map(color => (
          <div key={color} className="mb-2">
            <div className="flex items-center gap-1 mb-0.5">
              <div className={`w-2 h-2 rounded-full ${PROPERTY_SETS[color].bgClass}`} />
              <span className="text-gray-300 text-xs font-semibold">{PROPERTY_SETS[color].label}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {humanPlayer.properties[color].map(card => (
                <button key={card.id} onPointerDown={(e) => { pd(e); togglePay(card.id); }}
                  className={`px-2 py-1 rounded text-xs font-medium ${selectedPayCards.includes(card.id) ? 'bg-yellow-500 text-yellow-900' : 'bg-gray-700 text-gray-300'}`}>
                  {card.name} (${card.value}M)
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="flex gap-2 mt-4">
          <button onPointerDown={(e) => { pd(e); if (canPay) { payDebt(selectedPayCards); setSelectedPayCards([]); } }}
            disabled={!canPay}
            className={`flex-1 py-2 rounded-lg font-bold ${canPay ? 'bg-yellow-500 text-yellow-900' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
            Pay ${selectedTotal}M
          </button>
          {totalAssets === 0 && (
            <button onPointerDown={(e) => { pd(e); payDebt([]); setSelectedPayCards([]); }}
              className="flex-1 py-2 rounded-lg font-bold bg-red-700 text-white">Can't Pay</button>
          )}
        </div>
      </Modal>
    );
  }

  // ── Action Target (human picks a target) ──────────────────────────────────
  if (phase === 'action_target' && currentPlayerIndex === myPlayerIndex && pendingAction) {

    if (pendingAction.type === 'debt_collector') {
      const opps = players.filter(p => p.id !== humanPlayer.id);
      return (
        <Modal>
          <h3 className="text-white text-lg font-bold mb-3">Charge $5M — Pick a player</h3>
          <div className="flex flex-col gap-2">
            {opps.map(opp => (
              <button key={opp.id} onPointerDown={(e) => { pd(e); selectTarget(opp.id); }}
                className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold flex justify-between items-center">
                <span>{opp.name}</span>
                <span className="text-emerald-400 text-sm">Bank: ${getTotalBankValue(opp)}M</span>
              </button>
            ))}
          </div>
          <CancelBtn />
        </Modal>
      );
    }

    if (pendingAction.type === 'sly_deal') {
      const opps = players.filter(p => p.id !== humanPlayer.id);
      const stealable: { playerId: number; playerName: string; color: PropertyColor; cardId: string; cardName: string }[] = [];
      for (const opp of opps) {
        const full = getCompleteSets(opp);
        for (const color of Object.keys(opp.properties) as PropertyColor[]) {
          if (full.includes(color)) continue;
          for (const card of opp.properties[color]) {
            stealable.push({ playerId: opp.id, playerName: opp.name, color, cardId: card.id, cardName: card.name });
          }
        }
      }
      if (stealable.length === 0) {
        return (
          <Modal>
            <h3 className="text-white text-lg font-bold mb-2">No stealable properties!</h3>
            <p className="text-gray-400 text-sm mb-3">All opponent properties are in complete sets.</p>
            <CancelBtn label="OK" />
          </Modal>
        );
      }
      return (
        <Modal scrollable>
          <h3 className="text-white text-lg font-bold mb-3">Sly Deal — Pick a property to steal</h3>
          <div className="flex flex-col gap-2">
            {stealable.map(item => (
              <button key={item.cardId}
                onPointerDown={(e) => { pd(e); selectTarget(item.playerId, item.color, item.cardId); }}
                className="py-3 px-4 rounded-xl bg-gray-700 text-white text-sm font-semibold flex justify-between items-center">
                <span>{item.cardName}</span>
                <span className="text-gray-400 text-xs">{item.playerName} · {PROPERTY_SETS[item.color].label}</span>
              </button>
            ))}
          </div>
          <CancelBtn />
        </Modal>
      );
    }

    if (pendingAction.type === 'forced_deal' && pendingAction.offeredProperty) {
      const opps = players.filter(p => p.id !== humanPlayer.id);
      const stealable: { playerId: number; playerName: string; color: PropertyColor; cardId: string; cardName: string }[] = [];
      for (const opp of opps) {
        const full = getCompleteSets(opp);
        for (const color of Object.keys(opp.properties) as PropertyColor[]) {
          if (full.includes(color)) continue;
          for (const card of opp.properties[color]) {
            stealable.push({ playerId: opp.id, playerName: opp.name, color, cardId: card.id, cardName: card.name });
          }
        }
      }
      if (stealable.length === 0) {
        return (
          <Modal>
            <h3 className="text-white text-lg font-bold mb-2">No properties to swap!</h3>
            <p className="text-gray-400 text-sm mb-3">All opponent properties are in complete sets.</p>
            <CancelBtn />
          </Modal>
        );
      }
      return (
        <Modal scrollable>
          <h3 className="text-white text-lg font-bold mb-1">Forced Deal — Pick their property</h3>
          <p className="text-gray-400 text-sm mb-3">Offering: <span className="text-white font-semibold">{pendingAction.offeredProperty.card.name}</span></p>
          <div className="flex flex-col gap-2">
            {stealable.map(item => (
              <button key={item.cardId}
                onPointerDown={(e) => { pd(e); selectTarget(item.playerId, item.color, item.cardId); }}
                className="py-3 px-4 rounded-xl bg-gray-700 text-white text-sm font-semibold flex justify-between items-center">
                <span>{item.cardName}</span>
                <span className="text-gray-400 text-xs">{item.playerName} · {PROPERTY_SETS[item.color].label}</span>
              </button>
            ))}
          </div>
          <CancelBtn />
        </Modal>
      );
    }

    if (pendingAction.type === 'deal_breaker') {
      const opps = players.filter(p => p.id !== humanPlayer.id);
      const sets: { playerId: number; playerName: string; color: PropertyColor }[] = [];
      for (const opp of opps) {
        for (const color of getCompleteSets(opp)) {
          sets.push({ playerId: opp.id, playerName: opp.name, color });
        }
      }
      if (sets.length === 0) {
        return (
          <Modal>
            <h3 className="text-white text-lg font-bold mb-2">No complete sets to steal!</h3>
            <p className="text-gray-400 text-sm mb-3">Opponents don't have any complete sets yet.</p>
            <CancelBtn label="OK" />
          </Modal>
        );
      }
      return (
        <Modal>
          <h3 className="text-white text-lg font-bold mb-3">Deal Breaker — Steal a complete set</h3>
          <div className="flex flex-col gap-2">
            {sets.map(item => (
              <button key={`${item.playerId}-${item.color}`}
                onPointerDown={(e) => { pd(e); selectTarget(item.playerId, item.color); }}
                className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${PROPERTY_SETS[item.color].bgClass}`} />
                  <span>{PROPERTY_SETS[item.color].label} Set</span>
                </div>
                <span className="text-gray-400 text-sm">{item.playerName}</span>
              </button>
            ))}
          </div>
          <CancelBtn />
        </Modal>
      );
    }

    if (pendingAction.type === 'rent' || pendingAction.type === 'wild_rent') {
      const ownedColors = (Object.keys(humanPlayer.properties) as PropertyColor[]).filter(c => humanPlayer.properties[c].length > 0);
      const availableColors = pendingAction.type === 'wild_rent'
        ? ownedColors
        : (pendingAction.card?.colors || []).filter(c => ownedColors.includes(c));
      const isWildRent = pendingAction.type === 'wild_rent';
      const doubleActive = pendingDoubleRent > 0;
      const chosenColor = (pendingAction as any).chosenRentColor as PropertyColor | undefined;

      if (isWildRent && chosenColor) {
        const opps = players.filter(p => p.id !== humanPlayer.id);
        return (
          <Modal>
            <h3 className="text-white text-lg font-bold mb-1">Wild Rent — Pick a player to charge</h3>
            <p className="text-gray-400 text-sm mb-3">
              {PROPERTY_SETS[chosenColor].label}: ${getRentAmount(humanPlayer, chosenColor)}M
              {doubleActive && <span className="text-yellow-400 font-bold ml-1">(×2!)</span>}
            </p>
            <div className="flex flex-col gap-2">
              {opps.map(opp => (
                <button key={opp.id} onPointerDown={(e) => { pd(e); selectTarget(opp.id, chosenColor); }}
                  className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold flex justify-between items-center">
                  <span>{opp.name}</span>
                  <span className="text-emerald-400 text-sm">Bank: ${getTotalBankValue(opp)}M</span>
                </button>
              ))}
            </div>
            <CancelBtn />
          </Modal>
        );
      }

      if (availableColors.length === 0) {
        return (
          <Modal>
            <h3 className="text-white text-lg font-bold mb-2">No matching properties!</h3>
            <p className="text-gray-400 text-sm mb-3">You don't have properties of the right color to charge rent on.</p>
            <CancelBtn label="OK" />
          </Modal>
        );
      }

      return (
        <Modal>
          <h3 className="text-white text-lg font-bold mb-1">{isWildRent ? 'Wild Rent — Choose a color' : 'Choose a color to charge rent on'}</h3>
          {isWildRent && <p className="text-gray-400 text-xs mb-2">You'll then choose which player pays</p>}
          {doubleActive && <p className="text-yellow-400 text-xs font-bold mb-2">⚡ Double Rent active — rent will be doubled!</p>}
          <div className="flex flex-col gap-2">
            {availableColors.map(color => (
              <button key={color}
                onPointerDown={(e) => {
                  pd(e);
                  if (isWildRent) {
                    useCardGame.setState(s => ({ pendingAction: s.pendingAction ? { ...s.pendingAction, chosenRentColor: color } as any : null }));
                  } else {
                    selectTarget(humanPlayer.id, color);
                  }
                }}
                className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${PROPERTY_SETS[color].bgClass}`} />
                  <span>{PROPERTY_SETS[color].label}</span>
                </div>
                <span className="text-emerald-400">${getRentAmount(humanPlayer, color)}M</span>
              </button>
            ))}
          </div>
          <CancelBtn />
        </Modal>
      );
    }

    if (pendingAction.type === 'house') {
      const NO_HH = ['black', 'purple'] as PropertyColor[];
      const eligible = getCompleteSets(humanPlayer).filter(c => !NO_HH.includes(c) && !humanPlayer.hasHouse[c]);
      return (
        <Modal>
          <h3 className="text-white text-lg font-bold mb-1">🏡 Add house to which set?</h3>
          <p className="text-gray-400 text-xs mb-3">Adds +$3M rent. Railroads/Utilities not eligible.</p>
          <div className="flex flex-col gap-2">
            {eligible.length === 0 && <p className="text-gray-400 text-sm">No eligible complete sets.</p>}
            {eligible.map(color => (
              <button key={color} onPointerDown={(e) => { pd(e); selectTarget(humanPlayer.id, color); }}
                className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${PROPERTY_SETS[color].bgClass}`} />
                <span>{PROPERTY_SETS[color].label}</span>
              </button>
            ))}
          </div>
          <CancelBtn />
        </Modal>
      );
    }

    if (pendingAction.type === 'hotel') {
      const NO_HH = ['black', 'purple'] as PropertyColor[];
      const eligible = getCompleteSets(humanPlayer).filter(c => !NO_HH.includes(c) && humanPlayer.hasHouse[c] && !humanPlayer.hasHotel[c]);
      return (
        <Modal>
          <h3 className="text-white text-lg font-bold mb-1">🏨 Add hotel to which set?</h3>
          <p className="text-gray-400 text-xs mb-3">Adds +$4M rent (requires a house first).</p>
          <div className="flex flex-col gap-2">
            {eligible.length === 0 && <p className="text-gray-400 text-sm">No sets with houses available.</p>}
            {eligible.map(color => (
              <button key={color} onPointerDown={(e) => { pd(e); selectTarget(humanPlayer.id, color); }}
                className="py-3 px-4 rounded-xl bg-gray-700 text-white font-semibold flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${PROPERTY_SETS[color].bgClass}`} />
                <span>{PROPERTY_SETS[color].label}</span>
              </button>
            ))}
          </div>
          <CancelBtn />
        </Modal>
      );
    }
  }

  // ── Forced Deal Pick (step 1 — pick your own property to offer) ───────────
  if (phase === 'forced_deal_pick' && currentPlayerIndex === myPlayerIndex && pendingAction && !pendingAction.offeredProperty) {
    const myProps: { color: PropertyColor; cardId: string; cardName: string }[] = [];
    for (const color of Object.keys(humanPlayer.properties) as PropertyColor[]) {
      for (const card of humanPlayer.properties[color]) {
        myProps.push({ color, cardId: card.id, cardName: card.name });
      }
    }
    return (
      <Modal scrollable>
        <h3 className="text-white text-lg font-bold mb-3">Forced Deal — Pick your property to offer</h3>
        <div className="flex flex-col gap-2">
          {myProps.length === 0 && <p className="text-gray-400 text-sm">No properties to offer!</p>}
          {myProps.map(item => (
            <button key={item.cardId}
              onPointerDown={(e) => { pd(e); setForcedDealOffer(item.color, item.cardId); }}
              className="py-3 px-4 rounded-xl bg-gray-700 text-white text-sm font-semibold flex justify-between items-center gap-2">
              <span className="truncate">{item.cardName}</span>
              <span className="text-gray-400 text-xs flex-shrink-0">{PROPERTY_SETS[item.color].label}</span>
            </button>
          ))}
        </div>
        <CancelBtn />
      </Modal>
    );
  }

  // ── Trade Response ─────────────────────────────────────────────────────────
  if (phase === 'trade_response' && pendingTrade && pendingTrade.toPlayerId === humanPlayer.id) {
    const fromPlayer = players.find(p => p.id === pendingTrade.fromPlayerId);
    const offeredCards = pendingTrade.offeredCards.map(item => {
      const card = fromPlayer?.properties[item.color]?.find(c => c.id === item.cardId);
      return { ...item, name: card?.name || 'Unknown', label: PROPERTY_SETS[item.color].label };
    });
    const requestedCards = pendingTrade.requestedCards.map(item => {
      const card = humanPlayer.properties[item.color]?.find(c => c.id === item.cardId);
      return { ...item, name: card?.name || 'Unknown', label: PROPERTY_SETS[item.color].label };
    });
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800 rounded-2xl p-5 max-w-md w-full border border-purple-500/30">
          <h3 className="text-white text-lg font-bold mb-3 text-center">Trade Proposal</h3>
          <p className="text-gray-400 text-sm text-center mb-4">{fromPlayer?.name} wants to trade with you</p>
          <div className="mb-3">
            <p className="text-purple-400 text-xs font-semibold mb-1">They offer:</p>
            {offeredCards.map(c => (
              <div key={c.cardId} className="py-1.5 px-3 rounded-lg bg-gray-700 text-white text-sm mb-1 flex justify-between">
                <span>{c.name}</span><span className="text-gray-400 text-xs">{c.label}</span>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <p className="text-red-400 text-xs font-semibold mb-1">They want:</p>
            {requestedCards.map(c => (
              <div key={c.cardId} className="py-1.5 px-3 rounded-lg bg-gray-700 text-white text-sm mb-1 flex justify-between">
                <span>{c.name}</span><span className="text-gray-400 text-xs">{c.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onPointerDown={(e) => { pd(e); respondTrade(false); }} className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold">Reject</button>
            <button onPointerDown={(e) => { pd(e); respondTrade(true); }} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold">Accept</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Trade Initiate Modal ───────────────────────────────────────────────────
  if (phase === 'play' && currentPlayerIndex === myPlayerIndex && showTradeModal) {
    const myProps: { color: PropertyColor; cardId: string; cardName: string }[] = [];
    for (const color of Object.keys(humanPlayer.properties) as PropertyColor[]) {
      for (const card of humanPlayer.properties[color]) {
        myProps.push({ color, cardId: card.id, cardName: card.name });
      }
    }
    const opps = players.filter(p => p.id !== humanPlayer.id);
    const resetTrade = () => { setShowTradeModal(false); setTradeStep('pick_mine'); setTradeMyCards([]); setTradeTheirCards([]); setTradeOpponentId(null); };
    const toggleMy = (item: { color: PropertyColor; cardId: string }) =>
      setTradeMyCards(p => p.some(c => c.cardId === item.cardId) ? p.filter(c => c.cardId !== item.cardId) : [...p, item]);
    const toggleTheir = (item: { color: PropertyColor; cardId: string }) =>
      setTradeTheirCards(p => p.some(c => c.cardId === item.cardId) ? p.filter(c => c.cardId !== item.cardId) : [...p, item]);

    if (tradeStep === 'pick_mine') {
      return (
        <Modal scrollable>
          <h3 className="text-white text-lg font-bold mb-1">🤝 Trade — Your offer</h3>
          <p className="text-gray-400 text-xs mb-3">Select one or more properties to offer</p>
          {myProps.length === 0 ? <p className="text-gray-400 text-sm mb-3">No properties to trade!</p> : (
            <div className="flex flex-col gap-1.5">
              {myProps.map(item => {
                const sel = tradeMyCards.some(c => c.cardId === item.cardId);
                return (
                  <button key={item.cardId} onPointerDown={(e) => { pd(e); toggleMy({ color: item.color, cardId: item.cardId }); }}
                    className={`py-2 px-3 rounded-lg text-sm font-medium flex justify-between items-center gap-2 ${sel ? 'bg-purple-600 text-white ring-2 ring-purple-400' : 'bg-gray-700 text-white'}`}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PROPERTY_SETS[item.color].bgClass}`} />
                      <span className="truncate">{item.cardName}</span>
                    </div>
                    <span className="text-gray-300 text-xs flex-shrink-0">{PROPERTY_SETS[item.color].label}</span>
                    {sel && <span className="text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
          {tradeMyCards.length > 0 && <div className="mt-2 p-2 bg-purple-900/30 rounded-lg"><p className="text-purple-300 text-xs">Offering {tradeMyCards.length} card{tradeMyCards.length > 1 ? 's' : ''}</p></div>}
          <div className="flex gap-2 mt-3">
            <button onPointerDown={(e) => { pd(e); resetTrade(); }} className="flex-1 py-2 bg-gray-700 text-white rounded-lg text-sm">Cancel</button>
            <button onPointerDown={(e) => { pd(e); if (tradeMyCards.length > 0) setTradeStep('pick_opponent'); }}
              disabled={tradeMyCards.length === 0}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${tradeMyCards.length > 0 ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
              Next →
            </button>
          </div>
        </Modal>
      );
    }

    if (tradeStep === 'pick_opponent') {
      return (
        <Modal>
          <h3 className="text-white text-lg font-bold mb-3">Trade with who?</h3>
          <div className="flex flex-col gap-1.5">
            {opps.map(opp => {
              const hasP = (Object.keys(opp.properties) as PropertyColor[]).some(c => opp.properties[c].length > 0);
              return (
                <button key={opp.id} onPointerDown={(e) => { pd(e); if (hasP) { setTradeOpponentId(opp.id); setTradeTheirCards([]); setTradeStep('pick_theirs'); } }}
                  disabled={!hasP}
                  className={`py-2 px-3 rounded-lg text-sm font-medium flex justify-between items-center ${hasP ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}>
                  <span>{opp.name}</span>
                  {!hasP && <span className="text-gray-500 text-xs">No properties</span>}
                </button>
              );
            })}
          </div>
          <button onPointerDown={(e) => { pd(e); setTradeStep('pick_mine'); }} className="w-full mt-3 py-2 bg-gray-700 text-white rounded-lg text-sm">← Back</button>
        </Modal>
      );
    }

    if (tradeStep === 'pick_theirs' && tradeOpponentId !== null) {
      const opp = players.find(p => p.id === tradeOpponentId)!;
      const oppProps: { color: PropertyColor; cardId: string; cardName: string }[] = [];
      for (const color of Object.keys(opp.properties) as PropertyColor[]) {
        for (const card of opp.properties[color]) oppProps.push({ color, cardId: card.id, cardName: card.name });
      }
      return (
        <Modal scrollable>
          <h3 className="text-white text-lg font-bold mb-1">What do you want from {opp.name}?</h3>
          <p className="text-gray-400 text-xs mb-3">Select one or more of their properties</p>
          <div className="flex flex-col gap-1.5">
            {oppProps.map(item => {
              const sel = tradeTheirCards.some(c => c.cardId === item.cardId);
              return (
                <button key={item.cardId} onPointerDown={(e) => { pd(e); toggleTheir({ color: item.color, cardId: item.cardId }); }}
                  className={`py-2 px-3 rounded-lg text-sm font-medium flex justify-between items-center gap-2 ${sel ? 'bg-green-700 text-white ring-2 ring-green-400' : 'bg-gray-700 text-white'}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PROPERTY_SETS[item.color].bgClass}`} />
                    <span className="truncate">{item.cardName}</span>
                  </div>
                  <span className="text-gray-300 text-xs flex-shrink-0">{PROPERTY_SETS[item.color].label}</span>
                  {sel && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>
          {tradeTheirCards.length > 0 && <div className="mt-2 p-2 bg-green-900/30 rounded-lg"><p className="text-green-300 text-xs">Requesting {tradeTheirCards.length} card{tradeTheirCards.length > 1 ? 's' : ''}</p></div>}
          <div className="flex gap-2 mt-3">
            <button onPointerDown={(e) => { pd(e); setTradeTheirCards([]); setTradeStep('pick_opponent'); }} className="flex-1 py-2 bg-gray-700 text-white rounded-lg text-sm">← Back</button>
            <button onPointerDown={(e) => {
              pd(e);
              if (tradeTheirCards.length > 0 && tradeMyCards.length > 0) {
                startTrade({ fromPlayerId: humanPlayer.id, toPlayerId: tradeOpponentId, offeredCards: tradeMyCards, requestedCards: tradeTheirCards });
                resetTrade();
              }
            }} disabled={tradeTheirCards.length === 0}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${tradeTheirCards.length > 0 ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
              Propose Trade
            </button>
          </div>
        </Modal>
      );
    }
  }

  return null;
};
