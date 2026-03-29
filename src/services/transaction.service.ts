// src/services/transaction.service.ts - Transaction CRUD operations

import { CONFIG } from '../config/index.js';
import { getGoogleSheets } from './google-sheets.service.js';
import { getNamaBulan, log } from '../utilities.js';
import type { TransactionEntry, MonthlyReport, YearlyReport, TransactionDetail } from '../types/index.js';

const SHEET_RANGE = 'Transaksi';

// ─── Write ────────────────────────────────────────────────────────────────

export async function addTransaction(entry: TransactionEntry): Promise<boolean> {
    try {
        const { sheets } = await getGoogleSheets();
        const row = buildRow(entry);

        await sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.SHEET_ID,
            range: `${SHEET_RANGE}!A:K`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] }
        });

        log(`✅ Berhasil menyimpan ${entry.type}: ${entry.kategori} ${entry.jumlah}`, 'success');
        return true;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        log(`❌ Gagal menyimpan transaksi: ${msg}`, 'error');
        return false;
    }
}

export async function deleteLastTransaction(): Promise<{ success: boolean; entry?: TransactionEntry }> {
    try {
        const { sheets } = await getGoogleSheets();

        // Read all rows to find last
        const readResp = await sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.SHEET_ID,
            range: `${SHEET_RANGE}!A:K`
        });
        const rows = readResp.data.values || [];
        if (rows.length < 2) return { success: false };

        const lastRowIndex = rows.length; // 1-based, includes header
        const lastRow = rows[lastRowIndex - 1];
        if (!lastRow) return { success: false };

        // Get sheet id
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: CONFIG.SHEET_ID });
        const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === SHEET_RANGE);
        const sheetId = sheet?.properties?.sheetId ?? null;
        if (sheetId === null) return { success: false };

        // Delete row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: CONFIG.SHEET_ID,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId,
                            dimension: 'ROWS',
                            startIndex: lastRowIndex - 1,
                            endIndex: lastRowIndex
                        }
                    }
                }]
            }
        });

        const entry = parseRow(lastRow);
        log(`✅ Berhasil menghapus entri terakhir`, 'success');
        return { success: true, entry };
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        log(`❌ Gagal menghapus transaksi: ${msg}`, 'error');
        return { success: false };
    }
}

// ─── Read ─────────────────────────────────────────────────────────────────

export async function getMonthlyReport(bulan: number, tahun: number): Promise<MonthlyReport> {
    try {
        const { sheets } = await getGoogleSheets();
        const resp = await sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.SHEET_ID,
            range: `${SHEET_RANGE}!A:K`
        });
        const rows = resp.data.values || [];

        const { pemasukan, pengeluaran, pemasukanDetails, pengeluaranDetails } = processRowsForReport(rows, bulan, tahun);

        return {
            bulan,
            tahun,
            pemasukan,
            pengeluaran,
            saldo: pemasukan - pengeluaran,
            pemasukanDetails,
            pengeluaranDetails
        };
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        log(`❌ Error fetching monthly report: ${msg}`, 'error');
        return { bulan, tahun, pemasukan: 0, pengeluaran: 0, saldo: 0, pemasukanDetails: [], pengeluaranDetails: [] };
    }
}

export async function getYearlyReport(tahun: number): Promise<YearlyReport> {
    try {
        const { sheets } = await getGoogleSheets();
        const resp = await sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.SHEET_ID,
            range: `${SHEET_RANGE}!A:K`
        });
        const rows = resp.data.values || [];

        const monthData: Record<number, { pemasukan: number; pengeluaran: number }> = {};
        for (let m = 1; m <= 12; m++) {
            monthData[m] = { pemasukan: 0, pengeluaran: 0 };
        }

        let totalPemasukan = 0;
        let totalPengeluaran = 0;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row) continue;

            const entry = parseRow(row);
            if (entry.tahun !== tahun) continue;

            const month = monthData[entry.bulan];
            if (!month) continue;

            if (entry.type === 'Pemasukan') {
                month.pemasukan += entry.jumlah;
                totalPemasukan += entry.jumlah;
            } else {
                month.pengeluaran += entry.jumlah;
                totalPengeluaran += entry.jumlah;
            }
        }

        return {
            tahun,
            months: Object.entries(monthData).map(([b, d]) => ({ bulan: Number(b), ...d })),
            totalPemasukan,
            totalPengeluaran,
            totalSaldo: totalPemasukan - totalPengeluaran
        };
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        log(`❌ Error fetching yearly report: ${msg}`, 'error');
        return { tahun, months: [], totalPemasukan: 0, totalPengeluaran: 0, totalSaldo: 0 };
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildRow(entry: TransactionEntry): string[] {
    // Columns: Tanggal | Tipe | Kategori | Sub Kategori | Item | Bulan | Tahun | Jumlah | Metode | Bukti | Keterangan
    return [
        `${entry.tanggal} ${getNamaBulan(entry.bulan)} ${entry.tahun}`,
        entry.type,
        entry.kategori,
        entry.subKategori,
        entry.item,
        getNamaBulan(entry.bulan),
        String(entry.tahun),
        String(entry.jumlah),
        entry.metode,
        entry.bukti || '',
        entry.keterangan || ''
    ];
}

function parseRow(row: (string | undefined)[]): TransactionEntry {
    const type = (row[1] || '') === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran';
    const bulan = parseBulanFromText(row[5] || '');
    const tahun = Number.parseInt(row[6] || '0', 10);
    const jumlahText = row[7] || '0';
    const jumlah = Number.parseInt(jumlahText.replaceAll(/\D/g, '') || '0', 10);
    // Parse tanggal from "12 Januari 2025" format
    const tanggal = Number.parseInt((row[0] || '0').split(' ')[0] || '0', 10);

    return {
        tanggal,
        bulan,
        tahun,
        type,
        kategori: row[2] || '',
        subKategori: row[3] || '',
        item: row[4] || '',
        jumlah,
        metode: row[8] || '',
        bukti: row[9] || '',
        keterangan: row[10] || ''
    };
}

function parseBulanFromText(text: string): number {
    const BULAN_NAMES = [
        'januari', 'februari', 'maret', 'april', 'mei', 'juni',
        'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
    ];
    const lower = text.toLowerCase();
    const idx = BULAN_NAMES.indexOf(lower);
    return idx >= 0 ? idx + 1 : 0;
}

function processRowsForReport(rows: any[][], bulan: number, tahun: number) {
    let pemasukan = 0;
    let pengeluaran = 0;
    const pemasukanDetails: TransactionDetail[] = [];
    const pengeluaranDetails: TransactionDetail[] = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;

        const entry = parseRow(row);
        if (entry.bulan !== bulan || entry.tahun !== tahun) continue;

        const detail: TransactionDetail = {
            kategori: entry.kategori,
            subKategori: entry.subKategori,
            item: entry.item,
            jumlah: entry.jumlah,
            metode: entry.metode
        };

        if (entry.type === 'Pemasukan') {
            pemasukan += entry.jumlah;
            if (entry.jumlah > 0) pemasukanDetails.push(detail);
        } else {
            pengeluaran += entry.jumlah;
            if (entry.jumlah > 0) pengeluaranDetails.push(detail);
        }
    }

    return { pemasukan, pengeluaran, pemasukanDetails, pengeluaranDetails };
}
