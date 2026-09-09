import type {
  PaymentSettings,
  ServiceItem,
  ShopSettings,
  TransactionRecord,
  TransactionRow,
} from '../types'

export const STORAGE_KEYS = {
  services: 'barbershop_services_v2',
  payment: 'barbershop_payment_settings',
  shop: 'barbershop_shop_settings',
} as const

export const DEFAULT_SERVICES: ServiceItem[] = [
  { id: 1, name: 'Cukur saja', price: 15_000 },
  { id: 2, name: 'Cukur + keramas', price: 20_000 },
  { id: 3, name: 'Cukur + pijat', price: 20_000 },
  { id: 4, name: 'Cukur + keramas + pijat', price: 25_000 },
]

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  bankInfo: '',
  ewalletInfo: '',
  qrisImage: '',
}

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  address: '',
  phone: '',
}

export function formatRupiah(value: number): string {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

export function normalizePhone(raw: string): string {
  let phone = raw.replace(/[^0-9+]/g, '')
  if (phone.startsWith('+62')) phone = phone.slice(1)
  else if (phone.startsWith('62')) return phone
  else if (phone.startsWith('0')) phone = `62${phone.slice(1)}`
  else if (phone.length > 0) phone = `62${phone}`
  return phone
}

export function isValidWhatsAppNumber(phone: string): boolean {
  return /^62[0-9]{8,13}$/.test(phone)
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

export function dateInputToday(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function parseTransactionRow(row: TransactionRow): TransactionRecord {
  let extra: { items?: ServiceItem[]; phone?: string } = {}
  try {
    extra = JSON.parse(row.items || '{}') as { items?: ServiceItem[]; phone?: string }
  } catch {
    extra = {}
  }

  return {
    id: row.id,
    date: row.tanggal || row.created_at,
    customer: row.customer || 'Pelanggan',
    phone: extra.phone || '',
    items: Array.isArray(extra.items) ? extra.items : [],
    total: Number(row.total) || 0,
    payment: row.payment || 'Tunai',
    status: row.status || 'Menunggu bayar',
  }
}

export function buildMonthGroups(transactions: TransactionRecord[]): Array<{
  year: number
  months: Array<{ key: string; label: string }>
}> {
  const currentYear = new Date().getFullYear()
  const years = new Set<number>([currentYear])
  transactions.forEach((transaction) => years.add(Number(transaction.date.slice(0, 4))))

  return [...years]
    .filter(Number.isFinite)
    .sort((a, b) => b - a)
    .map((year) => ({
      year,
      months: Array.from({ length: 12 }, (_, index) => {
        const key = `${year}-${String(index + 1).padStart(2, '0')}`
        return { key, label: monthLabel(key) }
      }),
    }))
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function escapeCsvCell(value: string | number): string {
  const text = String(value).replace(/"/g, '""')
  return /[",\n]/.test(text) ? `"${text}"` : text
}
