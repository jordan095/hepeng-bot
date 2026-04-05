import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UndoHandler } from './undo.handler.js';
import { deleteLastTransaction } from '../services/index.js';
import type { MessageContext, TransactionEntry } from '../types/index.js';

vi.mock('../services/index.js', () => ({
    deleteLastTransaction: vi.fn(),
}));

describe('UndoHandler', () => {
    let handler: UndoHandler;
    let mockContext: MessageContext;
    let mockSendMessage: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        handler = new UndoHandler();
        mockSendMessage = vi.fn();
        mockContext = {
            sock: {
                sendMessage: mockSendMessage,
            } as any,
            msg: {} as any,
            from: '123456789@s.whatsapp.net',
            sender: 'user',
            text: 'undo',
            userRole: 'Owner',
        };
        vi.clearAllMocks();
    });

    describe('canHandle', () => {
        it('returns true for "batal"', () => {
            expect(handler.canHandle('batal')).toBe(true);
        });

        it('returns true for "undo"', () => {
            expect(handler.canHandle('undo')).toBe(true);
        });

        it('handles uppercase and spacing', () => {
            expect(handler.canHandle('  BATAL  ')).toBe(true);
            expect(handler.canHandle('Undo')).toBe(true);
        });

        it('returns false for unknown commands', () => {
            expect(handler.canHandle('delete')).toBe(false);
            expect(handler.canHandle('batalin')).toBe(false);
        });
    });

    describe('handle', () => {
        it('blocks non-owner users', async () => {
            mockContext.userRole = 'Viewer';
            const result = await handler.handle(mockContext);

            expect(result).toBe(true);
            expect(mockSendMessage).toHaveBeenCalledWith(mockContext.from, {
                text: '⛔ Hanya owner yang bisa membatalkan transaksi.'
            });
            expect(deleteLastTransaction).not.toHaveBeenCalled();
        });

        it('handles successful deletion', async () => {
            const mockEntry: TransactionEntry = {
                type: 'Pengeluaran',
                kategori: 'Makan',
                subKategori: 'Siang',
                jumlah: 50000,
                tanggal: 1,
                bulan: 1,
                tahun: 2024,
                item: '',
                metode: 'Cash'
            };

            vi.mocked(deleteLastTransaction).mockResolvedValueOnce({
                success: true,
                entry: mockEntry
            });

            const result = await handler.handle(mockContext);

            expect(result).toBe(true);
            expect(deleteLastTransaction).toHaveBeenCalled();
            expect(mockSendMessage).toHaveBeenCalledWith(mockContext.from, expect.objectContaining({
                text: expect.stringContaining('Entri terakhir dihapus!')
            }));
            expect(mockSendMessage).toHaveBeenCalledWith(mockContext.from, expect.objectContaining({
                text: expect.stringContaining('50.000')
            }));
            expect(mockSendMessage).toHaveBeenCalledWith(mockContext.from, expect.objectContaining({
                text: expect.stringContaining('Januari')
            }));
        });

        it('handles when no transaction can be deleted', async () => {
            vi.mocked(deleteLastTransaction).mockResolvedValueOnce({
                success: false
            });

            const result = await handler.handle(mockContext);

            expect(result).toBe(true);
            expect(deleteLastTransaction).toHaveBeenCalled();
            expect(mockSendMessage).toHaveBeenCalledWith(mockContext.from, {
                text: '❌ Tidak ada transaksi yang bisa dibatalkan.'
            });
        });

        it('returns false when an error occurs', async () => {
            vi.mocked(deleteLastTransaction).mockRejectedValueOnce(new Error('Test error'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await handler.handle(mockContext);

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error in UndoHandler: Error: Test error'));

            consoleSpy.mockRestore();
        });
    });
});