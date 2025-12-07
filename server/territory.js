// Territory Control Server Module
// GreyNet faction warfare with influence-based capture mechanics

import { TERRITORY_CONFIG } from '../shared/constants.js';
import { broadcastTerritoryCaptured, broadcastTerritoryCaptureStart, broadcastTerritoryContested } from './realtime.js';

// Territory state: { networkId -> territory info }
const territories = new Map();

// Active capturers: { networkId -> [{ playerId, playerName, startTime }] }
const activeCapturers = new Map();

// Initialize territory module
export function initializeTerritories() {
    console.log('[Territory] Faction warfare system initialized');
}

// Get territory status for a network
export function getTerritoryStatus(networkId) {
    return territories.get(networkId) || null;
}

// Get all territories owned by a player
export function getPlayerTerritories(playerId) {
    const owned = [];
    for (const [networkId, territory] of territories) {
        if (territory.ownerId === playerId) {
            owned.push({ networkId, ...territory });
        }
    }
    return owned;
}

// Start capturing a territory
export function startCapture(player, networkId, networkZone) {
    // Check zone restriction
    if (networkZone !== TERRITORY_CONFIG.zone) {
        return { error: `Territory control only available in ${TERRITORY_CONFIG.zone.toUpperCase()} zones.` };
    }

    // Check max territories
    const owned = getPlayerTerritories(player.id);
    if (owned.length >= TERRITORY_CONFIG.maxTerritories) {
        return { error: `Maximum territories reached (${TERRITORY_CONFIG.maxTerritories}).` };
    }

    // Add to active capturers
    let capturers = activeCapturers.get(networkId) || [];
    const alreadyCapturing = capturers.find(c => c.playerId === player.id);
    if (alreadyCapturing) {
        return { error: 'Already capturing this territory.' };
    }

    capturers.push({
        playerId: player.id,
        playerName: player.ip,
        crewId: player.organization?.id || null,
        crewName: player.organization?.name || null,
        startTime: Date.now(),
    });
    activeCapturers.set(networkId, capturers);

    // Initialize territory if not exists
    if (!territories.has(networkId)) {
        territories.set(networkId, {
            ownerId: null,
            ownerName: null,
            crewId: null,
            crewName: null,
            influence: 0,
            contested: false,
            lastUpdate: Date.now(),
        });
    }

    const territory = territories.get(networkId);
    const isContested = capturers.length > 1 || (territory.ownerId && territory.ownerId !== player.id);

    // Broadcast capture start
    broadcastTerritoryCaptureStart(player.id, player.ip, networkId);
    if (isContested) {
        broadcastTerritoryContested(networkId, player.id, player.ip);
    }

    return {
        success: true,
        message: isContested ? 'Capture started - CONTESTED!' : 'Capture started',
        contested: isContested,
        currentInfluence: territory.influence,
        currentOwner: territory.ownerName,
    };
}

// Stop capturing a territory
export function stopCapture(playerId, networkId) {
    const capturers = activeCapturers.get(networkId);
    if (!capturers) return;

    const idx = capturers.findIndex(c => c.playerId === playerId);
    if (idx !== -1) {
        capturers.splice(idx, 1);
        if (capturers.length === 0) {
            activeCapturers.delete(networkId);
        } else {
            activeCapturers.set(networkId, capturers);
        }
    }
}

// Process territory tick (called every 30 seconds)
export function processTerritoryTick(gameState, broadcastToPlayer) {
    const now = Date.now();

    for (const [networkId, capturers] of activeCapturers) {
        let territory = territories.get(networkId);
        if (!territory) continue;

        const isContested = capturers.length > 1;
        territory.contested = isContested;

        if (isContested) {
            // Contested - decay all influence
            territory.influence = Math.max(0, territory.influence - TERRITORY_CONFIG.contestDecay);
        } else if (capturers.length === 1) {
            // Single capturer - gain influence
            const capturer = capturers[0];

            if (territory.ownerId === capturer.playerId) {
                // Already own this - reinforcing
                territory.influence = Math.min(TERRITORY_CONFIG.maxInfluence, territory.influence + TERRITORY_CONFIG.influencePerTick / 2);
            } else if (territory.ownerId) {
                // Taking from someone else - decay their influence first
                territory.influence = Math.max(0, territory.influence - TERRITORY_CONFIG.influencePerTick);

                if (territory.influence <= 0) {
                    // Territory neutralized - start claiming
                    territory.ownerId = null;
                    territory.ownerName = null;
                    territory.crewId = null;
                    territory.crewName = null;
                }
            } else {
                // Neutral territory - claim it
                territory.influence += TERRITORY_CONFIG.influencePerTick;

                if (territory.influence >= TERRITORY_CONFIG.maxInfluence) {
                    // Captured!
                    territory.ownerId = capturer.playerId;
                    territory.ownerName = capturer.playerName;
                    territory.crewId = capturer.crewId;
                    territory.crewName = capturer.crewName;
                    territory.influence = TERRITORY_CONFIG.maxInfluence;

                    // Notify player
                    const player = gameState.players.get(capturer.playerId);
                    if (player && player.ws) {
                        player.ws.send(JSON.stringify({
                            type: 'TERRITORY_CAPTURED',
                            payload: { networkId, message: 'Territory captured!' },
                        }));
                    }

                    // Broadcast via Supabase Realtime
                    broadcastTerritoryCaptured(capturer.playerId, capturer.playerName, networkId);

                    // Remove from active capturers
                    activeCapturers.delete(networkId);
                    console.log(`[Territory] ${capturer.playerName} captured ${networkId}`);
                }
            }
        }

        territory.lastUpdate = now;
        territories.set(networkId, territory);
    }

    // Decay unattended territories
    for (const [networkId, territory] of territories) {
        if (!activeCapturers.has(networkId) && territory.influence > 0 && territory.influence < TERRITORY_CONFIG.maxInfluence) {
            territory.influence = Math.max(0, territory.influence - TERRITORY_CONFIG.abandonDecay);
            territories.set(networkId, territory);
        }
    }
}

// Calculate and distribute passive income (called hourly)
export function processTerritoryIncome(gameState) {
    const income = TERRITORY_CONFIG.passiveIncome;
    let totalDistributed = 0;

    for (const [networkId, territory] of territories) {
        if (territory.ownerId && territory.influence >= TERRITORY_CONFIG.maxInfluence) {
            const player = gameState.players.get(territory.ownerId);
            if (player) {
                player.credits += income;
                totalDistributed += income;
            }
        }
    }

    if (totalDistributed > 0) {
        console.log(`[Territory] Distributed ${totalDistributed} CR in passive income`);
    }
}

// Start territory processing loops
export function startTerritoryLoops(gameState) {
    // Influence tick loop (every 30s)
    setInterval(() => {
        processTerritoryTick(gameState);
    }, TERRITORY_CONFIG.captureTickInterval);

    // Income loop (every hour)
    setInterval(() => {
        processTerritoryIncome(gameState);
    }, 3600000);

    console.log('[Territory] Processing loops started');
}

// Get all territories for player view
export function getAllTerritories() {
    const result = [];
    for (const [networkId, territory] of territories) {
        result.push({ networkId, ...territory });
    }
    return result;
}

// Export territories map for external access
export function getTerritoriesMap() {
    return territories;
}
