import { describe, it, expect } from 'vitest';
import { parseAmount } from './shared.parser.js';

describe('parseAmount', () => {
    it('parses basic numbers without suffix', () => {
        expect(parseAmount('50000')).toEqual({ amount: 50_000, rawLength: 5 });
        expect(parseAmount('1500000')).toEqual({ amount: 1_500_000, rawLength: 7 });
    });

    it('parses numbers with thousand separators (dots)', () => {
        expect(parseAmount('50.000')).toEqual({ amount: 50_000, rawLength: 6 });
        expect(parseAmount('1.500.000')).toEqual({ amount: 1_500_000, rawLength: 9 });
    });

    it('parses numbers with rb, ribu, k suffixes', () => {
        expect(parseAmount('50rb')).toEqual({ amount: 50_000, rawLength: 4 });
        expect(parseAmount('50ribu')).toEqual({ amount: 50_000, rawLength: 6 });
        expect(parseAmount('50k')).toEqual({ amount: 50_000, rawLength: 3 });

        // Decimals with suffixes
        expect(parseAmount('50.5rb')).toEqual({ amount: 50_500, rawLength: 6 });
        expect(parseAmount('50,5rb')).toEqual({ amount: 50_500, rawLength: 6 });
        expect(parseAmount('50.5k')).toEqual({ amount: 50_500, rawLength: 5 });
    });

    it('parses numbers with jt, juta suffixes', () => {
        expect(parseAmount('1.5jt')).toEqual({ amount: 1_500_000, rawLength: 5 });
        expect(parseAmount('1,5jt')).toEqual({ amount: 1_500_000, rawLength: 5 });
        expect(parseAmount('1.5juta')).toEqual({ amount: 1_500_000, rawLength: 7 });
        expect(parseAmount('15jt')).toEqual({ amount: 15_000_000, rawLength: 4 });
    });

    it('parses case insensitively', () => {
        expect(parseAmount('50RB')).toEqual({ amount: 50_000, rawLength: 4 });
        expect(parseAmount('1.5JT')).toEqual({ amount: 1_500_000, rawLength: 5 });
        expect(parseAmount('50K')).toEqual({ amount: 50_000, rawLength: 3 });
    });

    it('returns null for invalid or missing amount formats', () => {
        expect(parseAmount('abc')).toBeNull();
        expect(parseAmount('rb')).toBeNull(); // Missing number
        expect(parseAmount('jt')).toBeNull();
        expect(parseAmount('   ')).toBeNull();
    });

    it('extracts from text that has more characters after the amount', () => {
        expect(parseAmount('50rb makanan')).toEqual({ amount: 50_000, rawLength: 4 });
        expect(parseAmount('1.5jt gaji bulanan')).toEqual({ amount: 1_500_000, rawLength: 5 });
    });
});
