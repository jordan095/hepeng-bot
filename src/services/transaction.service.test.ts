import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addTransaction, getYearlyReport } from './transaction.service.js';
import { getGoogleSheets } from './google-sheets.service.js';
import { log } from '../utilities.js';
import { CONFIG } from '../config/index.js';
import type { TransactionEntry } from '../types/index.js';

// Mock dependencies
vi.mock('./google-sheets.service.js', () => ({
    getGoogleSheets: vi.fn(),
}));

vi.mock('../utilities.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../utilities.js')>();
    return {
        ...actual,
        log: vi.fn(),
    };
});

vi.mock('../config/index.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../config/index.js')>();
    return {
        ...actual,
        CONFIG: {
            ...actual.CONFIG,
            SHEET_ID: 'test-sheet-id'
        }
    };
});

describe('addTransaction', () => {
    const mockEntry: TransactionEntry = {
        tanggal: 15,
        bulan: 5,
        tahun: 2024,
        type: 'Pengeluaran',
        kategori: 'Makanan',
        subKategori: 'Luar',
        item: 'Makan siang',
        jumlah: 50000,
        metode: 'QRIS',
        bukti: '',
        keterangan: 'Enak',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should append a new row and return true on success', async () => {
        const mockAppend = vi.fn().mockResolvedValue({ status: 200 });
        const mockSheets = {
            spreadsheets: {
                values: {
                    append: mockAppend,
                },
            },
        };
        vi.mocked(getGoogleSheets).mockResolvedValue({ sheets: mockSheets as any });

        const result = await addTransaction(mockEntry);

        expect(result).toBe(true);
        expect(getGoogleSheets).toHaveBeenCalled();
        expect(mockAppend).toHaveBeenCalledWith({
            spreadsheetId: CONFIG.SHEET_ID,
            range: 'Transaksi!A:K',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    [
                        '15 Mei 2024',
                        'Pengeluaran',
                        'Makanan',
                        'Luar',
                        'Makan siang',
                        'Mei',
                        '2024',
                        '50000',
                        'QRIS',
                        '',
                        'Enak',
                    ],
                ],
            },
        });
        expect(log).toHaveBeenCalledWith('✅ Berhasil menyimpan Pengeluaran: Makanan 50000', 'success');
    });

    it('should catch errors, log them, and return false on failure', async () => {
        const mockError = new Error('Google Sheets API is down');
        const mockAppend = vi.fn().mockRejectedValue(mockError);
        const mockSheets = {
            spreadsheets: {
                values: {
                    append: mockAppend,
                },
            },
        };
        vi.mocked(getGoogleSheets).mockResolvedValue({ sheets: mockSheets as any });

        const result = await addTransaction(mockEntry);

        expect(result).toBe(false);
        expect(getGoogleSheets).toHaveBeenCalled();
        expect(mockAppend).toHaveBeenCalled();
        expect(log).toHaveBeenCalledWith('❌ Gagal menyimpan transaksi: Google Sheets API is down', 'error');
    });
});

describe('transaction.service - getYearlyReport', () => {
    let getMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        getMock = vi.fn();

        vi.mocked(getGoogleSheets).mockResolvedValue({
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
        expect(result.months[0]?.bulan).toBe(1);
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
