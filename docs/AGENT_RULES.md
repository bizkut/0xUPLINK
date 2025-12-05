# AGENT RULES - 0xUPLINK

> **Instructions for AI Agent**: Read and follow these rules before making any code changes.

---

## Pre-Task Checklist

Before starting ANY coding task:

1. [ ] Read `docs/PROJECT_CONTEXT.md` for game vision
2. [ ] Read `docs/ARCHITECTURE.md` for technical details
3. [ ] Check `docs/AGENT_TASKS.md` for current priorities
4. [ ] Understand the existing code patterns in the relevant files

---

## Code Style & Conventions

### JavaScript

```javascript
// Use ES6 modules
import { something } from './module.js';
export const myFunction = () => {};

// Use const/let, never var
const immutable = 'value';
let mutable = 'value';

// Use arrow functions for callbacks
array.map(item => item.value);

// Use template literals
const message = `Player ${name} connected`;

// Use destructuring
const { id, name } = player;
const [first, ...rest] = array;

// Use async/await over raw promises
async function fetchData() {
  const result = await fetch(url);
  return result.json();
}
```

### Naming Conventions

```javascript
// Constants: SCREAMING_SNAKE_CASE
const MAX_PLAYERS = 100;
const ICE_TYPES = {};

// Functions/variables: camelCase
const playerCount = 0;
function calculateDamage() {}

// Classes: PascalCase
class GameServer {}

// Files: camelCase.js for modules, SCREAMING_SNAKE.md for docs
// game.js, nodeMap.js, constants.js
// PROJECT_CONTEXT.md, AGENT_RULES.md
```

### File Organization

```javascript
// Order of imports
// 1. Node.js built-ins
import { fileURLToPath } from 'url';

// 2. External packages
import express from 'express';

// 3. Local modules
import { CONSTANTS } from '../shared/constants.js';

// Order within file
// 1. Imports
// 2. Constants
// 3. Helper functions
// 4. Main class/exports
// 5. Initialization code
```

---

## Architecture Rules

### Client-Server Boundary

```
CLIENT (browser):
- UI rendering
- User input handling
- Local state for display
- WebSocket message sending
- Animation/visual feedback

SERVER (Node.js):
- ALL game logic
- State validation
- Authoritative game state
- Persistence
- Broadcasting to clients
```

### State Management

```javascript
// Server: Single source of truth
gameState = {
  players: Map(),
  servers: Map(),
  factions: {},
  universe: {},  // sectors, clusters, networks
};

// Client: Display state only
this.state = {
  player: {},       // Received from server
  connection: {},   // Current hack session
  ui: {},          // Local UI state only
};
```

### Message Handling

```javascript
// Always use typed messages
const MESSAGE_TYPES = {
  // Client → Server
  SCAN: 'SCAN',
  CONNECT: 'CONNECT',
  HACK: 'HACK',
  
  // Server → Client
  INIT: 'INIT',
  SCAN_RESULT: 'SCAN_RESULT',
  ERROR: 'ERROR',
};

// Always validate on server
function handleMessage(player, message) {
  const { type, payload } = message;
  
  // Validate type exists
  if (!MESSAGE_TYPES[type]) {
    return sendError(player, 'Invalid message type');
  }
  
  // Validate payload
  if (!validatePayload(type, payload)) {
    return sendError(player, 'Invalid payload');
  }
  
  // Process
  handlers[type](player, payload);
}
```

---

## Game Design Rules

### Balance Principles

1. **Risk vs Reward**: Higher security zones = lower risk, lower reward
2. **Time Investment**: Upgrades should feel meaningful but not grindy
3. **Skill Expression**: Better players should win, not just better gear
4. **Counterplay**: Every offensive tool has a defensive counter

### Security Zone Rules

```
CLEARNET (0.5-1.0):
- AI Sentinels respond in <5 seconds
- Attacking players = bounty + federal heat
- NPC servers only (corps, banks)
- No sovereignty allowed
- Trace rate: 3-5%/sec

GREYNET (0.1-0.4):
- Sentry ICE on backbone nodes
- Players can attack with consequences
- Faction warfare zones
- Limited structures allowed
- Trace rate: 2-3%/sec

DARKNET (≤0.0):
- No protection whatsoever
- Full PvP, no consequences
- Sovereignty allowed
- All structures allowed
- Trace rate: 1-2%/sec
```

### Economy Rules

1. **Credit Sinks**: Hardware upgrades, structure deployment, repairs
2. **Credit Sources**: Contracts, data theft, resource selling, mining
3. **Inflation Control**: Maintenance costs, destruction on death
4. **No Pay-to-Win**: All items obtainable through gameplay

---

## Testing Requirements

### Before Committing

1. **Manual test** the feature in browser
2. **Check console** for errors (client and server)
3. **Test edge cases**: Empty inputs, invalid IPs, disconnections
4. **Test multiplayer** if applicable (two browser tabs)

### Test Scenarios to Always Check

```
- New player connection
- Scanning existing/non-existing servers
- Connecting while already connected
- Disconnecting (clean and emergency)
- Trace reaching 100%
- Hardware integrity reaching 0
- Insufficient credits/resources for action
```

---

## Documentation Updates

### After Completing a Task

1. **AGENT_TASKS.md**: Check off completed items, add notes
2. **ARCHITECTURE.md**: Update if data models changed
3. **Code comments**: Add JSDoc for new functions

```javascript
/**
 * Calculates trace rate based on player hardware and active software
 * @param {Object} player - The player object
 * @param {Object} targetServer - The server being hacked
 * @returns {number} Trace rate as percentage per second
 */
function calculateTraceRate(player, targetServer) {
  // ...
}
```

---

## Common Pitfalls to Avoid

### Don't

```javascript
// DON'T trust client-side calculations
// Client says they breached? Verify server-side.

// DON'T store sensitive data in client state
// No passwords, no auth tokens in game.js

// DON'T use synchronous file I/O on server
// Use async/await for all I/O

// DON'T broadcast to all players
// Only send to affected players

// DON'T generate random IPs without collision check
// Verify IP doesn't already exist
```

### Do

```javascript
// DO validate all inputs
if (!targetIp || !isValidIP(targetIp)) {
  return { error: 'Invalid IP address' };
}

// DO use server timestamps
const timestamp = Date.now(); // Server time, not client

// DO handle disconnections gracefully
ws.on('close', () => {
  cleanupPlayer(playerId);
});

// DO rate limit expensive operations
if (lastScan[playerId] > Date.now() - 1000) {
  return { error: 'Scanning too fast' };
}
```

---

## Git Commit Guidelines

```bash
# Format
<type>: <short description>

# Types
feat:     New feature
fix:      Bug fix
refactor: Code refactoring
docs:     Documentation only
style:    Formatting, no code change
test:     Adding tests
chore:    Maintenance tasks

# Examples
feat: Add security zone system with ClearNet/GreyNet/DarkNet
fix: Prevent trace overflow above 100%
refactor: Extract node generation to separate module
docs: Update ARCHITECTURE.md with resource system
```

---

## Questions to Ask Before Implementing

1. **Does this fit the game vision?** (Check PROJECT_CONTEXT.md)
2. **Is this server-authoritative?** (Never trust the client)
3. **What happens on edge cases?** (Disconnect, timeout, invalid input)
4. **Does this affect multiplayer?** (Need to broadcast?)
5. **Is this balanced?** (Risk vs reward, time investment)
6. **Can this be exploited?** (Rate limiting, validation)
