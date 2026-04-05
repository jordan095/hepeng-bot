// src/handlers/income.handler.ts - Handle income commands

import type { TransactionEntry, ParsedTransaction, TransactionType } from '../types/index.js';
import { parseIncome } from '../parsers/index.js';
import { formatRupiah, getNamaBulan } from '../utilities.js';
import { BaseTransactionHandler } from './base-transaction.handler.js';

export class IncomeHandler extends BaseTransactionHandler {
    canHandle(text: string): boolean {
        const lower = text.toLowerCase().trim();
        return lower.startsWith('+') || lower.includes('masuk') || lower.includes('pemasukan');
    }

    protected parseMessage(text: string): ParsedTransaction | null {
        return parseIncome(text);
    }

    protected getTransactionType(): TransactionType {
        return 'Pemasukan';
    }

    protected getTransactionName(): string {
        return 'pemasukan';
    }

    protected buildSuccessMessage(entry: TransactionEntry): string {
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

    protected getFormatHint(): string {
        return `⚠️ Format tidak dikenali.

📝 *Format pemasukan:*
\`+ [jumlah] [kategori] [sub kategori] [item] [metode?]\`

💡 *Contoh:*
• \`+ 20jt Main Job Monthly Salary bca\`
• \`+ 500rb Main Job THR\`
• \`masuk 20jt Main Job Monthly Salary bca\`
• \`pemasukan 20jt Main Job Monthly Salary bca\`
• \`31 jan masuk 20.450.000 Main Job Monthly Salary bca\``;
    }
}
