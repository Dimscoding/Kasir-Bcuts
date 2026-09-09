# Kasir B.Cuts

Aplikasi kasir dan nota digital B.Cuts Barbershop. Versi 2 dibangun dengan React, TypeScript, Vite, dan Supabase.

## Fitur

- Login PIN karyawan melalui Supabase Auth
- Dashboard transaksi dan pendapatan
- Pembuatan transaksi serta struk PNG
- Berbagi nota ke WhatsApp
- Riwayat Januari–Desember, pencarian, dan filter status
- Export laporan CSV
- Pengelolaan layanan dan harga
- Pengaturan toko, rekening, e-wallet, dan QRIS
- Tampilan responsif untuk desktop dan handphone

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
```

Konfigurasi opsional tersedia di `.env.example`. Publishable key bawaan tetap dipertahankan agar deployment lama tidak terputus; untuk pengelolaan jangka panjang, isi variabel lingkungan di Vercel.
