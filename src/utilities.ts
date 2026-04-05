// src/utilities.ts - Helper functions

import fs from 'node:fs';
import path from 'node:path';
import { NAMA_BULAN } from './config/index.js';

export interface JakartaTime {
    tanggal: number;
    bulan: number;
    tahun: number;
    jam: number;
}

// Format mata uang Rupiah
export function formatRupiah(angka: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

// Get nama bulan Indonesia
export function getNamaBulan(bulan: number): string {
    return NAMA_BULAN[bulan - 1] || '';
}

// Log dengan timestamp dan simpan ke file
export function log(message: string, type: 'info' | 'error' | 'success' = 'info'): void {
    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    let prefix = 'ℹ️';
    if (type === 'error') prefix = '❌';
    else if (type === 'success') prefix = '✅';

    const logMessage = `[${timestamp}] ${prefix} ${message}`;
    console.log(logMessage);

    try {
        const logFile = path.join(process.cwd(), 'bot.log');
        fs.appendFileSync(logFile, logMessage + '\n');
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Gagal tulis log: ${msg}`);
    }
}

// Get current time in Jakarta (UTC+7)
export function getJakartaTime(): JakartaTime {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const getPart = (type: string) =>
        Number.parseInt(parts.find(p => p.type === type)?.value || '0');

    return {
        tanggal: getPart('day'),
        bulan: getPart('month'),
        tahun: getPart('year'),
        jam: getPart('hour') === 24 ? 0 : getPart('hour')
    };
}

// Format number as shortened string (e.g. 1500000 -> 1.5jt)
export function formatShort(angka: number): string {
    if (angka >= 1_000_000) return `${(angka / 1_000_000).toFixed(angka % 1_000_000 === 0 ? 0 : 1)}jt`;
    if (angka >= 1_000) return `${(angka / 1_000).toFixed(angka % 1_000 === 0 ? 0 : 1)}rb`;
    return String(angka);
}

/**
 * Prevents Google Sheets formula injection.
 * If a string starts with '=', '+', '-', or '@', it prepends a single quote.
 */
export function sanitizeSheetCell(value: string | number): string {
    const str = String(value);
    if (/^[=+\-@]/.test(str)) {
        return `'${str}`;
    }
    return str;
}
