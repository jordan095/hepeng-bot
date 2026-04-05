import { describe, it, expect } from 'vitest';
import { sanitizeSheetCell, formatRupiah } from './index.js';

describe('sanitizeSheetCell', () => {
    it('should prepend single quote to strings starting with =', () => {
        expect(sanitizeSheetCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
        expect(sanitizeSheetCell('=1+1')).toBe("'=1+1");
    });

    it('should prepend single quote to strings starting with +', () => {
        expect(sanitizeSheetCell('+100')).toBe("'+100");
    });

    it('should prepend single quote to strings starting with -', () => {
        expect(sanitizeSheetCell('-100')).toBe("'-100");
    });

    it('should prepend single quote to strings starting with @', () => {
        expect(sanitizeSheetCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
    });

    it('should not modify safe strings', () => {
        expect(sanitizeSheetCell('Hello World')).toBe('Hello World');
        expect(sanitizeSheetCell('100')).toBe('100');
        expect(sanitizeSheetCell('Pemasukan')).toBe('Pemasukan');
        expect(sanitizeSheetCell('a=b')).toBe('a=b');
    });

    it('should handle numbers correctly by converting to string', () => {
        expect(sanitizeSheetCell(100)).toBe('100');
        expect(sanitizeSheetCell(-100)).toBe("'-100");
    });
});

describe('formatRupiah', () => {
    it('formats positive numbers correctly', () => {
        // Intl.NumberFormat uses a non-breaking space (char code 160) between the currency symbol and the number.
        // We replace it with a regular space to make the test simpler to read and maintain.
        expect(formatRupiah(1000).replaceAll(/\s/g, ' ')).toBe('Rp 1.000');
    });

    it('formats zero correctly', () => {
        expect(formatRupiah(0).replaceAll(/\s/g, ' ')).toBe('Rp 0');
    });

    it('formats negative numbers correctly', () => {
        expect(formatRupiah(-500).replaceAll(/\s/g, ' ')).toBe('-Rp 500');
    });

    it('formats large numbers correctly', () => {
        expect(formatRupiah(1500000).replaceAll(/\s/g, ' ')).toBe('Rp 1.500.000');
    });
});
