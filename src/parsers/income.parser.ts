// src/parsers/income.parser.ts - Income message parsing
// Format: + 20jt Main Job Monthly Salary [metode?]
//         masuk 20jt Main Job Monthly Salary [metode?]
//         29 mar masuk 500rb Lainnya Misc Cashback [metode?]

import { KATEGORI_PEMASUKAN, ALL_KATEGORI_PEMASUKAN } from '../config/index.js';
import type { ParsedTransaction } from '../types/index.js';
import { parseAmount, parseDateFromText, extractMetode, extractCategory, extractSubCategory } from './shared.parser.js';
import { getJakartaTime } from '../utilities.js';

export function parseIncome(rawText: string): ParsedTransaction | null {
    const text = rawText.trim();
    const lower = text.toLowerCase();

    let triggerIdx = -1;
    let triggerLen = 0;

    if (lower.startsWith('+')) {
        triggerIdx = 0;
        triggerLen = 1;
    } else {
        const mIdx = lower.indexOf('masuk');
        if (mIdx === -1) return null;
        triggerIdx = mIdx;
        triggerLen = 5;
    }

    const prefix = text.slice(0, triggerIdx).trim();
    let workingText = text.slice(triggerIdx + triggerLen).trim();

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
    const catMatch = extractCategory(workingText, ALL_KATEGORI_PEMASUKAN);
    let kategori: string;
    let subKategori: string;
    let item: string;

    if (catMatch) {
        kategori = catMatch.category;
        workingText = catMatch.remainder;

        const subCats = KATEGORI_PEMASUKAN[kategori] || [];
        const subMatch = extractSubCategory(workingText, subCats);
        subKategori = subMatch.subCategory;
        item = subMatch.remainder;
    } else {
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
