import { validateLoginForm, validateRegisterForm } from '../services/validation.js';
import { AppStore } from '../state/store.js';
import { Order } from '../types/index.js';
import { escapeHtml, formatDateTime, formatRupiah } from '../utils/format.js';
import { InvoiceModal } from './invoiceModal.js';
import { ToastManager } from './toast.js';

type AuthTab = 'login' | 'register';

export class AuthModal {
  private readonly store: AppStore;
  private readonly toast: ToastManager;
  private readonly invoiceModal: InvoiceModal;

  private activeTab: AuthTab = 'login';
  private rootEl: HTMLElement | null = null;
  private headerBtnLabelEl: HTMLElement | null = null;
  private guestViewEl: HTMLElement | null = null;
  private accountViewEl: HTMLElement | null = null;

  constructor(store: AppStore, toast: ToastManager, invoiceModal: InvoiceModal) {
    this.store = store;
    this.toast = toast;
    this.invoiceModal = invoiceModal;
  }

  public init(): void {
    this.rootEl = document.getElementById('auth-modal-root');
    this.headerBtnLabelEl = document.getElementById('header-account-label');
    this.guestViewEl = document.getElementById('auth-guest-view');
    this.accountViewEl = document.getElementById('auth-account-view');

    document.getElementById('open-account-btn')?.addEventListener('click', () => this.open('login'));
    document.getElementById('hero-history-btn')?.addEventListener('click', () => this.open('login'));
    document.getElementById('close-auth-btn')?.addEventListener('click', () => this.close());
    document.getElementById('auth-modal-backdrop')?.addEventListener('click', () => this.close());

    document.getElementById('auth-tab-login')?.addEventListener('click', () => this.switchTab('login'));
    document
      .getElementById('auth-tab-register')
      ?.addEventListener('click', () => this.switchTab('register'));

    document.getElementById('fill-demo-account-btn')?.addEventListener('click', () => {
      const emailInput = document.getElementById('login-email') as HTMLInputElement | null;
      const passwordInput = document.getElementById('login-password') as HTMLInputElement | null;
      if (emailInput) emailInput.value = 'budi@gorengankuy.id';
      if (passwordInput) passwordInput.value = 'gorengan123';
      this.toast.show('Akun demo diisi. Klik Masuk untuk login.', 'info');
    });

    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    document.getElementById('register-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.store.logoutUser();
      this.toast.show('Anda telah keluar dari akun.', 'info');
      this.render();
    });

    this.store.subscribe(() => {
      this.renderHeaderButton();
      if (this.rootEl && !this.rootEl.classList.contains('hidden')) {
        this.render();
      }
    });

    this.renderHeaderButton();
    this.render();
  }

  public open(preferredTab: AuthTab = 'login'): void {
    this.activeTab = preferredTab;
    this.render();
    this.rootEl?.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  public close(): void {
    this.rootEl?.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  private switchTab(tab: AuthTab): void {
    this.activeTab = tab;
    this.renderGuestTabs();
  }

  private renderHeaderButton(): void {
    const session = this.store.getSession();
    if (!this.headerBtnLabelEl) return;
    if (session) {
      const firstName = session.name.split(' ')[0] || session.name;
      this.headerBtnLabelEl.textContent = firstName;
    } else {
      this.headerBtnLabelEl.textContent = 'Akun / Riwayat';
    }
  }

  private render(): void {
    const session = this.store.getSession();
    if (!this.guestViewEl || !this.accountViewEl) return;

    if (!session) {
      this.guestViewEl.classList.remove('hidden');
      this.accountViewEl.classList.add('hidden');
      this.renderGuestTabs();
      return;
    }

    this.guestViewEl.classList.add('hidden');
    this.accountViewEl.classList.remove('hidden');
    this.renderAccountProfile(session);
  }

  private renderGuestTabs(): void {
    const loginTabBtn = document.getElementById('auth-tab-login');
    const registerTabBtn = document.getElementById('auth-tab-register');
    const loginPanel = document.getElementById('login-form');
    const registerPanel = document.getElementById('register-form');

    const isLogin = this.activeTab === 'login';
    loginPanel?.classList.toggle('hidden', !isLogin);
    registerPanel?.classList.toggle('hidden', isLogin);

    if (loginTabBtn && registerTabBtn) {
      loginTabBtn.className = isLogin
        ? 'flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 text-stone-950 shadow-xs cursor-pointer'
        : 'flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer';
      registerTabBtn.className = !isLogin
        ? 'flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 text-stone-950 shadow-xs cursor-pointer'
        : 'flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer';
    }
  }

  private clearFormErrors(prefix: string): void {
    document.querySelectorAll<HTMLElement>(`[data-error-for^="${prefix}"]`).forEach((el) => {
      el.textContent = '';
      el.classList.add('hidden');
    });
  }

  private showFormErrors(prefix: string, errors: Record<string, string>): void {
    for (const [field, message] of Object.entries(errors)) {
      const target = document.querySelector<HTMLElement>(`[data-error-for="${prefix}-${field}"]`);
      if (target) {
        target.textContent = message;
        target.classList.remove('hidden');
      }
    }
  }

  private handleLogin(): void {
    this.clearFormErrors('login');
    const email = (document.getElementById('login-email') as HTMLInputElement | null)?.value ?? '';
    const password =
      (document.getElementById('login-password') as HTMLInputElement | null)?.value ?? '';

    const validation = validateLoginForm({ email, password });
    if (!validation.valid) {
      this.showFormErrors('login', validation.errors);
      return;
    }

    const result = this.store.loginUser(email, password);
    if (!result.ok) {
      this.showFormErrors('login', { general: result.message });
      return;
    }

    this.toast.show(`Selamat datang kembali, ${result.user.name}!`, 'success');
    this.render();
  }

  private handleRegister(): void {
    this.clearFormErrors('register');
    const name = (document.getElementById('register-name') as HTMLInputElement | null)?.value ?? '';
    const email = (document.getElementById('register-email') as HTMLInputElement | null)?.value ?? '';
    const phone = (document.getElementById('register-phone') as HTMLInputElement | null)?.value ?? '';
    const address =
      (document.getElementById('register-address') as HTMLTextAreaElement | null)?.value ?? '';
    const password =
      (document.getElementById('register-password') as HTMLInputElement | null)?.value ?? '';
    const confirmPassword =
      (document.getElementById('register-confirm') as HTMLInputElement | null)?.value ?? '';

    const validation = validateRegisterForm({
      name,
      email,
      phone,
      password,
      confirmPassword,
      address,
    });

    if (!validation.valid) {
      this.showFormErrors('register', validation.errors);
      return;
    }

    const result = this.store.registerUser({
      name,
      email,
      phone,
      password,
      defaultAddress: address,
    });

    if (!result.ok) {
      this.showFormErrors('register', { general: result.message });
      return;
    }

    this.toast.show(`Akun berhasil dibuat. Halo, ${result.user.name}!`, 'success');
    this.render();
  }

  private renderAccountProfile(session: {
    name: string;
    email: string;
    phone: string;
    defaultAddress: string;
  }): void {
    const profileBox = document.getElementById('account-profile-card');
    const ordersBox = document.getElementById('account-orders-list');

    if (profileBox) {
      profileBox.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 font-extrabold font-heading flex items-center justify-center text-lg">
            ${escapeHtml(session.name.charAt(0).toUpperCase())}
          </div>
          <div class="min-w-0">
            <div class="font-bold text-stone-900 dark:text-white truncate">${escapeHtml(session.name)}</div>
            <div class="text-xs text-stone-500 dark:text-stone-400 truncate">${escapeHtml(
              session.email
            )} &bull; ${escapeHtml(session.phone)}</div>
          </div>
        </div>
        ${
          session.defaultAddress
            ? `<p class="mt-3 text-xs text-stone-600 dark:text-stone-300 bg-white/80 dark:bg-stone-900/70 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">${escapeHtml(
                session.defaultAddress
              )}</p>`
            : ''
        }
      `;
    }

    if (!ordersBox) return;

    const orders = this.store.getUserOrders();
    if (orders.length === 0) {
      ordersBox.innerHTML = `
        <div class="p-6 text-center rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
          <p class="text-sm font-semibold text-stone-800 dark:text-stone-200">Belum ada riwayat pesanan</p>
          <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">Pesanan yang Anda buat saat login akan muncul di sini.</p>
        </div>
      `;
      return;
    }

    ordersBox.innerHTML = orders
      .map((order: Order) => {
        const itemSummary = order.items
          .map((item) => `${item.quantity}x ${item.productName}`)
          .join(', ');

        return `
          <div class="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div class="text-xs font-extrabold font-heading text-stone-900 dark:text-white">${escapeHtml(
                  order.id
                )}</div>
                <div class="text-[11px] text-stone-500 dark:text-stone-400">${escapeHtml(
                  formatDateTime(order.createdAt)
                )}</div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/40">
                ${escapeHtml(order.status)}
              </span>
            </div>
            <p class="text-xs text-stone-600 dark:text-stone-300 line-clamp-2">${escapeHtml(itemSummary)}</p>
            <div class="flex items-center justify-between pt-2 border-t border-stone-200/80 dark:border-stone-700/80">
              <div class="text-sm font-extrabold text-amber-700 dark:text-amber-400">${escapeHtml(
                formatRupiah(order.total)
              )}</div>
              <button type="button" data-view-invoice="${escapeHtml(
                order.id
              )}" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 hover:opacity-90 cursor-pointer transition-opacity">
                Lihat Nota
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    ordersBox.querySelectorAll<HTMLButtonElement>('[data-view-invoice]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const orderId = btn.dataset.viewInvoice;
        const found = orders.find((o) => o.id === orderId);
        if (found) {
          this.close();
          this.invoiceModal.open(found);
        }
      });
    });
  }
}
