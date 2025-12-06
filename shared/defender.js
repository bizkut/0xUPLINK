/**
 * Defender Counter-Play System
 * Allows network owners to actively respond to intrusions
 */

import { COUNTER_PROGRAMS, INTRUSION_CONFIG } from './constants.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new intrusion record when someone connects to a network
 */
export function createIntrusion(networkId, attackerId, attackerIp) {
    return {
        id: uuidv4(),
        networkId,
        attackerId,
        attackerIp,
        attackerNode: 'gateway', // Start at gateway
        startTime: Date.now(),
        traceProgress: 0,
        detected: false,
        detectedAt: null,
        counterMeasures: [], // Active counter-programs
        status: 'active', // active, escaped, traced, lockdown
    };
}

/**
 * Checks if an intrusion should trigger an alert
 */
export function shouldAlertOwner(intrusion) {
    if (intrusion.detected) return false;
    const elapsed = Date.now() - intrusion.startTime;
    return elapsed >= INTRUSION_CONFIG.alertDelay;
}

/**
 * Marks intrusion as detected and records time
 */
export function markDetected(intrusion) {
    intrusion.detected = true;
    intrusion.detectedAt = Date.now();
    return intrusion;
}

/**
 * Updates attacker's current node
 */
export function updateAttackerNode(intrusion, nodeId) {
    intrusion.attackerNode = nodeId;
    return intrusion;
}

/**
 * Applies a counter-program to an intrusion
 */
export function applyCounterProgram(intrusion, programId, defenderId) {
    const program = COUNTER_PROGRAMS[programId.toUpperCase()];
    if (!program) return { error: 'Unknown counter-program.' };

    // Check if already active
    const existing = intrusion.counterMeasures.find(
        cm => cm.programId === programId && cm.status === 'active'
    );
    if (existing) {
        return { error: `${program.name} is already active on this intrusion.` };
    }

    const counterMeasure = {
        id: uuidv4(),
        programId: program.id,
        programName: program.name,
        defenderId,
        startTime: Date.now(),
        duration: program.duration,
        status: 'active', // active, completed, cancelled
        effect: program.effect,
    };

    intrusion.counterMeasures.push(counterMeasure);

    return {
        success: true,
        counterMeasure,
        program,
    };
}

/**
 * Check if a counter-measure has completed
 */
export function isCounterMeasureComplete(counterMeasure) {
    const elapsed = Date.now() - counterMeasure.startTime;
    return elapsed >= counterMeasure.duration;
}

/**
 * Process completed counter-measures and return effects
 */
export function processCounterMeasures(intrusion) {
    const effects = [];

    for (const cm of intrusion.counterMeasures) {
        if (cm.status === 'active' && isCounterMeasureComplete(cm)) {
            cm.status = 'completed';

            switch (cm.effect) {
                case 'reveal_attacker':
                    effects.push({
                        type: 'backtrace_complete',
                        attackerIp: intrusion.attackerIp,
                        attackerId: intrusion.attackerId,
                    });
                    break;

                case 'damage_hardware':
                    effects.push({
                        type: 'counter_ice_hit',
                        attackerId: intrusion.attackerId,
                        damage: COUNTER_PROGRAMS.COUNTER_ICE.damage,
                    });
                    break;

                case 'disconnect_all':
                    effects.push({
                        type: 'lockdown_triggered',
                        networkId: intrusion.networkId,
                        lockDuration: COUNTER_PROGRAMS.LOCKDOWN.lockDuration,
                    });
                    intrusion.status = 'lockdown';
                    break;

                case 'destroy_files':
                    effects.push({
                        type: 'files_wiped',
                        networkId: intrusion.networkId,
                    });
                    break;
            }
        }
    }

    return effects;
}

/**
 * Gets intrusion info for display
 */
export function getIntrusionInfo(intrusion) {
    return {
        id: intrusion.id,
        networkId: intrusion.networkId,
        attackerNode: intrusion.attackerNode,
        traceProgress: intrusion.traceProgress,
        duration: Math.floor((Date.now() - intrusion.startTime) / 1000),
        status: intrusion.status,
        counterMeasures: intrusion.counterMeasures.map(cm => ({
            name: cm.programName,
            status: cm.status,
            remainingTime: cm.status === 'active'
                ? Math.max(0, cm.duration - (Date.now() - cm.startTime))
                : 0,
        })),
    };
}
