# hepeng-bot

**hepeng-bot** is a personal finance tracking WhatsApp bot. It connects to your WhatsApp account and allows you to easily log your daily expenses and incomes directly via chat. All transactions are saved and synced securely to a Google Sheet.

## ✨ Features

*   **Log Expenses & Incomes:** Use natural language commands to record your cash flow.
*   **Smart Parsing:** Supports implicit dates (like "29 mar"), shorthand numbers ("50rb", "1.5jt"), and optional payment methods.
*   **Undo Mistakes:** Quickly remove the last transaction with a simple `undo` command.
*   **Reports & Recaps:** Request monthly or yearly financial summaries directly in the chat.
*   **Role-Based Access:** Only authorized "Owner" numbers can record or delete data, while others can only view reports.
*   **Google Sheets Integration:** Acts as a real-time database that you can analyze outside the bot.

## 📋 Prerequisites

Before running the bot, ensure you have:
*   [Node.js](https://nodejs.org/) (v18 or higher recommended).
*   A Google Cloud Project with the **Google Sheets API** enabled.
*   A **Service Account** with access to your Google Cloud Project. You will need its JSON credentials.
*   A target Google Spreadsheet, shared with your Service Account email (give it "Editor" access).

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd hepeng-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your details:
   ```bash
   cp .env.example .env
   ```
   **Variables in `.env`:**
   *   `SHEET_ID`: The ID of your Google Sheet (found in the URL: `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`).
   *   `GOOGLE_CREDENTIALS`: The full JSON string of your Service Account credentials (minified into a single line).
   *   `OWNER_NUMBERS`: Comma-separated WhatsApp numbers allowed to edit data (e.g., `628123456789,628987654321`).

## 🚀 Running the Bot

*   **Development mode (auto-restarts on changes):**
    ```bash
    npm run dev
    ```
*   **Production mode:**
    ```bash
    npm start
    ```

**Connecting WhatsApp:**
When you start the bot for the first time, it will generate a QR code in your terminal. Open WhatsApp on your phone, go to **Linked Devices**, and scan the QR code to log the bot in. The session is saved in the `auth_info_baileys` directory.

## 💬 Usage (WhatsApp Commands)

Send these messages to the bot via WhatsApp.

### 💸 Recording Expenses (Owner Only)
Use `-` or `keluar` at the start of your message.
**Format:** `- [jumlah] [kategori] [sub kategori] [item] [metode?]`
*   `- 50rb Makanan Luar The Grace`
*   `- 1.5jt Perlengkapan Fashion Baju`
*   `keluar 880rb Medical Rawat Jalan Dokter mandiri`
*   `29 mar keluar 400rb Transportasi Ojol Maxim bca`

### 💰 Recording Incomes (Owner Only)
Use `+` or `masuk` at the start of your message.
**Format:** `+ [jumlah] [kategori] [sub kategori] [item] [metode?]`
*   `+ 20jt Main Job Monthly Salary bca`
*   `+ 500rb Main Job THR`
*   `31 jan masuk 20.450.000 Main Job Monthly Salary bca`

### 🗑️ Undo Last Transaction (Owner Only)
Delete the last logged transaction.
*   `batal`
*   `undo`

### 📊 Reports & Summaries
View your financial data.
*   `rekap` (Quick snapshot of current month's surplus/deficit)
*   `laporan` (Detailed report for the current month)
*   `laporan mar` (Detailed report for March)
*   `laporan 2025` (Yearly summary for 2025)

### ❓ Help
View the list of available commands, categories, and payment methods.
*   `bantuan`
*   `?`
*   `help`

## 🧪 Testing

To run the Vitest test suite:
```bash
npm run test
```
For coverage:
```bash
npm run test:coverage
```