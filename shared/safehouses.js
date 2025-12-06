/**
 * Safe House System
 * EVE Online-style stations for asset storage, rig swapping, and respawn
 */

import {
    SAFE_HOUSE_TYPES,
    SAFE_HOUSE_NAMES,
    HARDWARE_TIERS,
} from './constants.js';

/**
 * Generates an NPC Safe House for a network
 */
export function generateNPCSafeHouse(networkId, networkIp, zone) {
    const config = SAFE_HOUSE_TYPES.NPC_PUBLIC;
    const names = SAFE_HOUSE_NAMES[zone] || SAFE_HOUSE_NAMES.clearnet;
    const name = names[Math.floor(Math.random() * names.length)];

    const safeHouseId = `safehouse_${networkId}`;

    return {
        id: safeHouseId,
        name: name,
        type: config.id,
        networkId: networkId,
        networkIp: networkIp,
        zone: zone,
        ownerId: 'npc',

        // Capacity
        rigSlots: config.rigSlots,
        vaultCapacity: config.vaultCapacity,
        usedRigSlots: 0,
        usedVaultCapacity: 0,

        // Fees
        dockingFee: config.dockingFee,
        storageFeePerDay: config.storageFeePerDay,

        // Services
        hasRepair: config.hasRepair,
        hasMarket: config.hasMarket,
        hasCloning: config.hasCloning,

        // State
        dockedPlayers: [],
        storedAssets: {}, // { playerId: { rigs: [], software: [], files: [], resources: {} } }

        createdAt: Date.now(),
    };
}

/**
 * Generates a player-owned Safe House
 */
export function generatePlayerSafeHouse(playerId, networkId, networkIp, zone, customName = null) {
    const config = SAFE_HOUSE_TYPES.PLAYER_PRIVATE;
    const names = SAFE_HOUSE_NAMES[zone] || SAFE_HOUSE_NAMES.darknet;
    const name = customName || `${names[Math.floor(Math.random() * names.length)]} (Private)`;

    const safeHouseId = `safehouse_player_${playerId}_${Date.now()}`;

    return {
        id: safeHouseId,
        name: name,
        type: config.id,
        networkId: networkId,
        networkIp: networkIp,
        zone: zone,
        ownerId: playerId,

        // Capacity
        rigSlots: config.rigSlots,
        vaultCapacity: config.vaultCapacity,
        usedRigSlots: 0,
        usedVaultCapacity: 0,

        // No fees for player-owned
        dockingFee: 0,
        storageFeePerDay: 0,

        // Services
        hasRepair: config.hasRepair,
        hasMarket: config.hasMarket,
        hasCloning: config.hasCloning,

        // Access control
        allowedPlayers: [playerId], // Only owner by default

        // State
        dockedPlayers: [],
        storedAssets: {},

        createdAt: Date.now(),
    };
}

/**
 * Generates a crew-owned Safe House
 */
export function generateCrewSafeHouse(organizationId, networkId, networkIp, zone, customName = null) {
    const config = SAFE_HOUSE_TYPES.CREW_SHARED;
    const names = SAFE_HOUSE_NAMES[zone] || SAFE_HOUSE_NAMES.darknet;
    const name = customName || `${names[Math.floor(Math.random() * names.length)]} (Crew)`;

    const safeHouseId = `safehouse_crew_${organizationId}_${Date.now()}`;

    return {
        id: safeHouseId,
        name: name,
        type: config.id,
        networkId: networkId,
        networkIp: networkIp,
        zone: zone,
        ownerId: organizationId,

        // Capacity
        rigSlots: config.rigSlots,
        vaultCapacity: config.vaultCapacity,
        usedRigSlots: 0,
        usedVaultCapacity: 0,

        // No fees
        dockingFee: 0,
        storageFeePerDay: 0,

        // Services
        hasRepair: config.hasRepair,
        hasMarket: config.hasMarket,
        hasCloning: config.hasCloning,

        // Access control - all org members
        organizationId: organizationId,

        // Shared crew vault
        crewVault: {
            resources: {
                data_packets: 0,
                bandwidth_tokens: 0,
                encryption_keys: 0,
                access_tokens: 0,
                zero_days: 0,
                quantum_cores: 0,
            },
            software: [],
            files: [],
        },

        // State
        dockedPlayers: [],
        storedAssets: {},

        createdAt: Date.now(),
    };
}

/**
 * Creates a new rig object for storage
 */
export function createRig(rigName, hardware, software = []) {
    return {
        id: `rig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: rigName,
        hardware: { ...hardware },
        software: [...software],
        createdAt: Date.now(),
        lastUsed: Date.now(),
    };
}

/**
 * Creates the initial/starter rig for a new player
 */
export function createStarterRig() {
    return createRig('Starter Rig', {
        tier: 0,
        ...HARDWARE_TIERS[0],
        cpuUsed: 0,
        ramUsed: 0,
        integrity: 100,
    }, []);
}

/**
 * Gets empty asset storage structure for a player at a Safe House
 */
export function getEmptyAssetStorage() {
    return {
        rigs: [],
        software: [],
        files: [],
        resources: {
            data_packets: 0,
            bandwidth_tokens: 0,
            encryption_keys: 0,
            access_tokens: 0,
            zero_days: 0,
            quantum_cores: 0,
        },
    };
}

/**
 * Checks if a player can dock at a Safe House
 */
export function canDock(safeHouse, player) {
    // NPC public - anyone can dock
    if (safeHouse.type === 'npc_public') {
        // Check if player can afford docking fee
        if (player.credits < safeHouse.dockingFee) {
            return { allowed: false, reason: `Insufficient credits. Docking fee: ${safeHouse.dockingFee} CR` };
        }
        return { allowed: true };
    }

    // Player private - only owner and allowed players
    if (safeHouse.type === 'player_private') {
        if (safeHouse.ownerId === player.id || safeHouse.allowedPlayers?.includes(player.id)) {
            return { allowed: true };
        }
        return { allowed: false, reason: 'Access denied. Private Safe House.' };
    }

    // Crew shared - org members only
    if (safeHouse.type === 'crew_shared') {
        if (player.organization?.id === safeHouse.organizationId) {
            return { allowed: true };
        }
        return { allowed: false, reason: 'Access denied. Crew members only.' };
    }

    return { allowed: false, reason: 'Unknown Safe House type.' };
}

/**
 * Finds Safe House at a network
 */
export function findSafeHouseAtNetwork(safeHouses, networkId) {
    for (const [, safeHouse] of safeHouses) {
        if (safeHouse.networkId === networkId) {
            return safeHouse;
        }
    }
    return null;
}
