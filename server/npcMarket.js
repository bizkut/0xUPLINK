// NPC Market System - Anonymous vendors selling computers and modules
// Like Eve Online: sellers appear anonymous but have internal identities

import { v4 as uuidv4 } from 'uuid';
import { COMPUTER_CLASSES, RIG_MODULES } from '../shared/computerModels.js';

// NPC Vendor identities (internal, never shown to players)
const NPC_VENDORS = [
    { id: 'npc_tech_dealer_001', name: 'TechDealer_X1', type: 'tech' },
    { id: 'npc_shadow_market_001', name: 'ShadowMarket_Alpha', type: 'shadow' },
    { id: 'npc_corp_surplus_001', name: 'CorpSurplus_Liquidator', type: 'corp' },
    { id: 'npc_blackmarket_001', name: 'BlackMarket_Runner', type: 'black' },
    { id: 'npc_salvage_001', name: 'Salvage_Ops', type: 'salvage' },
    { id: 'npc_underground_001', name: 'Underground_Exchange', type: 'underground' },
    { id: 'npc_faction_ghost_001', name: 'Ghost_Faction_Trader', type: 'faction' },
    { id: 'npc_faction_syndicate_001', name: 'Syndicate_Arms', type: 'faction' },
];

// Price variance configuration
const PRICE_CONFIG = {
    // How much prices can deviate from base (±%)
    minVariance: 0.85,  // -15%
    maxVariance: 1.20,  // +20%

    // Vendor type affects pricing
    vendorModifiers: {
        tech: 1.0,        // Standard pricing
        shadow: 0.95,     // 5% cheaper (risky source)
        corp: 1.05,       // 5% more expensive (reliable)
        black: 0.90,      // 10% cheaper (very risky)
        salvage: 0.80,    // 20% cheaper (used/damaged goods)
        underground: 0.92, // 8% cheaper
        faction: 1.10,    // 10% more expensive (faction loyalty required)
    },

    // Order expiry (1 year in ms)
    npcOrderExpiry: 365 * 24 * 60 * 60 * 1000,
};

// Generate a realistic price with variance
function generatePrice(basePrice, vendorType) {
    const vendorMod = PRICE_CONFIG.vendorModifiers[vendorType] || 1.0;
    const variance = PRICE_CONFIG.minVariance +
        (Math.random() * (PRICE_CONFIG.maxVariance - PRICE_CONFIG.minVariance));

    const finalPrice = Math.round(basePrice * vendorMod * variance);

    // Round to nice numbers for realism
    if (finalPrice >= 10000) {
        return Math.round(finalPrice / 100) * 100; // Round to nearest 100
    } else if (finalPrice >= 1000) {
        return Math.round(finalPrice / 50) * 50; // Round to nearest 50
    } else {
        return Math.round(finalPrice / 10) * 10; // Round to nearest 10
    }
}

// Generate a random quantity based on item tier/rarity
function generateQuantity(tier) {
    switch (tier) {
        case 0: return Math.floor(Math.random() * 50) + 20;  // Common (Burner)
        case 1: return Math.floor(Math.random() * 20) + 10;  // Uncommon
        case 2: return Math.floor(Math.random() * 10) + 5;   // Rare
        case 3: return Math.floor(Math.random() * 5) + 2;    // Very Rare
        case 4: return Math.floor(Math.random() * 3) + 1;    // Legendary
        default: return Math.floor(Math.random() * 15) + 5;
    }
}

// Get a random NPC vendor
function getRandomVendor() {
    return NPC_VENDORS[Math.floor(Math.random() * NPC_VENDORS.length)];
}

// Generate NPC sell orders for computers
export function generateComputerOrders() {
    const orders = [];

    for (const rig of Object.values(COMPUTER_CLASSES)) {
        // Skip free items from NPC market
        if (rig.price === 0) continue;

        // Generate 1-3 orders per rig type from different vendors
        const numOrders = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < numOrders; i++) {
            const vendor = getRandomVendor();
            const price = generatePrice(rig.price, vendor.type);
            const quantity = generateQuantity(rig.tier);

            orders.push({
                id: uuidv4(),
                sellerId: vendor.id,
                sellerName: vendor.name, // Internal only, never shown
                isNpc: true,
                itemType: 'computer',
                itemId: rig.id,
                itemName: rig.name,
                itemTier: rig.tier,
                itemCategory: rig.specialty,
                price: price,
                quantity: quantity,
                createdAt: Date.now(),
                expiresAt: Date.now() + PRICE_CONFIG.npcOrderExpiry,
            });
        }
    }

    return orders;
}

// Generate NPC sell orders for modules
export function generateModuleOrders() {
    const orders = [];

    for (const mod of Object.values(RIG_MODULES)) {
        // Generate 1-4 orders per module type
        const numOrders = Math.floor(Math.random() * 4) + 1;

        // Determine tier based on price
        let tier = 1;
        if (mod.price >= 15000) tier = 4;
        else if (mod.price >= 5000) tier = 3;
        else if (mod.price >= 2000) tier = 2;

        for (let i = 0; i < numOrders; i++) {
            const vendor = getRandomVendor();
            const price = generatePrice(mod.price, vendor.type);
            const quantity = generateQuantity(tier);

            orders.push({
                id: uuidv4(),
                sellerId: vendor.id,
                sellerName: vendor.name,
                isNpc: true,
                itemType: 'module',
                itemId: mod.id,
                itemName: mod.name,
                itemTier: tier,
                itemCategory: mod.slotType,
                price: price,
                quantity: quantity,
                createdAt: Date.now(),
                expiresAt: Date.now() + PRICE_CONFIG.npcOrderExpiry,
            });
        }
    }

    return orders;
}

// Generate all NPC market orders
export function seedNpcMarketOrders() {
    const computerOrders = generateComputerOrders();
    const moduleOrders = generateModuleOrders();

    console.log(`[NPC Market] Generated ${computerOrders.length} computer orders`);
    console.log(`[NPC Market] Generated ${moduleOrders.length} module orders`);

    return [...computerOrders, ...moduleOrders];
}

// Refresh NPC orders (called periodically to replenish sold-out items)
export function refreshNpcOrders(existingOrders) {
    const now = Date.now();
    const refreshed = [];

    // Check each existing NPC order
    for (const order of existingOrders) {
        if (!order.isNpc) {
            refreshed.push(order);
            continue;
        }

        // Remove expired orders
        if (order.expiresAt < now) {
            console.log(`[NPC Market] Order expired: ${order.itemName}`);
            continue;
        }

        // Keep valid orders
        if (order.quantity > 0) {
            refreshed.push(order);
        }
    }

    // Check if we need to add more orders for any item type
    const computerCounts = {};
    const moduleCounts = {};

    for (const order of refreshed) {
        if (!order.isNpc) continue;

        if (order.itemType === 'computer') {
            computerCounts[order.itemId] = (computerCounts[order.itemId] || 0) + 1;
        } else if (order.itemType === 'module') {
            moduleCounts[order.itemId] = (moduleCounts[order.itemId] || 0) + 1;
        }
    }

    // Ensure at least 1 order for each computer type
    for (const rig of Object.values(COMPUTER_CLASSES)) {
        if (rig.price === 0) continue;

        if (!computerCounts[rig.id] || computerCounts[rig.id] < 1) {
            const vendor = getRandomVendor();
            const price = generatePrice(rig.price, vendor.type);
            const quantity = generateQuantity(rig.tier);

            refreshed.push({
                id: uuidv4(),
                sellerId: vendor.id,
                sellerName: vendor.name,
                isNpc: true,
                itemType: 'computer',
                itemId: rig.id,
                itemName: rig.name,
                itemTier: rig.tier,
                itemCategory: rig.specialty,
                price: price,
                quantity: quantity,
                createdAt: now,
                expiresAt: now + PRICE_CONFIG.npcOrderExpiry,
            });

            console.log(`[NPC Market] Restocked: ${rig.name}`);
        }
    }

    // Ensure at least 1 order for each module type
    for (const mod of Object.values(RIG_MODULES)) {
        if (!moduleCounts[mod.id] || moduleCounts[mod.id] < 1) {
            const vendor = getRandomVendor();
            let tier = 1;
            if (mod.price >= 15000) tier = 4;
            else if (mod.price >= 5000) tier = 3;
            else if (mod.price >= 2000) tier = 2;

            const price = generatePrice(mod.price, vendor.type);
            const quantity = generateQuantity(tier);

            refreshed.push({
                id: uuidv4(),
                sellerId: vendor.id,
                sellerName: vendor.name,
                isNpc: true,
                itemType: 'module',
                itemId: mod.id,
                itemName: mod.name,
                itemTier: tier,
                itemCategory: mod.slotType,
                price: price,
                quantity: quantity,
                createdAt: now,
                expiresAt: now + PRICE_CONFIG.npcOrderExpiry,
            });

            console.log(`[NPC Market] Restocked: ${mod.name}`);
        }
    }

    return refreshed;
}

export { NPC_VENDORS, PRICE_CONFIG };
