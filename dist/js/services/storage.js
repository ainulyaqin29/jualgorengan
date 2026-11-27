const KEYS = {
    USERS: 'gorengankuy_users_v1',
    SESSION: 'gorengankuy_session_v1',
    CART: 'gorengankuy_cart_v1',
    ORDERS: 'gorengankuy_orders_v1',
    STOCK: 'gorengankuy_stock_v1',
};
export function hashPassword(raw) {
    // Deterministic lightweight hash for client-side demo auth persistence
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i += 1) {
        hash ^= raw.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return `gk_${(hash >>> 0).toString(16)}`;
}
function readJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw)
            return fallback;
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
export class StorageService {
    constructor() {
        this.ensureSeedUsers();
    }
    ensureSeedUsers() {
        const users = readJson(KEYS.USERS, []);
        if (users.length === 0) {
            const demoUser = {
                id: 'usr_demo_001',
                name: 'Budi Santoso',
                email: 'budi@gorengankuy.id',
                phone: '081234567890',
                passwordHash: hashPassword('gorengan123'),
                defaultAddress: 'Jl. Kemang Raya No. 45, Jakarta Selatan (Patokan: Sebelah Apotek Sehat)',
                createdAt: new Date().toISOString(),
            };
            writeJson(KEYS.USERS, [demoUser]);
        }
    }
    getUsers() {
        return readJson(KEYS.USERS, []);
    }
    findUserByEmail(email) {
        const normalized = email.trim().toLowerCase();
        return this.getUsers().find((u) => u.email.toLowerCase() === normalized);
    }
    createUser(data) {
        const existing = this.findUserByEmail(data.email);
        if (existing) {
            return { ok: false, message: 'Email sudah terdaftar. Silakan masuk ke akun Anda.' };
        }
        const newUser = {
            id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            phone: data.phone.trim(),
            passwordHash: hashPassword(data.password),
            defaultAddress: data.defaultAddress.trim(),
            createdAt: new Date().toISOString(),
        };
        const users = this.getUsers();
        users.push(newUser);
        writeJson(KEYS.USERS, users);
        const sessionUser = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            defaultAddress: newUser.defaultAddress,
        };
        this.setSession(sessionUser);
        return { ok: true, user: sessionUser };
    }
    authenticate(email, password) {
        const user = this.findUserByEmail(email);
        if (!user || user.passwordHash !== hashPassword(password)) {
            return { ok: false, message: 'Email atau kata sandi tidak sesuai.' };
        }
        const sessionUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            defaultAddress: user.defaultAddress,
        };
        this.setSession(sessionUser);
        return { ok: true, user: sessionUser };
    }
    getSession() {
        return readJson(KEYS.SESSION, null);
    }
    setSession(user) {
        if (!user) {
            localStorage.removeItem(KEYS.SESSION);
            return;
        }
        writeJson(KEYS.SESSION, user);
    }
    getCart() {
        return readJson(KEYS.CART, []);
    }
    saveCart(items) {
        writeJson(KEYS.CART, items);
    }
    getStockMap() {
        return readJson(KEYS.STOCK, {});
    }
    saveStockMap(stockMap) {
        writeJson(KEYS.STOCK, stockMap);
    }
    getOrders() {
        return readJson(KEYS.ORDERS, []);
    }
    getOrdersByUser(userId) {
        return this.getOrders()
            .filter((order) => order.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    saveOrder(order) {
        const orders = this.getOrders();
        orders.unshift(order);
        try {
            writeJson(KEYS.ORDERS, orders);
        }
        catch {
            // Fallback if localStorage quota is tight due to large base64 proof image
            const trimmedProofOrder = {
                ...order,
                paymentProof: {
                    ...order.paymentProof,
                    dataUrl: '',
                },
            };
            const existing = this.getOrders();
            existing.unshift(trimmedProofOrder);
            writeJson(KEYS.ORDERS, existing);
        }
    }
}
//# sourceMappingURL=storage.js.map