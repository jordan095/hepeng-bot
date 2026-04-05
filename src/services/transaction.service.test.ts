import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMonthlyReport } from './transaction.service.js';

// Mock dependencies
vi.mock('./google-sheets.service.js', () => ({
    getGoogleSheets: vi.fn()
}));

vi.mock('../utilities.js', () => ({
    log: vi.fn(),
    getNamaBulan: vi.fn((m) => {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return months[m - 1] || '';
    })
}));

// We also need to mock CONFIG to avoid importing undefined variables if it's strictly checked
vi.mock('../config/index.js', () => ({
    CONFIG: { SHEET_ID: 'mock-sheet-id' }
}));

import { getGoogleSheets } from './google-sheets.service.js';
import { log } from '../utilities.js';

describe('Transaction Service - getMonthlyReport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns correctly calculated report for a specific month with mixed rows', async () => {
        // Mock data
        const mockRows = [
            ['Tanggal', 'Tipe', 'Kategori', 'Sub Kategori', 'Item', 'Bulan', 'Tahun', 'Jumlah', 'Metode', 'Bukti', 'Keterangan'], // Header
            ['1 Januari 2025', 'Pemasukan', 'Gaji', '', 'Gaji Pokok', 'Januari', '2025', 'Rp 10.000.000', 'Transfer', '', ''],
            ['5 Januari 2025', 'Pengeluaran', 'Makanan', 'Makan Luar', 'Makan siang', 'Januari', '2025', 'Rp 50.000', 'Cash', '', ''],
            ['10 Januari 2025', 'Pengeluaran', 'Transportasi', 'Ojol', 'Gojek', 'Januari', '2025', 'Rp 20.000', 'Gopay', '', '']
        ];

        const mockGet = vi.fn().mockResolvedValue({ data: { values: mockRows } });
        (getGoogleSheets as any).mockResolvedValue({
            sheets: {
                spreadsheets: {
                    values: { get: mockGet }
                }
            }
        });

        const report = await getMonthlyReport(1, 2025);

        expect(mockGet).toHaveBeenCalledWith({
            spreadsheetId: 'mock-sheet-id',
            range: 'Transaksi!A:K'
        });

        expect(report).toEqual({
            bulan: 1,
            tahun: 2025,
            pemasukan: 10000000,
            pengeluaran: 70000,
            saldo: 9930000,
            pemasukanDetails: [
                { kategori: 'Gaji', subKategori: '', item: 'Gaji Pokok', jumlah: 10000000, metode: 'Transfer' }
            ],
            pengeluaranDetails: [
                { kategori: 'Makanan', subKategori: 'Makan Luar', item: 'Makan siang', jumlah: 50000, metode: 'Cash' },
                { kategori: 'Transportasi', subKategori: 'Ojol', item: 'Gojek', jumlah: 20000, metode: 'Gopay' }
            ]
        });
    });

    it('skips rows that do not match the requested month and year', async () => {
        const mockRows = [
            ['Tanggal', 'Tipe', 'Kategori', 'Sub Kategori', 'Item', 'Bulan', 'Tahun', 'Jumlah', 'Metode', 'Bukti', 'Keterangan'],
            ['1 Januari 2025', 'Pemasukan', 'Gaji', '', '', 'Januari', '2025', '1000000', '', '', ''],
            ['1 Februari 2025', 'Pemasukan', 'Bonus', '', '', 'Februari', '2025', '500000', '', '', ''],
            ['1 Januari 2024', 'Pemasukan', 'Gaji', '', '', 'Januari', '2024', '1000000', '', '', '']
        ];

        const mockGet = vi.fn().mockResolvedValue({ data: { values: mockRows } });
        (getGoogleSheets as any).mockResolvedValue({
            sheets: { spreadsheets: { values: { get: mockGet } } }
        });

        const report = await getMonthlyReport(1, 2025);

        expect(report.pemasukan).toBe(1000000);
        expect(report.pemasukanDetails).toHaveLength(1);
    });

    it('handles empty rows or zero amounts gracefully', async () => {
        const mockRows = [
            ['Tanggal', 'Tipe', 'Kategori', 'Sub Kategori', 'Item', 'Bulan', 'Tahun', 'Jumlah', 'Metode', 'Bukti', 'Keterangan'],
            ['1 Januari 2025', 'Pemasukan', 'Gaji', '', '', 'Januari', '2025', '0', '', '', ''],
            ['2 Januari 2025', 'Pengeluaran', 'Makan', '', '', 'Januari', '2025', '', '', '', '']
        ];

        const mockGet = vi.fn().mockResolvedValue({ data: { values: mockRows } });
        (getGoogleSheets as any).mockResolvedValue({
            sheets: { spreadsheets: { values: { get: mockGet } } }
        });

        const report = await getMonthlyReport(1, 2025);

        expect(report.pemasukan).toBe(0);
        expect(report.pengeluaran).toBe(0);
        expect(report.saldo).toBe(0);
        expect(report.pemasukanDetails).toHaveLength(0);
        expect(report.pengeluaranDetails).toHaveLength(0);
    });

    it('returns default zeroed object and logs error when Google Sheets API fails', async () => {
        const errorMessage = 'API Error';
        (getGoogleSheets as any).mockRejectedValue(new Error(errorMessage));

        const report = await getMonthlyReport(1, 2025);

        expect(report).toEqual({
            bulan: 1,
            tahun: 2025,
            pemasukan: 0,
            pengeluaran: 0,
            saldo: 0,
            pemasukanDetails: [],
            pengeluaranDetails: []
        });

        expect(log).toHaveBeenCalledWith(`❌ Error fetching monthly report: ${errorMessage}`, 'error');
    });

    it('returns default zeroed object when resp.data.values is empty', async () => {
        const mockGet = vi.fn().mockResolvedValue({ data: {} });
        (getGoogleSheets as any).mockResolvedValue({
            sheets: { spreadsheets: { values: { get: mockGet } } }
        });

        const report = await getMonthlyReport(1, 2025);

        expect(report.pemasukan).toBe(0);
        expect(report.pengeluaran).toBe(0);
    });
});
