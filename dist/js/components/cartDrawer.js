import { FREE_SHIPPING_THRESHOLD } from '../state/store.js';
import { escapeHtml, formatRupiah } from '../utils/format.js';
export class CartDrawer {
    store;
    toast;
    onProceedCheckout;
    rootEl = null;
    itemsEl = null;
    summaryEl = null;
    checkoutBtn = null;
    headerBadgeEl = null;
    mobileBarEl = null;
    mobileSummaryEl = null;
    constructor(store, toast, onProceedCheckout) {
        this.store = store;
        this.toast = toast;
        this.onProceedCheckout = onProceedCheckout;
    }
    init() {
        this.rootEl = document.getElementById('cart-drawer-root');
        this.itemsEl = document.getElementById('cart-items-list');
        this.summaryEl = document.getElementById('cart-summary-box');
        this.checkoutBtn = document.getElementById('cart-checkout-btn');
        this.headerBadgeEl = document.getElementById('header-cart-badge');
        this.mobileBarEl = document.getElementById('mobile-cart-bar');
        this.mobileSummaryEl = document.getElementById('mobile-cart-summary');
        document.getElementById('open-cart-btn')?.addEventListener('click', () => this.open());
        document.getElementById('mobile-open-cart-btn')?.addEventListener('click', () => this.open());
        document.getElementById('close-cart-btn')?.addEventListener('click', () => this.close());
        document.getElementById('cart-backdrop')?.addEventListener('click', () => this.close());
        document.getElementById('cart-clear-btn')?.addEventListener('click', () => {
            this.store.clearCart();
            this.toast.show('Keranjang dikosongkan.', 'info');
        });
        this.checkoutBtn?.addEventListener('click', () => {
            if (this.store.getCart().length === 0) {
                this.toast.show('Keranjang masih kosong. Pilih gorengan dulu yuk!', 'warning');
                return;
            }
            this.close();
            this.onProceedCheckout();
        });
        this.store.subscribe(() => {
            this.render();
        });
        this.render();
    }
    open() {
        if (!this.rootEl)
            return;
        this.rootEl.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    }
    close() {
        if (!this.rootEl)
            return;
        this.rootEl.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
    render() {
        const cart = this.store.getCart();
        const totals = this.store.getTotals('delivery');
        if (this.headerBadgeEl) {
            this.headerBadgeEl.textContent = totals.itemCount.toString();
            this.headerBadgeEl.classList.toggle('hidden', totals.itemCount === 0);
            this.headerBadgeEl.classList.toggle('inline-flex', totals.itemCount > 0);
        }
        if (this.mobileBarEl && this.mobileSummaryEl) {
            this.mobileBarEl.classList.toggle('hidden', totals.itemCount === 0);
            this.mobileSummaryEl.textContent = `${totals.itemCount} item • ${formatRupiah(totals.subtotal)}`;
        }
        if (!this.itemsEl || !this.summaryEl || !this.checkoutBtn)
            return;
        if (cart.length === 0) {
            this.itemsEl.innerHTML = `
        <div class="py-16 text-center px-4">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl mb-4">🧺</div>
          <h3 class="text-base font-bold font-heading text-stone-900 dark:text-white">Keranjang Masih Kosong</h3>
          <p class="text-xs text-stone-500 dark:text-stone-400 mt-1.5 max-w-[240px] mx-auto">Pilih gorengan favorit Anda dari katalog untuk mulai memesan.</p>
        </div>
      `;
            this.summaryEl.innerHTML = '';
            this.checkoutBtn.disabled = true;
            return;
        }
        this.checkoutBtn.disabled = false;
        this.itemsEl.innerHTML = cart
            .map((item) => {
            const product = this.store.getProductById(item.productId);
            if (!product)
                return '';
            const lineTotal = product.price * item.quantity;
            return `
          <div class="flex gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700/70">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-16 h-16 rounded-xl object-cover shrink-0 bg-amber-50">
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <h4 class="text-sm font-bold text-stone-900 dark:text-white truncate">${escapeHtml(product.name)}</h4>
                <button type="button" data-cart-remove="${escapeHtml(product.id)}" aria-label="Hapus ${escapeHtml(product.name)}" class="text-stone-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
              <div class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">${escapeHtml(formatRupiah(product.price))} &bull; ${escapeHtml(product.unit)}</div>
              <div class="mt-2.5 flex items-center justify-between">
                <div class="inline-flex items-center gap-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5">
                  <button type="button" data-cart-dec="${escapeHtml(product.id)}" class="w-7 h-7 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold cursor-pointer">-</button>
                  <span class="w-6 text-center text-xs font-bold text-stone-900 dark:text-white tabular-nums">${item.quantity}</span>
                  <button type="button" data-cart-inc="${escapeHtml(product.id)}" class="w-7 h-7 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold cursor-pointer">+</button>
                </div>
                <span class="text-sm font-bold text-amber-700 dark:text-amber-400">${escapeHtml(formatRupiah(lineTotal))}</span>
              </div>
            </div>
          </div>
        `;
        })
            .join('');
        const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - totals.subtotal);
        const shippingHint = totals.qualifiesFreeShipping
            ? `<div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium text-emerald-700 dark:text-emerald-300">Gratis ongkir kurir instan aktif!</div>`
            : `<div class="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">Tambah <strong>${escapeHtml(formatRupiah(remainingForFreeShipping))}</strong> lagi untuk gratis ongkir kurir instan.</div>`;
        this.summaryEl.innerHTML = `
      ${shippingHint}
      <div class="space-y-1.5 text-sm pt-1">
        <div class="flex justify-between text-stone-600 dark:text-stone-400">
          <span>Subtotal (${totals.itemCount} item)</span>
          <span class="font-semibold text-stone-900 dark:text-white">${escapeHtml(formatRupiah(totals.subtotal))}</span>
        </div>
        <div class="flex justify-between text-stone-600 dark:text-stone-400">
          <span>Kemasan Food Grade</span>
          <span class="font-semibold text-stone-900 dark:text-white">${escapeHtml(formatRupiah(totals.packagingFee))}</span>
        </div>
        <div class="flex justify-between text-stone-600 dark:text-stone-400">
          <span>Estimasi Ongkir Kurir</span>
          <span class="font-semibold ${totals.deliveryFee === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-900 dark:text-white'}">${totals.deliveryFee === 0 ? 'Gratis' : escapeHtml(formatRupiah(totals.deliveryFee))}</span>
        </div>
        <div class="flex justify-between pt-2 border-t border-stone-200 dark:border-stone-800 text-base font-extrabold font-heading text-stone-900 dark:text-white">
          <span>Total Estimasi</span>
          <span class="text-amber-700 dark:text-amber-400">${escapeHtml(formatRupiah(totals.total))}</span>
        </div>
      </div>
    `;
        this.bindCartItemButtons();
    }
    bindCartItemButtons() {
        if (!this.itemsEl)
            return;
        this.itemsEl.querySelectorAll('[data-cart-dec]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.cartDec;
                if (id)
                    this.store.addToCart(id, -1);
            });
        });
        this.itemsEl.querySelectorAll('[data-cart-inc]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.cartInc;
                if (!id)
                    return;
                const res = this.store.addToCart(id, 1);
                if (!res.ok && res.message)
                    this.toast.show(res.message, 'warning');
            });
        });
        this.itemsEl.querySelectorAll('[data-cart-remove]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.cartRemove;
                if (id)
                    this.store.removeFromCart(id);
            });
        });
    }
}
//# sourceMappingURL=cartDrawer.js.map