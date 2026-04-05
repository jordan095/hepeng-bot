# Agent Guide - Hepeng Bot

Welcome to the Hepeng Bot repository. This document provides technical context and guidelines for AI agents working on this project.

## 📝 Project Overview

**hepeng-bot** is a WhatsApp bot designed for tracking personal finances (income and expenses). It interacts with users over WhatsApp and records transactions in a Google Sheet. It supports logging income and expenses, retrieving monthly and yearly reports, getting quick summaries, and undoing the last entered transaction.

### Core Stack
- **Runtime:** Node.js (v20+)
- **Language:** TypeScript (ES Modules)
- **WhatsApp Library:** `@whiskeysockets/baileys`
- **Database/Storage:** Google Sheets via `googleapis`
- **Logging:** `pino`
- **Testing:** `vitest`
- **Execution:** `tsx` (for running TypeScript directly)

## 🏗️ Architecture & Codebase Structure

The project is structured into modular layers located in the `src/` directory:

### 1. Main Entry Point
- `src/index.ts`: The main entry point. Handles connecting to WhatsApp, listening to messages, deduplicating messages, extracting text/senders, and routing messages.

### 2. Configuration
- `src/config/`: Configuration files mapping expenses, environment variables validation, etc.

### 3. Command Handlers (Chain of Responsibility)
Message processing follows a Chain of Responsibility pattern.
- **Entry Point:** `src/index.ts` calls `routeMessage` in `src/handlers/command-router.ts`.
- **Router:** Iterates through a list of handlers (`src/handlers/*.handler.ts`) until one handles the message.
- **Handlers:** Each handler implements `CommandHandler` interface with `canHandle(text)` and `handle(context)`.
    - `bantuan.handler.ts`: Handles help (`bantuan`, `?`, `help`) commands.
    - `expense.handler.ts`: Parses and processes expenses (`-` or `keluar`).
    - `income.handler.ts`: Parses and processes incomes (`+` or `masuk`).
    - `laporan.handler.ts`: Generates reports for specific months or years.
    - `rekap.handler.ts`: Gives a quick snapshot of the current month.
    - `undo.handler.ts`: Deletes the last entered transaction.

### 4. Parsers
Logic for extracting transaction details from natural language is located in `src/parsers/`. Translates natural language strings from the user into structured objects (e.g., `parseIncome`, `parseExpense`).
- `expense.parser.ts`: Handles "-" or "keluar" prefixes.
- `income.parser.ts`: Handles "+" or "masuk" prefixes.
- `shared.parser.ts`: Contains reusable regex-based extraction for amounts, dates, and payment methods.

### 5. Services
External integrations and business logic.
- `google-sheets.service.ts`: Singleton pattern for Google Sheets API client. Connects using credentials.
- `transaction.service.ts`: CRUD operations for transactions. Handles fetching reports and adding/deleting transactions in Google Sheets.

### 6. Types and Utilities
- `src/types/`: Centralized interfaces and types (e.g., `MessageContext`, `TransactionEntry`).
- `src/utilities.ts`: Shared helpers (date formatting, logging, currency formatting).

## 🧑‍💻 Technical Details & Guidelines

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

### Authentication & Role-Based Access
- **WhatsApp:** Uses `useMultiFileAuthState` in `auth_info_baileys/`.
- **Google API:** Uses `GOOGLE_CREDENTIALS` (JSON string) or `credentials.json` file.
- **Roles:** The bot supports an `'Owner'` and `'Viewer'` role, mapped via the `OWNER_NUMBERS` environment variable. Owners can modify data, Viewers can only run reports.

### Development Workflow & Guidelines
- **Immutability & Statelessness:** Keep parsers stateless and easily testable. Handlers should focus on sending messages and wiring user intent to services.
- **Error Handling:** Use safe try/catch blocks within handlers and services. Return standard error messages back to the user instead of letting the application crash. Log using `log()` from `utilities.ts`.
- **Coding Standards:**
    - Use **ES Modules** (always include `.js` extension in imports of local files).
    - Prefer **functional approach** for parsing and data processing.
    - Use `log` from `src/utilities.ts` for consistent logging.
    - Ensure all new handlers have associated tests if they contain complex logic.

### Extending the Bot
To add a new command:
1. Create `src/handlers/your-new.handler.ts`.
2. Implement `CommandHandler` interface.
3. Register it in `src/handlers/command-router.ts`.

## 🧪 Testing

- **Framework:** Vitest
- **Run Tests:** `pnpm run test`
- **Coverage:** `pnpm run test:coverage`
- **Guidelines:**
    - Add tests primarily for `parsers/` since they contain the most complex business logic (regular expressions, date string manipulation).
    - Tests should live alongside the code, e.g., `expense.parser.test.ts`.
    - Make sure to mock external modules like `googleapis` when testing `services/`.

## ⚙️ Environment Variables Setup

Ensure you have a `.env` file (or provide these variables) with the following minimum variables:
*   `SHEET_ID`: ID of the target Google Spreadsheet.
*   `GOOGLE_CREDENTIALS`: JSON string of Google Service Account credentials.
*   `OWNER_NUMBERS`: Comma-separated list of WhatsApp numbers (e.g., `628123456789`) that can modify data.

## 🚀 Running the Project

- **Development:** `pnpm run dev` (Runs with `tsx watch`)
- **Production:** `pnpm start` (Runs with `tsx`)
- **QR Code Login:** On the first run, `qrcode-terminal` will display a QR code in the terminal. Scan it with your WhatsApp linked devices to connect the bot.
