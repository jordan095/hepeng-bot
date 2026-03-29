// src/config/constants.ts - Categories and payment methods from reference spreadsheet

export const BULAN_MAP: Record<string, number> = {
    jan: 1, januari: 1,
    feb: 2, februari: 2,
    mar: 3, maret: 3,
    apr: 4, april: 4,
    mei: 5, may: 5,
    jun: 6, juni: 6,
    jul: 7, juli: 7,
    agu: 8, agus: 8, agustus: 8,
    sep: 9, sept: 9, september: 9,
    okt: 10, oktober: 10,
    nov: 11, november: 11,
    des: 12, desember: 12, dec: 12, december: 12
};

// Categories and sub-categories from the reference spreadsheet
export const KATEGORI_PENGELUARAN: Record<string, string[]> = {
    'Administrasi': ['Kartu Kredit', 'Pajak'],
    'Asuransi': ['Proteksi'],
    'Donasi': ['Charity'],
    'Investasi': ['Goal'],
    'Kredit': ['Goal'],
    'Learning': ['Personal Development', 'Sekolah Anak', 'Sewa', 'Les Renang'],
    'Liburan': ['Tiket', 'Sewa'],
    'Makanan': ['Belanja', 'Luar'],
    'Medical': ['Kesehatan', 'Obat', 'Rawat Inap', 'Rawat Jalan'],
    'Peralatan': ['Elektronik', 'Furnitur', 'Pertukangan'],
    'Perlengkapan': ['Alat Tulis Kantor', 'Anak', 'Bahan material', 'Dapur', 'Elektronik', 'Fashion', 'Furnitur', 'Kebersihan', 'Olahraga'],
    'Persembahan': ['Durung-durung'],
    'Rumah': ['Iuran', 'Listrik', 'Internet', 'PDAM'],
    'Service': ['Jasa', 'Laundry', 'Parawatan & Kecantikan', 'Subscription', 'Telepon', 'Olahraga'],
    'Sosial': ['Arisan', 'Dansos', 'Oleh-oleh / Kado', 'Sosial', 'Tumpak'],
    'Transportasi': ['BBM', 'Ojol', 'Parkir', 'Pengiriman', 'Servis', 'Sparepart'],
};

export const KATEGORI_PEMASUKAN: Record<string, string[]> = {
    'Main Job': ['Monthly Salary', 'THR', 'Bonus'],
    'Lainnya': ['Misc'],
};

// All valid kategori names (for fuzzy matching)
export const ALL_KATEGORI_PENGELUARAN = Object.keys(KATEGORI_PENGELUARAN);
export const ALL_KATEGORI_PEMASUKAN = Object.keys(KATEGORI_PEMASUKAN);

// Payment methods - order matters for matching (longer first)
export const METODE_KEYWORDS: Record<string, string> = {
    'cc visa bca': 'CC VISA BCA',
    'cc bca': 'CC VISA BCA',
    'mandiri': 'Mandiri',
    'transfer': 'Transfer',
    'jago': 'Jago',
    'cash': 'Cash',
    'tunai': 'Cash',
    'bca': 'BCA',
};

export const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
