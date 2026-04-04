// src/handlers/rekap.handler.ts - Quick summary for current month
// Command: rekap

import type { MessageContext, CommandHandler } from '../types/index.js';
import { getMonthlyReport } from '../services/index.js';
import { formatRupiah, getNamaBulan, getJakartaTime } from '../utilities.js';

export class RekapHandler implements CommandHandler {
    canHandle(text: string): boolean {
        return text.toLowerCase().trim() === 'rekap';
    }

    async handle(context: MessageContext): Promise<boolean> {
        try {
            if (context.userRole !== 'Owner') {
                await context.sock.sendMessage(context.from, {
                    text: '⛔ Hanya owner yang bisa melihat rekap.'
                });
                return true;
            }

            const jkt = getJakartaTime();
            const report = await getMonthlyReport(jkt.bulan, jkt.tahun);

            const emoji = report.saldo >= 0 ? '📈' : '📉';
            const saldoLabel = report.saldo >= 0 ? 'Surplus' : 'Defisit';

            const msg = `💼 *REKAP ${getNamaBulan(jkt.bulan).toUpperCase()} ${jkt.tahun}*

💰 Pemasukan: ${formatRupiah(report.pemasukan)}
💸 Pengeluaran: ${formatRupiah(report.pengeluaran)}
${emoji} ${saldoLabel}: ${formatRupiah(Math.abs(report.saldo))}

_Kirim "laporan" untuk detail lengkap._`;

            await context.sock.sendMessage(context.from, { text: msg });
            return true;
        } catch (error) {
            console.error(`Error in RekapHandler: ${error}`);
            return false;
        }
    }
}
