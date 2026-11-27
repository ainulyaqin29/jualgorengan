export const PAYMENT_METHOD_LABELS = {
    qris: 'QRIS Instan',
    bank_transfer: 'Transfer Bank',
    ewallet: 'E-Wallet',
};
export const PAYMENT_CHANNELS = [
    {
        id: 'qris-utama',
        method: 'qris',
        label: 'QRIS Nasional (Semua E-Wallet & M-Banking)',
        shortName: 'QRIS',
        accountNumber: 'ID1020304050607',
        accountName: 'GorenganKuy Nusantara',
        instructions: 'Scan kode QRIS di bawah menggunakan aplikasi BCA Mobile, Mandiri Livin, GoPay, OVO, DANA, atau ShopeePay sesuai total tagihan.',
    },
    {
        id: 'bank-bca',
        method: 'bank_transfer',
        label: 'Bank BCA - 8820 4419 23',
        shortName: 'BCA',
        accountNumber: '8820441923',
        accountName: 'PT GorenganKuy Nusantara',
        instructions: 'Transfer tepat hingga digit terakhir ke rekening BCA a.n. PT GorenganKuy Nusantara.',
    },
    {
        id: 'bank-mandiri',
        method: 'bank_transfer',
        label: 'Bank Mandiri - 1370 0098 2211 4',
        shortName: 'Mandiri',
        accountNumber: '1370009822114',
        accountName: 'PT GorenganKuy Nusantara',
        instructions: 'Transfer melalui ATM atau Livin by Mandiri ke rekening di atas.',
    },
    {
        id: 'ewallet-gopay',
        method: 'ewallet',
        label: 'GoPay - 0812 9988 7766',
        shortName: 'GoPay',
        accountNumber: '081299887766',
        accountName: 'GorenganKuy Official',
        instructions: 'Kirim saldo GoPay ke nomor resmi GorenganKuy Official lalu simpan screenshot bukti transfer.',
    },
    {
        id: 'ewallet-dana',
        method: 'ewallet',
        label: 'DANA / OVO - 0812 9988 7766',
        shortName: 'DANA / OVO',
        accountNumber: '081299887766',
        accountName: 'GorenganKuy Official',
        instructions: 'Kirim saldo DANA atau OVO ke nomor di atas dan unggah bukti transaksi.',
    },
];
export function renderQrisSvg(amountLabel) {
    return `
    <div class="flex flex-col items-center p-4 bg-white rounded-2xl border border-amber-200 shadow-inner">
      <div class="text-[11px] font-bold tracking-wider uppercase text-stone-700 mb-2">QRIS &bull; GorenganKuy Nusantara</div>
      <svg class="w-40 h-40 text-stone-900" viewBox="0 0 120 120" fill="none" aria-label="Kode QRIS Pembayaran">
        <rect width="120" height="120" rx="8" fill="#FFFFFF"/>
        <rect x="8" y="8" width="30" height="30" rx="4" stroke="#1C1917" stroke-width="5"/>
        <rect x="17" y="17" width="12" height="12" rx="2" fill="#1C1917"/>
        <rect x="82" y="8" width="30" height="30" rx="4" stroke="#1C1917" stroke-width="5"/>
        <rect x="91" y="17" width="12" height="12" rx="2" fill="#1C1917"/>
        <rect x="8" y="82" width="30" height="30" rx="4" stroke="#1C1917" stroke-width="5"/>
        <rect x="17" y="91" width="12" height="12" rx="2" fill="#1C1917"/>
        <path d="M46 10h8v8h-8zm12 0h8v14h-8zm12 8h6v10h-6zM46 26h10v8H46zm18 8h10v8H64zM10 46h12v8H10zm18 0h10v10H28zm16 0h12v12H44zm18 0h12v8H62zm20 0h12v10H82zm18 0h12v14h-12zM14 62h10v12H14zm18 4h8v8h-8zm14-2h14v10H46zm20 2h10v12H66zm16-4h10v8H82zm16 6h12v8H98zM46 82h10v10H46zm16 4h12v8H62zm20-4h10v12H82zm16 4h12v10H98zM46 100h14v10H46zm20-2h10v12H66zm18 4h14v8H84z" fill="#1C1917"/>
      </svg>
      <div class="mt-2 text-xs font-semibold text-amber-700">Nominal: ${amountLabel}</div>
    </div>
  `;
}
//# sourceMappingURL=payments.js.map