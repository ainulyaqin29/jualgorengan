/**
 * Strict TypeScript Type Definitions for GorengaNusantara Storefront
 */

export type ThemeMode = 'dark' | 'light';

export type ProductCategory = 'Semua' | 'Gurih' | 'Pedas' | 'Manis' | 'Paket Hemat';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: Exclude<ProductCategory, 'Semua'>;
  price: number;
  unit: string;
  stock: number;
  badge?: string;
  description: string;
  image: string;
  prepMinutes: number;
  isFeatured?: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  defaultAddress: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  defaultAddress: string;
}

export type DeliveryMethod = 'delivery' | 'pickup';

export type PaymentMethod = 'qris' | 'bank_transfer' | 'ewallet';

export interface PaymentChannel {
  id: string;
  method: PaymentMethod;
  label: string;
  shortName: string;
  accountNumber: string;
  accountName: string;
  instructions: string;
}

export interface PaymentProof {
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  uploadedAt: string;
}

export type OrderStatus = 'Menunggu Verifikasi' | 'Diproses' | 'Dikirim' | 'Selesai';

export interface OrderItem {
  productId: string;
  productName: string;
  unit: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  shippingAddress: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentChannelLabel: string;
  paymentProof: PaymentProof;
  status: OrderStatus;
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';
