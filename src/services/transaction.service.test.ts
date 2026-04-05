import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addTransaction } from './transaction.service.js';
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
