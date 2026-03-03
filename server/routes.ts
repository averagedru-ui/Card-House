import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import {
  initializeGame,
  drawCards,
  playCardToBank,
  playPropertyCard,
  playActionCard,
  resolveDebtPayment,
  resolveTargetAction,
  resolveActionResponse,
  discardCard,
  endTurn,
} from "@shared/engine";
import type { GameState, PropertyColor, Card } from "@shared/gameTypes";

interface Room {
  id: string;
  players: { ws: WebSocket; name: string; index: number }[];
  maxPlayers: number;
  gameState: GameState | null;
  isStarted: boolean;
}

const rooms = new Map<string, Room>();

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function broadcastToRoom(room: Room, message: any, exclude?: WebSocket) {
  const data = JSON.stringify(message);
  for (const player of room.players) {
    if (player.ws !== exclude && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(data);
    }
  }
}

function sendToPlayer(ws: WebSocket, message: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function getPlayerNames(room: Room): string[] {
  return room.players.map((p) => p.name);
}

function createPlayerView(gameState: GameState, playerIndex: number): GameState {
  const state: GameState = JSON.parse(JSON.stringify(gameState));
  for (let i = 0; i < state.players.length; i++) {
    if (i !== playerIndex) {
      state.players[i].hand = state.players[i].hand.map(() => ({
        id: "hidden",
        type: "hidden" as any,
        name: "???",
        value: 0,
      }));
    }
  }
  return state;
}

function processMultiplayerAction(
  gameState: GameState,
  action: any,
  playerIndex: number
): GameState | null {
  try {
    const state: GameState = JSON.parse(JSON.stringify(gameState));

    switch (action.type) {
      case "draw":
        if (state.phase !== "draw" || state.currentPlayerIndex !== playerIndex)
          return null;
        return drawCards(state, 2);

      case "play_bank":
        if (state.phase !== "play" || state.currentPlayerIndex !== playerIndex)
          return null;
        return playCardToBank(state, action.cardId);

      case "play_property":
        if (state.phase !== "play" || state.currentPlayerIndex !== playerIndex)
          return null;
        return playPropertyCard(state, action.cardId, action.color);

      case "play_action": {
        if (state.phase !== "play" || state.currentPlayerIndex !== playerIndex)
          return null;
        const result = playActionCard(state, action.cardId);
        if (result && "needsTarget" in result) return result.state;
        return result as GameState;
      }

      case "select_target":
        if (state.currentPlayerIndex !== playerIndex) return null;
        return resolveTargetAction(
          state,
          action.targetPlayerId,
          action.targetColor,
          action.targetCardId
        );

      case "pay_debt":
        if (state.pendingAction?.currentResponder !== playerIndex) return null;
        return resolveDebtPayment(state, playerIndex, action.cardIds || []);

      case "respond_action":
        if (state.pendingAction?.targetPlayerId !== playerIndex) return null;
        return resolveActionResponse(state, action.useJustSayNo || false);

      case "forced_deal_offer": {
        if (state.currentPlayerIndex !== playerIndex) return null;
        const player = state.players[playerIndex];
        const card = player.properties[action.color as PropertyColor]?.find(
          (c: Card) => c.id === action.cardId
        );
        if (!card || !state.pendingAction) return null;
        state.pendingAction.offeredProperty = {
          color: action.color,
          card,
        };
        state.phase = "action_target";
        state.message = "Choose opponent's property to take";
        return state;
      }

      case "discard":
        if (
          state.phase !== "discard" ||
          state.currentPlayerIndex !== playerIndex
        )
          return null;
        return discardCard(state, action.cardId);

      case "end_turn":
        if (state.phase !== "play" || state.currentPlayerIndex !== playerIndex)
          return null;
        return endTurn(state);

      default:
        return null;
    }
  } catch (err) {
    console.error("Error processing multiplayer action:", err);
    return null;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    let currentRoomId: string | null = null;
    let playerName = "";

    ws.on("message", (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (msg.type) {
        case "create_room": {
          playerName = (msg.playerName || "Player").slice(0, 12);
          let roomId = generateRoomId();
          while (rooms.has(roomId)) roomId = generateRoomId();
          const room: Room = {
            id: roomId,
            players: [{ ws, name: playerName, index: 0 }],
            maxPlayers: 4,
            gameState: null,
            isStarted: false,
          };
          rooms.set(roomId, room);
          currentRoomId = roomId;
          sendToPlayer(ws, {
            type: "room_created",
            roomId,
            players: [playerName],
          });
          break;
        }

        case "join_room": {
          playerName = (msg.playerName || "Player").slice(0, 12);
          const roomId = msg.roomId?.toUpperCase();
          const room = rooms.get(roomId);
          if (!room) {
            sendToPlayer(ws, { type: "error", message: "Room not found" });
            return;
          }
          if (room.isStarted) {
            sendToPlayer(ws, {
              type: "error",
              message: "Game already started",
            });
            return;
          }
          if (room.players.length >= room.maxPlayers) {
            sendToPlayer(ws, { type: "error", message: "Room is full" });
            return;
          }
          const idx = room.players.length;
          room.players.push({ ws, name: playerName, index: idx });
          currentRoomId = roomId;
          sendToPlayer(ws, {
            type: "room_joined",
            roomId,
            players: getPlayerNames(room),
          });
          broadcastToRoom(
            room,
            {
              type: "player_joined",
              players: getPlayerNames(room),
            },
            ws
          );
          break;
        }

        case "start_game": {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          if (room.players[0].ws !== ws) {
            sendToPlayer(ws, {
              type: "error",
              message: "Only the host can start",
            });
            return;
          }
          if (room.players.length < 2) {
            sendToPlayer(ws, {
              type: "error",
              message: "Need at least 2 players",
            });
            return;
          }
          room.isStarted = true;
          const names = room.players.map((p) => p.name);
          const gameState = initializeGame(room.players.length, names);
          room.gameState = gameState;

          for (const player of room.players) {
            const stateForPlayer = createPlayerView(gameState, player.index);
            sendToPlayer(player.ws, {
              type: "game_started",
              gameState: stateForPlayer,
              playerIndex: player.index,
            });
          }
          break;
        }

        case "game_action": {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room || !room.gameState) return;

          const playerIndex = room.players.findIndex((p) => p.ws === ws);
          if (playerIndex === -1) return;

          const newState = processMultiplayerAction(
            room.gameState,
            msg.action,
            playerIndex
          );
          if (newState) {
            room.gameState = newState;
            for (const player of room.players) {
              const stateForPlayer = createPlayerView(newState, player.index);
              sendToPlayer(player.ws, {
                type: "game_update",
                gameState: stateForPlayer,
                playerIndex: player.index,
              });
            }
          }
          break;
        }

        case "send_chat": {
          if (!currentRoomId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          const chatText = (msg.text || "").slice(0, 200);
          if (!chatText) return;
          broadcastToRoom(room, {
            type: "chat_message",
            sender: playerName,
            text: chatText,
            timestamp: Date.now(),
          });
          break;
        }
      }
    });

    ws.on("close", () => {
      if (currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.players = room.players.filter((p) => p.ws !== ws);
          if (room.players.length === 0) {
            rooms.delete(currentRoomId);
          } else {
            broadcastToRoom(room, {
              type: "player_left",
              players: getPlayerNames(room),
              leftPlayer: playerName,
            });
          }
        }
      }
    });
  });

  return httpServer;
}
