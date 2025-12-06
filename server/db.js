import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- Auth ---

export async function registerUser(username, password) {
    const email = `${username.toLowerCase()}@uplink.net`;

    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) return { error: authError.message };
    if (!authData.user) return { error: 'Registration failed' };

    // 2. Create profile (Trigger might handle this, or we do it manually if we didn't set up a trigger)
    // My migration didn't set up a trigger, so I must insert profile manually.
    const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: authData.user.id, username }]);

    if (profileError) {
        // Cleanup auth user? (Can't with anon key easily)
        return { error: 'Failed to create profile: ' + profileError.message };
    }

    // 3. Create initial stats
    const { error: statsError } = await supabase
        .from('player_stats')
        .insert([{
            player_id: authData.user.id,
            ip: generateIP(), // Helper needed? Or pass it in.
        }]);

    if (statsError) console.error('Error creating stats:', statsError);

    return { user: authData.user };
}

export async function loginUser(username, password) {
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
    // 1. Update Stats
    const { error: statsError } = await supabase
        .from('player_stats')
        .upsert({
            player_id: playerId,
            credits: state.credits,
            reputation: state.reputation,
            heat: state.heat,
            current_rig_class: state.rig?.class?.id || 'BURNER',
            rig_integrity: state.hardware?.integrity || 100,
            home_safehouse_id: state.homeSafeHouse,
            updated_at: new Date(),
        });

    if (statsError) console.error('Save stats error:', statsError);

    // 2. Update Inventory (Resources)
    // We'll delete old resource items and re-insert (easiest for sync) or upsert
    const resourceItems = Object.entries(state.resources).map(([key, qty]) => ({
        player_id: playerId,
        category: 'RESOURCE',
        item_key: key,
        quantity: qty,
        equipped_slot: null
    }));

    // Upsert resources
    const { error: resError } = await supabase
        .from('player_items')
        .upsert(resourceItems, { onConflict: 'player_id, category, item_key, equipped_slot' });

    if (resError) console.error('Save resources error:', resError);

    // 3. Update Modules
    const moduleItems = [];
    if (state.rig.equippedModules) {
        ['core', 'memory', 'expansion'].forEach(slot => {
            state.rig.equippedModules[slot].forEach(mod => {
                moduleItems.push({
                    player_id: playerId,
                    category: 'MODULE',
                    item_key: mod.id,
                    quantity: 1,
                    equipped_slot: slot
                });
            });
        });
    }

    // Clear existing modules first (to handle unequipped ones)?
    // For now, simpler to just upsert. But if a module was removed, upsert won't delete it.
    // Ideally: Delete all modules for player, then insert.
    await supabase.from('player_items').delete().match({ player_id: playerId, category: 'MODULE' });
    if (moduleItems.length > 0) {
        await supabase.from('player_items').insert(moduleItems);
    }

    // 4. Update Files
    // Similar logic: Diff or overwrite. Overwrite is safer for prototype.
    // Be careful not to delete ALL files if we are only syncing changes.
    // Let's just assume we want to sync the *local files* from state.
    // state.localStorage.files
    if (state.localStorage?.files) {
        // This is heavy if many files. For prototype, it's fine.
        await supabase.from('player_files').delete().match({ player_id: playerId });
        const fileRows = state.localStorage.files.map(f => ({
            player_id: playerId,
            filename: f.name,
            file_type: f.type || 'data',
            size_mb: f.size || 1,
            content: f.content,
            encrypted: !!f.encrypted
        }));
        if (fileRows.length > 0) {
            await supabase.from('player_files').insert(fileRows);
        }
    }
}

export async function loadPlayerState(playerId) {
    // Parallel fetch
    const [stats, items, files] = await Promise.all([
        supabase.from('player_stats').select('*').eq('player_id', playerId).single(),
        supabase.from('player_items').select('*').eq('player_id', playerId),
        supabase.from('player_files').select('*').eq('player_id', playerId)
    ]);

    if (stats.error) {
        console.error('Load stats error:', stats.error);
        return null;
    }

    const data = stats.data;
    const inventory = items.data || [];
    const playerFiles = files.data || [];

    // Reconstruct resources
    const resources = {
        data_packets: 0, bandwidth_tokens: 0, encryption_keys: 0,
        access_tokens: 0, zero_days: 0, quantum_cores: 0
    };
    inventory.filter(i => i.category === 'RESOURCE').forEach(i => {
        resources[i.item_key] = i.quantity;
    });

    // Reconstruct modules
    const equippedModules = { core: [], memory: [], expansion: [] };
    inventory.filter(i => i.category === 'MODULE').forEach(i => {
        // We need to look up module details from constant/config using item_key
        // Usage: we just store ID here, game logic needs to hydrate it.
        // For now, push the ID. The game loader will need to map ID to object.
        if (equippedModules[i.equipped_slot]) {
            equippedModules[i.equipped_slot].push(i.item_key);
        }
    });

    // Reconstruct files
    const localFiles = playerFiles.map(f => ({
        name: f.filename,
        type: f.file_type,
        size: f.size_mb,
        content: f.content,
        encrypted: f.encrypted
    }));

    return {
        stats: data,
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
