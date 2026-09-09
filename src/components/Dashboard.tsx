import { Icon } from './Icon'
import type { TransactionRecord, ViewName } from '../types'
import { formatRupiah, monthKey } from '../lib/utils'

interface DashboardProps {
  loading: boolean
  transactions: TransactionRecord[]
  onNavigate: (view: ViewName) => void
}

export function Dashboard({ loading, transactions, onNavigate }: DashboardProps) {
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const currentMonthKey = monthKey(now.toISOString())
  const todayTransactions = transactions.filter((item) => item.date.slice(0, 10) === todayKey)
  const monthTransactions = transactions.filter((item) => monthKey(item.date) === currentMonthKey)
  const monthRevenue = monthTransactions.reduce((sum, item) => sum + item.total, 0)
  const pendingCount = transactions.filter((item) => item.status !== 'Lunas').length
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  const dateLabel = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="page dashboard-page">
      <section className="welcome-panel">
        <div>
          <p className="eyebrow">{dateLabel}</p>
          <h2>Halo, Juragan.</h2>
          <p>Pantau kasir B.Cuts dari satu tempat yang lebih ringkas.</p>
        </div>
        <div className="welcome-badge"><Icon name="sparkle" size={24} /></div>
      </section>

      <section className="hero-revenue">
        <div className="hero-copy">
          <span>Pendapatan bulan ini</span>
          <strong>{loading ? 'Memuat...' : formatRupiah(monthRevenue)}</strong>
          <small>{monthTransactions.length} transaksi tercatat</small>
        </div>
        <button className="primary-button hero-action" onClick={() => onNavigate('transaksi')} type="button">
          <Icon name="plus" size={19} /> Transaksi baru
        </button>
      </section>

      <section aria-label="Ringkasan kasir" className="stat-grid">
        <article className="stat-card stat-gold">
          <span className="stat-icon"><Icon name="users" /></span>
          <div><small>Hari ini</small><strong>{todayTransactions.length}</strong><p>transaksi</p></div>
        </article>
        <article className="stat-card stat-blue">
          <span className="stat-icon"><Icon name="wallet" /></span>
          <div><small>Rata-rata</small><strong>{formatRupiah(monthTransactions.length ? monthRevenue / monthTransactions.length : 0)}</strong><p>per transaksi</p></div>
        </article>
        <article className="stat-card stat-red">
          <span className="stat-icon"><Icon name="clock" /></span>
          <div><small>Menunggu</small><strong>{pendingCount}</strong><p>pembayaran</p></div>
        </article>
      </section>

      <section className="content-card recent-card">
        <div className="section-heading">
          <div><p className="eyebrow">Aktivitas</p><h3>Transaksi terbaru</h3></div>
          <button className="text-button" onClick={() => onNavigate('riwayat')} type="button">Lihat semua</button>
        </div>

        {loading ? (
          <div className="skeleton-list">{[1, 2, 3].map((item) => <div className="skeleton-row" key={item} />)}</div>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <span><Icon name="history" size={26} /></span>
            <strong>Belum ada transaksi</strong>
            <p>Transaksi yang disimpan akan muncul di sini.</p>
          </div>
        ) : (
          <div className="transaction-list compact-list">
            {recent.map((transaction) => {
              const date = new Date(transaction.date)
              return (
                <article className="transaction-row" key={transaction.id}>
                  <span className="avatar">{transaction.customer.trim().charAt(0).toUpperCase() || 'P'}</span>
                  <div className="transaction-main">
                    <div><strong>{transaction.customer}</strong><span className={`status-pill ${transaction.status === 'Lunas' ? 'paid' : 'pending'}`}>{transaction.status === 'Lunas' ? 'Lunas' : 'Menunggu'}</span></div>
                    <small>{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small>
                  </div>
                  <strong className="transaction-amount">{formatRupiah(transaction.total)}</strong>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
