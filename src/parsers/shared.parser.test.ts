import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseDateFromText, extractCategory } from './shared.parser.js';
import * as utilities from '../utilities.js';

describe('parseDateFromText', () => {
    beforeEach(() => {
        vi.spyOn(utilities, 'getJakartaTime').mockReturnValue({
            tanggal: 15,
            bulan: 5,
            tahun: 2024,
            jam: 12
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns default date when text contains no date info', () => {
        const result = parseDateFromText('some random text');
        expect(result).toEqual({ tanggal: 15, bulan: 5, tahun: 2024 });
    });

    it('parses full date (day, month, year)', () => {
        const result = parseDateFromText('29 mar 2025 expense 50rb');
        expect(result).toEqual({ tanggal: 29, bulan: 3, tahun: 2025 });
    });

    it('parses day and month, keeping default year', () => {
        const result = parseDateFromText('12 jan income 1jt');
        expect(result).toEqual({ tanggal: 12, bulan: 1, tahun: 2024 });
    });

    it('parses correctly with upper/mixed case text', () => {
        const result = parseDateFromText('15 FEB 2026 OUT');
        expect(result).toEqual({ tanggal: 15, bulan: 2, tahun: 2026 });
    });

    it('does not update day if day is out of bounds', () => {
        const result = parseDateFromText('32 mar 2025');
        // Match day doesn't meet 1..31 condition
        expect(result).toEqual({ tanggal: 15, bulan: 3, tahun: 2025 });
    });

    it('does not update year if year format is invalid', () => {
        const result = parseDateFromText('15 mar 9999');
        // 9999 doesn't match 20\d{2}
        expect(result).toEqual({ tanggal: 15, bulan: 3, tahun: 2024 });
    });

    it('handles text with multiple numbers gracefully', () => {
        // Will pick the first valid year and day
        // regex logic: /\b(20\d{2})\b/.exec(text) for year
        // regex logic: /\b(\d{1,2})\b/.exec(text) for day
        const result = parseDateFromText('2023 25 jan 10');
        expect(result.tahun).toBe(2023); // First matching year
        expect(result.bulan).toBe(1); // jan
        // first matching 1-2 digits is "25" (since 2023 is not \b\d{1,2}\b)
        expect(result.tanggal).toBe(25);
    });
});

describe('extractCategory', () => {
    it('matches exact category case-insensitive and returns remainder', () => {
        const text = 'MAKANAN luar the grace';
        const knownCategories = ['Makanan', 'Minuman'];
        const result = extractCategory(text, knownCategories);
        expect(result).toEqual({
            category: 'Makanan',
            remainder: 'luar the grace'
        });
    });

    it('matches the longest category when multiple match', () => {
        const text = 'Makanan Luar warteg';
        const knownCategories = ['Makanan', 'Makanan Luar'];
        const result = extractCategory(text, knownCategories);
        expect(result).toEqual({
            category: 'Makanan Luar',
            remainder: 'warteg'
        });
    });

    it('returns null when there is no match', () => {
        const text = 'Transportasi ojol';
        const knownCategories = ['Makanan', 'Minuman'];
        const result = extractCategory(text, knownCategories);
        expect(result).toBeNull();
    });

    it('returns null for empty text', () => {
        const text = '';
        const knownCategories = ['Makanan', 'Minuman'];
        const result = extractCategory(text, knownCategories);
        expect(result).toBeNull();
    });

    it('returns null for empty categories list', () => {
        const text = 'Makanan luar';
        const knownCategories: string[] = [];
        const result = extractCategory(text, knownCategories);
        expect(result).toBeNull();
    });

    it('slices remainder correctly even without space', () => {
        const text = 'MakananLuar';
        const knownCategories = ['Makanan'];
        const result = extractCategory(text, knownCategories);
        expect(result).toEqual({
            category: 'Makanan',
            remainder: 'Luar'
        });
    });
});
