// src/types/index.ts - TypeScript interfaces and types

import type { WASocket, proto } from '@whiskeysockets/baileys';

// Transaction types
export type TransactionType = 'Pemasukan' | 'Pengeluaran';

export interface TransactionEntry {
    tanggal: number;
    bulan: number;
    tahun: number;
    type: TransactionType;
    kategori: string;
    subKategori: string;
    item: string;
    jumlah: number;
    metode: string;
    bukti?: string;
    keterangan?: string;
}

export interface ParsedTransaction {
    jumlah: number;
    kategori: string;
    subKategori: string;
    item: string;
    metode: string;
    tanggal: number;
    bulan: number;
    tahun: number;
}

export interface MonthlyReport {
    bulan: number;
    tahun: number;
    pemasukan: number;
    pengeluaran: number;
    saldo: number;
    pemasukanDetails: TransactionDetail[];
    pengeluaranDetails: TransactionDetail[];
}

export interface TransactionDetail {
    kategori: string;
    subKategori: string;
    item: string;
    jumlah: number;
    metode: string;
}

export interface YearlyReport {
    tahun: number;
    months: {
        bulan: number;
        pemasukan: number;
        pengeluaran: number;
    }[];
    totalPemasukan: number;
    totalPengeluaran: number;
    totalSaldo: number;
}

// Message context for handlers
export interface MessageContext {
    sock: WASocket;
    msg: proto.IWebMessageInfo;
    from: string;
    sender: string;
    text: string;
    userRole: 'Owner' | 'Viewer';
}

// Command handler interface
export interface CommandHandler {
    canHandle(text: string): boolean;
    handle(context: MessageContext): Promise<boolean | void>;
}
