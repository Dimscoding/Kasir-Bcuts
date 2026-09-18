import { useCallback, useEffect, useRef, useState } from 'react'
import logoUrl from './assets/logo-bcuts.png?url'
import { BottomNav } from './components/BottomNav'
import { Dashboard } from './components/Dashboard'
import { HistoryPage } from './components/HistoryPage'
import { Icon } from './components/Icon'
import { ServicesPage } from './components/ServicesPage'
import { SettingsPage } from './components/SettingsPage'
import { TransactionPage } from './components/TransactionPage'
import { supabase } from './lib/supabase'
import {
  DEFAULT_PAYMENT_SETTINGS,
  DEFAULT_SERVICES,
  DEFAULT_SHOP_SETTINGS,
  dateInputToday,
  parseTransactionRow,
  readStorage,
  STORAGE_KEYS,
  writeStorage,
} from './lib/utils'
import type {
  CreateTransactionInput,
  PaymentSettings,
  ServiceItem,
  ShopSettings,
  ToastKind,
  ToastMessage,
  TransactionDraft,
  TransactionRecord,
  TransactionRow,
  ViewName,
} from './types'

export default function App() {
  const [activeView, setActiveView] = useState<ViewName>('dashboard')
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [services, setServices] = useState<ServiceItem[]>(() => readStorage(STORAGE_KEYS.services, DEFAULT_SERVICES))
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(() => readStorage(STORAGE_KEYS.payment, DEFAULT_PAYMENT_SETTINGS))
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => readStorage(STORAGE_KEYS.shop, DEFAULT_SHOP_SETTINGS))
  const [draft, setDraft] = useState<TransactionDraft>({
    customer: '',
    phone: '',
    date: dateInputToday(),
    payment: 'Tunai',
    paidNow: false,
    selectedIds: new Set<number>(),
  })
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const toastTimer = useRef<number | null>(null)

  const notify = useCallback((message: string, kind: ToastKind = 'info') => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast({ message, kind })
    toastTimer.current = window.setTimeout(() => setToast(null), 4200)
  }, [])

  const loadTransactions = useCallback(async () => {
    setLoadingTransactions(true)
    try {
      const { data, error } = await supabase.from('transaksi').select('*').order('tanggal', { ascending: true })
      if (error) throw error
      setTransactions(((data || []) as TransactionRow[]).map(parseTransactionRow))
    } catch (error) {
      setTransactions([])
      notify(error instanceof Error ? `Data transaksi gagal dimuat: ${error.message}` : 'Data transaksi gagal dimuat.', 'error')
    } finally {
      setLoadingTransactions(false)
    }
  }, [notify])

  useEffect(() => {
    void loadTransactions()
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    }
  }, [loadTransactions])

  const saveTransaction = async (input: CreateTransactionInput): Promise<TransactionRecord> => {
    const dbRow = {
      customer: input.customer,
      items: JSON.stringify({ items: input.items, phone: input.phone }),
      total: input.total,
      payment: input.payment,
      status: input.status,
      tanggal: input.date,
    }
    const { data, error } = await supabase.from('transaksi').insert(dbRow).select().single()
    if (error) throw new Error(`Gagal menyimpan transaksi: ${error.message}`)
    const saved = parseTransactionRow(data as TransactionRow)
    setTransactions((current) => [...current, saved])
    return saved
  }

  const markPaid = async (id: string | number) => {
    const { error } = await supabase.from('transaksi').update({ status: 'Lunas' }).eq('id', Number(id))
    if (error) {
      notify(`Status gagal diperbarui: ${error.message}`, 'error')
      return
    }
    setTransactions((current) => current.map((item) => item.id === id ? { ...item, status: 'Lunas' } : item))
    notify('Transaksi sudah ditandai lunas.', 'success')
  }

  const deleteTransaction = async (id: string | number) => {
    const { error } = await supabase.from('transaksi').delete().eq('id', Number(id))
    if (error) {
      notify(`Transaksi gagal dihapus: ${error.message}`, 'error')
      return
    }
    setTransactions((current) => current.filter((item) => item.id !== id))
    notify('Transaksi berhasil dihapus.', 'success')
  }

  const updateServices = (nextServices: ServiceItem[]) => {
    setServices(nextServices)
    writeStorage(STORAGE_KEYS.services, nextServices)
    const validIds = new Set(nextServices.map((service) => service.id))
    setDraft((current) => ({ ...current, selectedIds: new Set([...current.selectedIds].filter((id) => validIds.has(id))) }))
  }

  const updatePaymentSettings = (nextSettings: PaymentSettings) => {
    setPaymentSettings(nextSettings)
    writeStorage(STORAGE_KEYS.payment, nextSettings)
  }

  const updateShopSettings = (nextSettings: ShopSettings) => {
    setShopSettings(nextSettings)
    writeStorage(STORAGE_KEYS.shop, nextSettings)
  }

  const navigate = (view: ViewName) => {
    setActiveView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <div className="barber-pole" />
      <header className="app-header">
        <button aria-label="Kembali ke dashboard" className="header-brand" onClick={() => navigate('dashboard')} type="button">
          <span className="brand-mark"><img alt="Logo B.Cuts" src={logoUrl} /></span>
          <span><strong>B.Cuts</strong><small>Cashier workspace</small></span>
        </button>
        <div className="header-status"><span /> Online & tersinkron</div>
      </header>

      <main className="app-content" key={activeView}>
        {activeView === 'dashboard' ? <Dashboard loading={loadingTransactions} onNavigate={navigate} transactions={transactions} /> : null}
        {activeView === 'transaksi' ? <TransactionPage draft={draft} onDraftChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} onNavigate={navigate} onNotify={notify} onSave={saveTransaction} paymentSettings={paymentSettings} services={services} shopSettings={shopSettings} /> : null}
        {activeView === 'riwayat' ? <HistoryPage loading={loadingTransactions} onDelete={deleteTransaction} onMarkPaid={markPaid} transactions={transactions} /> : null}
        {activeView === 'layanan' ? <ServicesPage onChange={updateServices} services={services} /> : null}
        {activeView === 'pengaturan' ? <SettingsPage onNotify={notify} onPaymentChange={updatePaymentSettings} onShopChange={updateShopSettings} payment={paymentSettings} shop={shopSettings} /> : null}
      </main>

      <BottomNav activeView={activeView} onChange={navigate} />

      {toast ? (
        <div aria-live="polite" className={`toast toast-${toast.kind}`} role="status">
          <span>{toast.kind === 'success' ? <Icon name="check" size={17} /> : toast.kind === 'error' ? '!' : 'i'}</span>
          {toast.message}
          <button aria-label="Tutup notifikasi" onClick={() => setToast(null)} type="button">×</button>
        </div>
      ) : null}
    </div>
  )
}
