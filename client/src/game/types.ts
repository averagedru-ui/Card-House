export type {
  CardType,
  PropertyColor,
  PropertySetInfo,
  ActionType,
  Card,
  Player,
  GamePhase,
  PendingAction,
  GameLogEntry,
  ChatMessage,
  GameState,
} from '@shared/gameTypes';

export interface RoomInfo {
  id: string;
  players: { id: string; name: string; isHost: boolean }[];
  maxPlayers: number;
  isStarted: boolean;
}
