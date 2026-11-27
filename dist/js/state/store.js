import { INITIAL_PRODUCTS } from '../data/products.js';
import { StorageService } from '../services/storage.js';
export const FREE_SHIPPING_THRESHOLD = 35000;
export const BASE_DELIVERY_FEE = 5000;
export const PACKAGING_FEE = 1000;
export class AppStore {
    storage;
    products;
    cart;
    session;
    listeners = new Set();
    constructor(storage = new StorageService()) {
        this.storage = storage;
        const savedStock = this.storage.getStockMap();
        this.products = INITIAL_PRODUCTS.map((p) => ({
            ...p,
            stock: typeof savedStock[p.id] === 'number' ? savedStock[p.id] : p.stock,
        }));
        this.cart = this.sanitizeCart(this.storage.getCart());
        this.session = this.storage.getSession();
    }
    sanitizeCart(rawCart) {
        const valid = [];
        for (const item of rawCart) {
            const product = this.products.find((p) => p.id === item.productId);
            if (product && product.stock > 0 && item.quantity > 0) {
                valid.push({
                    productId: product.id,
                    quantity: Math.min(item.quantity, product.stock),
                });
            }
        }
        return valid;
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    notify() {
        for (const listener of this.listeners) {
            listener();
        }
    }
    getProducts() {
        return this.products;
    }
    getProductById(productId) {
        return this.products.find((p) => p.id === productId);
    }
    getCart() {
        return this.cart;
    }
    getCartQuantity(productId) {
        return this.cart.find((item) => item.productId === productId)?.quantity ?? 0;
    }
    getTotals(deliveryMethod = 'delivery') {
        let itemCount = 0;
        let subtotal = 0;
        for (const item of this.cart) {
            const product = this.getProductById(item.productId);
            if (!product)
                continue;
            itemCount += item.quantity;
            subtotal += product.price * item.quantity;
        }
        if (itemCount === 0) {
            return {
                itemCount: 0,
                subtotal: 0,
                deliveryFee: 0,
                packagingFee: 0,
                total: 0,
                qualifiesFreeShipping: false,
            };
        }
        const qualifiesFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
        const deliveryFee = deliveryMethod === 'pickup' ? 0 : qualifiesFreeShipping ? 0 : BASE_DELIVERY_FEE;
        const packagingFee = PACKAGING_FEE;
        return {
            itemCount,
            subtotal,
            deliveryFee,
            packagingFee,
            total: subtotal + deliveryFee + packagingFee,
            qualifiesFreeShipping,
        };
    }
    addToCart(productId, delta = 1) {
        const product = this.getProductById(productId);
        if (!product) {
            return { ok: false, message: 'Produk tidak ditemukan.' };
        }
        if (product.stock <= 0) {
            return { ok: false, message: `${product.name} sedang habis.` };
        }
        const existing = this.cart.find((c) => c.productId === productId);
        const nextQty = (existing?.quantity ?? 0) + delta;
        if (nextQty > product.stock) {
            return {
                ok: false,
                message: `Stok ${product.name} tersisa ${product.stock}.`,
            };
        }
        if (nextQty <= 0) {
            this.cart = this.cart.filter((c) => c.productId !== productId);
        }
        else if (existing) {
            this.cart = this.cart.map((c) => c.productId === productId ? { ...c, quantity: nextQty } : c);
        }
        else {
            this.cart = [...this.cart, { productId, quantity: nextQty }];
        }
        this.storage.saveCart(this.cart);
        this.notify();
        return { ok: true };
    }
    setCartQuantity(productId, quantity) {
        const product = this.getProductById(productId);
        if (!product)
            return { ok: false, message: 'Produk tidak ditemukan.' };
        if (quantity <= 0) {
            this.removeFromCart(productId);
            return { ok: true };
        }
        if (quantity > product.stock) {
            return {
                ok: false,
                message: `Maksimal stok tersedia ${product.stock}.`,
            };
        }
        const existing = this.cart.find((c) => c.productId === productId);
        if (existing) {
            this.cart = this.cart.map((c) => c.productId === productId ? { ...c, quantity } : c);
        }
        else {
            this.cart = [...this.cart, { productId, quantity }];
        }
        this.storage.saveCart(this.cart);
        this.notify();
        return { ok: true };
    }
    removeFromCart(productId) {
        this.cart = this.cart.filter((c) => c.productId !== productId);
        this.storage.saveCart(this.cart);
        this.notify();
    }
    clearCart() {
        this.cart = [];
        this.storage.saveCart(this.cart);
        this.notify();
    }
    getSession() {
        return this.session;
    }
    registerUser(data) {
        const result = this.storage.createUser(data);
        if (result.ok) {
            this.session = result.user;
            this.notify();
        }
        return result;
    }
    loginUser(email, password) {
        const result = this.storage.authenticate(email, password);
        if (result.ok) {
            this.session = result.user;
            this.notify();
        }
        return result;
    }
    logoutUser() {
        this.storage.setSession(null);
        this.session = null;
        this.notify();
    }
    getUserOrders() {
        if (!this.session)
            return [];
        return this.storage.getOrdersByUser(this.session.id);
    }
    placeOrder(input) {
        if (this.cart.length === 0) {
            return { ok: false, message: 'Keranjang belanja masih kosong.' };
        }
        const orderItems = [];
        for (const item of this.cart) {
            const product = this.getProductById(item.productId);
            if (!product || product.stock < item.quantity) {
                return {
                    ok: false,
                    message: `Stok ${product?.name ?? 'produk'} tidak mencukupi.`,
                };
            }
            orderItems.push({
                productId: product.id,
                productName: product.name,
                unit: product.unit,
                price: product.price,
                quantity: item.quantity,
                subtotal: product.price * item.quantity,
            });
        }
        const totals = this.getTotals(input.deliveryMethod);
        const now = new Date();
        const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const randomCode = Math.random().toString(36).slice(2, 6).toUpperCase();
        const order = {
            id: `GRG-${dateStamp}-${randomCode}`,
            userId: this.session ? this.session.id : null,
            customerName: input.customerName.trim(),
            customerPhone: input.customerPhone.trim(),
            deliveryMethod: input.deliveryMethod,
            shippingAddress: input.deliveryMethod === 'pickup'
                ? 'Ambil Langsung di Gerai GorenganKuy Kemang'
                : input.shippingAddress.trim(),
            notes: input.notes.trim(),
            items: orderItems,
            subtotal: totals.subtotal,
            deliveryFee: totals.deliveryFee,
            packagingFee: totals.packagingFee,
            total: totals.total,
            paymentMethod: input.paymentMethod,
            paymentChannelLabel: input.paymentChannelLabel,
            paymentProof: input.paymentProof,
            status: 'Menunggu Verifikasi',
            createdAt: now.toISOString(),
        };
        // Deduct stock and persist
        const stockMap = this.storage.getStockMap();
        this.products = this.products.map((product) => {
            const ordered = orderItems.find((oi) => oi.productId === product.id);
            if (!ordered)
                return product;
            const updatedStock = Math.max(0, product.stock - ordered.quantity);
            stockMap[product.id] = updatedStock;
            return { ...product, stock: updatedStock };
        });
        this.storage.saveStockMap(stockMap);
        this.storage.saveOrder(order);
        this.cart = [];
        this.storage.saveCart(this.cart);
        this.notify();
        return { ok: true, order };
    }
}
//# sourceMappingURL=store.js.map