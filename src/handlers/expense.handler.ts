// src/handlers/expense.handler.ts - Handle expense commands

import type { TransactionEntry, ParsedTransaction, TransactionType } from '../types/index.js';
import { parseExpense } from '../parsers/index.js';
import { formatRupiah, getNamaBulan } from '../utils/index.js';
import { BaseTransactionHandler } from './base-transaction.handler.js';

export class ExpenseHandler extends BaseTransactionHandler {
    canHandle(text: string): boolean {
        const lower = text.toLowerCase().trim();
        return lower.startsWith('-') || lower.includes('keluar') || lower.includes('pengeluaran');
    }

    protected parseMessage(text: string): ParsedTransaction | null {
        return parseExpense(text);
    }

    protected getTransactionType(): TransactionType {
        return 'Pengeluaran';
    }

    protected getTransactionName(): string {
        return 'pengeluaran';
    }

    protected buildSuccessMessage(entry: TransactionEntry): string {
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

    protected getFormatHint(): string {
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
