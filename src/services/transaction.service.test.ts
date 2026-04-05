import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getYearlyReport } from './transaction.service.js';
import * as googleSheetsService from './google-sheets.service.js';

// Mock config
vi.mock('../config/index.js', () => ({
    CONFIG: {
        SHEET_ID: 'test-sheet-id'
    }
}));

// Mock google sheets service
vi.mock('./google-sheets.service.js', () => ({
    getGoogleSheets: vi.fn()
}));

// Mock utilities
vi.mock('../utilities.js', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        log: vi.fn() // suppress logs during testing
    };
});

describe('transaction.service - getYearlyReport', () => {
    let getMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        getMock = vi.fn();

        vi.mocked(googleSheetsService.getGoogleSheets).mockResolvedValue({
            sheets: {
                spreadsheets: {
                    values: {
                        get: getMock
                    }
                }
            }
        } as any);
    });

    it('returns empty report if no rows', async () => {
        getMock.mockResolvedValue({ data: { values: [] } });

        const result = await getYearlyReport(2025);

        expect(result.tahun).toBe(2025);
        expect(result.totalPemasukan).toBe(0);
        expect(result.totalPengeluaran).toBe(0);
        expect(result.totalSaldo).toBe(0);
        expect(result.months.length).toBe(12);
        expect(result.months[0].bulan).toBe(1);
    });

    it('calculates yearly report correctly with multiple months and ignores other years', async () => {
        const mockRows = [
            ['Tanggal', 'Tipe', 'Kategori', 'Sub Kategori', 'Item', 'Bulan', 'Tahun', 'Jumlah', 'Metode', 'Bukti', 'Keterangan'],
            // Jan 2025 Pemasukan 1000
            ['1 Januari 2025', 'Pemasukan', 'Gaji', '', '', 'Januari', '2025', '1.000', 'BCA', '', ''],
            // Jan 2025 Pengeluaran 300
            ['15 Januari 2025', 'Pengeluaran', 'Makan', '', '', 'Januari', '2025', '300', 'Cash', '', ''],
            // Feb 2025 Pemasukan 2000
            ['1 Februari 2025', 'Pemasukan', 'Gaji', '', '', 'Februari', '2025', '2.000', 'BCA', '', ''],
            // Feb 2025 Pengeluaran 500
            ['15 Februari 2025', 'Pengeluaran', 'Makan', '', '', 'Februari', '2025', '500', 'Cash', '', ''],
            // Jan 2024 (Should be ignored)
            ['1 Januari 2024', 'Pemasukan', 'Gaji', '', '', 'Januari', '2024', '5.000', 'BCA', '', ''],
            // Invalid row
            null,
            []
        ];

        getMock.mockResolvedValue({ data: { values: mockRows } });

        const result = await getYearlyReport(2025);

        expect(result.tahun).toBe(2025);
        expect(result.totalPemasukan).toBe(3000);
        expect(result.totalPengeluaran).toBe(800);
        expect(result.totalSaldo).toBe(2200);

        // Check January
        const jan = result.months.find(m => m.bulan === 1);
        expect(jan?.pemasukan).toBe(1000);
        expect(jan?.pengeluaran).toBe(300);

        // Check February
        const feb = result.months.find(m => m.bulan === 2);
        expect(feb?.pemasukan).toBe(2000);
        expect(feb?.pengeluaran).toBe(500);

        // Check March (empty)
        const mar = result.months.find(m => m.bulan === 3);
        expect(mar?.pemasukan).toBe(0);
        expect(mar?.pengeluaran).toBe(0);

        // Verify API was called with correct parameters
        expect(getMock).toHaveBeenCalledWith({
            spreadsheetId: 'test-sheet-id',
            range: 'Transaksi!A:K'
        });
    });

    it('handles API errors gracefully', async () => {
        getMock.mockRejectedValue(new Error('API Error'));

        const result = await getYearlyReport(2025);

        expect(result.tahun).toBe(2025);
        expect(result.totalPemasukan).toBe(0);
        expect(result.totalPengeluaran).toBe(0);
        expect(result.totalSaldo).toBe(0);
        expect(result.months).toEqual([]);
    });
});
