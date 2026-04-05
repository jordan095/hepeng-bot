// src/handlers/expense.handler.ts - Handle expense commands

import type { MessageContext, CommandHandler, TransactionEntry } from '../types/index.js';
import { parseExpense } from '../parsers/index.js';
import { addTransaction } from '../services/index.js';
import { formatRupiah, getNamaBulan } from '../utils/index.js';
import { setLastEntry } from './undo.handler.js';

export class ExpenseHandler implements CommandHandler {
    canHandle(text: string): boolean {
        const lower = text.toLowerCase().trim();
        return lower.startsWith('-') || lower.includes('keluar') || lower.includes('pengeluaran');
    }

    async handle(context: MessageContext): Promise<boolean> {
        try {
            if (context.userRole !== 'Owner') {
                await context.sock.sendMessage(context.from, {
                    text: '⛔ Hanya owner yang bisa mencatat transaksi.'
                });
                return true;
            }

            const parsed = parseExpense(context.text);
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
                type: 'Pengeluaran',
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
                    text: '❌ Gagal menyimpan pengeluaran. Coba lagi.'
                });
            }

            return true;
        } catch (error) {
            console.error(`Error in ExpenseHandler: ${error}`);
            return false;
        }
    }

    private buildSuccessMessage(entry: TransactionEntry): string {
        const methodeText = entry.metode ? `\n5. Metode: ${entry.metode}` : '';
        const itemText = entry.item ? `\n4. Item: ${entry.item}` : '';
        return `✅ *Pengeluaran tercatat!*

📋 *Detail:*
1. Kategori: ${entry.kategori}
2. Sub Kategori: ${entry.subKategori}
3. Jumlah: ${formatRupiah(entry.jumlah)}${itemText}${methodeText}

📅 ${entry.tanggal} ${getNamaBulan(entry.bulan)} ${entry.tahun}
✔️ Tersimpan di Google Sheet`;
    }

    private getFormatHint(): string {
        return `⚠️ Format tidak dikenali.

📝 *Format pengeluaran:*
\`- [jumlah] [kategori] [sub kategori] [item] [metode?]\`

💡 *Contoh:*
• \`- 50rb Makanan Luar The Grace\`
• \`- 1.5jt Perlengkapan Fashion Baju Lebaran jago\`
• \`keluar 400rb Transportasi Ojol Transport CC bca\`
• \`pengeluaran 400rb Transportasi Ojol Transport CC bca\`
• \`29 mar keluar 880rb Medical Rawat Jalan Dokter mandiri\``;
    }
}
