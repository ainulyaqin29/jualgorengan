import { PAYMENT_METHOD_LABELS } from '../data/payments.js';
import { Order } from '../types/index.js';
import { escapeHtml, formatDateTime, formatFileSize, formatRupiah } from '../utils/format.js';

export class InvoiceModal {
  private rootEl: HTMLElement | null = null;
  private bodyEl: HTMLElement | null = null;

  public init(): void {
    this.rootEl = document.getElementById('invoice-modal-root');
    this.bodyEl = document.getElementById('invoice-modal-body');

    document.getElementById('close-invoice-btn')?.addEventListener('click', () => this.close());
    document.getElementById('invoice-modal-backdrop')?.addEventListener('click', () => this.close());
    document.getElementById('invoice-done-btn')?.addEventListener('click', () => this.close());
    document.getElementById('invoice-print-btn')?.addEventListener('click', () => {
      window.print();
    });
  }

  public open(order: Order): void {
    if (!this.rootEl || !this.bodyEl) return;

    const isImageProof = order.paymentProof.fileType.startsWith('image/') && order.paymentProof.dataUrl;
    const proofPreviewHtml = isImageProof
      ? `<img src="${order.paymentProof.dataUrl}" alt="Bukti pembayaran ${escapeHtml(
          order.paymentProof.fileName
        )}" class="w-full max-h-48 object-contain rounded-xl border border-stone-200 dark:border-stone-700 bg-white">`
      : `<div class="flex items-center gap-3 p-3 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <div class="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">PDF</div>
          <div class="min-w-0">
            <div class="text-xs font-bold text-stone-900 dark:text-white truncate">${escapeHtml(
              order.paymentProof.fileName
            )}</div>
            <div class="text-[11px] text-stone-500">${escapeHtml(
              formatFileSize(order.paymentProof.fileSize)
            )}</div>
          </div>
        </div>`;

    this.bodyEl.innerHTML = `
      <div class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <div>
            <div class="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Nota Pesanan Resmi</div>
            <div class="text-lg font-extrabold font-heading text-stone-900 dark:text-white mt-0.5">${escapeHtml(
              order.id
            )}</div>
            <div class="text-xs text-stone-600 dark:text-stone-400 mt-0.5">${escapeHtml(
              formatDateTime(order.createdAt)
            )}</div>
          </div>
          <span class="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/50">
            ${escapeHtml(order.status)}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/70 space-y-1.5">
            <div class="font-bold text-stone-900 dark:text-white uppercase tracking-wider text-[11px]">Info Penerima</div>
            <p class="font-semibold text-stone-800 dark:text-stone-200">${escapeHtml(order.customerName)}</p>
            <p class="text-stone-600 dark:text-stone-400">WA: ${escapeHtml(order.customerPhone)}</p>
            <p class="text-stone-600 dark:text-stone-400">${
              order.deliveryMethod === 'pickup' ? 'Ambil di Gerai' : 'Kurir Instan'
            }: ${escapeHtml(order.shippingAddress)}</p>
            ${
              order.notes
                ? `<p class="text-amber-700 dark:text-amber-300 pt-1">Catatan: "${escapeHtml(order.notes)}"</p>`
                : ''
            }
          </div>

          <div class="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/70 space-y-1.5">
            <div class="font-bold text-stone-900 dark:text-white uppercase tracking-wider text-[11px]">Pembayaran</div>
            <p class="font-semibold text-stone-800 dark:text-stone-200">${escapeHtml(
              PAYMENT_METHOD_LABELS[order.paymentMethod]
            )}</p>
            <p class="text-stone-600 dark:text-stone-400">${escapeHtml(order.paymentChannelLabel)}</p>
            <p class="text-stone-500 dark:text-stone-400 pt-1">File Bukti: ${escapeHtml(
              order.paymentProof.fileName
            )} (${escapeHtml(formatFileSize(order.paymentProof.fileSize))})</p>
          </div>
        </div>

        <div class="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
          <div class="px-4 py-2.5 bg-stone-100 dark:bg-stone-800/80 text-xs font-bold text-stone-700 dark:text-stone-300 flex justify-between">
            <span>Rincian Menu</span>
            <span>Subtotal</span>
          </div>
          <div class="divide-y divide-stone-100 dark:divide-stone-800 px-4">
            ${order.items
              .map(
                (item) => `
              <div class="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div>
                  <div class="font-semibold text-stone-900 dark:text-white">${escapeHtml(
                    item.productName
                  )}</div>
                  <div class="text-xs text-stone-500 dark:text-stone-400">${
                    item.quantity
                  } &times; ${escapeHtml(formatRupiah(item.price))} (${escapeHtml(item.unit)})</div>
                </div>
                <div class="font-bold text-stone-900 dark:text-white">${escapeHtml(
                  formatRupiah(item.subtotal)
                )}</div>
              </div>
            `
              )
              .join('')}
          </div>
          <div class="px-4 py-3 bg-stone-50 dark:bg-stone-900/60 border-t border-stone-200 dark:border-stone-800 space-y-1.5 text-xs">
            <div class="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Subtotal Menu</span>
              <span>${escapeHtml(formatRupiah(order.subtotal))}</span>
            </div>
            <div class="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Kemasan Food Grade</span>
              <span>${escapeHtml(formatRupiah(order.packagingFee))}</span>
            </div>
            <div class="flex justify-between text-stone-600 dark:text-stone-400">
              <span>Ongkos Kirim</span>
              <span>${
                order.deliveryFee === 0 ? 'Gratis' : escapeHtml(formatRupiah(order.deliveryFee))
              }</span>
            </div>
            <div class="flex justify-between pt-2 border-t border-stone-200 dark:border-stone-700 text-sm sm:text-base font-extrabold font-heading text-stone-900 dark:text-white">
              <span>Total Dibayar</span>
              <span class="text-amber-700 dark:text-amber-400">${escapeHtml(
                formatRupiah(order.total)
              )}</span>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-xs font-bold text-stone-700 dark:text-stone-300">Lampiran Bukti Pembayaran</div>
          ${proofPreviewHtml}
        </div>
      </div>
    `;

    this.rootEl.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  public close(): void {
    if (!this.rootEl) return;
    this.rootEl.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}
