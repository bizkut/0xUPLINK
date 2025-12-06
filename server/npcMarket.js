// NPC Market System - Database-backed vendors and orders
// Like Eve Online: sellers appear anonymous but have internal identities

import { v4 as uuidv4 } from 'uuid';
import { COMPUTER_CLASSES, RIG_MODULES } from '../shared/computerModels.js';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Supabase client for market operations (optional)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Price variance configuration
const PRICE_CONFIG = {
    minVariance: 0.85,  // -15%
    maxVariance: 1.20,  // +20%
    npcOrderExpiry: 365 * 24 * 60 * 60 * 1000, // 1 year in ms
};

// Cached vendors (loaded from DB)
let cachedVendors = [];

// Load vendors from database
export async function loadVendorsFromDb() {
    if (!supabase) {
        console.warn('[NPC Market] No database - using fallback vendors');
        cachedVendors = getFallbackVendors();
        return cachedVendors;
    }

    const { data, error } = await supabase
        .from('npc_vendors')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('[NPC Market] Failed to load vendors:', error);
        return [];
    }

    cachedVendors = data;
    console.log(`[NPC Market] Loaded ${data.length} vendors from database`);
    return data;
}

// Get a random vendor from cache
function getRandomVendor() {
    if (cachedVendors.length === 0) return null;
    return cachedVendors[Math.floor(Math.random() * cachedVendors.length)];
}

// Generate a realistic price with variance
function generatePrice(basePrice, priceModifier = 1.0) {
    const variance = PRICE_CONFIG.minVariance +
        (Math.random() * (PRICE_CONFIG.maxVariance - PRICE_CONFIG.minVariance));

    const finalPrice = Math.round(basePrice * priceModifier * variance);

    // Round to nice numbers for realism
    if (finalPrice >= 10000) {
        return Math.round(finalPrice / 100) * 100;
    } else if (finalPrice >= 1000) {
        return Math.round(finalPrice / 50) * 50;
    } else {
        return Math.round(finalPrice / 10) * 10;
    }
}

// Generate a random quantity based on item tier/rarity
function generateQuantity(tier) {
    switch (tier) {
        case 0: return Math.floor(Math.random() * 50) + 20;
        case 1: return Math.floor(Math.random() * 20) + 10;
        case 2: return Math.floor(Math.random() * 10) + 5;
        case 3: return Math.floor(Math.random() * 5) + 2;
        case 4: return Math.floor(Math.random() * 3) + 1;
        default: return Math.floor(Math.random() * 15) + 5;
    }
}

// Fallback vendors when no database
function getFallbackVendors() {
    return [
        { vendor_code: 'NPC_TechDealer', name: 'TechDealer', price_modifier: 1.0 },
        { vendor_code: 'NPC_ShadowMarket', name: 'ShadowMarket', price_modifier: 0.95 },
        { vendor_code: 'NPC_BlackMarket', name: 'BlackMarket', price_modifier: 1.1 },
    ];
}

// In-memory orders when no database
let inMemoryOrders = [];

// Load existing market orders from database
export async function loadMarketOrdersFromDb() {
    if (!supabase) return inMemoryOrders;

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('market_orders')
        .select('*')
        .gt('expires_at', now);

    if (error) {
        console.error('[NPC Market] Failed to load orders:', error);
        return [];
    }

    // Convert to in-memory format
    return data.map(o => ({
        id: o.id,
        sellerId: o.seller_id,
        sellerName: o.seller_name,
        isNpc: o.is_npc,
        itemType: o.item_type,
        itemId: o.item_id,
        itemName: o.item_name,
        itemTier: o.item_tier,
        itemCategory: o.item_category,
        price: o.price,
        quantity: o.quantity,
        createdAt: new Date(o.created_at).getTime(),
        expiresAt: new Date(o.expires_at).getTime(),
    }));
}

// Save a market order to database
export async function saveMarketOrderToDb(order) {
    if (!supabase) {
        inMemoryOrders.push(order);
        return true;
    }

    const { error } = await supabase
        .from('market_orders')
        .insert({
            id: order.id,
            seller_id: order.sellerId,
            seller_name: order.sellerName,
            is_npc: order.isNpc || false,
            item_type: order.itemType,
            item_id: order.itemId,
            item_name: order.itemName,
            item_tier: order.itemTier,
            item_category: order.itemCategory,
            price: order.price,
            quantity: order.quantity,
            created_at: new Date(order.createdAt).toISOString(),
            expires_at: new Date(order.expiresAt).toISOString(),
        });

    if (error) {
        console.error('[NPC Market] Failed to save order:', error);
        return false;
    }
    return true;
}

// Update order quantity in database
export async function updateOrderQuantityInDb(orderId, newQuantity) {
    if (!supabase) {
        const idx = inMemoryOrders.findIndex(o => o.id === orderId);
        if (idx !== -1) {
            if (newQuantity <= 0) inMemoryOrders.splice(idx, 1);
            else inMemoryOrders[idx].quantity = newQuantity;
        }
        return;
    }

    if (newQuantity <= 0) {
        // Delete order if quantity reaches 0
        const { error } = await supabase
            .from('market_orders')
            .delete()
            .eq('id', orderId);

        if (error) console.error('[NPC Market] Failed to delete order:', error);
        return;
    }

    const { error } = await supabase
        .from('market_orders')
        .update({ quantity: newQuantity })
        .eq('id', orderId);

    if (error) console.error('[NPC Market] Failed to update order:', error);
}

// Delete order from database
export async function deleteOrderFromDb(orderId) {
    if (!supabase) {
        inMemoryOrders = inMemoryOrders.filter(o => o.id !== orderId);
        return;
    }

    const { error } = await supabase
        .from('market_orders')
        .delete()
        .eq('id', orderId);

    if (error) console.error('[NPC Market] Failed to delete order:', error);
}

// Generate and save NPC orders for computers
async function generateComputerOrders() {
    const orders = [];

    for (const rig of Object.values(COMPUTER_CLASSES)) {
        if (rig.price === 0) continue;

        const numOrders = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < numOrders; i++) {
            const vendor = getRandomVendor();
            if (!vendor) continue;

            const price = generatePrice(rig.price, vendor.price_modifier);
            const quantity = generateQuantity(rig.tier);

            const order = {
                id: uuidv4(),
                sellerId: vendor.vendor_code,
                sellerName: vendor.name,
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
            };

            orders.push(order);
            await saveMarketOrderToDb(order);
        }
    }

    return orders;
}

// Generate and save NPC orders for modules
async function generateModuleOrders() {
    const orders = [];

    for (const mod of Object.values(RIG_MODULES)) {
        const numOrders = Math.floor(Math.random() * 4) + 1;

        let tier = 1;
        if (mod.price >= 15000) tier = 4;
        else if (mod.price >= 5000) tier = 3;
        else if (mod.price >= 2000) tier = 2;

        for (let i = 0; i < numOrders; i++) {
            const vendor = getRandomVendor();
            if (!vendor) continue;

            const price = generatePrice(mod.price, vendor.price_modifier);
            const quantity = generateQuantity(tier);

            const order = {
                id: uuidv4(),
                sellerId: vendor.vendor_code,
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
            };

            orders.push(order);
            await saveMarketOrderToDb(order);
        }
    }

    return orders;
}

// Initialize NPC market - load from DB or seed if empty
export async function initializeNpcMarket() {
    // 1. Load vendors from DB
    await loadVendorsFromDb();

    if (cachedVendors.length === 0) {
        console.error('[NPC Market] No vendors found in database! Run migration to seed vendors.');
        return { computerOrders: [], moduleOrders: [] };
    }

    // 2. Check if we have existing orders
    const existingOrders = await loadMarketOrdersFromDb();

    if (existingOrders.length > 0) {
        console.log(`[NPC Market] Loaded ${existingOrders.length} existing orders from database`);
        return { orders: existingOrders, fromDb: true };
    }

    // 3. No orders exist - generate and save new ones
    console.log('[NPC Market] No orders in DB, generating new NPC orders...');
    const computerOrders = await generateComputerOrders();
    const moduleOrders = await generateModuleOrders();

    console.log(`[NPC Market] Generated ${computerOrders.length} computer orders`);
    console.log(`[NPC Market] Generated ${moduleOrders.length} module orders`);

    return {
        orders: [...computerOrders, ...moduleOrders],
        fromDb: false
    };
}

// Restock sold-out items (called periodically)
export async function restockNpcOrders() {
    const existingOrders = await loadMarketOrdersFromDb();

    // Count orders per item
    const computerCounts = {};
    const moduleCounts = {};

    for (const order of existingOrders) {
        if (!order.isNpc) continue;

        if (order.itemType === 'computer') {
            computerCounts[order.itemId] = (computerCounts[order.itemId] || 0) + 1;
        } else if (order.itemType === 'module') {
            moduleCounts[order.itemId] = (moduleCounts[order.itemId] || 0) + 1;
        }
    }

    let restocked = 0;

    // Restock computers
    for (const rig of Object.values(COMPUTER_CLASSES)) {
        if (rig.price === 0) continue;

        if (!computerCounts[rig.id] || computerCounts[rig.id] < 1) {
            const vendor = getRandomVendor();
            if (!vendor) continue;

            const order = {
                id: uuidv4(),
                sellerId: vendor.vendor_code,
                sellerName: vendor.name,
                isNpc: true,
                itemType: 'computer',
                itemId: rig.id,
                itemName: rig.name,
                itemTier: rig.tier,
                itemCategory: rig.specialty,
                price: generatePrice(rig.price, vendor.price_modifier),
                quantity: generateQuantity(rig.tier),
                createdAt: Date.now(),
                expiresAt: Date.now() + PRICE_CONFIG.npcOrderExpiry,
            };

            await saveMarketOrderToDb(order);
            restocked++;
        }
    }

    // Restock modules
    for (const mod of Object.values(RIG_MODULES)) {
        if (!moduleCounts[mod.id] || moduleCounts[mod.id] < 1) {
            const vendor = getRandomVendor();
            if (!vendor) continue;

            let tier = 1;
            if (mod.price >= 15000) tier = 4;
            else if (mod.price >= 5000) tier = 3;
            else if (mod.price >= 2000) tier = 2;

            const order = {
                id: uuidv4(),
                sellerId: vendor.vendor_code,
                sellerName: vendor.name,
                isNpc: true,
                itemType: 'module',
                itemId: mod.id,
                itemName: mod.name,
                itemTier: tier,
                itemCategory: mod.slotType,
                price: generatePrice(mod.price, vendor.price_modifier),
                quantity: generateQuantity(tier),
                createdAt: Date.now(),
                expiresAt: Date.now() + PRICE_CONFIG.npcOrderExpiry,
            };

            await saveMarketOrderToDb(order);
            restocked++;
        }
    }

    if (restocked > 0) {
        console.log(`[NPC Market] Restocked ${restocked} items`);
    }

    return restocked;
}

export { PRICE_CONFIG };

// === NPC TRADING SIMULATION ===
// Simulates dynamic NPC market activity

const NPC_SIMULATION_CONFIG = {
    intervalMs: 24 * 60 * 60 * 1000, // Every 24 hours
    cancelChance: 0.15,             // 15% chance to cancel an order
    priceAdjustChance: 0.25,        // 25% chance to adjust price
    priceAdjustRange: 0.15,         // ±15% price adjustment
    newOrderChance: 0.20,           // 20% chance to add new order
    partialFillChance: 0.10,        // 10% chance to simulate a sale
    maxActionsPerCycle: 10,         // Max actions per simulation cycle
};

let simulationInterval = null;

// Simulate NPC trading activity
export async function simulateNpcTrading() {
    const orders = await loadMarketOrdersFromDb();
    const npcOrders = orders.filter(o => o.isNpc);

    if (npcOrders.length === 0) {
        console.log('[NPC Trading] No NPC orders to simulate');
        return;
    }

    let actions = 0;
    const maxActions = NPC_SIMULATION_CONFIG.maxActionsPerCycle;

    // Shuffle orders for randomness
    const shuffled = [...npcOrders].sort(() => Math.random() - 0.5);

    for (const order of shuffled) {
        if (actions >= maxActions) break;

        const roll = Math.random();

        // 1. Cancel order
        if (roll < NPC_SIMULATION_CONFIG.cancelChance) {
            await deleteOrderFromDb(order.id);
            console.log(`[NPC Trading] Cancelled order: ${order.itemName}`);
            actions++;
            continue;
        }

        // 2. Adjust price
        if (roll < NPC_SIMULATION_CONFIG.cancelChance + NPC_SIMULATION_CONFIG.priceAdjustChance) {
            const adjustment = 1 + ((Math.random() * 2 - 1) * NPC_SIMULATION_CONFIG.priceAdjustRange);
            const newPrice = Math.round(order.price * adjustment);

            if (supabase) {
                await supabase
                    .from('market_orders')
                    .update({ price: newPrice })
                    .eq('id', order.id);
            } else {
                // In-memory update
                const idx = inMemoryOrders.findIndex(o => o.id === order.id);
                if (idx !== -1) inMemoryOrders[idx].price = newPrice;
            }

            console.log(`[NPC Trading] Price adjusted: ${order.itemName} ${order.price} -> ${newPrice}`);
            actions++;
            continue;
        }

        // 3. Partial fill (simulate sale - reduce quantity)
        if (roll < NPC_SIMULATION_CONFIG.cancelChance + NPC_SIMULATION_CONFIG.priceAdjustChance + NPC_SIMULATION_CONFIG.partialFillChance) {
            const soldQty = Math.floor(Math.random() * Math.min(3, order.quantity)) + 1;
            const newQty = order.quantity - soldQty;

            if (newQty <= 0) {
                await deleteOrderFromDb(order.id);
                console.log(`[NPC Trading] Sold out: ${order.itemName}`);
            } else {
                await updateOrderQuantityInDb(order.id, newQty);
                console.log(`[NPC Trading] Sold ${soldQty}x ${order.itemName} (${newQty} remaining)`);
            }
            actions++;
            continue;
        }
    }

    // 4. Add new orders if chance triggers
    if (Math.random() < NPC_SIMULATION_CONFIG.newOrderChance) {
        const restocked = await restockNpcOrders();
        if (restocked > 0) actions++;
    }

    if (actions > 0) {
        console.log(`[NPC Trading] Simulation complete: ${actions} actions`);
    }

    return actions;
}

// Start the NPC trading simulation timer
export function startNpcTradingSimulation() {
    if (simulationInterval) {
        clearInterval(simulationInterval);
    }

    console.log(`[NPC Trading] Starting simulation (every ${NPC_SIMULATION_CONFIG.intervalMs / 3600000} hours)`);

    // Run first simulation after 1 minute (give server time to start)
    setTimeout(() => {
        simulateNpcTrading();

        // Then run on interval
        simulationInterval = setInterval(() => {
            simulateNpcTrading();
        }, NPC_SIMULATION_CONFIG.intervalMs);
    }, 60000);

    return simulationInterval;
}

// Stop the simulation
export function stopNpcTradingSimulation() {
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
        console.log('[NPC Trading] Simulation stopped');
    }
}
