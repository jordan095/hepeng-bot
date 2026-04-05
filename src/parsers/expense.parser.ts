// src/parsers/expense.parser.ts - Expense message parsing
// Format: - 50rb Makanan Luar The Grace [metode?]
//         keluar 50rb Makanan Luar The Grace [metode?]
//         29 mar keluar 50rb Makanan Luar [metode?]

import { KATEGORI_PENGELUARAN, ALL_KATEGORI_PENGELUARAN } from '../config/index.js';
import type { ParsedTransaction } from '../types/index.js';
import { parseAmount, parseDateFromText, extractMetode, extractCategory, extractSubCategory } from './shared.parser.js';
import { getJakartaTime } from '../utils/index.js';

export function parseExpense(rawText: string): ParsedTransaction | null {
    const text = rawText.trim();

    // Find the trigger keyword position
    const lower = text.toLowerCase();
    let triggerIdx = -1;
    let triggerLen = 0;

    // Check for "-" at start (with optional space after)
    if (lower.startsWith('-')) {
        triggerIdx = 0;
        triggerLen = 1;
    } else {
        const pIdx = lower.indexOf('pengeluaran');
        const kIdx = lower.indexOf('keluar');

        if (pIdx !== -1) {
            triggerIdx = pIdx;
            triggerLen = 11;
        } else if (kIdx !== -1) {
            triggerIdx = kIdx;
            triggerLen = 6;
        } else {
            return null;
        }
    }

    // Everything before trigger is optional date prefix
    const prefix = text.slice(0, triggerIdx).trim();
    let workingText = text.slice(triggerIdx + triggerLen).trim();

    // Parse date (from prefix or defaults)
    const jkt = getJakartaTime();
    const dateResult = prefix ? parseDateFromText(prefix) : {
        tanggal: jkt.tanggal,
        bulan: jkt.bulan,
        tahun: jkt.tahun
    };

    // Extract payment method from end
    const { metode, cleanText } = extractMetode(workingText);
    workingText = cleanText;

    // Parse amount
    const amountResult = parseAmount(workingText);
    if (!amountResult || amountResult.amount <= 0) return null;
    workingText = workingText.slice(amountResult.rawLength).trim();

    // Parse category
    const catMatch = extractCategory(workingText, ALL_KATEGORI_PENGELUARAN);
    let kategori: string;
    let subKategori: string;
    let item: string;

    if (catMatch) {
        kategori = catMatch.category;
        workingText = catMatch.remainder;

        // Parse sub-category
        const subCats = KATEGORI_PENGELUARAN[kategori] || [];
        const subMatch = extractSubCategory(workingText, subCats);
        subKategori = subMatch.subCategory;
        item = subMatch.remainder;
    } else {
        // Fallback: first word = kategori, second = sub-kategori, rest = item
        const parts = workingText.split(/\s+/);
        kategori = parts[0] ?? '';
        subKategori = parts[1] ?? '';
        item = parts.slice(2).join(' ');
    }

    return {
        jumlah: amountResult.amount,
        kategori,
        subKategori,
        item,
        metode,
        ...dateResult
    };
}
