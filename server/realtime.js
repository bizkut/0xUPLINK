/**
 * Supabase Realtime Broadcast Module
 * 
 * Handles pub/sub messaging for real-time game events using
 * Supabase Realtime Broadcast channels.
 */

import { supabase } from './db.js';
import { REALTIME_CHANNELS, REALTIME_EVENTS } from '../shared/constants.js';

// Channel references
let globalChannel = null;
let territoryChannel = null;
let marketChannel = null;

/**
 * Initialize Supabase Realtime channels for broadcasting
 */
export function initRealtime() {
    if (!supabase) {
        console.warn('[Realtime] Supabase not configured - broadcasts disabled');
        return false;
    }

    try {
        // Create broadcast channels
        globalChannel = supabase.channel(REALTIME_CHANNELS.GLOBAL);
        territoryChannel = supabase.channel(REALTIME_CHANNELS.TERRITORY);
        marketChannel = supabase.channel(REALTIME_CHANNELS.MARKET);

        // Subscribe to channels (required before broadcasting)
        globalChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('[Realtime] Global channel ready');
            }
        });

        territoryChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('[Realtime] Territory channel ready');
            }
        });

        marketChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('[Realtime] Market channel ready');
            }
        });

        console.log('[Realtime] Supabase Realtime initialized');
        return true;
    } catch (error) {
        console.error('[Realtime] Failed to initialize:', error);
        return false;
    }
}

/**
 * Broadcast a message to a channel
 * @param {string} channel - Channel name from REALTIME_CHANNELS
 * @param {string} event - Event type from REALTIME_EVENTS
 * @param {object} payload - Data to broadcast
 */
export async function broadcast(channel, event, payload) {
    if (!supabase) return;

    let channelRef;
    switch (channel) {
        case REALTIME_CHANNELS.GLOBAL:
            channelRef = globalChannel;
            break;
        case REALTIME_CHANNELS.TERRITORY:
            channelRef = territoryChannel;
            break;
        case REALTIME_CHANNELS.MARKET:
            channelRef = marketChannel;
            break;
        default:
            console.warn(`[Realtime] Unknown channel: ${channel}`);
            return;
    }

    if (!channelRef) {
        console.warn('[Realtime] Channel not initialized');
        return;
    }

    try {
        await channelRef.send({
            type: 'broadcast',
            event,
            payload: {
                ...payload,
                timestamp: Date.now(),
            },
        });
    } catch (error) {
        console.error(`[Realtime] Broadcast error on ${channel}:`, error);
    }
}

// ============== CONVENIENCE BROADCAST FUNCTIONS ==============

/**
 * Broadcast ghost network spawn
 */
export function broadcastGhostSpawn(ghost) {
    broadcast(REALTIME_CHANNELS.GLOBAL, REALTIME_EVENTS.GHOST_SPAWN, {
        id: ghost.id,
        name: ghost.name,
        ip: ghost.ip,
        expiresAt: ghost.expiresAt,
        message: `⚡ Ghost Network detected: ${ghost.name}`,
    });
}

/**
 * Broadcast ghost network expiration
 */
export function broadcastGhostExpire(ghost) {
    broadcast(REALTIME_CHANNELS.GLOBAL, REALTIME_EVENTS.GHOST_EXPIRE, {
        id: ghost.id,
        name: ghost.name,
        message: `💨 Ghost Network collapsed: ${ghost.name}`,
    });
}

/**
 * Broadcast territory capture started
 */
export function broadcastTerritoryCaptureStart(playerId, playerName, networkId) {
    broadcast(REALTIME_CHANNELS.TERRITORY, REALTIME_EVENTS.TERRITORY_CAPTURE_START, {
        playerId,
        playerName,
        networkId,
        message: `🏴 ${playerName} is capturing ${networkId}`,
    });
}

/**
 * Broadcast territory captured
 */
export function broadcastTerritoryCaptured(playerId, playerName, networkId) {
    broadcast(REALTIME_CHANNELS.TERRITORY, REALTIME_EVENTS.TERRITORY_CAPTURED, {
        playerId,
        playerName,
        networkId,
        message: `🏆 ${playerName} captured ${networkId}`,
    });
}

/**
 * Broadcast territory contested
 */
export function broadcastTerritoryContested(networkId, attackerId, attackerName) {
    broadcast(REALTIME_CHANNELS.TERRITORY, REALTIME_EVENTS.TERRITORY_CONTESTED, {
        networkId,
        attackerId,
        attackerName,
        message: `⚔️ Territory contested: ${networkId}`,
    });
}

/**
 * Broadcast territory lost
 */
export function broadcastTerritoryLost(previousOwnerId, previousOwnerName, networkId, newOwnerId) {
    broadcast(REALTIME_CHANNELS.TERRITORY, REALTIME_EVENTS.TERRITORY_LOST, {
        previousOwnerId,
        previousOwnerName,
        networkId,
        newOwnerId,
        message: `💔 ${previousOwnerName} lost control of ${networkId}`,
    });
}

/**
 * Broadcast market price update
 */
export function broadcastMarketPriceUpdate(resourceType, oldPrice, newPrice) {
    const direction = newPrice > oldPrice ? '⬆️' : newPrice < oldPrice ? '⬇️' : '➡️';
    broadcast(REALTIME_CHANNELS.MARKET, REALTIME_EVENTS.MARKET_PRICE_UPDATE, {
        resourceType,
        oldPrice,
        newPrice,
        direction,
        message: `${direction} ${resourceType}: ${oldPrice} → ${newPrice} CR`,
    });
}

/**
 * Broadcast black market price changes
 */
export function broadcastBlackmarketPriceChange(item, oldPrice, newPrice) {
    const direction = newPrice > oldPrice ? '⬆️' : newPrice < oldPrice ? '⬇️' : '➡️';
    broadcast(REALTIME_CHANNELS.MARKET, REALTIME_EVENTS.BLACKMARKET_PRICE_CHANGE, {
        itemId: item.id,
        itemName: item.name,
        oldPrice,
        newPrice,
        direction,
        message: `${direction} [BLACK MARKET] ${item.name}: ${newPrice} CR`,
    });
}

/**
 * Broadcast intrusion alert to specific player (via global with filter)
 */
export function broadcastIntrusionAlert(targetPlayerId, attackerId, attackerName, networkId) {
    broadcast(REALTIME_CHANNELS.GLOBAL, REALTIME_EVENTS.PLAYER_INTRUSION_ALERT, {
        targetPlayerId,
        attackerId,
        attackerName,
        networkId,
        message: `🚨 ALERT: ${attackerName} is intruding on ${networkId}`,
    });
}

/**
 * Cleanup channels on shutdown
 */
export function cleanupRealtime() {
    if (globalChannel) globalChannel.unsubscribe();
    if (territoryChannel) territoryChannel.unsubscribe();
    if (marketChannel) marketChannel.unsubscribe();
    console.log('[Realtime] Channels cleaned up');
}
