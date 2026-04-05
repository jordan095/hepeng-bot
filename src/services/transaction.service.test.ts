import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMonthlyReport, addTransaction, getYearlyReport } from './transaction.service.js';
import { getGoogleSheets } from './google-sheets.service.js';
import { log } from '../utilities.js';
import type { TransactionEntry } from '../types/index.js';

// Mock dependencies
vi.mock('./google-sheets.service.js', () => ({
    getGoogleSheets: vi.fn()
}));

vi.mock('../utilities.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../utilities.js')>();
    return {
        ...actual,
        log: vi.fn(),
        getNamaBulan: vi.fn((m) => {
            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            return months[m - 1] || '';
        })
    };
});

vi.mock('../config/index.js', () => ({
    CONFIG: { SHEET_ID: 'mock-sheet-id' }
}));

describe('Transaction Service', () => {

    describe('getMonthlyReport', () => {
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
                spreadsheetId: 'mock-sheet-id',
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

    describe('getYearlyReport', () => {
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
                spreadsheetId: 'mock-sheet-id',
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
});
