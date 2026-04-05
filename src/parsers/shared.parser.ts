// src/parsers/shared.parser.ts - Shared parsing utilities

import { BULAN_MAP, METODE_KEYWORDS } from '../config/index.js';
import { getJakartaTime } from '../utils/index.js';

export interface AmountResult {
    amount: number;
    rawLength: number;
}

/**
 * Parses amount formats: 50rb, 1.5jt, 1.500.000, 50000, 50k
 */
export function parseAmount(text: string): AmountResult | null {
    const regex = /^(\d+(?:[.,]\d+)*(?:rb|ribu|k|jt|juta)?)\b/i;
    const match = regex.exec(text);
    if (!match?.[1]) return null;

    const raw = match[1];
    const amount = calculateAmount(raw);
    return { amount, rawLength: raw.length };
}

function calculateAmount(raw: string): number {
    const lower = raw.toLowerCase();
    const multiplier = getMultiplier(lower);
    const clean = removeMultiplierSuffix(lower);
    const normalized = normalizeDecimalFormat(clean);
    return Math.round(Number.parseFloat(normalized) * multiplier);
}

function getMultiplier(s: string): number {
    if (s.includes('jt') || s.includes('juta')) return 1_000_000;
    if (s.includes('rb') || s.includes('ribu') || s.includes('k')) return 1_000;
    return 1;
}

function removeMultiplierSuffix(s: string): string {
    return s.replaceAll(/rb|ribu|k|jt|juta/gi, '');
}

function normalizeDecimalFormat(s: string): string {
    if (s.includes(',')) {
        return s.replaceAll('.', '').replaceAll(',', '.');
    }
    const dotCount = (s.match(/\./g) || []).length;
    if (dotCount > 1) {
        return s.replaceAll('.', '');
    }
    if (dotCount === 1 && /\.\d{3}$/.test(s)) {
        return s.replaceAll('.', '');
    }
    return s;
}

/**
 * Parses optional date prefix before the main command keyword.
 * Supports: "12 jan", "29 mar 2025"
 */
const BULAN_MAP_KEYS = Object.keys(BULAN_MAP);

export function parseDateFromText(text: string): { tanggal: number; bulan: number; tahun: number } {
    const jkt = getJakartaTime();
    const result = { tanggal: jkt.tanggal, bulan: jkt.bulan, tahun: jkt.tahun };

    const yearMatch = /\b(20\d{2})\b/.exec(text);
    if (yearMatch?.[1]) result.tahun = Number.parseInt(yearMatch[1], 10);

    const lowerText = text.toLowerCase();
    const mName = BULAN_MAP_KEYS.find(name => lowerText.includes(name));
    if (mName) result.bulan = BULAN_MAP[mName] ?? result.bulan;

    const dayMatch = /\b(\d{1,2})\b/.exec(text);
    if (dayMatch?.[1]) {
        const day = Number.parseInt(dayMatch[1], 10);
        if (day >= 1 && day <= 31) result.tanggal = day;
    }

    return result;
}

/**
 * Detects and extracts payment method from end of text.
 * Returns { metode, cleanText } where cleanText has the keyword removed.
 */
export function extractMetode(text: string): { metode: string; cleanText: string } {
    const lower = text.toLowerCase();

    // Sort by length descending so longer matches win (e.g. "cc visa bca" before "bca")
    const sorted = Object.keys(METODE_KEYWORDS).sort((a, b) => b.length - a.length);

    for (const keyword of sorted) {
        if (lower.endsWith(keyword)) {
            const metode = METODE_KEYWORDS[keyword] ?? '';
            const cleanText = text.slice(0, text.length - keyword.length).trim();
            return { metode, cleanText };
        }
        // Also check for keyword anywhere at the end preceded by space
        const idx = lower.lastIndexOf(keyword);
        if (idx !== -1 && idx >= lower.length - keyword.length - 2) {
            const metode = METODE_KEYWORDS[keyword] ?? '';
            const cleanText = (text.slice(0, idx) + text.slice(idx + keyword.length)).trim();
            return { metode, cleanText };
        }
    }

    return { metode: '', cleanText: text };
}

/**
 * Tries to match the beginning of text against a list of known categories.
 * Returns longest matching category first, then the remainder.
 */
export function extractCategory(
    text: string,
    knownCategories: string[]
): { category: string; remainder: string } | null {
    const sorted = [...knownCategories].sort((a, b) => b.length - a.length);
    const lower = text.toLowerCase();

    for (const cat of sorted) {
        if (lower.startsWith(cat.toLowerCase())) {
            return {
                category: cat,
                remainder: text.slice(cat.length).trim()
            };
        }
    }
    return null;
}

/**
 * Tries to match beginning of text against known sub-categories list.
 */
export function extractSubCategory(
    text: string,
    subCategories: string[]
): { subCategory: string; remainder: string } {
    const sorted = [...subCategories].sort((a, b) => b.length - a.length);
    const lower = text.toLowerCase();

    for (const sub of sorted) {
        if (lower.startsWith(sub.toLowerCase())) {
            return {
                subCategory: sub,
                remainder: text.slice(sub.length).trim()
            };
        }
    }

    // Fallback: treat first word as sub-category
    const spaceIdx = text.indexOf(' ');
    if (spaceIdx === -1) return { subCategory: text, remainder: '' };
    return {
        subCategory: text.slice(0, spaceIdx),
        remainder: text.slice(spaceIdx + 1).trim()
    };
}
