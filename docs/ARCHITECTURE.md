# ARCHITECTURE - 0xUPLINK

## Current Codebase Structure

```
0xUPLINK/
├── client/
│   ├── index.html          # Main HTML entry point
│   ├── css/                 # Stylesheets
│   └── js/
│       ├── main.js          # Entry point, event handling
│       ├── game.js          # Core game logic, state management
│       ├── terminal.js      # Terminal UI component
│       ├── nodeMap.js       # Network visualization (canvas)
│       └── ui.js            # UI utilities
├── server/
│   └── index.js             # Express + WebSocket server
├── shared/
│   └── constants.js         # Shared game constants (hardware, ICE, software)
├── docs/                    # Documentation (you are here)
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## System Architecture

### Client-Server Communication

```
┌─────────────┐    WebSocket     ┌─────────────┐
│   Client    │ ◄──────────────► │   Server    │
│  (Browser)  │                  │  (Node.js)  │
└─────────────┘                  └─────────────┘
      │                                │
      ▼                                ▼
┌─────────────┐                  ┌─────────────┐
│  Game.js    │                  │  GameState  │
│  (local)    │                  │  (global)   │
└─────────────┘                  └─────────────┘
```

### Message Types (WebSocket)

```javascript
// Client → Server
SCAN        // Request server info
CONNECT     // Initiate connection to target
HACK        // Perform hack action (breach, download, etc.)
DISCONNECT  // End connection
UPGRADE     // Purchase hardware/software
JOIN_FACTION// Join a faction
NAVIGATE    // Travel between networks
EXPLORE     // Get sector/cluster info
HARVEST     // Collect resources from nodes
CREW_ACTION // Create/Join/Leave organizations
DEPLOY_STRUCTURE // Place sovereignty structures
SIEGE_START // Initiate attack on structure

// Server → Client
INIT            // Initial player state
SCAN_RESULT     // Server scan results
CONNECT_RESULT  // Connection established
INTRUSION_ALERT // Someone is hacking you
HACK_ACTIVITY   // Real-time hack updates
FACTION_JOINED  // Faction confirmation
NAVIGATE_RESULT // Travel confirmation
EXPLORE_RESULT  // Map data
HARVEST_RESULT  // Resource gains
CREW_RESULT     // Organization updates
```

---

## Data Models

### Player

```javascript
{
  id: string,
  ip: string,                    // Player's "home" IP
  credits: number,
  reputation: number,
  heat: number,                  // Criminal heat (0-100)
  faction: string | null,
  online: boolean,
  hardware: {
    tier: number,                // 0-4
    cpu: number,
    ram: number,
    traceResist: number,
    bandwidth: number,
    integrity: number,           // Hardware health
    cpuUsed: number,
    ramUsed: number,
  },
  software: Software[],
  files: File[],
  server: Server,                // Player's own server
}
```

### Server/Network

```javascript
{
  ownerId: string,
  owner: string,                 // Display name
  securityRating: 'LOW' | 'MEDIUM' | 'HIGH',
  traceRate: number,             // % per second
  nodes: Node[],
}
```

### Node

```javascript
{
  id: string,
  type: 'gateway' | 'firewall' | 'database' | 'vault' | 'proxy' | 'log_server' | 'trap',
  connections: string[],         // Adjacent node IDs
  ice: ICE | null,
  breached: boolean,
  password: boolean,
  cracked: boolean,
  files: File[],
}
```

### ICE (Defense)

```javascript
{
  id: string,                    // firewall, tracker, black_ice, etc.
  name: string,
  strength: number,              // For firewall/black_ice
  damage: number,                // For black_ice
  traceMultiplier: number,       // For tracker
  slowMultiplier: number,        // For tar_pit
}
```

### Software (Offense)

```javascript
{
  id: string,
  name: string,
  level: number,
  power: number,                 // For icebreaker
  speed: number,                 // For password_cracker
  traceReduction: number,        // For proxy_chain
  effectiveness: number,         // For log_cleaner
  cpuCost: number,
  ramCost: number,
  used: boolean,                 // For single-use per connection
}
```

---

### Heat System (Implemented)

Heat represents criminal notoriety. Higher heat = more severe penalties.

```javascript
// Heat Thresholds (shared/constants.js)
HEAT_THRESHOLDS = {
  CLEAN:      { level: 0,  effects: {} },
  SUSPICIOUS: { level: 30, effects: { scanSpeedMultiplier: 1.5 } },
  WANTED:     { level: 50, effects: { autoBounty: true, bountyAmount: 500 } },
  HUNTED:     { level: 70, effects: { hunterIceEnabled: true, traceRateMultiplier: 1.25 } },
  FEDERAL:    { level: 80, effects: { clearnetBanned: true, raidTimer: 300 } },
}
```

**Game.js Methods:**
- `getHeatTier()` - Returns current tier object
- `getHeatEffects()` - Returns active effects
- `getHeatInfo()` - Full status for display

**Applied Penalties:**
- Scan speed slows at 30+ heat
- Trace rate increases at 70+ heat
- ClearNet connections blocked at 80+ heat

---

## Planned Systems Architecture

### 1. Universe/World System

```
┌─────────────────────────────────────────────────────────────┐
│                        THE GRID                             │
├─────────────────────────────────────────────────────────────┤
│  SECTORS (Regions)                                          │
│  ├── Corporate Core    [ClearNet, 0.7-1.0]                 │
│  ├── Frontier Networks [GreyNet, 0.2-0.5]                  │
│  ├── Dead Zones        [DarkNet entry, -0.5-0.1]           │
│  ├── The Void          [Deep DarkNet, -1.0 to -0.5]        │
│  └── Ghost Networks    [Wormhole equiv, dynamic]           │
├─────────────────────────────────────────────────────────────┤
│  CLUSTERS (Constellations) - 5-15 networks each            │
├─────────────────────────────────────────────────────────────┤
│  NETWORKS (Systems) - Individual hackable spaces           │
│  └── NODES (Planets) - Gateway, firewall, database, etc.   │
└─────────────────────────────────────────────────────────────┘
```

### 2. Sovereignty System

```javascript
// Planned structure types
CONTROL_NODE      // Claims sovereignty (TCU equivalent)
SOVEREIGNTY_HUB   // Upgrades cluster (iHub equivalent)
DATA_SKYHOOK      // Harvests data packets (Skyhook equivalent)
CRYPTO_MINING_RIG // Passive credit generation (Moon drill)
SAFE_HOUSE        // Player spawn point (Station)
```

### 3. Resource System

```
Tier 1 (Basic):     Data Packets, Bandwidth Tokens
Tier 2 (Intermediate): Encryption Keys, Access Tokens
Tier 3 (Rare):      Zero-Day Exploits
Tier 4 (Endgame):   Quantum Cores (DarkNet only)
```

### 4. Organization System

```
CREW (≤10 members)
  └── SYNDICATE (≤100 members, can claim sov)
       └── CARTEL (≤1000, alliance of syndicates)
```

---

## Database Schema (Planned)

### Tables

```sql
-- Players
players (id, username, password_hash, created_at, last_login)
player_state (player_id, credits, reputation, heat, faction_id, hardware_tier)
player_software (player_id, software_id, level)
player_files (player_id, file_id, stolen_from, stolen_at)

-- Universe
sectors (id, name, security_min, security_max, description)
clusters (id, sector_id, name, sov_holder_id)
networks (id, cluster_id, ip, security, sov_holder_id)
nodes (id, network_id, type, ice_id, connections)
files (id, node_id, name, size, value, encrypted)

-- Sovereignty
structures (id, network_id, type, owner_id, deployed_at, health)
structure_upgrades (structure_id, upgrade_type, level)

-- Organizations
factions (id, name, type, treasury, tax_rate)
faction_members (faction_id, player_id, role, joined_at)

-- Economy
market_orders (id, player_id, item_type, item_id, price, quantity, order_type)
transactions (id, buyer_id, seller_id, item_type, item_id, price, timestamp)

-- Contracts
contracts (id, issuer_id, target_network_id, objective, reward, status)
contract_completions (contract_id, player_id, completed_at)
```

---

## Real-Time Systems

### Hack Battle Flow

```
1. Attacker: CONNECT to target
2. Server: Notify defender (if online)
3. Server: Start trace timer
4. Both: Real-time actions via WebSocket
   - Attacker: breach, probe, extract, scramble
   - Defender: trace, lockdown, deploy_ice, counter_hack
5. End conditions:
   - Attacker disconnects (clean or emergency)
   - Trace reaches 100%
   - Defender kicks attacker
```

### Activity Defense Multiplier (ADM)

```javascript
// Higher ADM = harder to attack sovereignty structures
adm = baseMultiplier 
    + (hackingActivity * 0.2)      // Players hacking in cluster
    + (miningActivity * 0.2)       // Resource harvesting
    + (structureCount * 0.1)       // Deployed structures
    + (memberPresence * 0.3)       // Online faction members
```

---

## Performance Considerations

1. **Network topology**: Pre-generate and cache cluster/network layouts
2. **Player servers**: Generate on first scan, persist in DB
3. **Real-time updates**: Only broadcast to affected players
4. **Trace calculation**: Server-authoritative, client displays
5. **Resource harvesting**: Batch process every N minutes, not real-time

---

## Security Considerations

1. **Server-authoritative**: All game state validated server-side
2. **Rate limiting**: Prevent spam scanning/connection attempts
3. **Input sanitization**: Validate all command inputs
4. **Session management**: Secure WebSocket authentication
5. **Anti-cheat**: Server validates all hack timing/success
