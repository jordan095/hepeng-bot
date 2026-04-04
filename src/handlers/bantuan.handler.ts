// src/handlers/bantuan.handler.ts - Help text
// Commands: bantuan | ?

import type { MessageContext, CommandHandler } from '../types/index.js';
import { KATEGORI_PENGELUARAN } from '../config/index.js';

export class BantuanHandler implements CommandHandler {
    canHandle(text: string): boolean {
        const lower = text.toLowerCase().trim();
        return lower === 'bantuan' || lower === '?' || lower === 'help';
    }

    async handle(context: MessageContext): Promise<boolean> {
        try {
            await context.sock.sendMessage(context.from, {
                text: this.buildHelpText(context.userRole)
            });
            return true;
        } catch (error) {
            console.error(`Error in BantuanHandler: ${error}`);
            return false;
        }
    }

    private buildHelpText(role: string): string {
        let text = `🤖 *HEPENG BOT - Personal Finance Tracker*\n\n`;

        text += `📝 *FORMAT PERINTAH:*\n\n`;

        if (role === 'Owner') {
            text += `💸 *CATAT PENGELUARAN:*\n`;
            text += `\`- [jumlah] [kategori] [sub kategori] [item] [metode?]\`\n`;
            text += `Contoh:\n`;
            text += `• \`- 50rb Makanan Luar The Grace\`\n`;
            text += `• \`- 1.5jt Perlengkapan Fashion Baju jago\`\n`;
            text += `• \`keluar 880rb Medical Rawat Jalan Dokter mandiri\`\n`;
            text += `• \`29 mar keluar 400rb Transportasi Ojol Maxim bca\`\n\n`;

            text += `💰 *CATAT PEMASUKAN:*\n`;
            text += `\`+ [jumlah] [kategori] [sub kategori] [item] [metode?]\`\n`;
            text += `Contoh:\n`;
            text += `• \`+ 20jt Main Job Monthly Salary bca\`\n`;
            text += `• \`+ 500rb Main Job THR\`\n`;
            text += `• \`masuk 20.450.000 Main Job Monthly Salary bca\`\n\n`;

            text += `🗑️ *BATALKAN ENTRI TERAKHIR:*\n`;
            text += `• \`batal\` atau \`undo\`\n\n`;

            text += `📊 *LAPORAN:*\n`;
            text += `• \`laporan\` → laporan bulan ini\n`;
            text += `• \`laporan mar\` → laporan Maret\n`;
            text += `• \`laporan mar 2025\` → laporan Maret 2025\n`;
            text += `• \`laporan 2025\` → laporan tahunan\n\n`;

            text += `⚡ *REKAP CEPAT:*\n`;
            text += `• \`rekap\` → ringkasan bulan ini\n\n`;

            text += `💳 *METODE PEMBAYARAN (opsional di akhir):*\n`;
            text += `cash | bca | mandiri | jago | cc visa bca | transfer\n\n`;

            const katList = Object.keys(KATEGORI_PENGELUARAN).join(', ');
            text += `📂 *KATEGORI PENGELUARAN:*\n${katList}\n\n`;

            text += `📂 *KATEGORI PEMASUKAN:*\nMain Job, Lainnya`;
        }

        return text;
    }
}
