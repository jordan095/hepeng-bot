import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseAmount, parseDateFromText, extractCategory, extractMetode } from './shared.parser.js';
import * as utilities from '../utils/index.js';

describe('extractMetode', () => {
    it('returns empty string if no payment method is found', () => {
        const result = extractMetode('makan siang');
        expect(result).toEqual({ metode: '', cleanText: 'makan siang' });
    });

    it('extracts payment method exactly at the end of the text', () => {
        const result = extractMetode('makan siang bca');
        expect(result).toEqual({ metode: 'BCA', cleanText: 'makan siang' });
    });

    it('longer method names take precedence', () => {
        const result = extractMetode('belanja cc visa bca');
        expect(result).toEqual({ metode: 'CC VISA BCA', cleanText: 'belanja' });
    });

    it('is case-insensitive', () => {
        const result = extractMetode('beli pulsa ManDiri');
        expect(result).toEqual({ metode: 'Mandiri', cleanText: 'beli pulsa' });
    });

    it('does not extract keyword if it is placed in the middle or beginning of the string', () => {
        const result = extractMetode('bca transfer ke teman');
        expect(result).toEqual({ metode: '', cleanText: 'bca transfer ke teman' });

        const result2 = extractMetode('bayar cash ke abang');
        expect(result2).toEqual({ metode: '', cleanText: 'bayar cash ke abang' });
    });
});

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
