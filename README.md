# 0xUPLINK // Netrunner MMO

> **Status**: Prototype / Alpha
> **Phase**: 5 (Territory Warfare) Completed

A cyberpunk hacking MMO inspired by *Uplink*, *Mr. Robot*, and *EVE Online*. Hack servers, steal data, harvest resources, form syndicates, and claim sovereignty over the DarkNet in a persistent, player-driven world.

## 🚀 Quick Start

### Using Docker (Recommended)
The easiest way to run the game server and client.

```bash
# Build and start the container
docker-compose up --build -d

# View logs
docker-compose logs -f
```

Open **http://localhost:3000** in your browser.

### Manual Installation
Requires Node.js v18+.

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🎮 Gameplay Features

### 🌐 The Grid
The world is divided into three security zones:
- **ClearNet (HighSec)**: Corporate-controlled, heavy AI security. Low risk, low reward.
- **GreyNet (LowSec)**: The fringe. Faction warfare and open PvP.
- **DarkNet (NullSec)**: Lawless deep web. Player sovereignty, highest rewards (Zero-Days, Quantum Cores).

### 💻 Hacking & Systems
- **Terminal Interface**: Type commands or use hotkeys/buttons.
- **Real-time Intrusion**: Breach firewalls, crack passwords, and dodge active traces.
- **Hardware & Software**: Upgrade your rig (CPU, RAM) and install tools (Icebreakers, Decryptors, Log Cleaners).
- **Resources**: Harvest data packets, encryption keys, and rare exploits from compromised nodes.

### 🏢 Organizations & Sovereignty
- **Crews**: Form small teams for cooperative hacking.
- **Syndicates**: Massive organizations that can claim territory.
- **Structures**: Deploy Control Nodes, Data Skyhooks, and Mining Rigs in the DarkNet.
- **Siege Warfare**: Attack enemy structures to dismantle their control.

## ⌨️ Commands

### Navigation
- `scan <ip>` - Scan a target server for nodes and ICE
- `connect <ip>` - Connect to a server
- `disconnect` - Disconnect safely
- `move <node>` - Move to an adjacent node inside a network
- `location` - Show current sector and zone info
- `map` - View the cluster map
- `sectors` - List all available sectors

### Offense
- `breach` - Break through ICE protection
- `crack` - Crack password-protected nodes
- `download <file>` - Steal files
- `harvest` - Collect resources from nodes
- `clean` - Erase logs to reduce Heat

### Management
- `status` - View player stats (Credits, Heat, Reputation)
- `hardware` - View rig specifications
- `software` - View installed programs
- `resources` - View inventory
- `crew` - Manage your organization (`create`, `invite`, `info`)
- `sov` - Sovereignty management (`deploy`, `status`)
- `siege` - Attack territory structures

## 🛠️ Tech Stack

- **Frontend**: Vanilla JS, HTML5, CSS3 (Terminal UI + Canvas Visualization)
- **Backend**: Node.js, Express, WebSocket (ws)
- **Containerization**: Docker, Docker Compose
- **Architecture**: Event-driven, Server-authoritative state

## 📄 License

MIT License
