// src/handlers/base-transaction.handler.ts - Base class for transaction handlers

import type { MessageContext, CommandHandler, TransactionEntry, ParsedTransaction, TransactionType } from '../types/index.js';
import { addTransaction } from '../services/index.js';
import { setLastEntry } from './undo.handler.js';

export abstract class BaseTransactionHandler implements CommandHandler {
    abstract canHandle(text: string): boolean;

    protected abstract parseMessage(text: string): ParsedTransaction | null;
    protected abstract getTransactionType(): TransactionType;
    protected abstract getTransactionName(): string;
    protected abstract buildSuccessMessage(entry: TransactionEntry): string;
    protected abstract getFormatHint(): string;

    async handle(context: MessageContext): Promise<boolean> {
        try {
            if (context.userRole !== 'Owner') {
                await context.sock.sendMessage(context.from, {
                    text: '⛔ Hanya owner yang bisa mencatat transaksi.'
                });
                return true;
            }

            const parsed = this.parseMessage(context.text);
            if (!parsed) {
                await context.sock.sendMessage(context.from, {
                    text: this.getFormatHint()
                });
                return true;
            }

            const entry: TransactionEntry = {
                tanggal: parsed.tanggal,
                bulan: parsed.bulan,
                tahun: parsed.tahun,
                type: this.getTransactionType(),
                kategori: parsed.kategori,
                subKategori: parsed.subKategori,
                item: parsed.item,
                jumlah: parsed.jumlah,
                metode: parsed.metode
            };

            const success = await addTransaction(entry);

            if (success) {
                setLastEntry(entry);
                await context.sock.sendMessage(context.from, {
                    text: this.buildSuccessMessage(entry)
                });
            } else {
                await context.sock.sendMessage(context.from, {
                    text: `❌ Gagal menyimpan ${this.getTransactionName()}. Coba lagi.`
                });
            }

            return true;
        } catch (error) {
            console.error(`Error in ${this.constructor.name}: ${error}`);
            return false;
        }
    }
}
