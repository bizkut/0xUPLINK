# 0xUPLINK // Netrunner MMO

> **Status**: Alpha v0.5  
> **Latest**: EVE Theme, Status Sidebar, Specialization Paths, Interactive Network Map

A cyberpunk hacking MMO inspired by *Uplink*, *Mr. Robot*, and *EVE Online*. Hack servers, steal data, harvest resources, dock at Safe Houses, and claim sovereignty over the DarkNet in a persistent, player-driven world.

## 🚀 Quick Start

### Using Docker (Recommended)
```bash
docker-compose up --build -d
```
Open **http://localhost:3000** in your browser.

### Manual Installation
```bash
npm install
npm run dev
```

---

## 🎮 How to Play

### Starting Out
1. You spawn in **ClearNet** (safe zone) with basic hardware
2. Type `tutorial` or `help` to learn commands
3. Use `location` to see where you are

### The Hacking Loop
```
1. SCAN    →  scan <ip>      Find targets
2. CONNECT →  connect <ip>   Establish link (trace starts!)
3. MOVE    →  move <node>    Navigate the network
4. BREACH  →  breach         Break ICE protection
5. CRACK   →  crack          Crack passwords
6. LOOT    →  download/harvest  Steal files or resources
7. CLEAN   →  clean          Erase your logs
8. ESCAPE  →  disconnect     Exit before trace completes!
```

### Heat System 🔥
Your **Heat** level determines how much attention you've attracted:

| Heat | Status | Effects |
|------|--------|---------|
| 0-29 | Clean | No penalties |
| 30-49 | Suspicious | Scans 1.5x slower |
| 50-69 | Wanted | Auto-bounty on you |
| 70-79 | Hunted | Hunter ICE spawns, faster traces |
| 80+ | Federal | **Banned from ClearNet!** |

Use `heat` to check your status. Heat decays slowly over time.

### Safe Houses 🏠
Dock at Safe Houses to store assets and swap hardware:
- `dock` - Enter a Safe House (50 CR fee at NPC stations)
- `hangar` - View stored rigs and resources
- `store resources <type>` - Store resources
- `retrieve resources <type>` - Take resources
- `sethome` - Set respawn point
- `undock` - Return to the Grid

### Ghost Networks 👻
Temporary high-value networks that appear randomly (like EVE wormholes):
- **5x rewards**, guaranteed rare resources
- 30min to 2hr lifetime before collapse
- Must be in DarkNet to scan for them
- No "local" - can't see other players inside!

---

## 🌐 Security Zones

| Zone | Security | Risk | Reward |
|------|----------|------|--------|
| **ClearNet** | High (0.5-1.0) | Low - AI protection | 1x |
| **GreyNet** | Medium (0.0-0.5) | Medium - PvP allowed | 1.5x |
| **DarkNet** | Low (-1.0-0.0) | High - Lawless | 2x |
| **Ghost** | Extreme | Very High | 5x |

---

## ⌨️ Command Reference

### Navigation
| Command | Description |
|---------|-------------|
| `location` | Show current sector/zone |
| `sectors` | List all sectors |
| `explore` | List networks in cluster |
| `navigate <id>` | Jump to network |
| `map` | View cluster map |

### Hacking
| Command | Description |
|---------|-------------|
| `scan <ip>` | Scan target |
| `connect <ip>` | Connect (starts trace) |
| `move <node>` | Move to node |
| `breach` | Break ICE |
| `crack` | Crack password |
| `download <file>` | Steal file |
| `harvest` | Collect resources |
| `clean` | Erase logs |
| `cloak` | Activate proxy chain |
| `abort` | Emergency disconnect |
| `disconnect` | Safe disconnect |

### Safe Houses
| Command | Description |
|---------|-------------|
| `dock` | Dock at Safe House |
| `undock` | Leave Safe House |
| `hangar` | View storage |
| `store resources <type> [amt]` | Store items |
| `retrieve resources <type> [amt]` | Take items |
| `sethome` | Set respawn point |

### Info & Management
| Command | Description |
|---------|-------------|
| `status` | Player stats |
| `heat` | Detailed heat status |
| `hardware` | Rig specs |
| `software` | Installed programs |
| `resources` | View inventory |
| `contracts` | Available jobs |
| `shop` | Black market |

### Organizations
| Command | Description |
|---------|-------------|
| `crew create <name>` | Create organization |
| `crew invite <player>` | Invite player |
| `crew info` | View org info |
| `sov status` | Sovereignty info |
| `sov deploy <type>` | Deploy structure |
| `siege <structure>` | Attack structure |

### Market Economy
| Command | Description |
|---------|-------------|
| `market` | View sell orders |
| `sell <resource> <amt> <price>` | List for sale |
| `buy <order_id>` | Purchase order |

### Defense
| Command | Description |
|---------|-------------|
| `defend` | View intrusions |
| `backtrace <id>` | Trace attacker |
| `counterice <id>` | Damage attacker rig |
| `lockdown <network>` | Emergency lockdown |
| `rig` | Check rig status |
| `repair` | Repair rig damage |

### Communication
| Command | Description |
|---------|-------------|
| `say <message>` | Local chat |
| `shout <message>` | Global chat |
| `rep [player]` | Check reputation |

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+D` | Disconnect |
| `Ctrl+S` | Status |
| `Ctrl+H` | Help |
| `Ctrl+L` | Clear screen |
| `Ctrl+R` | Rig status |
| `Ctrl+M` | Market |

### Specialization
| Command | Description |
|---------|-------------|
| `skills` | View all skill paths |
| `spec choose <path>` | Choose specialization |
| `spec learn <skill_id>` | Learn a skill |

**Paths**: Infiltrator 🔓, Sentinel 🛡️, Broker 💰

---

## 🎨 User Interface

### Status Sidebar
The right sidebar displays real-time information:
- **Rig Status**: Integrity bar (repairs when damaged)
- **Resources**: All 6 resource types at a glance
- **Reputation**: Title and score
- **Quick Actions**: Context-sensitive buttons

### Contextual Actions
Buttons appear automatically based on your situation:
- **@ Safe House**: Dock, Hangar, Set Home
- **Connected (Hacking)**: Harvest, Clean Logs, Disconnect
- **Under Attack**: Defend, Lockdown

### Interactive Network Map
Click nodes directly on the network map to move (same as `move <node>` command).

### Theme
EVE Online-inspired dark space aesthetic with:
- Semi-transparent panels
- Blue hover effects
- Amber highlights for important items

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JS, HTML5, CSS3 (Terminal UI + Canvas)
- **Backend**: Node.js, Express, WebSocket
- **Containerization**: Docker, Docker Compose
- **Architecture**: Event-driven, Server-authoritative

---

## 📄 License

MIT License
