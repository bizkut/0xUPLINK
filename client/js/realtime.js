/**
 * Supabase Realtime Client Module
 * 
 * Handles subscriptions to real-time game events and displays
 * toast notifications for important updates.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { REALTIME_CHANNELS, REALTIME_EVENTS } from '../../shared/constants.js';

let supabase = null;
let globalChannel = null;
let territoryChannel = null;
let marketChannel = null;

// Event handlers
let onGhostSpawn = null;
let onGhostExpire = null;
let onTerritoryCaptured = null;
let onTerritoryContested = null;
let onMarketPriceChange = null;
let onIntrusionAlert = null;

/**
 * Initialize Supabase Realtime client
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseKey - Supabase anon key
 */
export function initRealtimeClient(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
        console.warn('[Realtime] Supabase not configured - notifications disabled');
        return false;
    }

    try {
        supabase = createClient(supabaseUrl, supabaseKey);

        // Subscribe to global channel
        globalChannel = supabase
            .channel(REALTIME_CHANNELS.GLOBAL)
            .on('broadcast', { event: REALTIME_EVENTS.GHOST_SPAWN }, handleGhostSpawn)
            .on('broadcast', { event: REALTIME_EVENTS.GHOST_EXPIRE }, handleGhostExpire)
            .on('broadcast', { event: REALTIME_EVENTS.PLAYER_INTRUSION_ALERT }, handleIntrusionAlert)
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Connected to global channel');
                }
            });

        // Subscribe to territory channel
        territoryChannel = supabase
            .channel(REALTIME_CHANNELS.TERRITORY)
            .on('broadcast', { event: REALTIME_EVENTS.TERRITORY_CAPTURE_START }, handleTerritoryCaptureStart)
            .on('broadcast', { event: REALTIME_EVENTS.TERRITORY_CAPTURED }, handleTerritoryCaptured)
            .on('broadcast', { event: REALTIME_EVENTS.TERRITORY_CONTESTED }, handleTerritoryContested)
            .on('broadcast', { event: REALTIME_EVENTS.TERRITORY_LOST }, handleTerritoryLost)
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Connected to territory channel');
                }
            });

        // Subscribe to market channel
        marketChannel = supabase
            .channel(REALTIME_CHANNELS.MARKET)
            .on('broadcast', { event: REALTIME_EVENTS.MARKET_PRICE_UPDATE }, handleMarketPriceUpdate)
            .on('broadcast', { event: REALTIME_EVENTS.BLACKMARKET_PRICE_CHANGE }, handleBlackmarketPriceChange)
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Connected to market channel');
                }
            });

        console.log('[Realtime] Client initialized');
        return true;
    } catch (error) {
        console.error('[Realtime] Initialization failed:', error);
        return false;
    }
}

// ============== EVENT HANDLERS ==============

function handleGhostSpawn({ payload }) {
    showToast(payload.message, 'ghost', 10000);
    if (onGhostSpawn) onGhostSpawn(payload);
}

function handleGhostExpire({ payload }) {
    showToast(payload.message, 'warning', 5000);
    if (onGhostExpire) onGhostExpire(payload);
}

function handleTerritoryCaptureStart({ payload }) {
    showToast(payload.message, 'territory', 5000);
}

function handleTerritoryCaptured({ payload }) {
    showToast(payload.message, 'success', 8000);
    if (onTerritoryCaptured) onTerritoryCaptured(payload);
}

function handleTerritoryContested({ payload }) {
    showToast(payload.message, 'warning', 8000);
    if (onTerritoryContested) onTerritoryContested(payload);
}

function handleTerritoryLost({ payload }) {
    showToast(payload.message, 'error', 8000);
}

function handleMarketPriceUpdate({ payload }) {
    // Only show for significant changes
    if (onMarketPriceChange) onMarketPriceChange(payload);
}

function handleBlackmarketPriceChange({ payload }) {
    showToast(payload.message, 'market', 5000);
    if (onMarketPriceChange) onMarketPriceChange(payload);
}

function handleIntrusionAlert({ payload }) {
    // Only show if targeted at this player
    const playerId = window.game?.state?.player?.id;
    if (payload.targetPlayerId === playerId) {
        showToast(payload.message, 'alert', 10000);
        if (onIntrusionAlert) onIntrusionAlert(payload);
    }
}

// ============== TOAST NOTIFICATION SYSTEM ==============

let toastContainer = null;

function createToastContainer() {
    if (toastContainer) return;

    toastContainer = document.createElement('div');
    toastContainer.id = 'realtime-toast-container';
    toastContainer.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 350px;
    pointer-events: none;
  `;
    document.body.appendChild(toastContainer);
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type: 'ghost', 'territory', 'market', 'success', 'warning', 'error', 'alert'
 * @param {number} duration - Duration in ms (default 5000)
 */
export function showToast(message, type = 'info', duration = 5000) {
    createToastContainer();

    const toast = document.createElement('div');
    toast.className = `realtime-toast realtime-toast-${type}`;

    const colors = {
        ghost: { bg: 'rgba(170, 0, 255, 0.9)', border: '#aa00ff', icon: '⚡' },
        territory: { bg: 'rgba(255, 170, 0, 0.9)', border: '#ffaa00', icon: '🏴' },
        market: { bg: 'rgba(0, 200, 200, 0.9)', border: '#00c8c8', icon: '💹' },
        success: { bg: 'rgba(0, 255, 100, 0.9)', border: '#00ff64', icon: '✓' },
        warning: { bg: 'rgba(255, 200, 0, 0.9)', border: '#ffc800', icon: '⚠' },
        error: { bg: 'rgba(255, 50, 50, 0.9)', border: '#ff3232', icon: '✗' },
        alert: { bg: 'rgba(255, 0, 0, 0.95)', border: '#ff0000', icon: '🚨' },
        info: { bg: 'rgba(100, 100, 100, 0.9)', border: '#666666', icon: 'ℹ' },
    };

    const color = colors[type] || colors.info;

    toast.style.cssText = `
    background: ${color.bg};
    border: 1px solid ${color.border};
    border-left: 4px solid ${color.border};
    padding: 12px 16px;
    border-radius: 4px;
    color: #ffffff;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-out ${duration - 300}ms forwards;
    pointer-events: auto;
  `;

    toast.innerHTML = `
    <span style="margin-right: 8px;">${color.icon}</span>
    <span>${message}</span>
  `;

    // Add CSS animations if not exists
    if (!document.getElementById('realtime-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'realtime-toast-styles';
        style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; transform: translateY(-10px); }
      }
    `;
        document.head.appendChild(style);
    }

    toastContainer.appendChild(toast);

    // Remove after duration
    setTimeout(() => {
        toast.remove();
    }, duration);
}

// ============== EVENT SUBSCRIPTION SETTERS ==============

export function setOnGhostSpawn(handler) { onGhostSpawn = handler; }
export function setOnGhostExpire(handler) { onGhostExpire = handler; }
export function setOnTerritoryCaptured(handler) { onTerritoryCaptured = handler; }
export function setOnTerritoryContested(handler) { onTerritoryContested = handler; }
export function setOnMarketPriceChange(handler) { onMarketPriceChange = handler; }
export function setOnIntrusionAlert(handler) { onIntrusionAlert = handler; }

/**
 * Cleanup subscriptions
 */
export function cleanupRealtimeClient() {
    if (globalChannel) globalChannel.unsubscribe();
    if (territoryChannel) territoryChannel.unsubscribe();
    if (marketChannel) marketChannel.unsubscribe();
    console.log('[Realtime] Client disconnected');
}
