import { PRODUCT_CATEGORIES } from '../data/products.js';
import { escapeHtml, formatRupiah } from '../utils/format.js';
export class CatalogView {
    store;
    toast;
    activeCategory = 'Semua';
    searchQuery = '';
    categoryContainer = null;
    gridContainer = null;
    searchInput = null;
    countLabel = null;
    constructor(store, toast) {
        this.store = store;
        this.toast = toast;
    }
    init() {
        this.categoryContainer = document.getElementById('catalog-categories');
        this.gridContainer = document.getElementById('catalog-grid');
        this.searchInput = document.getElementById('catalog-search');
        this.countLabel = document.getElementById('catalog-result-count');
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                this.searchQuery = this.searchInput?.value.trim().toLowerCase() ?? '';
                this.renderGrid();
            });
        }
        this.store.subscribe(() => {
            this.renderGrid();
        });
        this.renderCategories();
        this.renderGrid();
    }
    renderCategories() {
        if (!this.categoryContainer)
            return;
        this.categoryContainer.innerHTML = PRODUCT_CATEGORIES.map((category) => {
            const isActive = category === this.activeCategory;
            const baseClass = 'px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer border';
            const activeClass = isActive
                ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-md shadow-amber-500/20'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-amber-400';
            return `<button type="button" data-category="${escapeHtml(category)}" class="${baseClass} ${activeClass}">${escapeHtml(category)}</button>`;
        }).join('');
        this.categoryContainer.querySelectorAll('button[data-category]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const selected = btn.dataset.category;
                if (!selected)
                    return;
                this.activeCategory = selected;
                this.renderCategories();
                this.renderGrid();
            });
        });
    }
    getFilteredProducts() {
        return this.store.getProducts().filter((product) => {
            const matchCategory = this.activeCategory === 'Semua' || product.category === this.activeCategory;
            const matchQuery = this.searchQuery.length === 0 ||
                product.name.toLowerCase().includes(this.searchQuery) ||
                product.description.toLowerCase().includes(this.searchQuery) ||
                product.category.toLowerCase().includes(this.searchQuery);
            return matchCategory && matchQuery;
        });
    }
    getStockBadge(stock) {
        if (stock <= 0) {
            return {
                label: 'Stok Habis',
                classes: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60',
            };
        }
        if (stock <= 10) {
            return {
                label: `Sisa ${stock}`,
                classes: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
            };
        }
        return {
            label: `Tersedia (${stock})`,
            classes: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
        };
    }
    renderGrid() {
        if (!this.gridContainer)
            return;
        const filtered = this.getFilteredProducts();
        if (this.countLabel) {
            this.countLabel.textContent = `Menampilkan ${filtered.length} menu pilihan`;
        }
        if (filtered.length === 0) {
            this.gridContainer.innerHTML = `
        <div class="col-span-full py-14 text-center rounded-3xl bg-white/80 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
          <div class="text-4xl mb-3">🥟</div>
          <h3 class="text-lg font-bold font-heading text-stone-900 dark:text-white">Menu tidak ditemukan</h3>
          <p class="text-sm text-stone-500 dark:text-stone-400 mt-1">Coba kata kunci lain atau pilih kategori Semua.</p>
        </div>
      `;
            return;
        }
        this.gridContainer.innerHTML = filtered
            .map((product) => {
            const inCartQty = this.store.getCartQuantity(product.id);
            const stockInfo = this.getStockBadge(product.stock);
            const isOutOfStock = product.stock <= 0;
            const actionMarkup = isOutOfStock
                ? `<button type="button" disabled class="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-500 cursor-not-allowed">Stok Sedang Habis</button>`
                : inCartQty > 0
                    ? `
            <div class="flex items-center justify-between gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 rounded-xl p-1">
              <button type="button" data-action="dec" data-id="${escapeHtml(product.id)}" aria-label="Kurangi jumlah ${escapeHtml(product.name)}" class="w-9 h-9 rounded-lg bg-white dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 text-stone-900 dark:text-white font-bold text-base shadow-xs cursor-pointer transition-colors">-</button>
              <span class="text-sm font-bold text-stone-900 dark:text-amber-200 tabular-nums">${inCartQty} di keranjang</span>
              <button type="button" data-action="inc" data-id="${escapeHtml(product.id)}" aria-label="Tambah jumlah ${escapeHtml(product.name)}" class="w-9 h-9 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-base shadow-xs cursor-pointer transition-colors">+</button>
            </div>
          `
                    : `
            <button type="button" data-action="add" data-id="${escapeHtml(product.id)}" class="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 shadow-sm shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4"/></svg>
              <span>Tambah ke Keranjang</span>
            </button>
          `;
            return `
          <article class="group flex flex-col rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-400/70 transition-all duration-200 ${isOutOfStock ? 'opacity-75' : ''}">
            <div class="relative aspect-[16/11] bg-amber-50 dark:bg-stone-800 overflow-hidden">
              <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
              <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-900/80 text-amber-300 backdrop-blur-xs">${escapeHtml(product.category)}</span>
                ${product.badge
                ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-stone-950 shadow-xs">${escapeHtml(product.badge)}</span>`
                : ''}
              </div>
              <span class="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${stockInfo.classes}">
                ${escapeHtml(stockInfo.label)}
              </span>
            </div>

            <div class="p-5 flex-1 flex flex-col justify-between gap-4">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-base sm:text-lg font-bold font-heading text-stone-900 dark:text-white leading-snug">${escapeHtml(product.name)}</h3>
                </div>
                <p class="mt-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-2">${escapeHtml(product.description)}</p>
              </div>

              <div class="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3">
                <div class="flex items-baseline justify-between">
                  <div>
                    <span class="text-lg sm:text-xl font-extrabold font-heading text-amber-700 dark:text-amber-400">${escapeHtml(formatRupiah(product.price))}</span>
                    <span class="text-xs text-stone-500 dark:text-stone-400 ml-1">${escapeHtml(product.unit)}</span>
                  </div>
                  <span class="text-[11px] font-medium text-stone-500 dark:text-stone-400">&plusmn; ${product.prepMinutes} mnt</span>
                </div>
                ${actionMarkup}
              </div>
            </div>
          </article>
        `;
        })
            .join('');
        this.bindCardActions();
    }
    bindCardActions() {
        if (!this.gridContainer)
            return;
        this.gridContainer.querySelectorAll('button[data-action]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.id;
                const action = btn.dataset.action;
                if (!productId || !action)
                    return;
                const delta = action === 'dec' ? -1 : 1;
                const result = this.store.addToCart(productId, delta);
                if (!result.ok && result.message) {
                    this.toast.show(result.message, 'warning');
                    return;
                }
                if (action === 'add') {
                    const product = this.store.getProductById(productId);
                    this.toast.show(`${product?.name ?? 'Produk'} ditambahkan ke keranjang.`, 'success');
                }
            });
        });
    }
}
//# sourceMappingURL=catalog.js.map