import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Supabase is OPTIONAL - game works without persistence
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
    console.warn('[DB] Supabase not configured - running without persistence');
}

// --- Auth ---

export async function registerUser(username, password) {
    if (!supabase) return { error: 'Database not configured' };

    // Use custom RPC to bypass Captcha/Rate limits and ensure atomic creation
    const { data, error } = await supabase.rpc('register_player', {
        username,
        password
    });

    if (error) return { error: error.message };
    if (data.error) return { error: data.error };

    // Data contains { success, user_id }
    return { user: { id: data.user_id } };
}

export async function loginUser(username, password) {
    if (!supabase) return { error: 'Database not configured' };

    const email = `${username.toLowerCase()}@uplink.net`;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) return { error: error.message };
    return { user: data.user, session: data.session };
}

// --- Persistence ---

export async function savePlayerState(playerId, state) {
    if (!supabase) return; // Skip if no DB

    // Use RPCs to bypass RLS (since we are server)

    // 1. Save Stats & Resources
    const { error: statsError } = await supabase.rpc('save_player_state', {
        p_id: playerId,
        p_reputation: state.reputation,
        p_heat: state.heat,
        p_rig_class: state.rig?.class?.id || 'burner', // Use fallback if missing
        p_rig_integrity: state.rigIntegrity || state.rig?.integrity || 100,
        p_home_safehouse: state.homeSafeHouse,
        p_resources: state.resources
    });

    if (statsError) console.error('Save stats error:', statsError);

    // 2. Save Modules
    // Prepare modules object: { core: [id, id], ... }
    const modulesObj = { core: [], memory: [], expansion: [] };
    if (state.rig && state.rig.equippedModules) {
        ['core', 'memory', 'expansion'].forEach(slot => {
            if (state.rig.equippedModules[slot]) {
                // Map module objects to IDs
                modulesObj[slot] = state.rig.equippedModules[slot].map(m => m.id || m);
            }
        });
    }

    const { error: modError } = await supabase.rpc('save_player_modules_v2', {
        p_id: playerId,
        p_modules: modulesObj
    });

    if (modError) console.error('Save modules error:', modError);

    // 3. Update Files
    // RPC for files? Or just skip for now to reduce complexity/migrations
    // Let's implement basic file saving later if needed, or via simple delete/insert if allowed.
    // We'll skip file persistence for this iteration to focus on the crash fix.
}

export async function loadPlayerState(playerId) {
    if (!supabase) return null; // Skip if no DB

    const { data, error } = await supabase.rpc('load_player_state', { p_id: playerId });

    if (error) {
        console.error('Load stats error:', error);
        return null;
    }

    // Data structure: { stats, items: [], files: [] }
    const { stats, items, files } = data;

    if (!stats) return null;

    // Reconstruct resources
    const resources = {
        data_packets: 0, bandwidth_tokens: 0, encryption_keys: 0,
        access_tokens: 0, zero_days: 0, quantum_cores: 0
    };
    items.filter(i => i.category === 'RESOURCE').forEach(i => {
        resources[i.item_key] = i.quantity;
    });

    // Reconstruct modules
    const equippedModules = { core: [], memory: [], expansion: [] };
    items.filter(i => i.category === 'MODULE').forEach(i => {
        if (equippedModules[i.equipped_slot]) {
            equippedModules[i.equipped_slot].push(i.item_key);
        }
    });

    // Reconstruct files
    const localFiles = files.map(f => ({
        name: f.filename,
        type: f.file_type,
        size: f.size_mb,
        content: f.content,
        encrypted: f.encrypted
    }));

    return {
        stats,
        resources,
        equippedModules,
        localFiles
    };
}

function generateIP() {
    return [
        Math.floor(Math.random() * 223) + 1,
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
    ].join('.');
}
