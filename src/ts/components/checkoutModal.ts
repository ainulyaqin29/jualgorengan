import { PAYMENT_CHANNELS, PAYMENT_METHOD_LABELS, renderQrisSvg } from '../data/payments.js';
import { validateCheckoutForm, validatePaymentProofFile } from '../services/validation.js';
import { AppStore } from '../state/store.js';
import { DeliveryMethod, PaymentMethod, PaymentProof } from '../types/index.js';
import { escapeHtml, formatFileSize, formatRupiah } from '../utils/format.js';
import { AuthModal } from './authModal.js';
import { InvoiceModal } from './invoiceModal.js';
import { ToastManager } from './toast.js';

export class CheckoutModal {
  private readonly store: AppStore;
  private readonly toast: ToastManager;
  private readonly invoiceModal: InvoiceModal;
  private readonly authModal: AuthModal;

  private deliveryMethod: DeliveryMethod = 'delivery';
  private paymentMethod: PaymentMethod = 'qris';
  private selectedChannelId = 'qris-utama';
  private uploadedProof: PaymentProof | null = null;

  private rootEl: HTMLElement | null = null;
  private summaryEl: HTMLElement | null = null;
  private paymentDetailEl: HTMLElement | null = null;
  private proofPreviewEl: HTMLElement | null = null;
  private addressWrapperEl: HTMLElement | null = null;
  private guestNoticeEl: HTMLElement | null = null;
  private proofInputEl: HTMLInputElement | null = null;

  constructor(
    store: AppStore,
    toast: ToastManager,
    invoiceModal: InvoiceModal,
    authModal: AuthModal
  ) {
    this.store = store;
    this.toast = toast;
    this.invoiceModal = invoiceModal;
    this.authModal = authModal;
  }

  public init(): void {
    this.rootEl = document.getElementById('checkout-modal-root');
    this.summaryEl = document.getElementById('checkout-order-summary');
    this.paymentDetailEl = document.getElementById('checkout-payment-detail');
    this.proofPreviewEl = document.getElementById('proof-preview-container');
    this.addressWrapperEl = document.getElementById('checkout-address-wrapper');
    this.guestNoticeEl = document.getElementById('checkout-guest-notice');
    this.proofInputEl = document.getElementById('payment-proof-input') as HTMLInputElement | null;

    document.getElementById('close-checkout-btn')?.addEventListener('click', () => this.close());
    document
      .getElementById('checkout-modal-backdrop')
      ?.addEventListener('click', () => this.close());

    document.getElementById('checkout-login-shortcut')?.addEventListener('click', () => {
      this.close();
      this.authModal.open('login');
    });

    document
      .querySelectorAll<HTMLInputElement>('input[name="deliveryMethod"]')
      .forEach((radio) => {
        radio.addEventListener('change', () => {
          this.deliveryMethod = radio.value === 'pickup' ? 'pickup' : 'delivery';
          this.addressWrapperEl?.classList.toggle('hidden', this.deliveryMethod === 'pickup');
          this.renderSummary();
          this.renderPaymentDetail();
        });
      });

    document.querySelectorAll<HTMLButtonElement>('[data-payment-method]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const method = btn.dataset.paymentMethod as PaymentMethod | undefined;
        if (!method) return;
        this.paymentMethod = method;
        const firstChannel = PAYMENT_CHANNELS.find((c) => c.method === method);
        this.selectedChannelId = firstChannel?.id ?? '';
        this.renderPaymentMethodTabs();
        this.renderPaymentDetail();
      });
    });

    this.bindFileUpload();

    document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  public open(): void {
    if (this.store.getCart().length === 0) {
      this.toast.show('Keranjang belanja masih kosong.', 'warning');
      return;
    }

    this.clearErrors();
    this.prefillFromSession();
    this.renderSummary();
    this.renderPaymentMethodTabs();
    this.renderPaymentDetail();
    this.renderProofPreview();

    this.rootEl?.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  public close(): void {
    this.rootEl?.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  private prefillFromSession(): void {
    const session = this.store.getSession();
    const nameInput = document.getElementById('checkout-name') as HTMLInputElement | null;
    const phoneInput = document.getElementById('checkout-phone') as HTMLInputElement | null;
    const addressInput = document.getElementById('checkout-address') as HTMLTextAreaElement | null;

    if (this.guestNoticeEl) {
      const isGuest = session === null;
      this.guestNoticeEl.classList.toggle('hidden', !isGuest);
      this.guestNoticeEl.classList.toggle('flex', isGuest);
    }

    if (session) {
      if (nameInput && !nameInput.value) nameInput.value = session.name;
      if (phoneInput && !phoneInput.value) phoneInput.value = session.phone;
      if (addressInput && !addressInput.value && session.defaultAddress) {
        addressInput.value = session.defaultAddress;
      }
    }
  }

  private renderSummary(): void {
    if (!this.summaryEl) return;

    const cart = this.store.getCart();
    const totals = this.store.getTotals(this.deliveryMethod);

    const itemsMarkup = cart
      .map((item) => {
        const product = this.store.getProductById(item.productId);
        if (!product) return '';
        return `
          <div class="flex justify-between gap-2 text-xs">
            <span class="text-stone-700 dark:text-stone-300">${item.quantity}&times; ${escapeHtml(
          product.name
        )}</span>
            <span class="font-semibold text-stone-900 dark:text-white shrink-0">${escapeHtml(
              formatRupiah(product.price * item.quantity)
            )}</span>
          </div>
        `;
      })
      .join('');

    this.summaryEl.innerHTML = `
      <div class="space-y-2 pb-3 border-b border-stone-200 dark:border-stone-700">${itemsMarkup}</div>
      <div class="space-y-1.5 pt-3 text-xs">
        <div class="flex justify-between text-stone-600 dark:text-stone-400">
          <span>Subtotal</span>
          <span>${escapeHtml(formatRupiah(totals.subtotal))}</span>
        </div>
        <div class="flex justify-between text-stone-600 dark:text-stone-400">
          <span>Kemasan Food Grade</span>
          <span>${escapeHtml(formatRupiah(totals.packagingFee))}</span>
        </div>
        <div class="flex justify-between text-stone-600 dark:text-stone-400">
          <span>Ongkos Kirim (${this.deliveryMethod === 'pickup' ? 'Ambil di Gerai' : 'Kurir'})</span>
          <span>${
            totals.deliveryFee === 0 ? 'Gratis' : escapeHtml(formatRupiah(totals.deliveryFee))
          }</span>
        </div>
        <div class="flex justify-between pt-2 border-t border-stone-200 dark:border-stone-700 text-base font-extrabold font-heading text-stone-900 dark:text-white">
          <span>Total Pembayaran</span>
          <span class="text-amber-700 dark:text-amber-400">${escapeHtml(
            formatRupiah(totals.total)
          )}</span>
        </div>
      </div>
    `;
  }

  private renderPaymentMethodTabs(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-payment-method]').forEach((btn) => {
      const isSelected = btn.dataset.paymentMethod === this.paymentMethod;
      btn.className = isSelected
        ? 'py-2.5 px-3 rounded-xl text-xs font-bold border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 cursor-pointer transition-all'
        : 'py-2.5 px-3 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-amber-400 cursor-pointer transition-all';
    });
  }

  private renderPaymentDetail(): void {
    if (!this.paymentDetailEl) return;

    const channels = PAYMENT_CHANNELS.filter((c) => c.method === this.paymentMethod);
    const activeChannel =
      channels.find((c) => c.id === this.selectedChannelId) ?? channels[0];
    if (!activeChannel) return;
    this.selectedChannelId = activeChannel.id;

    const totals = this.store.getTotals(this.deliveryMethod);
    const totalFormatted = formatRupiah(totals.total);

    const channelSelector =
      channels.length > 1
        ? `
          <div class="flex flex-wrap gap-2 mb-3">
            ${channels
              .map(
                (ch) => `
              <button type="button" data-channel-id="${escapeHtml(ch.id)}" class="px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                  ch.id === activeChannel.id
                    ? 'bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 border-stone-900 dark:border-amber-500'
                    : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }">
                ${escapeHtml(ch.shortName)}
              </button>
            `
              )
              .join('')}
          </div>
        `
        : '';

    const instructionBody =
      this.paymentMethod === 'qris'
        ? `
          ${renderQrisSvg(escapeHtml(totalFormatted))}
          <p class="mt-3 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">${escapeHtml(
            activeChannel.instructions
          )}</p>
        `
        : `
          <div class="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="text-[11px] font-semibold text-stone-500 dark:text-stone-400">${escapeHtml(
                activeChannel.shortName
              )} &bull; a.n. ${escapeHtml(activeChannel.accountName)}</div>
              <div class="text-base font-extrabold font-mono text-stone-900 dark:text-white tracking-wide mt-0.5">${escapeHtml(
                activeChannel.accountNumber
              )}</div>
            </div>
            <button type="button" id="copy-account-btn" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 cursor-pointer shrink-0 transition-colors">
              Salin
            </button>
          </div>
          <p class="mt-2.5 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">${escapeHtml(
            activeChannel.instructions
          )}</p>
        `;

    this.paymentDetailEl.innerHTML = `
      <div class="text-xs font-bold text-stone-800 dark:text-stone-200 mb-2">${escapeHtml(
        PAYMENT_METHOD_LABELS[this.paymentMethod]
      )}</div>
      ${channelSelector}
      ${instructionBody}
    `;

    this.paymentDetailEl.querySelectorAll<HTMLButtonElement>('[data-channel-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.channelId) {
          this.selectedChannelId = btn.dataset.channelId;
          this.renderPaymentDetail();
        }
      });
    });

    document.getElementById('copy-account-btn')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(activeChannel.accountNumber);
        this.toast.show(`Nomor ${activeChannel.shortName} disalin!`, 'success');
      } catch {
        this.toast.show(`Nomor tujuan: ${activeChannel.accountNumber}`, 'info');
      }
    });
  }

  private bindFileUpload(): void {
    const dropzone = document.getElementById('proof-dropzone');

    this.proofInputEl?.addEventListener('change', () => {
      const file = this.proofInputEl?.files?.[0] ?? null;
      this.processSelectedFile(file);
    });

    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-amber-500', 'bg-amber-50/70', 'dark:bg-amber-950/30');
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-amber-500', 'bg-amber-50/70', 'dark:bg-amber-950/30');
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-amber-500', 'bg-amber-50/70', 'dark:bg-amber-950/30');
        const file = e.dataTransfer?.files?.[0] ?? null;
        this.processSelectedFile(file);
      });
    }
  }

  private processSelectedFile(file: File | null): void {
    const errorEl = document.querySelector<HTMLElement>('[data-error-for="checkout-paymentProof"]');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }

    const validation = validatePaymentProofFile(file);
    if (!validation.valid || !file) {
      this.uploadedProof = null;
      this.renderProofPreview();
      if (this.proofInputEl) this.proofInputEl.value = '';
      if (errorEl && validation.error) {
        errorEl.textContent = validation.error;
        errorEl.classList.remove('hidden');
      }
      this.toast.show(validation.error ?? 'File bukti pembayaran tidak valid.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      this.uploadedProof = {
        fileName: file.name,
        fileType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png'),
        fileSize: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      this.renderProofPreview();
      this.toast.show('Bukti pembayaran siap diunggah.', 'success');
    };
    reader.onerror = () => {
      this.toast.show('Gagal membaca file. Coba pilih file lain.', 'error');
    };
    reader.readAsDataURL(file);
  }

  private renderProofPreview(): void {
    if (!this.proofPreviewEl) return;

    if (!this.uploadedProof) {
      this.proofPreviewEl.innerHTML = '';
      this.proofPreviewEl.classList.add('hidden');
      return;
    }

    this.proofPreviewEl.classList.remove('hidden');
    const isImage = this.uploadedProof.fileType.startsWith('image/');

    this.proofPreviewEl.innerHTML = `
      <div class="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">${escapeHtml(
              this.uploadedProof.fileName
            )}</div>
            <div class="text-[11px] text-emerald-700/80 dark:text-emerald-400">${escapeHtml(
              formatFileSize(this.uploadedProof.fileSize)
            )} &bull; Siap diverifikasi</div>
          </div>
          <button type="button" id="remove-proof-btn" class="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-stone-800 text-rose-600 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 cursor-pointer shrink-0">
            Hapus
          </button>
        </div>
        ${
          isImage
            ? `<img src="${this.uploadedProof.dataUrl}" alt="Preview bukti pembayaran" class="w-full max-h-44 object-contain rounded-xl bg-white border border-stone-200 dark:border-stone-700">`
            : `<div class="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                <div class="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0">PDF</div>
                <div class="text-xs text-stone-700 dark:text-stone-300">Dokumen PDF terlampir dan siap dikirim bersama pesanan.</div>
              </div>`
        }
      </div>
    `;

    document.getElementById('remove-proof-btn')?.addEventListener('click', () => {
      this.uploadedProof = null;
      if (this.proofInputEl) this.proofInputEl.value = '';
      this.renderProofPreview();
    });
  }

  private clearErrors(): void {
    document.querySelectorAll<HTMLElement>('[data-error-for^="checkout-"]').forEach((el) => {
      el.textContent = '';
      el.classList.add('hidden');
    });
  }

  private showErrors(errors: Record<string, string>): void {
    for (const [field, message] of Object.entries(errors)) {
      const target = document.querySelector<HTMLElement>(`[data-error-for="checkout-${field}"]`);
      if (target) {
        target.textContent = message;
        target.classList.remove('hidden');
      }
    }
  }

  private handleSubmit(): void {
    this.clearErrors();

    const customerName =
      (document.getElementById('checkout-name') as HTMLInputElement | null)?.value ?? '';
    const customerPhone =
      (document.getElementById('checkout-phone') as HTMLInputElement | null)?.value ?? '';
    const shippingAddress =
      (document.getElementById('checkout-address') as HTMLTextAreaElement | null)?.value ?? '';
    const notes =
      (document.getElementById('checkout-notes') as HTMLTextAreaElement | null)?.value ?? '';

    const validation = validateCheckoutForm({
      customerName,
      customerPhone,
      deliveryMethod: this.deliveryMethod,
      shippingAddress,
      paymentMethod: this.paymentMethod,
      paymentChannelId: this.selectedChannelId,
      hasProof: this.uploadedProof !== null,
    });

    if (!validation.valid || !this.uploadedProof) {
      this.showErrors(validation.errors);
      this.toast.show('Periksa kembali form pengiriman dan bukti pembayaran.', 'error');
      return;
    }

    const channel = PAYMENT_CHANNELS.find((c) => c.id === this.selectedChannelId);
    const result = this.store.placeOrder({
      customerName,
      customerPhone,
      deliveryMethod: this.deliveryMethod,
      shippingAddress,
      notes,
      paymentMethod: this.paymentMethod,
      paymentChannelLabel: channel?.label ?? PAYMENT_METHOD_LABELS[this.paymentMethod],
      paymentProof: this.uploadedProof,
    });

    if (!result.ok) {
      this.toast.show(result.message, 'error');
      return;
    }

    // Reset transient checkout proof & notes
    this.uploadedProof = null;
    if (this.proofInputEl) this.proofInputEl.value = '';
    const notesInput = document.getElementById('checkout-notes') as HTMLTextAreaElement | null;
    if (notesInput) notesInput.value = '';

    this.close();
    this.toast.show(`Pesanan ${result.order.id} berhasil dikonfirmasi!`, 'success');
    this.invoiceModal.open(result.order);
  }
}
