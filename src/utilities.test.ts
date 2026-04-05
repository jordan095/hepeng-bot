import { describe, it, expect } from 'vitest';
import { formatRupiah } from './utilities.js';

describe('formatRupiah', () => {
    it('formats positive numbers correctly', () => {
        // Intl.NumberFormat uses a non-breaking space (char code 160) between the currency symbol and the number.
        // We replace it with a regular space to make the test simpler to read and maintain.
        expect(formatRupiah(1000).replace(/\s/g, ' ')).toBe('Rp 1.000');
    });

    it('formats zero correctly', () => {
        expect(formatRupiah(0).replace(/\s/g, ' ')).toBe('Rp 0');
    });

    it('formats negative numbers correctly', () => {
        expect(formatRupiah(-500).replace(/\s/g, ' ')).toBe('-Rp 500');
    });

    it('formats large numbers correctly', () => {
        expect(formatRupiah(1500000).replace(/\s/g, ' ')).toBe('Rp 1.500.000');
    });
});
