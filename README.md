# UPLINK // Netrunner

A cyberpunk hacking MMO where every server belongs to a player.

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Gameplay

### Commands
- `scan <ip>` - Scan a target server
- `connect <ip>` - Connect to a server
- `move <node>` - Move to an adjacent node
- `breach` - Break through ICE protection
- `crack` - Crack password-protected nodes
- `download <file>` - Download a file
- `clean` - Clean your logs before disconnecting
- `disconnect` - Safely disconnect
- `abort` - Emergency disconnect (leaves trace)

### Hotkeys
- `[1]` Scan | `[2]` Connect | `[3]` Breach | `[4]` Download | `[5]` Crack
- `[C]` Cloak | `[X]` Clean Logs | `[ESC]` Abort

### Tutorial
Type `tutorial` to start the training simulation.

## Tech Stack
- Frontend: Vanilla JS with terminal UI
- Backend: Node.js + Express + WebSocket
- Real-time multiplayer via WebSocket

## License
MIT