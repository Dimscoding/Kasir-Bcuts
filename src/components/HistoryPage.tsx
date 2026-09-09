import { useDeferredValue, useMemo, useState } from 'react'
import { Icon } from './Icon'
import type { TransactionRecord } from '../types'
import {
  buildMonthGroups,
  dateInputToday,
  downloadBlob,
  escapeCsvCell,
  formatRupiah,
  monthKey,
} from '../lib/utils'

interface HistoryPageProps {
  loading: boolean
  transactions: TransactionRecord[]
  onDelete: (id: string | number) => Promise<void>
  onMarkPaid: (id: string | number) => Promise<void>
}

export function HistoryPage({ loading, transactions, onDelete, onMarkPaid }: HistoryPageProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(new Date().toISOString()))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Lunas' | 'Menunggu'>('Semua')
  const [busyId, setBusyId] = useState<string | number | null>(null)
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())
  const monthGroups = useMemo(() => buildMonthGroups(transactions), [transactions])

  const monthTransactions = useMemo(() => {
    return transactions
      .filter((item) => monthKey(item.date) === selectedMonth)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [selectedMonth, transactions])

  const visibleTransactions = useMemo(() => {
    return monthTransactions.filter((item) => {
      const searchMatch = !deferredSearch || `${item.customer} ${item.phone} ${item.items.map((service) => service.name).join(' ')}`.toLowerCase().includes(deferredSearch)
      const statusMatch = statusFilter === 'Semua' || (statusFilter === 'Lunas' ? item.status === 'Lunas' : item.status !== 'Lunas')
      return searchMatch && statusMatch
    })
  }, [deferredSearch, monthTransactions, statusFilter])

  const monthRevenue = monthTransactions.reduce((sum, item) => sum + item.total, 0)
  const paidRevenue = monthTransactions.filter((item) => item.status === 'Lunas').reduce((sum, item) => sum + item.total, 0)

  const handleMarkPaid = async (id: string | number) => {
    setBusyId(id)
    try { await onMarkPaid(id) } finally { setBusyId(null) }
  }

  const handleDelete = async (id: string | number, customer: string) => {
    if (!window.confirm(`Hapus transaksi milik ${customer}? Data yang dihapus tidak bisa dikembalikan.`)) return
    setBusyId(id)
    try { await onDelete(id) } finally { setBusyId(null) }
  }

  const exportCsv = () => {
    if (transactions.length === 0) return
    const headers = ['NO', 'TANGGAL', 'JAM', 'PELANGGAN', 'NO WHATSAPP', 'LAYANAN', 'PEMBAYARAN', 'STATUS', 'NOMINAL']
    const rows = [...transactions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item, index) => {
        const date = new Date(item.date)
        const cells = [
          index + 1,
          date.toLocaleDateString('id-ID'),
          date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          item.customer,
          item.phone,
          item.items.map((service) => service.name).join(' + '),
          item.payment,
          item.status,
          item.total,
        ]
        return cells.map(escapeCsvCell).join(',')
      })
    const csv = `\uFEFF${[headers.join(','), ...rows].join('\n')}`
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `rekap-bcuts-${dateInputToday()}.csv`)
  }

  return (
    <div className="page history-page">
      <div className="page-heading">
        <div><p className="eyebrow">Laporan kasir</p><h2>Riwayat transaksi</h2></div>
        <button className="secondary-button" disabled={transactions.length === 0} onClick={exportCsv} type="button"><Icon name="download" size={18} /> Export CSV</button>
      </div>

      <section className="history-summary">
        <label className="month-select-wrap">
          <span><Icon name="calendar" size={18} /> Pilih bulan</span>
          <select onChange={(event) => setSelectedMonth(event.target.value)} value={selectedMonth}>
            {monthGroups.map((group) => (
              <optgroup key={group.year} label={String(group.year)}>
                {group.months.map((month) => <option key={month.key} value={month.key}>{month.label}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="history-metrics">
          <article><small>Total transaksi</small><strong>{monthTransactions.length}</strong></article>
          <article><small>Nominal tercatat</small><strong>{formatRupiah(monthRevenue)}</strong></article>
          <article><small>Sudah diterima</small><strong>{formatRupiah(paidRevenue)}</strong></article>
        </div>
      </section>

      <section className="content-card history-list-card">
        <div className="history-toolbar">
          <label className="search-field">
            <Icon name="search" size={18} />
            <input aria-label="Cari pelanggan atau layanan" onChange={(event) => setSearch(event.target.value)} placeholder="Cari pelanggan atau layanan..." value={search} />
          </label>
          <div aria-label="Filter status" className="segmented-filter">
            {(['Semua', 'Lunas', 'Menunggu'] as const).map((status) => (
              <button className={statusFilter === status ? 'is-active' : ''} key={status} onClick={() => setStatusFilter(status)} type="button">{status}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="skeleton-list">{[1, 2, 3, 4].map((item) => <div className="skeleton-row" key={item} />)}</div>
        ) : visibleTransactions.length === 0 ? (
          <div className="empty-state">
            <span><Icon name="history" size={26} /></span>
            <strong>Tidak ada transaksi</strong>
            <p>Coba ganti bulan, status, atau kata pencarian.</p>
          </div>
        ) : (
          <div className="transaction-list">
            {visibleTransactions.map((transaction) => {
              const date = new Date(transaction.date)
              const isPaid = transaction.status === 'Lunas'
              return (
                <article className="history-item" key={transaction.id}>
                  <div className="history-item-top">
                    <div className="history-person">
                      <span className="avatar">{transaction.customer.trim().charAt(0).toUpperCase() || 'P'}</span>
                      <div><strong>{transaction.customer}</strong><small>{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small></div>
                    </div>
                    <strong className="history-total">{formatRupiah(transaction.total)}</strong>
                  </div>
                  <p className="history-services">{transaction.items.map((service) => service.name).join(' · ')}</p>
                  <div className="history-meta">
                    <span>{transaction.payment}</span>
                    <span className={`status-pill ${isPaid ? 'paid' : 'pending'}`}>{isPaid ? <Icon name="check" size={13} /> : <Icon name="clock" size={13} />}{isPaid ? 'Lunas' : 'Menunggu bayar'}</span>
                  </div>
                  <div className="history-actions">
                    {!isPaid ? <button className="small-action confirm" disabled={busyId === transaction.id} onClick={() => handleMarkPaid(transaction.id)} type="button"><Icon name="check" size={15} /> Tandai lunas</button> : null}
                    <button className="small-action danger" disabled={busyId === transaction.id} onClick={() => handleDelete(transaction.id, transaction.customer)} type="button"><Icon name="trash" size={15} /> Hapus</button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
