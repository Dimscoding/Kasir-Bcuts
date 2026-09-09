import type { Tables } from './database.types'

export type ViewName = 'dashboard' | 'transaksi' | 'riwayat' | 'layanan' | 'pengaturan'

export type PaymentMethod = 'Tunai' | 'QRIS' | 'Transfer bank' | 'E-wallet'

export type TransactionStatus = 'Lunas' | 'Menunggu bayar'

export interface ServiceItem {
  id: number
  name: string
  price: number
}

export interface TransactionRecord {
  id: string | number
  date: string
  customer: string
  phone: string
  items: ServiceItem[]
  total: number
  payment: PaymentMethod | string
  status: TransactionStatus | string
}

export type TransactionRow = Tables<'transaksi'>

export interface ReceiptRecord {
  orderId: string
  customer: string
  date: string
  items: ServiceItem[]
  total: number
  payment: PaymentMethod
  status: TransactionStatus
}

export interface PaymentSettings {
  bankInfo: string
  ewalletInfo: string
  qrisImage: string
}

export interface ShopSettings {
  address: string
  phone: string
}

export interface TransactionDraft {
  customer: string
  phone: string
  date: string
  payment: PaymentMethod
  paidNow: boolean
  selectedIds: Set<number>
}

export interface CreateTransactionInput {
  customer: string
  phone: string
  items: ServiceItem[]
  total: number
  payment: PaymentMethod
  status: TransactionStatus
  date: string
}

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastMessage {
  kind: ToastKind
  message: string
}
