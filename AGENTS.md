# AGENTS.md

Welcome to the **hepeng-bot** project! This document serves as a guide for AI agents and developers working on this repository.

## 📝 Project Overview

**hepeng-bot** is a WhatsApp bot designed for tracking personal finances (income and expenses). It interacts with users over WhatsApp and records transactions in a Google Sheet. It supports logging income and expenses, retrieving monthly and yearly reports, getting quick summaries, and undoing the last entered transaction.

## 🛠️ Tech Stack

*   **Runtime:** Node.js
*   **Language:** TypeScript
*   **WhatsApp Library:** `@whiskeysockets/baileys`
*   **Google Sheets Integration:** `googleapis`
*   **Logging:** `pino`
*   **Testing:** `vitest`
*   **Execution:** `tsx` (for running TypeScript directly)

## 🏗️ Architecture & Codebase Structure

The project is structured into modular layers located in the `src/` directory:

*   `src/index.ts`: The main entry point. Handles connecting to WhatsApp, listening to messages, deduplicating messages, extracting text/senders, and routing messages.
*   `src/config/`: Configuration files mapping expenses, environment variables validation, etc.
*   `src/handlers/`: Contains command handlers implementing the Chain of Responsibility pattern.
    *   `command-router.ts`: Loops through handlers until one handles the message.
    *   `bantuan.handler.ts`: Handles help (`bantuan`, `?`, `help`) commands.
    *   `expense.handler.ts`: Parses and processes expenses (`-` or `keluar`).
    *   `income.handler.ts`: Parses and processes incomes (`+` or `masuk`).
    *   `laporan.handler.ts`: Generates reports for specific months or years.
    *   `rekap.handler.ts`: Gives a quick snapshot of the current month.
    *   `undo.handler.ts`: Deletes the last entered transaction.
*   `src/parsers/`: Translates natural language strings from the user into structured objects (e.g., `parseIncome`, `parseExpense`).
*   `src/services/`: External integrations and business logic.
    *   `google-sheets.service.ts`: Connects to Google Sheets API using credentials.
    *   `transaction.service.ts`: Handles fetching reports and adding/deleting transactions in Google Sheets.
*   `src/types/`: Centralized interfaces and types (e.g., `MessageContext`, `TransactionEntry`).
*   `src/utilities.ts`: Shared helpers (date formatting, logging, currency formatting).

## 🧑‍💻 Development Workflow & Guidelines

*   **Role-Based Access:** The bot supports an `'Owner'` and `'Viewer'` role, mapped via the `OWNER_NUMBERS` environment variable. Owners can modify data, Viewers can only run reports.
*   **Immutability & Statelessness:** Keep parsers stateless and easily testable. Handlers should focus on sending messages and wiring user intent to services.
*   **Error Handling:** Use safe try/catch blocks within handlers and services. Return standard error messages back to the user instead of letting the application crash. Log using `log()` from `utilities.ts`.

## 🧪 Testing

*   **Framework:** Vitest (`npm run test`, `npm run test:coverage`).
*   **Guidelines:**
    *   Add tests primarily for `parsers/` since they contain the most complex business logic (regular expressions, date string manipulation).
    *   Tests should live alongside the code, e.g., `expense.parser.test.ts`.
    *   Make sure to mock external modules like `googleapis` when testing `services/`.

## ⚙️ Environment Variables Setup

Ensure you have a `.env` file (or provide these variables) with the following minimum variables:
*   `SHEET_ID`: ID of the target Google Spreadsheet.
*   `GOOGLE_CREDENTIALS`: JSON string of Google Service Account credentials.
*   `OWNER_NUMBERS`: Comma-separated list of WhatsApp numbers (e.g., `628123456789`) that can modify data.

## 🚀 Running the Project

*   **Development:** `npm run dev` (Runs with `tsx watch`)
*   **Production:** `npm start` (Runs with `tsx`)
*   **QR Code Login:** On the first run, `qrcode-terminal` will display a QR code in the terminal. Scan it with your WhatsApp linked devices to connect the bot.
