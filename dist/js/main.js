import { AuthModal } from './components/authModal.js';
import { CartDrawer } from './components/cartDrawer.js';
import { CatalogView } from './components/catalog.js';
import { CheckoutModal } from './components/checkoutModal.js';
import { InvoiceModal } from './components/invoiceModal.js';
import { ThemeManager } from './components/theme.js';
import { ToastManager } from './components/toast.js';
import { AppStore } from './state/store.js';
document.addEventListener('DOMContentLoaded', () => {
    const themeManager = new ThemeManager();
    themeManager.init();
    const toastManager = new ToastManager();
    toastManager.init();
    const store = new AppStore();
    const invoiceModal = new InvoiceModal();
    invoiceModal.init();
    const authModal = new AuthModal(store, toastManager, invoiceModal);
    authModal.init();
    const checkoutModal = new CheckoutModal(store, toastManager, invoiceModal, authModal);
    checkoutModal.init();
    const cartDrawer = new CartDrawer(store, toastManager, () => {
        checkoutModal.open();
    });
    cartDrawer.init();
    const catalogView = new CatalogView(store, toastManager);
    catalogView.init();
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear().toString();
    }
});
//# sourceMappingURL=main.js.map