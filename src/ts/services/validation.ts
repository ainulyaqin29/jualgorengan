import {
  DeliveryMethod,
  FileValidationResult,
  PaymentMethod,
  ValidationResult,
} from '../types/index.js';

export const MAX_PROOF_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_PROOF_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
export const ALLOWED_PROOF_EXTENSIONS: readonly string[] = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
];

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-().]/g, '');
}

export function isValidIndonesianPhone(phone: string): boolean {
  const cleaned = normalizePhone(phone);
  return /^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(cleaned);
}

export function validateRegisterForm(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (input.name.trim().length < 3) {
    errors.name = 'Nama lengkap minimal 3 karakter.';
  }
  if (!isValidEmail(input.email)) {
    errors.email = 'Masukkan alamat email yang valid (contoh: nama@email.com).';
  }
  if (!isValidIndonesianPhone(input.phone)) {
    errors.phone = 'Nomor WhatsApp harus valid (contoh: 081234567890).';
  }
  if (input.password.length < 6) {
    errors.password = 'Kata sandi minimal 6 karakter.';
  }
  if (input.confirmPassword !== input.password) {
    errors.confirmPassword = 'Konfirmasi kata sandi tidak cocok.';
  }
  if (input.address.trim().length > 0 && input.address.trim().length < 10) {
    errors.address = 'Jika diisi, alamat pengiriman minimal 10 karakter.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLoginForm(input: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!isValidEmail(input.email)) {
    errors.email = 'Masukkan alamat email yang valid.';
  }
  if (input.password.trim().length === 0) {
    errors.password = 'Kata sandi wajib diisi.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateCheckoutForm(input: {
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  shippingAddress: string;
  paymentMethod: PaymentMethod | '';
  paymentChannelId: string;
  hasProof: boolean;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (input.customerName.trim().length < 3) {
    errors.customerName = 'Nama penerima minimal 3 karakter.';
  }
  if (!isValidIndonesianPhone(input.customerPhone)) {
    errors.customerPhone = 'Nomor WhatsApp aktif wajib valid (contoh: 081234567890).';
  }
  if (input.deliveryMethod === 'delivery' && input.shippingAddress.trim().length < 12) {
    errors.shippingAddress = 'Alamat pengiriman lengkap minimal 12 karakter (jalan, nomor, patokan).';
  }
  if (!input.paymentMethod || !input.paymentChannelId) {
    errors.paymentMethod = 'Pilih metode dan kanal pembayaran terlebih dahulu.';
  }
  if (!input.hasProof) {
    errors.paymentProof = 'Wajib mengunggah bukti pembayaran sebelum membuat pesanan.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePaymentProofFile(file: File | null): FileValidationResult {
  if (!file) {
    return {
      valid: false,
      error: 'Silakan pilih file bukti pembayaran terlebih dahulu.',
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      error: 'File yang dipilih kosong atau rusak.',
    };
  }

  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = ALLOWED_PROOF_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasAllowedMime = ALLOWED_PROOF_MIME_TYPES.includes(file.type);

  if (!hasAllowedMime && !hasAllowedExtension) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.',
    };
  }

  if (file.size > MAX_PROOF_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran file melebihi batas maksimal 2 MB. Kompres atau pilih file lain.',
    };
  }

  return { valid: true };
}
