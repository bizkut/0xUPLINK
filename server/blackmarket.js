// Black Market Server Module
// Dynamic pricing with supply/demand mechanics for contraband items

import { BLACK_MARKET_CONFIG, CONTRABAND_ITEMS } from '../shared/constants.js';

// In-memory state for black market
const blackMarketState = {
    supply: {},      // { itemId -> quantity }
    demand: {},      // { itemId -> demand level (0-100) }
    priceHistory: {},// { itemId -> [{ price, time }] }
    lastUpdate: 0,
};

// Initialize black market state
export function initializeBlackMarket() {
    for (const item of CONTRABAND_ITEMS) {
        // Initial supply based on rarity
        const supplyByRarity = {
            abundant: 25,
            normal: 15,
            scarce: 8,
            rare: 3,
        };
        blackMarketState.supply[item.id] = supplyByRarity[item.rarity] || 10;
        blackMarketState.demand[item.id] = 50; // Start at 50% demand
        blackMarketState.priceHistory[item.id] = [];
    }
    blackMarketState.lastUpdate = Date.now();
    console.log('[Black Market] Initialized with', CONTRABAND_ITEMS.length, 'contraband items');
}

// Get supply level string based on quantity
function getSupplyLevel(quantity) {
    const levels = BLACK_MARKET_CONFIG.supplyLevels;
    if (quantity >= levels.abundant.threshold) return 'abundant';
    if (quantity >= levels.normal.threshold) return 'normal';
    if (quantity >= levels.scarce.threshold) return 'scarce';
    return 'rare';
}

// Calculate current price for an item
export function calculatePrice(itemId) {
    const item = CONTRABAND_ITEMS.find(i => i.id === itemId);
    if (!item) return null;

    const supply = blackMarketState.supply[itemId] || 0;
    const demand = blackMarketState.demand[itemId] || 50;
    const supplyLevel = getSupplyLevel(supply);
    const supplyMultiplier = BLACK_MARKET_CONFIG.supplyLevels[supplyLevel].multiplier;

    // Demand affects price: 0% demand = 0.5x, 100% demand = 1.5x
    const demandMultiplier = 0.5 + (demand / 100);

    // Random volatility within range
    const volatilityRange = BLACK_MARKET_CONFIG.volatility;
    const volatilityFactor = 1 + (Math.random() * volatilityRange * 2 - volatilityRange);

    const price = Math.floor(item.basePrice * supplyMultiplier * demandMultiplier * volatilityFactor);
    return Math.max(1, price);
}

// Get all items with current prices
export function getBlackMarketItems() {
    return CONTRABAND_ITEMS.map(item => {
        const supply = blackMarketState.supply[item.id] || 0;
        const demand = blackMarketState.demand[item.id] || 50;
        const price = calculatePrice(item.id);
        const supplyLevel = getSupplyLevel(supply);

        // Calculate trend based on price history
        const history = blackMarketState.priceHistory[item.id] || [];
        let trend = 'stable';
        if (history.length >= 2) {
            const last = history[history.length - 1].price;
            const prev = history[history.length - 2].price;
            if (last > prev * 1.05) trend = 'rising';
            else if (last < prev * 0.95) trend = 'falling';
        }

        return {
            ...item,
            price,
            supply,
            supplyLevel,
            demand: Math.round(demand),
            trend,
            available: supply > 0,
        };
    });
}

// Buy contraband (decreases supply, increases demand)
export function buyContraband(itemId) {
    const supply = blackMarketState.supply[itemId];
    if (supply === undefined || supply <= 0) {
        return { error: 'Item out of stock.' };
    }

    const price = calculatePrice(itemId);
    blackMarketState.supply[itemId]--;
    blackMarketState.demand[itemId] = Math.min(100, (blackMarketState.demand[itemId] || 50) + 10);

    return { success: true, price };
}

// Sell contraband (increases supply, decreases demand)
export function sellContraband(itemId) {
    const item = CONTRABAND_ITEMS.find(i => i.id === itemId);
    if (!item) return { error: 'Invalid contraband item.' };

    const price = Math.floor(calculatePrice(itemId) * 0.7); // Sell at 70% of buy price
    blackMarketState.supply[itemId] = (blackMarketState.supply[itemId] || 0) + 1;
    blackMarketState.demand[itemId] = Math.max(0, (blackMarketState.demand[itemId] || 50) - 5);

    return { success: true, price };
}

// Price update loop (called periodically)
export function updateBlackMarketPrices() {
    const now = Date.now();

    for (const item of CONTRABAND_ITEMS) {
        // Record current price to history
        const price = calculatePrice(item.id);
        const history = blackMarketState.priceHistory[item.id];
        history.push({ price, time: now });

        // Keep only last 24 entries (24 hours of history)
        if (history.length > 24) {
            history.shift();
        }

        // Decay demand slightly
        blackMarketState.demand[item.id] = Math.max(
            20,
            (blackMarketState.demand[item.id] || 50) - BLACK_MARKET_CONFIG.demandDecay * 10
        );

        // Slowly restock based on rarity
        const restockChance = {
            abundant: 0.5,
            normal: 0.3,
            scarce: 0.15,
            rare: 0.05,
        }[item.rarity] || 0.2;

        if (Math.random() < restockChance) {
            const maxStock = {
                abundant: 30,
                normal: 20,
                scarce: 10,
                rare: 5,
            }[item.rarity] || 15;

            blackMarketState.supply[item.id] = Math.min(
                maxStock,
                (blackMarketState.supply[item.id] || 0) + 1
            );
        }
    }

    blackMarketState.lastUpdate = now;
    console.log('[Black Market] Prices updated');
}

// Start price update loop
export function startBlackMarketLoop() {
    setInterval(() => {
        updateBlackMarketPrices();
    }, BLACK_MARKET_CONFIG.priceUpdateInterval);
    console.log('[Black Market] Price update loop started (every', BLACK_MARKET_CONFIG.priceUpdateInterval / 60000, 'min)');
}

// Get heat penalty
export function getHeatPenalty() {
    return BLACK_MARKET_CONFIG.heatPenalty;
}

// Export state for debugging
export function getBlackMarketState() {
    return { ...blackMarketState };
}
