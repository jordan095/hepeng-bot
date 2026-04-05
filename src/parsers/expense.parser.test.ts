// src/parsers/expense.parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseExpense } from './expense.parser.js';

describe('parseExpense', () => {
    it('parses basic - format', () => {
        const result = parseExpense('- 50rb Makanan Luar The Grace');
        expect(result).not.toBeNull();
        expect(result!.jumlah).toBe(50_000);
        expect(result!.kategori).toBe('Makanan');
        expect(result!.subKategori).toBe('Luar');
        expect(result!.item).toBe('The Grace');
    });

    it('parses keluar format', () => {
        const result = parseExpense('keluar 400rb Transportasi Ojol Transport CC');
        expect(result).not.toBeNull();
        expect(result!.jumlah).toBe(400_000);
        expect(result!.kategori).toBe('Transportasi');
        expect(result!.subKategori).toBe('Ojol');
    });

    it('parses pengeluaran format', () => {
        const result = parseExpense('pengeluaran 400rb Transportasi Ojol Transport CC');
        expect(result).not.toBeNull();
        expect(result!.jumlah).toBe(400_000);
        expect(result!.kategori).toBe('Transportasi');
        expect(result!.subKategori).toBe('Ojol');
    });

    it('parses juta amount', () => {
        const result = parseExpense('- 1.5jt Perlengkapan Fashion Baju Lebaran');
        expect(result).not.toBeNull();
        expect(result!.jumlah).toBe(1_500_000);
        expect(result!.kategori).toBe('Perlengkapan');
        expect(result!.subKategori).toBe('Fashion');
    });

    it('parses with metode at end', () => {
        const result = parseExpense('- 880rb Medical Rawat Jalan Dokter mandiri');
        expect(result).not.toBeNull();
        expect(result!.jumlah).toBe(880_000);
        expect(result!.metode).toBe('Mandiri');
        expect(result!.kategori).toBe('Medical');
        expect(result!.subKategori).toBe('Rawat Jalan');
    });

    it('parses with date prefix', () => {
        const result = parseExpense('29 mar keluar 400rb Transportasi Ojol Maxim');
        expect(result).not.toBeNull();
        expect(result!.tanggal).toBe(29);
        expect(result!.bulan).toBe(3);
        expect(result!.jumlah).toBe(400_000);
    });

    it('parses whole number amount', () => {
        const result = parseExpense('- 1.515.494 Makanan Luar Food CC');
        expect(result).not.toBeNull();
        expect(result!.jumlah).toBe(1_515_494);
    });

    it('returns null for unrecognized format', () => {
        const result = parseExpense('laporan maret');
        expect(result).toBeNull();
    });

    it('parses CC VISA BCA metode', () => {
        const result = parseExpense('- 125rb Administrasi Kartu Kredit Tahunan CC cc visa bca');
        expect(result).not.toBeNull();
        expect(result!.metode).toBe('CC VISA BCA');
    });
});
