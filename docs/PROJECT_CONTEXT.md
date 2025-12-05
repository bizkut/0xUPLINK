# PROJECT CONTEXT - 0xUPLINK

## Current Status
**Development Phase**: 5 (Territory Warfare) - **COMPLETED**
**Version**: 0.2.0 (Dockerized Prototype)

The core foundational systems are fully implemented, including the persistent universe, resource economy, player organizations, and the mock sovereignty/warfare system. The project is ready for expanded multiplayer testing and persistence layer integration (Database).

## Vision Statement

**0xUPLINK** is a persistent-world hacking MMO inspired by classic games like *Uplink* and *Mr. Robot*, combined with the sandbox territorial gameplay of *EVE Online*. Players build, hack, defend, and conquer in a cyberpunk universe where every server can belong to a player.

## Core Concept: "Netrunner MMO"

Instead of a single-player story where you hack NPCs, this is a persistent world where:
- Every server can belong to a player
- Territory (network clusters) can be claimed and defended
- Factions compete for control of the DarkNet
- The economy is player-driven

## Visual Identity

- **Ultra-minimalist**: Dark background, glowing green/amber text
- **Geometric nodes**: Simple shapes connected by lines representing network topology
- **Terminal aesthetic**: CLI-style interface with autocomplete, not pure typing
- **Mr. Robot meets Uplink**: Modern take on classic hacker interfaces

---

## EVE Online → Netrunner Concept Mapping

### Universe Structure

| EVE Online | 0xUPLINK |
|------------|----------|
| Star Systems | **Networks** (individual hackable spaces) |
| Constellations | **Clusters** (groups of 5-15 networks) |
| Regions | **Sectors** (large themed areas) |
| Stargates | **Backbone Links** (network connections) |
| Stations | **Data Havens / Safe Houses** |
| Planets | **Nodes** (gateway, firewall, database, vault) |

### Security Zones

| EVE | 0xUPLINK | Description |
|-----|----------|-------------|
| Highsec (0.5-1.0) | **ClearNet** | Corporate internet, AI Sentinel protection, safe but low reward |
| Lowsec (0.1-0.4) | **GreyNet** | Underground networks, weak protection, faction warfare |
| Nullsec (≤0.0) | **DarkNet** | Lawless, player sovereignty, highest risk/reward |
| Wormholes | **Ghost Networks** | Hidden, temporary, no local chat, extreme |

### Sovereignty

| EVE | 0xUPLINK |
|-----|----------|
| TCU (Territorial Claim Unit) | **Control Node** |
| Infrastructure Hub | **Sovereignty Hub** |
| Orbital Skyhook | **Data Skyhook** |
| Moon Mining | **Crypto Mining Rig** |

### Organizations

| EVE | 0xUPLINK |
|-----|----------|
| Corporation | **Crew** (small) / **Syndicate** (medium) |
| Alliance | **Cartel** (large alliance of syndicates) |
| NPC Factions | **Federal Cyber Division, Megacorps, Shadowbrokers** |

### Combat → Hack Battles

| EVE | 0xUPLINK |
|-----|----------|
| Ship combat | **Real-time hack battles** |
| Ship modules | **Software (icebreaker, proxy chain, etc.)** |
| Ship hull | **Hardware tier (rig)** |
| Gate camps | **Network chokepoints** |
| Bubbles | **Trace traps** |
| CONCORD response | **AI Sentinel response** |

### Resources

| EVE | 0xUPLINK |
|-----|----------|
| Tritanium/Pyerite | **Data Packets** (basic) |
| Mexallon/Isogen | **Encryption Keys** (intermediate) |
| Morphite | **Zero-Day Exploits** (rare) |
| Moon goo | **Quantum Cores** (endgame, DarkNet only) |

### Death/Loss

| EVE | 0xUPLINK |
|-----|----------|
| Ship destruction | **Rig seizure/destruction** |
| Pod death | **Identity burn** |
| Clone system | **Backup systems** |
| Insurance | **Hardware insurance** |

---

## The Core Loop

```
BUILD → HACK → DEFEND → EXPAND
  │       │        │        │
  │       │        │        └── Claim sovereignty, deploy structures
  │       │        └── Set up ICE, monitor intrusions, counter-hack
  │       └── Take contracts, steal data from other players/NPCs
  └── Set up server, install ICE, buy software upgrades
```

## Player Progression

1. **Burner Phase**: Start with basic laptop, hack NPC ClearNet servers
2. **Crew Phase**: Join/form a crew, operate in GreyNet
3. **Syndicate Phase**: Claim DarkNet territory, build structures
4. **Cartel Phase**: Alliance warfare, sector control

## Key Differentiators from EVE

1. **Faster pace**: Hacks take minutes, not hours
2. **Accessible UI**: Terminal with autocomplete/buttons, not spreadsheets
3. **Asymmetric PvP**: Attacker vs defender with different toolsets
4. **Permadeath lite**: Lose hardware, keep character progression
5. **Real-time defense**: Online defenders can actively counter-hack

---

## Target Audience

- Fans of hacking games (Uplink, Hacknet, Quadrilateral Cowboy)
- EVE Online players who want similar depth without the time commitment
- Cyberpunk enthusiasts
- Players who enjoy sandbox/emergent gameplay

## Technical Stack

- **Client**: Vanilla JS, HTML5 Canvas for node maps
- **Server**: Node.js + Express + WebSocket
- **Database**: TBD (likely PostgreSQL for persistence)
- **Real-time**: WebSocket for live hack battles and alerts
