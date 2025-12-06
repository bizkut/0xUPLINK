# AGENT TASKS - 0xUPLINK

> **Instructions for AI Agent**: Read this file before starting any task. Update status after completing each task. Add new tasks as discovered.

---

## Current Sprint: Foundation Systems

### Phase 1: Security Zones & World Generation
**Priority: HIGH | Status: COMPLETED**

- [x] **1.1** Add security zone constants to `shared/constants.js`
  - Defined CLEARNET, GREYNET, DARKNET with security ranges
  - Added zone-specific rules (trace rates, rewards, consequences)
  - Added SECTORS (6 total), NPC_FACTIONS, RESOURCES, SOVEREIGNTY_STRUCTURES, ORGANIZATION_TYPES
  
- [x] **1.2** Create `shared/universe.js` for world structure
  - Universe generation with sectors → clusters → networks hierarchy
  - Network generation based on security level and theme
  - Resource drops on nodes based on zone
  - Backbone connections between networks
  - Navigation/routing utilities
  
- [x] **1.3** Update `server/index.js` to generate persistent world
  - Universe generates on startup (~7ms for 897 networks)
  - Players get starting location in ClearNet
  - Added NAVIGATE, EXPLORE, HARVEST message handlers
  - Added /api/universe endpoints
  
- [x] **1.4** Add zone-aware NPC server generation
  - Server names based on sector theme (corporate, frontier, void, etc.)
  - ICE strength, rewards, resources scale with security level
  - DarkNet has rare resources (Zero-Days, Quantum Cores)

- [x] **1.5** Update client to display current zone/location
  - Added zone indicator to status bar (CLEARNET/GREYNET/DARKNET with colors)
  - Added sector name, network IP, and security badge to header
  - Added CSS for zone colors (.zone-clearnet, .zone-greynet, .zone-darknet)
  - Added new commands: location, sectors, explore, navigate, resources, map
  - Updated help command with UNIVERSE section

---

### Phase 2: Resource System
**Priority: HIGH | Status: COMPLETED**

- [x] **2.1** Define resource types in `shared/constants.js`
  - Data Packets (basic)
  - Bandwidth Tokens (basic)
  - Encryption Keys (intermediate)
  - Zero-Day Exploits (rare)
  - Quantum Cores (endgame)

- [x] **2.2** Add resource drops to nodes
  - Database nodes: Data Packets
  - Vault nodes: Encryption Keys
  - DarkNet special nodes: Zero-Days, Quantum Cores

- [x] **2.3** Create resource inventory system
  - Add `resources` to player state
  - Track resource quantities
  - Add `resources` command to view inventory

- [x] **2.4** Implement resource harvesting
  - Add `harvest` command for nodes with resources
  - Resource quantity based on security level
  - Harvesting takes time, increases trace

---

### Phase 3: Player Organizations
**Priority: MEDIUM | Status: COMPLETED**

- [x] **3.1** Define organization types in constants
  - Crew (≤10 members)
  - Syndicate (≤100, can claim sov)
  - Cartel (alliance of syndicates)

- [x] **3.2** Add organization data structures
  - Organization: id, name, type, leader, members, treasury
  - Member roles: leader, officer, member

- [x] **3.3** Implement crew commands
  - `crew create <name>` - Create new crew
  - `crew invite <player>` - Invite player
  - `crew leave` - Leave current crew
  - `crew info` - View crew details
  - `crew members` - List members

- [x] **3.4** Add faction treasury system
  - Tax rate on member earnings
  - Shared treasury for structure deployment
  - Withdrawal permissions by role

---

### Phase 4: Sovereignty System
**Priority: MEDIUM | Status: COMPLETED**

- [x] **4.1** Define sovereignty structures
  - Control Node (claims sovereignty)
  - Sovereignty Hub (cluster upgrades)
  - Data Skyhook (passive harvesting)
  - Crypto Mining Rig (passive credits)

- [x] **4.2** Implement structure deployment
  - Require DarkNet location
  - Require Syndicate membership
  - Deduct credits from treasury
  - 24h vulnerability window after deploy

- [x] **4.3** Add sovereignty map view
  - Command: `sov map` or `territory`
  - Show cluster ownership
  - Show structure locations

- [x] **4.4** Implement passive income
  - Data Skyhook: Generate resources over time
  - Mining Rig: Generate credits over time
  - Require online faction member to claim

---

### Phase 5: Territory Warfare
**Priority: LOW | Status: COMPLETED**

- [x] **5.1** Implement structure attacking
  - `siege <structure>` command
  - Prolonged hack (Entosis Link equivalent)
  - Reinforcement timers

- [x] **5.2** Add Activity Defense Multiplier
  - Track faction activity per cluster (Mocked for now)
  - Higher ADM = longer siege times
  - Decay when inactive

- [x] **5.3** Implement reinforcement notifications
  - Alert all faction members (Console log for now)
  - Show timer until vulnerable
  - Coordinate defense

---

## Backlog

### Infrastructure
- [x] **6.1** Docker Support
  - Dockerfile for server
  - Docker Compose for full stack
  - Healthchecks and volume mapping

### UI Improvements
- [x] Add autocomplete for commands (Tab-completion already implemented)
- [ ] Add button shortcuts for common actions
- [ ] Improve node map visualization for larger networks
- [ ] Add cluster/sector navigation view
- [ ] Sound effects for alerts, hack success/fail

### Gameplay
- [x] **Graded Heat System** (Completed 2025-12-06)
  - Added `HEAT_THRESHOLDS` constant with 5 tiers (Clean/Suspicious/Wanted/Hunted/Federal)
  - Added `getHeatTier()`, `getHeatEffects()`, `getHeatInfo()` methods to `game.js`
  - Scan speed penalties at 30+ heat
  - Trace rate multipliers at 70+ heat  
  - ClearNet ban at 80+ heat (Federal level)
  - Added `heat` command for detailed status display
- [x] **Ghost Networks** (Completed 2025-12-06)
  - Added `GHOST_NETWORK_CONFIG` and `GHOST_NETWORK_NAMES` to `constants.js`
  - Added `generateGhostNetwork()`, `generateGhostNodes()` to `universe.js`
  - 5x reward multiplier, guaranteed rare resources (zero-days, quantum cores)
  - 30min-2hr random lifetime, auto-expire with player notification
  - Server spawns 1-2 on startup, 10% spawn chance every 5 min
  - Must be in DarkNet to scan for ghosts, no "local" visibility
- [x] **Safe House Storage System** (Completed 2025-12-06)
  - Added `SAFE_HOUSE_TYPES`, `SAFE_HOUSE_NAMES` to `constants.js`
  - Created `safehouses.js` module with generation functions
  - 15 NPC Safe Houses spawn across zones on server start
  - Server handlers: DOCK, UNDOCK, HANGAR, STORE, RETRIEVE, SWAP_RIG, SET_HOME
  - Client commands: dock, undock, hangar, store, retrieve, sethome
  - Per-location asset storage (rigs, software, files, resources)
- [ ] Faction warfare system (GreyNet control)
- [ ] Active Defender Counter-Play (real-time PvP responses)
- [ ] Ghost Networks (temporary high-value "wormhole" zones)
- [ ] Insurance/backup system for hardware
- [ ] Contract marketplace (player-created)
- [ ] Black market with dynamic prices
- [ ] Player Market Economy (buy/sell orders)

### Technical
- [ ] Database persistence (PostgreSQL)
- [ ] Player authentication system
- [ ] Session management
- [ ] Rate limiting
- [ ] Admin tools

---

## Completed Tasks

### Initial Implementation (Pre-docs)
- [x] Basic client/server architecture
- [x] Terminal UI with command parsing
- [x] Node map visualization
- [x] Hardware tier system
- [x] ICE and software types
- [x] Basic scanning and connecting
- [x] NPC server generation
- [x] Faction definitions (non-functional)
- [x] Contract system (basic)

---

## Notes for Agent

1. **Before coding**: Always read PROJECT_CONTEXT.md and ARCHITECTURE.md
2. **After completing a task**: Update this file, check the box, add notes
3. **If blocked**: Add a note explaining the blocker
4. **New discoveries**: Add new tasks to appropriate section
5. **Design changes**: Update ARCHITECTURE.md if data models change
