# 🤖 Hepeng Bot - WhatsApp Finance Tracker

Hepeng Bot adalah bot WhatsApp pribadi untuk mempermudah pencatatan pengeluaran dan pemasukan secara langsung melalui chat. Seluruh data disimpan di Google Sheets secara otomatis.

## ✨ Fitur Utama

- 💸 **Pencatatan Pengeluaran & Pemasukan:** Format pesan natural yang mudah diingat.
- 📊 **Laporan Bulanan & Tahunan:** Ringkasan keuangan langsung di WhatsApp.
- ⚡ **Rekap Cepat:** Lihat saldo bulan ini hanya dengan satu kata.
- 🗑️ **Fitur Undo:** Salah catat? Batalkan transaksi terakhir dengan mudah.
- 🔒 **Role Access:** Hanya owner yang bisa menambah/menghapus data.

## 🚀 Persiapan & Instalasi

### 1. Prasyarat
- Node.js v20 atau lebih baru.
- Akun Google Cloud untuk akses Google Sheets API.
- WhatsApp yang aktif untuk discan QR-nya.

### 2. Setup Google Sheets
1. Buat Google Sheet baru.
2. Buat sheet/tab bernama **"Transaksi"**.
3. Pastikan kolom-kolomnya sesuai (lihat `AGENT.md` untuk detail teknis).
4. Share sheet tersebut ke email Service Account Google Cloud Anda (dengan akses Editor).

### 3. Konfigurasi Environment
Salin `.env.example` menjadi `.env` dan isi variabel berikut:
```env
GOOGLE_SHEET_ID=ID_SHEET_ANDA
OWNER_NUMBERS=628123456789,628987654321
GOOGLE_CREDENTIALS={"type":"service_account",...}
```

### 4. Menjalankan Bot
```bash
# Install dependencies
pnpm install

# Jalankan mode development
pnpm run dev
```
Scan QR code yang muncul di terminal menggunakan WhatsApp Anda (Linked Devices).

## 📝 Panduan Penggunaan

### 💸 Mencatat Pengeluaran
Format: `- [jumlah] [kategori] [sub kategori] [item] [metode?]`
Contoh:
- `- 50rb Makanan Luar The Grace`
- `- 1.5jt Perlengkapan Fashion Baju Lebaran jago`
- `keluar 400rb Transportasi Ojol Transport CC bca`
- `29 mar keluar 880rb Medical Rawat Jalan Dokter mandiri`

### 💰 Mencatat Pemasukan
Format: `+ [jumlah] [kategori] [sub kategori] [item] [metode?]`
Contoh:
- `+ 20jt Main Job Monthly Salary bca`
- `+ 500rb Lainnya Misc Cashback`
- `masuk 20jt Main Job Monthly Salary bca`

### 📊 Laporan & Rekap
- `rekap` - Ringkasan cepat bulan ini.
- `laporan` - Laporan detail bulan ini.
- `laporan mar` - Laporan detail bulan Maret.
- `laporan 2025` - Laporan tahunan 2025.

### 🗑️ Batalkan Transaksi
- `batal` atau `undo` - Menghapus baris transaksi terakhir dari Google Sheet.

### ❓ Bantuan
- `bantuan`, `help`, atau `?` - Menampilkan daftar perintah.

## 🧪 Testing
```bash
pnpm run test
```

## 🌿 Strategi Branching
- `main-dev` - Branch utama untuk pengembangan. Semua fitur baru dan perbaikan bug harus di-merge ke sini terlebih dahulu.
- `main` - Branch untuk produksi/deployment. Lakukan merge dari `main-dev` ke `main` ketika siap untuk deploy ke lingkungan produksi.

## 📄 Lisensi
MIT
