# It's A Deal - Property Card Game

## Overview
A Monopoly Deal-inspired property card game built with React, TypeScript, and Tailwind CSS. Players compete against AI opponents or other players online to collect 3 complete property sets.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion (2D card game UI, no 3D/Canvas)
- **Backend**: Express.js server with WebSocket support for multiplayer
- **State Management**: Zustand for game state
- **Shared Logic**: Game engine shared between client and server via `shared/` directory

## Project Structure
```
shared/
  gameTypes.ts       - Card types, game state types, player types (shared)
  cards.ts           - Card definitions, deck creation (shared)
  engine.ts          - Core game logic: draw, play, actions, AI, win conditions (shared)
  schema.ts          - Database schema (unused currently)
client/src/
  game/
    types.ts          - Re-exports from shared + client-only types (RoomInfo)
    cards.ts          - Re-exports from shared
    engine.ts         - Re-exports from shared
    useCardGame.ts    - Zustand store binding engine to React + multiplayer + save/load + chat
    useProfile.ts     - Profile system (localStorage): name, stats, friends, quest progress
    components/
      CardComponent.tsx     - Individual card rendering (property, money, action, wildcard)
      MainMenu.tsx          - Start screen: solo vs AI or multiplayer, resume, rules/quests/profile buttons
      MultiplayerLobby.tsx  - Room creation/joining, lobby UI, invite link sharing, chat relay
      GameBoard.tsx         - Main tabletop layout with draw/discard center, AI processing, menu, chat
      GameMenu.tsx          - In-game menu overlay (resume, rules, save & quit, quit)
      ChatPanel.tsx         - Chat panel (floating icon, works in solo + multiplayer)
      RulesScreen.tsx       - Full game rules page (card types, turn structure, action details)
      ProfileScreen.tsx     - Player profile (name edit, stats, friends list)
      QuestScreen.tsx       - Quest/challenge list with progress tracking
      TableCenter.tsx       - Draw pile + discard pile as card stacks in center of board
      PlayerHand.tsx        - Overlapping fanned card hand with hover-lift selection
      PropertyArea.tsx      - Fanned card groups by color set (compact/full modes)
      OpponentArea.tsx      - Opponent display with fanned properties, bank cards, hidden hand stack
      ActionPanel.tsx       - Modal UI for action card resolution (targeting, payments, Just Say No)
      GameLog.tsx           - Animated activity feed showing game events
      TurnBanner.tsx        - Animated turn announcement overlay
      ActionNotification.tsx - Floating notification for actions/charges
      GameOverScreen.tsx    - Win/lose screen with final standings
  App.tsx             - Root component routing between menu, lobby, and game
server/
  index.ts           - Express + HTTP server setup
  routes.ts          - WebSocket server for multiplayer rooms + game state management
  vite.ts            - Vite dev middleware
  static.ts          - Static file serving for production
script/
  build.ts           - Esbuild + Vite build script with @shared alias
```

## Game Rules
- 2-4 players (1 human + AI opponents, or all human via multiplayer)
- Draw 2 cards per turn, play up to 3
- Card types: Property, Money, Action, Wildcard
- Actions: Pass Go, Debt Collector, Birthday, Sly Deal, Forced Deal, Deal Breaker, Rent, House, Hotel, Just Say No
- Win by collecting 3 complete property sets
- Cards can be banked as money regardless of type
- Just Say No defensively blocks targeted actions (Sly Deal, Deal Breaker, Forced Deal, Debt Collector, Rent)

## Game Persistence
- Solo games auto-save to localStorage (debounced 500ms)
- Resume button on main menu shows turn number and player count
- Save cleared on game over or quit without saving
- Save & Quit option in in-game menu preserves state

## Multiplayer
- Firebase Realtime Database-based multiplayer (no backend server needed)
- Room system with 5-character codes stored in Firebase
- Optional room password (set on create, required to join if set)
- Shareable invite links (`?room=XXXXX` URL parameter)
- Client-side game logic with Firebase state sync (trust-based, suitable for friends)
- Player views: opponents' hands hidden via client-side filtering
- 2-4 players per room
- In-game chat via Firebase Realtime Database
- Firebase config in `client/src/game/firebase.ts`
- Multiplayer service in `client/src/game/firebaseMultiplayer.ts`

## Profile System
- localStorage-backed player profile (name, stats, friends, quest progress)
- Win/loss tracking with streak counter
- Friends list (add/remove by name)
- 10 quests with auto-completion tracking (first win, speed demon, pacifist, etc.)

## In-Game Menu
- Hamburger menu icon in game header bar
- Options: Resume, Rules, Save & Quit (solo only), Quit/Leave
- Profile section showing player stats (sets, bank, cards)

## Tech Stack
- React 18, TypeScript, Tailwind CSS, Zustand, Framer Motion
- Vite dev server with Express backend + WebSocket (ws library)
- esbuild for production server bundling
- Fully responsive (desktop + mobile)

## Deployment
### Replit (dev server)
- Dev: `npm run dev` (Express + Vite dev server on port 5000)
- Build: `npm run build` (bundles server + client)
- Run: `node ./dist/index.cjs`

### Vercel / Static Deploy
- Push to GitHub, connect to Vercel
- `vercel.json` configured: builds client via Vite, outputs to `dist/`, SPA rewrites
- No backend server needed — multiplayer runs via Firebase
- Firebase project: itsadeal-b2716
- Firebase Realtime Database: https://itsadeal-b2716-default-rtdb.firebaseio.com
