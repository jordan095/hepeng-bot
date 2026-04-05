import { performance } from 'node:perf_hooks';
import { BULAN_MAP } from './src/config/constants.js';

const rest = "laporan maret 2025";
const iter = 1_000_000;

// Current approach
const start1 = performance.now();
for (let i = 0; i < iter; i++) {
    const mName = Object.keys(BULAN_MAP).find(name => rest.includes(name));
}
const end1 = performance.now();
console.log(`Current approach: ${(end1 - start1).toFixed(2)} ms`);

// Optimized approach
const BULAN_KEYS = Object.keys(BULAN_MAP);
const start2 = performance.now();
for (let i = 0; i < iter; i++) {
    const mName = BULAN_KEYS.find(name => rest.includes(name));
}
const end2 = performance.now();
console.log(`Optimized approach: ${(end2 - start2).toFixed(2)} ms`);
