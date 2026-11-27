import { CartItem, Order, SessionUser, UserAccount } from '../types/index.js';

const KEYS = {
  USERS: 'gorengankuy_users_v1',
  SESSION: 'gorengankuy_session_v1',
  CART: 'gorengankuy_cart_v1',
  ORDERS: 'gorengankuy_orders_v1',
  STOCK: 'gorengankuy_stock_v1',
} as const;

export function hashPassword(raw: string): string {
  // Deterministic lightweight hash for client-side demo auth persistence
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `gk_${(hash >>> 0).toString(16)}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export class StorageService {
  constructor() {
    this.ensureSeedUsers();
  }

  private ensureSeedUsers(): void {
    const users = readJson<UserAccount[]>(KEYS.USERS, []);
    if (users.length === 0) {
      const demoUser: UserAccount = {
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

  public getUsers(): UserAccount[] {
    return readJson<UserAccount[]>(KEYS.USERS, []);
  }

  public findUserByEmail(email: string): UserAccount | undefined {
    const normalized = email.trim().toLowerCase();
    return this.getUsers().find((u) => u.email.toLowerCase() === normalized);
  }

  public createUser(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    defaultAddress: string;
  }): { ok: true; user: SessionUser } | { ok: false; message: string } {
    const existing = this.findUserByEmail(data.email);
    if (existing) {
      return { ok: false, message: 'Email sudah terdaftar. Silakan masuk ke akun Anda.' };
    }

    const newUser: UserAccount = {
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

    const sessionUser: SessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      defaultAddress: newUser.defaultAddress,
    };
    this.setSession(sessionUser);

    return { ok: true, user: sessionUser };
  }

  public authenticate(
    email: string,
    password: string
  ): { ok: true; user: SessionUser } | { ok: false; message: string } {
    const user = this.findUserByEmail(email);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return { ok: false, message: 'Email atau kata sandi tidak sesuai.' };
    }

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      defaultAddress: user.defaultAddress,
    };
    this.setSession(sessionUser);
    return { ok: true, user: sessionUser };
  }

  public getSession(): SessionUser | null {
    return readJson<SessionUser | null>(KEYS.SESSION, null);
  }

  public setSession(user: SessionUser | null): void {
    if (!user) {
      localStorage.removeItem(KEYS.SESSION);
      return;
    }
    writeJson(KEYS.SESSION, user);
  }

  public getCart(): CartItem[] {
    return readJson<CartItem[]>(KEYS.CART, []);
  }

  public saveCart(items: CartItem[]): void {
    writeJson(KEYS.CART, items);
  }

  public getStockMap(): Record<string, number> {
    return readJson<Record<string, number>>(KEYS.STOCK, {});
  }

  public saveStockMap(stockMap: Record<string, number>): void {
    writeJson(KEYS.STOCK, stockMap);
  }

  public getOrders(): Order[] {
    return readJson<Order[]>(KEYS.ORDERS, []);
  }

  public getOrdersByUser(userId: string): Order[] {
    return this.getOrders()
      .filter((order) => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveOrder(order: Order): void {
    const orders = this.getOrders();
    orders.unshift(order);
    try {
      writeJson(KEYS.ORDERS, orders);
    } catch {
      // Fallback if localStorage quota is tight due to large base64 proof image
      const trimmedProofOrder: Order = {
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
