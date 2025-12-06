// Computer Models System - EVE-style rigs with specializations
// Each computer class has unique bonuses, weaknesses, and slot layouts

export const COMPUTER_CLASSES = {
    PHANTOM: {
        id: 'phantom',
        name: 'Phantom',
        description: 'Ghost in the machine. Untraceable.',
        specialty: 'Stealth',
        tier: 2,
        price: 25000,

        // Base stats
        baseCpu: 4,
        baseRam: 512,
        baseBandwidth: 150,

        // Bonuses (multipliers, 1.0 = no change)
        bonuses: {
            traceResist: 1.4,      // +40% trace resistance
            harvestYield: 1.0,
            breachSpeed: 1.0,
            firewallStrength: 1.0,
            disconnectSpeed: 1.0,
        },

        // Weaknesses (multipliers, 1.0 = no change)
        weaknesses: {
            cpuEfficiency: 0.8,    // -20% effective CPU
        },

        // Slot layout
        slots: {
            core: 2,
            memory: 2,
            expansion: 3,
        },
    },

    HARVESTER: {
        id: 'harvester',
        name: 'Harvester',
        description: 'Built for extraction, not combat.',
        specialty: 'Data Mining',
        tier: 2,
        price: 20000,

        baseCpu: 3,
        baseRam: 1024,
        baseBandwidth: 200,

        bonuses: {
            traceResist: 1.0,
            harvestYield: 1.5,     // +50% harvest yield
            breachSpeed: 1.0,
            firewallStrength: 1.0,
            disconnectSpeed: 1.0,
        },

        weaknesses: {
            breachSpeed: 0.7,      // -30% breach speed
        },

        slots: {
            core: 1,
            memory: 3,
            expansion: 3,
        },
    },

    RAZORBACK: {
        id: 'razorback',
        name: 'Razorback',
        description: 'Fast, aggressive, reckless.',
        specialty: 'Assault',
        tier: 2,
        price: 30000,

        baseCpu: 6,
        baseRam: 256,
        baseBandwidth: 250,

        bonuses: {
            traceResist: 1.0,
            harvestYield: 1.0,
            breachSpeed: 1.35,     // +35% breach speed
            firewallStrength: 1.0,
            disconnectSpeed: 1.0,
        },

        weaknesses: {
            traceResist: 0.75,     // -25% trace resistance
        },

        slots: {
            core: 4,
            memory: 1,
            expansion: 2,
        },
    },

    BASTION: {
        id: 'bastion',
        name: 'Bastion',
        description: 'A fortress. Slow but impenetrable.',
        specialty: 'Defense',
        tier: 3,
        price: 50000,

        baseCpu: 4,
        baseRam: 2048,
        baseBandwidth: 100,

        bonuses: {
            traceResist: 1.0,
            harvestYield: 1.0,
            breachSpeed: 1.0,
            firewallStrength: 1.5,  // +50% firewall strength
            disconnectSpeed: 1.0,
        },

        weaknesses: {
            bandwidth: 0.6,         // -40% bandwidth
        },

        slots: {
            core: 2,
            memory: 2,
            expansion: 3,
        },
    },

    MULE: {
        id: 'mule',
        name: 'Mule',
        description: 'Hauls the loot.',
        specialty: 'Storage',
        tier: 1,
        price: 15000,

        baseCpu: 2,
        baseRam: 512,
        baseBandwidth: 150,

        bonuses: {
            traceResist: 1.0,
            harvestYield: 1.0,
            breachSpeed: 1.0,
            firewallStrength: 1.0,
            disconnectSpeed: 1.0,
            inventorySlots: 2.0,    // +100% inventory slots
        },

        weaknesses: {
            cpuEfficiency: 0.7,     // -30% effective CPU
        },

        slots: {
            core: 1,
            memory: 2,
            expansion: 4,
        },
    },

    WRAITH: {
        id: 'wraith',
        name: 'Wraith',
        description: 'Vanishes without a trace.',
        specialty: 'Evasion',
        tier: 3,
        price: 45000,

        baseCpu: 4,
        baseRam: 384,
        baseBandwidth: 200,

        bonuses: {
            traceResist: 1.0,
            harvestYield: 1.0,
            breachSpeed: 1.0,
            firewallStrength: 1.0,
            disconnectSpeed: 1.25,  // +25% disconnect speed
            cleanDisconnect: true,  // No trace accumulation on disconnect
        },

        weaknesses: {
            ramEfficiency: 0.8,     // -20% effective RAM
        },

        slots: {
            core: 2,
            memory: 3,
            expansion: 2,
        },
    },

    HYDRA: {
        id: 'hydra',
        name: 'Hydra',
        description: 'Divide and conquer.',
        specialty: 'Multi-target',
        tier: 4,
        price: 100000,

        baseCpu: 8,
        baseRam: 1024,
        baseBandwidth: 300,

        bonuses: {
            traceResist: 1.0,
            harvestYield: 1.0,
            breachSpeed: 1.0,
            firewallStrength: 1.0,
            disconnectSpeed: 1.0,
            maxConnections: 2,      // Can connect to 2 nodes simultaneously
        },

        weaknesses: {
            singleTargetPower: 0.5, // -50% power when only 1 connection
        },

        slots: {
            core: 3,
            memory: 2,
            expansion: 2,
        },
    },

    BLACKSITE: {
        id: 'blacksite',
        name: 'Blacksite',
        description: 'Sees them before they see you.',
        specialty: 'Counterintel',
        tier: 3,
        price: 55000,

        baseCpu: 5,
        baseRam: 768,
        baseBandwidth: 175,

        bonuses: {
            traceResist: 1.0,
            harvestYield: 1.0,
            breachSpeed: 1.0,
            firewallStrength: 1.0,
            disconnectSpeed: 1.0,
            defenderDetection: 1.3, // +30% chance to detect active defenders
        },

        weaknesses: {
            offensePower: 0.8,      // -20% offensive power
        },

        slots: {
            core: 2,
            memory: 3,
            expansion: 2,
        },
    },

    // Starter rig - no bonuses, basic slots
    BURNER: {
        id: 'burner',
        name: 'Burner',
        description: 'Disposable. Untraceable. Expendable.',
        specialty: 'None',
        tier: 0,
        price: 0,

        baseCpu: 2,
        baseRam: 64,
        baseBandwidth: 50,

        bonuses: {
            traceResist: 1.0,
            harvestYield: 1.0,
            breachSpeed: 1.0,
            firewallStrength: 1.0,
            disconnectSpeed: 1.0,
        },

        weaknesses: {},

        slots: {
            core: 1,
            memory: 1,
            expansion: 1,
        },
    },
};

// Rig Modules - items that can be equipped into slots
export const RIG_MODULES = {
    // ========== CORE MODULES (Offense) ==========
    ICEBREAKER_MK1: {
        id: 'icebreaker_mk1',
        name: 'Icebreaker Mk.I',
        slotType: 'core',
        description: 'Basic firewall bypass tool.',
        stats: { breachPower: 100 },
        cpuCost: 1,
        ramCost: 32,
        price: 500,
    },
    ICEBREAKER_MK2: {
        id: 'icebreaker_mk2',
        name: 'Icebreaker Mk.II',
        slotType: 'core',
        description: 'Improved firewall bypass.',
        stats: { breachPower: 200 },
        cpuCost: 1,
        ramCost: 64,
        price: 1500,
    },
    ICEBREAKER_MK3: {
        id: 'icebreaker_mk3',
        name: 'Icebreaker Mk.III',
        slotType: 'core',
        description: 'Advanced firewall bypass.',
        stats: { breachPower: 350 },
        cpuCost: 2,
        ramCost: 128,
        price: 5000,
    },
    ICEBREAKER_MK4: {
        id: 'icebreaker_mk4',
        name: 'Icebreaker Mk.IV',
        slotType: 'core',
        description: 'Military-grade firewall bypass.',
        stats: { breachPower: 500 },
        cpuCost: 2,
        ramCost: 256,
        price: 15000,
    },
    EXPLOIT_KIT: {
        id: 'exploit_kit',
        name: 'Exploit Kit',
        slotType: 'core',
        description: '+25% breach speed vs unpatched systems.',
        stats: { breachSpeedBonus: 0.25 },
        cpuCost: 1,
        ramCost: 64,
        price: 2000,
    },
    BRUTE_FORCE_ARRAY: {
        id: 'brute_force_array',
        name: 'Brute Force Array',
        slotType: 'core',
        description: 'Guaranteed breach, but slow (-50% speed).',
        stats: { guaranteedBreach: true, breachSpeedPenalty: -0.5 },
        cpuCost: 3,
        ramCost: 256,
        price: 8000,
    },
    ZERO_DAY_INJECTOR: {
        id: 'zero_day_injector',
        name: 'Zero-Day Injector',
        slotType: 'core',
        description: 'Instant breach. Single use, then destroyed.',
        stats: { instantBreach: true, singleUse: true },
        cpuCost: 1,
        ramCost: 32,
        price: 25000,
    },

    // ========== MEMORY MODULES (Utility) ==========
    GHOST_PROTOCOL: {
        id: 'ghost_protocol',
        name: 'Ghost Protocol',
        slotType: 'memory',
        description: '-20% trace accumulation rate.',
        stats: { traceReduction: 0.2 },
        cpuCost: 1,
        ramCost: 64,
        price: 3000,
    },
    LOG_SHREDDER: {
        id: 'log_shredder',
        name: 'Log Shredder',
        slotType: 'memory',
        description: '+50% log cleaning speed.',
        stats: { cleanSpeedBonus: 0.5 },
        cpuCost: 1,
        ramCost: 32,
        price: 1500,
    },
    PACKET_SNIFFER: {
        id: 'packet_sniffer',
        name: 'Packet Sniffer',
        slotType: 'memory',
        description: 'Reveals hidden files and encrypted data.',
        stats: { revealHidden: true },
        cpuCost: 1,
        ramCost: 48,
        price: 2500,
    },
    PROXY_CHAIN: {
        id: 'proxy_chain',
        name: 'Proxy Chain',
        slotType: 'memory',
        description: '+15% trace resistance via bounced connections.',
        stats: { traceResistBonus: 0.15 },
        cpuCost: 1,
        ramCost: 64,
        price: 4000,
    },
    DECRYPTOR: {
        id: 'decryptor',
        name: 'Decryptor',
        slotType: 'memory',
        description: 'Bypass Scrambler ICE data corruption.',
        stats: { bypassScrambler: true },
        cpuCost: 1,
        ramCost: 96,
        price: 3500,
    },
    DATA_ANALYZER: {
        id: 'data_analyzer',
        name: 'Data Analyzer',
        slotType: 'memory',
        description: '+20% data value identification.',
        stats: { dataValueBonus: 0.2 },
        cpuCost: 1,
        ramCost: 48,
        price: 2000,
    },

    // ========== EXPANSION MODULES (Passive) ==========
    NEURAL_OVERCLOCK: {
        id: 'neural_overclock',
        name: 'Neural Overclock',
        slotType: 'expansion',
        description: '+1 effective CPU.',
        stats: { cpuBonus: 1 },
        cpuCost: 0,
        ramCost: 32,
        price: 5000,
    },
    RAM_EXPANSION: {
        id: 'ram_expansion',
        name: 'RAM Expansion',
        slotType: 'expansion',
        description: '+256 RAM.',
        stats: { ramBonus: 256 },
        cpuCost: 0,
        ramCost: 0,
        price: 2000,
    },
    BANDWIDTH_BOOSTER: {
        id: 'bandwidth_booster',
        name: 'Bandwidth Booster',
        slotType: 'expansion',
        description: '+50 bandwidth.',
        stats: { bandwidthBonus: 50 },
        cpuCost: 0,
        ramCost: 16,
        price: 1500,
    },
    SURGE_PROTECTOR: {
        id: 'surge_protector',
        name: 'Surge Protector',
        slotType: 'expansion',
        description: 'Survive one Black ICE hit.',
        stats: { blackIceShield: 1 },
        cpuCost: 0,
        ramCost: 32,
        price: 4000,
    },
    TRACE_DAMPENER: {
        id: 'trace_dampener',
        name: 'Trace Dampener',
        slotType: 'expansion',
        description: '+10% passive trace resistance.',
        stats: { traceResistBonus: 0.1 },
        cpuCost: 0,
        ramCost: 24,
        price: 3000,
    },
    STORAGE_BAY: {
        id: 'storage_bay',
        name: 'Storage Bay',
        slotType: 'expansion',
        description: '+5 inventory slots.',
        stats: { inventoryBonus: 5 },
        cpuCost: 0,
        ramCost: 0,
        price: 2500,
    },
    QUICK_DISCONNECT: {
        id: 'quick_disconnect',
        name: 'Quick Disconnect',
        slotType: 'expansion',
        description: '+30% disconnect speed.',
        stats: { disconnectSpeedBonus: 0.3 },
        cpuCost: 0,
        ramCost: 16,
        price: 3500,
    },
};

// Helper function to get a rig by ID
export function getRigById(rigId) {
    return Object.values(COMPUTER_CLASSES).find(rig => rig.id === rigId);
}

// Helper function to get a module by ID
export function getModuleById(moduleId) {
    return Object.values(RIG_MODULES).find(mod => mod.id === moduleId);
}

// Calculate effective stats for a rig with equipped modules
export function calculateEffectiveStats(rig, equippedModules = []) {
    const stats = {
        cpu: rig.baseCpu,
        ram: rig.baseRam,
        bandwidth: rig.baseBandwidth,
        traceResist: rig.bonuses.traceResist || 1.0,
        harvestYield: rig.bonuses.harvestYield || 1.0,
        breachSpeed: rig.bonuses.breachSpeed || 1.0,
        breachPower: 0,
        inventorySlots: 10, // Base inventory
    };

    // Apply rig weaknesses
    if (rig.weaknesses.cpuEfficiency) {
        stats.cpu = Math.floor(stats.cpu * rig.weaknesses.cpuEfficiency);
    }
    if (rig.weaknesses.ramEfficiency) {
        stats.ram = Math.floor(stats.ram * rig.weaknesses.ramEfficiency);
    }
    if (rig.weaknesses.bandwidth) {
        stats.bandwidth = Math.floor(stats.bandwidth * rig.weaknesses.bandwidth);
    }
    if (rig.weaknesses.traceResist) {
        stats.traceResist *= rig.weaknesses.traceResist;
    }
    if (rig.weaknesses.breachSpeed) {
        stats.breachSpeed *= rig.weaknesses.breachSpeed;
    }

    // Apply rig bonuses
    if (rig.bonuses.inventorySlots) {
        stats.inventorySlots = Math.floor(stats.inventorySlots * rig.bonuses.inventorySlots);
    }

    // Apply module bonuses
    for (const mod of equippedModules) {
        if (mod.stats.cpuBonus) stats.cpu += mod.stats.cpuBonus;
        if (mod.stats.ramBonus) stats.ram += mod.stats.ramBonus;
        if (mod.stats.bandwidthBonus) stats.bandwidth += mod.stats.bandwidthBonus;
        if (mod.stats.traceResistBonus) stats.traceResist += mod.stats.traceResistBonus;
        if (mod.stats.breachPower) stats.breachPower += mod.stats.breachPower;
        if (mod.stats.inventoryBonus) stats.inventorySlots += mod.stats.inventoryBonus;
    }

    return stats;
}

// Check if a module can be equipped to a rig
export function canEquipModule(rig, module, currentModules = []) {
    const slotType = module.slotType;
    const maxSlots = rig.slots[slotType] || 0;
    const usedSlots = currentModules.filter(m => m.slotType === slotType).length;

    return usedSlots < maxSlots;
}
