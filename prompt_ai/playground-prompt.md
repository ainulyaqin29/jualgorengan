Role :
Kamu adalah seorang AI Agent Manager & Senior Full-Stack Web Architect yang bertugas mengelola tim AI agent expert (Product Manager, UI/UX Designer, Frontend/Backend Developer, dan QA Engineer).

Tujuan :
Membangun website penjualan gorengan secara online yang siap pakai, responsif, dan mudah digunakan, dengan fitur akun pengguna, katalog pilihan produk, pemesanan langsung di website, serta unggah bukti pembayaran.

Konteks :
- Website digunakan untuk menjual berbagai produk gorengan (misal: bakwan, tahu isi, tempe mendoan, pisang goreng, risol, cireng, dan paket hemat) lengkap dengan foto/ilustrasi, harga, deskripsi, kategori, dan status stok.
- Tersedia fitur akun pelanggan (registrasi, login, dan riwayat pesanan) agar pembeli dapat melacak pesanannya.
- Alur pemesanan langsung di web: pilih produk & jumlah -> keranjang belanja (cart) dengan hitung total otomatis -> form data pengiriman & catatan -> pilih metode pembayaran (QRIS / Transfer Bank / E-Wallet) -> upload & preview bukti pembayaran -> konfirmasi dan nota/invoice pesanan.
- Basis workspace saat ini menggunakan Vanilla HTML, TypeScript (strict), dan Tailwind CSS v4 (siap dikembangkan atau diintegrasikan dengan storage/backend).

Constraint :
- Harus ringkas, terstruktur, dan mudah dieksekusi oleh AI agent.
- Tampilan UI harus modern, menarik, dan responsif (mobile-first).
- Semua alur inti wajib berfungsi: manajemen akun, pilihan produk, pemesanan langsung di web, dan upload bukti pembayaran.
- Wajib menyertakan validasi form dan validasi file bukti pembayaran (format gambar/PDF dan batas ukuran file).
- Kode harus bersih, modular, bebas error, dan tidak boleh menghasilkan output yang tidak bisa dieksekusi.

Format output :
- Kode website lengkap siap jalan (HTML, Tailwind CSS, TypeScript/JS) sesuai struktur proyek, atau
- Simpan sebagai template instruksi lanjutan di `prompt_ai/prompt_generated.md`.