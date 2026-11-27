import { escapeHtml } from '../utils/format.js';
export class ToastManager {
    container = null;
    init() {
        this.container = document.getElementById('toast-container');
    }
    show(message, type = 'info', durationMs = 3400) {
        if (!this.container) {
            this.container = document.getElementById('toast-container');
        }
        if (!this.container)
            return;
        const palette = {
            success: {
                bg: 'bg-emerald-600 text-white border-emerald-500',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>',
            },
            error: {
                bg: 'bg-rose-600 text-white border-rose-500',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>',
            },
            warning: {
                bg: 'bg-amber-500 text-stone-950 border-amber-400',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.65 18.5h16.7a1 1 0 00.86-1.5l-7.5-13a1 1 0 00-1.72 0z"/>',
            },
            info: {
                bg: 'bg-stone-900 text-white border-stone-700 dark:bg-stone-800',
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/>',
            },
        };
        const style = palette[type];
        const toast = document.createElement('div');
        toast.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium transition-all duration-200 translate-y-2 opacity-0 ${style.bg}`;
        toast.setAttribute('role', 'status');
        toast.innerHTML = `
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">${style.icon}</svg>
      <span>${escapeHtml(message)}</span>
    `;
        this.container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        });
        window.setTimeout(() => {
            toast.classList.add('translate-y-2', 'opacity-0');
            window.setTimeout(() => {
                toast.remove();
            }, 220);
        }, durationMs);
    }
}
//# sourceMappingURL=toast.js.map