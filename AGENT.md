# Agent Guide - Hepeng Bot

Welcome to the Hepeng Bot repository. This document provides technical context and guidelines for AI agents working on this project.

## Project Overview

Hepeng Bot is a WhatsApp-based personal finance tracker that saves transactions to Google Sheets. It's built with TypeScript and uses the `@whiskeysockets/baileys` library for WhatsApp integration.

### Core Stack
- **Runtime:** Node.js (v20+)
- **Language:** TypeScript (ES Modules)
- **WhatsApp Library:** `@whiskeysockets/baileys`
- **Database/Storage:** Google Sheets via `googleapis`
- **Logging:** `pino`
- **Testing:** `vitest`

## Architecture

### 1. Command Handlers (Chain of Responsibility)
Message processing follows a Chain of Responsibility pattern.
- **Entry Point:** `src/index.ts` calls `routeMessage` in `src/handlers/command-router.ts`.
- **Router:** Iterates through a list of handlers (`src/handlers/*.handler.ts`).
- **Handlers:** Each handler implements `CommandHandler` interface with `canHandle(text)` and `handle(context)`.

### 2. Parsers
Logic for extracting transaction details from natural language is located in `src/parsers/`.
- `expense.parser.ts`: Handles "-" or "keluar" prefixes.
- `income.parser.ts`: Handles "+" or "masuk" prefixes.
- `shared.parser.ts`: Contains reusable regex-based extraction for amounts, dates, and payment methods.

### 3. Services
- `google-sheets.service.ts`: Singleton pattern for Google Sheets API client.
- `transaction.service.ts`: CRUD operations for transactions and report generation.

## Technical Details

### Google Sheets Schema
The bot expects a sheet named **"Transaksi"** with the following columns:
1. `Tanggal` (e.g., "12 Januari 2025")
2. `Tipe` (Pengeluaran / Pemasukan)
3. `Kategori`
4. `Sub Kategori`
5. `Item`
6. `Bulan` (Full month name in Indonesian)
7. `Tahun` (YYYY)
8. `Jumlah` (Number)
9. `Metode` (Payment method)
10. `Bukti` (URL/Ref)
11. `Keterangan`

### Authentication
- **WhatsApp:** Uses `useMultiFileAuthState` in `auth_info_baileys/`.
- **Google API:** Uses `GOOGLE_CREDENTIALS` (JSON string) or `credentials.json` file.

## Development & Testing

- **Run Dev:** `npm run dev`
- **Run Tests:** `npm run test`
- **Coverage:** `npm run test:coverage`

### Extending the Bot
To add a new command:
1. Create `src/handlers/your-new.handler.ts`.
2. Implement `CommandHandler` interface.
3. Register it in `src/handlers/command-router.ts`.

## Coding Standards
- Use **ES Modules** (always include `.js` extension in imports of local files).
- Prefer **functional approach** for parsing and data processing.
- Use `log` from `src/utilities.ts` for consistent logging.
- Ensure all new handlers have associated tests if they contain complex logic.
