// src/handlers/laporan.handler.ts - Monthly and yearly report handler
// Commands: laporan | laporan mar | laporan maret | laporan 2025

import type { 
    MessageContext, 
    CommandHandler, 
    MonthlyReport, 
    YearlyReport, 
    TransactionDetail 
} from '../types/index.js';
import { getMonthlyReport, getYearlyReport } from '../services/index.js';
import { formatRupiah, getNamaBulan, getJakartaTime } from '../utilities.js';
import { BULAN_MAP } from '../config/index.js';

const BULAN_KEYS = Object.keys(BULAN_MAP);

export class LaporanHandler implements CommandHandler {
    canHandle(text: string): boolean {
        return text.toLowerCase().trim().startsWith('laporan');
    }

    async handle(context: MessageContext): Promise<boolean> {
        try {
            if (context.userRole !== 'Owner') {
                await context.sock.sendMessage(context.from, {
                    text: '⛔ Hanya owner yang bisa melihat laporan.'
                });
                return true;
            }

            const text = context.text.toLowerCase().trim();
            const rest = text.replaceAll(/^laporan\s*/g, '').trim();

            // 1. Check if yearly: "laporan 2025" or "laporan tahun 2025"
            const yearMatch = /^(?:tahun\s+)?(\d{4})$/.exec(rest);
            if (yearMatch?.[1]) {
                const tahun = Number.parseInt(yearMatch[1], 10);
                const report = await getYearlyReport(tahun);
                await context.sock.sendMessage(context.from, {
                    text: buildYearlyMessage(report)
                });
                return true;
            }

            // 2. Monthly: parse month name or default to current
            const jkt = getJakartaTime();
            let bulan = jkt.bulan;
            let tahun = jkt.tahun;

            if (rest) {
                const mName = BULAN_KEYS.find(name => rest.includes(name));
                if (mName) bulan = BULAN_MAP[mName] ?? bulan;

                const yrMatch = /(\d{4})/.exec(rest);
                if (yrMatch?.[1]) tahun = Number.parseInt(yrMatch[1], 10);
            }

            const report = await getMonthlyReport(bulan, tahun);
            await context.sock.sendMessage(context.from, {
                text: buildMonthlyMessage(report)
            });
            return true;
        } catch (error) {
            console.error(`Error in LaporanHandler: ${error}`);
            return false;
        }
    }
}

// ─── Message Builders ─────────────────────────────────────────────────────

function buildMonthlyMessage(r: MonthlyReport): string {
    const header = `📊 *LAPORAN ${getNamaBulan(r.bulan).toUpperCase()} ${r.tahun}*\n`;
    const saldoEmoji = r.saldo >= 0 ? '📈' : '📉';
    const summary = `\n💰 Pemasukan: ${formatRupiah(r.pemasukan)}\n💸 Pengeluaran: ${formatRupiah(r.pengeluaran)}\n${saldoEmoji} Saldo: ${formatRupiah(r.saldo)}\n`;

    let details = '';

    if (r.pemasukanDetails.length > 0) {
        details += '\n✅ *Detail Pemasukan:*\n';
        details += groupAndFormatDetails(r.pemasukanDetails);
    }

    if (r.pengeluaranDetails.length > 0) {
        details += '\n❌ *Detail Pengeluaran:*\n';
        details += groupAndFormatDetails(r.pengeluaranDetails);
    }

    if (!details) details = '\n_Belum ada transaksi di bulan ini._';

    return header + summary + details;
}

function groupAndFormatDetails(details: TransactionDetail[]): string {
    // Group by kategori
    const groups: Record<string, { total: number; items: { subKategori: string; item: string; jumlah: number }[] }> = {};

    for (const d of details) {
        groups[d.kategori] ??= { total: 0, items: [] };
        const g = groups[d.kategori];
        if (g) {
            g.total += d.jumlah;
            g.items.push({ subKategori: d.subKategori, item: d.item, jumlah: d.jumlah });
        }
    }

    let text = '';
    for (const [kat, group] of Object.entries(groups)) {
        text += `\n*${kat}* (${formatRupiah(group.total)})\n`;
        for (const item of group.items) {
            const label = item.item || item.subKategori;
            text += `  • ${label}: ${formatRupiah(item.jumlah)}\n`;
        }
    }
    return text;
}

function buildYearlyMessage(r: YearlyReport): string {
    let text = `📊 *LAPORAN TAHUNAN ${r.tahun}*\n\n`;
    text += `💰 Total Pemasukan: ${formatRupiah(r.totalPemasukan)}\n`;
    text += `💸 Total Pengeluaran: ${formatRupiah(r.totalPengeluaran)}\n`;
    const saldoEmoji = r.totalSaldo >= 0 ? '📈' : '📉';
    text += `${saldoEmoji} Saldo Bersih: ${formatRupiah(r.totalSaldo)}\n`;
    text += `\n📅 *Breakdown per bulan:*\n`;

    for (const month of r.months) {
        const hasData = month.pemasukan > 0 || month.pengeluaran > 0;
        if (!hasData) continue;
        const saldo = month.pemasukan - month.pengeluaran;
        const saldoStr = saldo >= 0 ? `+${formatRupiah(saldo)}` : formatRupiah(saldo);
        text += `${getNamaBulan(month.bulan)}: ${saldoStr}`;
        text += ` (in: ${formatRupiah(month.pemasukan)}, out: ${formatRupiah(month.pengeluaran)})\n`;
    }

    return text;
}
