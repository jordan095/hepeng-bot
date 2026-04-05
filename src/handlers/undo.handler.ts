// src/handlers/undo.handler.ts - Undo last transaction

import type { MessageContext, CommandHandler, TransactionEntry } from '../types/index.js';
import { deleteLastTransaction } from '../services/index.js';
import { formatRupiah, getNamaBulan } from '../utils/index.js';

// In-memory store for last entry (for display in undo confirmation)
let lastEntry: TransactionEntry | null = null;

export function setLastEntry(entry: TransactionEntry): void {
    lastEntry = entry;
}

export function getLastEntry(): TransactionEntry | null {
    return lastEntry;
}

export class UndoHandler implements CommandHandler {
    canHandle(text: string): boolean {
        const lower = text.toLowerCase().trim();
        return lower === 'batal' || lower === 'undo';
    }

    async handle(context: MessageContext): Promise<boolean> {
        try {
            if (context.userRole !== 'Owner') {
                await context.sock.sendMessage(context.from, {
                    text: '⛔ Hanya owner yang bisa membatalkan transaksi.'
                });
                return true;
            }

            const result = await deleteLastTransaction();

            if (result.success && result.entry) {
                lastEntry = null;
                await context.sock.sendMessage(context.from, {
                    text: this.buildSuccessMessage(result.entry)
                });
            } else {
                await context.sock.sendMessage(context.from, {
                    text: '❌ Tidak ada transaksi yang bisa dibatalkan.'
                });
            }

            return true;
        } catch (error) {
            console.error(`Error in UndoHandler: ${error}`);
            return false;
        }
    }

    private buildSuccessMessage(entry: TransactionEntry): string {
        return `🗑️ *Entri terakhir dihapus!*

📋 *Yang dihapus:*
- Tipe: ${entry.type}
- Kategori: ${entry.kategori} › ${entry.subKategori}
- Jumlah: ${formatRupiah(entry.jumlah)}
- Tanggal: ${entry.tanggal} ${getNamaBulan(entry.bulan)} ${entry.tahun}`;
    }
}
