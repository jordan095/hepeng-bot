// src/parsers/income.parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseIncome } from './income.parser.js';

describe('parseIncome', () => {
    it('parses basic + format', () => {
        const result = parseIncome('+ 20jt Main Job Monthly Salary');
        expect(result).not.toBeNull();
        expect(result!.jumlah).toBe(20_000_000);
        expect(result!.kategori).toBe('Main Job');
        expect(result!.subKategori).toBe('Monthly Salary');
    });

    it('parses masuk format', () => {
        const result = parseIncome('masuk 20jt Main Job Monthly Salary');
        expect(result).not.toBeNull();
        expect(result!.jumlah).toBe(20_000_000);
    });

    it('parses pemasukan format', () => {
        const result = parseIncome('pemasukan 20jt Main Job Monthly Salary');
        expect(result).not.toBeNull();
        expect(result!.jumlah).toBe(20_000_000);
    });

    it('parses with bca metode', () => {
        const result = parseIncome('+ 20jt Main Job Monthly Salary bca');
        expect(result).not.toBeNull();
        expect(result!.metode).toBe('BCA');
        expect(result!.jumlah).toBe(20_000_000);
    });

    it('parses with full number', () => {
        const result = parseIncome('masuk 20.450.000 Main Job Monthly Salary bca');
        expect(result).not.toBeNull();
        expect(result!.jumlah).toBe(20_450_000);
    });

    it('parses THR', () => {
        const result = parseIncome('+ 500rb Main Job THR');
        expect(result).not.toBeNull();
        expect(result!.jumlah).toBe(500_000);
        expect(result!.subKategori).toBe('THR');
    });

    it('parses with date prefix', () => {
        const result = parseIncome('31 jan masuk 20.450.000 Main Job Monthly Salary');
        expect(result).not.toBeNull();
        expect(result!.tanggal).toBe(31);
        expect(result!.bulan).toBe(1);
    });

    it('returns null for unrecognized format', () => {
        const result = parseIncome('rekap');
        expect(result).toBeNull();
    });
});
