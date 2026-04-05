import { describe, it, expect } from 'vitest';
import { sanitizeSheetCell } from './utilities.js';

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
