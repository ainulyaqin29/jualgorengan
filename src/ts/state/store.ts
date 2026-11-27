import { INITIAL_PRODUCTS } from '../data/products.js';
import { StorageService } from '../services/storage.js';
import {
  CartItem,
  DeliveryMethod,
  Order,
  OrderItem,
  PaymentMethod,
  PaymentProof,
  Product,
  SessionUser,
} from '../types/index.js';

export const FREE_SHIPPING_THRESHOLD = 35000;
export const BASE_DELIVERY_FEE = 5000;
export const PACKAGING_FEE = 1000;

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  total: number;
  qualifiesFreeShipping: boolean;
}

type StoreListener = () => void;

export class AppStore {
  private readonly storage: StorageService;
  private products: Product[];
  private cart: CartItem[];
  private session: SessionUser | null;
  private listeners: Set<StoreListener> = new Set();

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

  private sanitizeCart(rawCart: CartItem[]): CartItem[] {
    const valid: CartItem[] = [];
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

  public subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getProducts(): readonly Product[] {
    return this.products;
  }

  public getProductById(productId: string): Product | undefined {
    return this.products.find((p) => p.id === productId);
  }

  public getCart(): readonly CartItem[] {
    return this.cart;
  }

  public getCartQuantity(productId: string): number {
    return this.cart.find((item) => item.productId === productId)?.quantity ?? 0;
  }

  public getTotals(deliveryMethod: DeliveryMethod = 'delivery'): CartTotals {
    let itemCount = 0;
    let subtotal = 0;

    for (const item of this.cart) {
      const product = this.getProductById(item.productId);
      if (!product) continue;
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
    const deliveryFee =
      deliveryMethod === 'pickup' ? 0 : qualifiesFreeShipping ? 0 : BASE_DELIVERY_FEE;
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

  public addToCart(productId: string, delta = 1): { ok: boolean; message?: string } {
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
    } else if (existing) {
      this.cart = this.cart.map((c) =>
        c.productId === productId ? { ...c, quantity: nextQty } : c
      );
    } else {
      this.cart = [...this.cart, { productId, quantity: nextQty }];
    }

    this.storage.saveCart(this.cart);
    this.notify();
    return { ok: true };
  }

  public setCartQuantity(productId: string, quantity: number): { ok: boolean; message?: string } {
    const product = this.getProductById(productId);
    if (!product) return { ok: false, message: 'Produk tidak ditemukan.' };

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
      this.cart = this.cart.map((c) =>
        c.productId === productId ? { ...c, quantity } : c
      );
    } else {
      this.cart = [...this.cart, { productId, quantity }];
    }

    this.storage.saveCart(this.cart);
    this.notify();
    return { ok: true };
  }

  public removeFromCart(productId: string): void {
    this.cart = this.cart.filter((c) => c.productId !== productId);
    this.storage.saveCart(this.cart);
    this.notify();
  }

  public clearCart(): void {
    this.cart = [];
    this.storage.saveCart(this.cart);
    this.notify();
  }

  public getSession(): SessionUser | null {
    return this.session;
  }

  public registerUser(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    defaultAddress: string;
  }): { ok: true; user: SessionUser } | { ok: false; message: string } {
    const result = this.storage.createUser(data);
    if (result.ok) {
      this.session = result.user;
      this.notify();
    }
    return result;
  }

  public loginUser(
    email: string,
    password: string
  ): { ok: true; user: SessionUser } | { ok: false; message: string } {
    const result = this.storage.authenticate(email, password);
    if (result.ok) {
      this.session = result.user;
      this.notify();
    }
    return result;
  }

  public logoutUser(): void {
    this.storage.setSession(null);
    this.session = null;
    this.notify();
  }

  public getUserOrders(): Order[] {
    if (!this.session) return [];
    return this.storage.getOrdersByUser(this.session.id);
  }

  public placeOrder(input: {
    customerName: string;
    customerPhone: string;
    deliveryMethod: DeliveryMethod;
    shippingAddress: string;
    notes: string;
    paymentMethod: PaymentMethod;
    paymentChannelLabel: string;
    paymentProof: PaymentProof;
  }): { ok: true; order: Order } | { ok: false; message: string } {
    if (this.cart.length === 0) {
      return { ok: false, message: 'Keranjang belanja masih kosong.' };
    }

    const orderItems: OrderItem[] = [];
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
    const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const randomCode = Math.random().toString(36).slice(2, 6).toUpperCase();

    const order: Order = {
      id: `GRG-${dateStamp}-${randomCode}`,
      userId: this.session ? this.session.id : null,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      deliveryMethod: input.deliveryMethod,
      shippingAddress:
        input.deliveryMethod === 'pickup'
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
      if (!ordered) return product;
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
