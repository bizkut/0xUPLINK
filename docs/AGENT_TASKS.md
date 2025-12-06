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
- [x] **File Tab-Autocomplete** (Completed 2025-12-06)
  - Tab-complete filenames for cat, rm, download commands
  - Shows local files when disconnected, remote when connected
  - Also added rig buy autocomplete
- [x] Add button shortcuts for common actions
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
- [x] **Active Defender Counter-Play** (Completed 2025-12-06)
  - Added `COUNTER_PROGRAMS` and `INTRUSION_CONFIG` to `constants.js`
  - Created `defender.js` module with intrusion tracking
  - Server handlers: DEFEND_VIEW, DEFEND_BACKTRACE, DEFEND_COUNTERICE, DEFEND_LOCKDOWN
  - Client commands: defend, backtrace, counterice, lockdown
  - Intrusion alerts sent to network owners after 5s delay
  - Counter-programs: Backtrace (500 CR), Counter-ICE (1000 CR), Lockdown (2000 CR)
- [ ] Ghost Networks (temporary high-value "wormhole" zones)
- [ ] Insurance/backup system for hardware
- [x] **Contract Marketplace** (Completed 2025-12-07)
  - Eve Online-style player-created contracts
  - 4 contract types: Bounty (🎯), Data Theft (📁), Defense (🛡️), Courier (📦)
  - Server handlers: CONTRACT_CREATE, CONTRACT_LIST, CONTRACT_ACCEPT, CONTRACT_CANCEL
  - Modal UI with Available, My Contracts, Create Contract tabs
  - 120% collateral escrow, 50 CR creation fee
  - Automatic expiry cleanup loop
- [x] **Player Market Economy** (Completed 2025-12-06)
  - Added `MARKET_CONFIG` and `TRADEABLE_RESOURCES` to `constants.js`
  - Server handlers: MARKET_LIST, MARKET_SELL, MARKET_BUY, MARKET_CANCEL, MARKET_MODIFY
  - Client commands: market, sell, buy
  - 5% transaction fee, 10 CR listing fee, 24hr order expiry
  - Auto-cleanup loop for expired orders with resource refund
- [x] **Interactive Market UI** (Completed 2025-12-06)
  - Eve Online-style market interface with 3-column layout
  - Buy Orders, Sell Orders, My Orders tabs
  - Category filtering, search, sorting
  - Anonymous sellers (NPC vendors)
- [x] **NPC Trading Simulation** (Completed 2025-12-07)
  - 24-hour trading cycle: NPCs cancel, adjust prices, add new orders
  - 8 NPC vendors with price modifiers
  - MARKET_MODIFY handler with Eve-style bid/ask rules
  - 2-minute order modification cooldown
- [x] **Black Market with Dynamic Prices** (Completed 2025-12-07)
  - DarkNet-only contraband trading
  - 7 contraband items: Stolen Credentials, Hot Data, Exploit Kit, etc.
  - Dynamic pricing with supply/demand and volatility (±15%)
  - Supply levels: Abundant → Rare (0.8x-1.5x price)
  - +5 Heat penalty per transaction
  - Price trends display (⬆️/⬇️/➡️)
- [x] **Death/Loss Consequences** (Completed 2025-12-06)
  - Added `DEATH_CONFIG` constant with trace/kill penalties
  - Player model: rigIntegrity, homeSafeHouse, respawnProtection
  - 10% credit loss, 50% cargo loss, 25% rig damage on trace
  - Respawn at home Safe House or ClearNet
  - Client commands: rig (status), repair (fix at Safe House)

### Technical
- [ ] Database persistence (PostgreSQL)
- [ ] Redis for real-time pub/sub
- [x] **UI Autocomplete & Hotkeys** (Completed 2025-12-06)
  - Ctrl+D disconnect, Ctrl+S status, Ctrl+H help, Ctrl+L clear
  - Ctrl+R rig status, Ctrl+M market
  - Contextual suggestions for resources, nodes, crew subcommands
- [x] **In-Game Comms & Reputation** (Completed 2025-12-06)
  - Chat channels: local (cluster), global, crew, darknet
  - 8 reputation titles from Blacklisted (-100) to Legend (2500)
  - Commands: say, shout, rep
- [x] **Specialization Paths** (Completed 2025-12-06)
  - 3 paths: Infiltrator (stealth), Sentinel (defense), Broker (trading)
  - 15 unique skills with prerequisites and escalating costs
  - Commands: skills, spec choose, spec learn
- [x] **Status Sidebar UI** (Completed 2025-12-06)
  - Real-time rig status, resources, reputation display
  - Quick action buttons (Status, Explore, Market, Skills)
  - Contextual actions (Safe House, Hacking, Defense)
- [x] **EVE Online Theme** (Completed 2025-12-06)
  - Dark space gradient background
  - Semi-transparent panels with thin borders
  - Balanced color scheme (white text, amber highlights, blue hover)
- [x] **Interactive Network Map** (Completed 2025-12-06)
  - Clickable nodes execute move commands
  - EVE-styled connection colors
- [x] **Computer Models System** (Completed 2025-12-06)
  - 9 rig classes: Burner, Phantom, Harvester, Razorback, Bastion, Mule, Wraith, Hydra, Blacksite
  - Each rig has unique bonuses, weaknesses, and slot layouts
  - 20+ modules for Core, Memory, Expansion slots
  - Commands: rig, rigs, modules, fit, unfit
  - Sidebar shows rig name, specialty, stats, and equipped modules
- [x] **Local Storage System** (Completed 2025-12-06)
  - Player localStorage with capacity based on rig class
  - ls shows local files when disconnected
  - Commands: storage, cat, rm
  - Downloaded files save to local storage
- [x] **Public Chat Window** (Completed 2025-12-06)
  - Global chat panel below network map
  - Real-time messaging with player identification
  - Self-highlighting (amber vs blue for others)
- [x] **Authentication System** (Completed 2025-12-06)
  - Supabase integration for user registration/login
  - Single-session enforcement (kicks duplicate logins)
  - Hacker-themed login UI with matrix rain effect
- [x] **Player Persistence** (Completed 2025-12-06)
  - Save/load player state to Supabase PostgreSQL
  - Graceful fallback when database unavailable
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
