// src/handlers/income.handler.ts - Handle income commands

import type { MessageContext, CommandHandler, TransactionEntry } from '../types/index.js';
import { parseIncome } from '../parsers/index.js';
import { addTransaction } from '../services/index.js';
import { formatRupiah, getNamaBulan } from '../utilities.js';
import { setLastEntry } from './undo.handler.js';

export class IncomeHandler implements CommandHandler {
    canHandle(text: string): boolean {
        const lower = text.toLowerCase().trim();
        return lower.startsWith('+') || lower.includes('masuk');
    }

    async handle(context: MessageContext): Promise<boolean> {
        try {
            if (context.userRole !== 'Owner') {
                await context.sock.sendMessage(context.from, {
                    text: '⛔ Hanya owner yang bisa mencatat transaksi.'
                });
                return true;
            }

            const parsed = parseIncome(context.text);
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
                type: 'Pemasukan',
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
                    text: '❌ Gagal menyimpan pemasukan. Coba lagi.'
                });
            }

            return true;
        } catch (error) {
            console.error(`Error in IncomeHandler: ${error}`);
            return false;
        }
    }

    private buildSuccessMessage(entry: TransactionEntry): string {
        const methodeText = entry.metode ? `\n5. Metode: ${entry.metode}` : '';
        const itemText = entry.item ? `\n4. Item: ${entry.item}` : '';
        return `✅ *Pemasukan tercatat!*

💰 *Detail:*
1. Kategori: ${entry.kategori}
2. Sub Kategori: ${entry.subKategori}
3. Jumlah: ${formatRupiah(entry.jumlah)}${itemText}${methodeText}

📅 ${entry.tanggal} ${getNamaBulan(entry.bulan)} ${entry.tahun}
✔️ Tersimpan di Google Sheet`;
    }

    private getFormatHint(): string {
        return `⚠️ Format tidak dikenali.

📝 *Format pemasukan:*
\`+ [jumlah] [kategori] [sub kategori] [item] [metode?]\`

💡 *Contoh:*
• \`+ 20jt Main Job Monthly Salary bca\`
• \`+ 500rb Main Job THR\`
• \`masuk 20jt Main Job Monthly Salary bca\`
• \`31 jan masuk 20.450.000 Main Job Monthly Salary bca\``;
    }
}
