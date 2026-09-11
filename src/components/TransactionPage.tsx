import { useMemo, useRef, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'
import { Icon } from './Icon'
import logoUrl from '../assets/logo-bcuts.png?url'
import type {
  CreateTransactionInput,
  PaymentMethod,
  PaymentSettings,
  ReceiptRecord,
  ServiceItem,
  ShopSettings,
  TransactionDraft,
  TransactionRecord,
  ViewName,
} from '../types'
import { downloadBlob, formatRupiah, isValidWhatsAppNumber, normalizePhone } from '../lib/utils'

interface TransactionPageProps {
  draft: TransactionDraft
  services: ServiceItem[]
  paymentSettings: PaymentSettings
  shopSettings: ShopSettings
  onDraftChange: (patch: Partial<TransactionDraft>) => void
  onNavigate: (view: ViewName) => void
  onNotify: (message: string, kind?: 'success' | 'error' | 'info') => void
  onSave: (input: CreateTransactionInput) => Promise<TransactionRecord>
}

interface SharePayload {
  message: string
  phone: string
  receipt: ReceiptRecord
}

const paymentMethods: PaymentMethod[] = ['Tunai', 'QRIS', 'Transfer bank', 'E-wallet']

export function TransactionPage({
  draft,
  services,
  paymentSettings,
  shopSettings,
  onDraftChange,
  onNavigate,
  onNotify,
  onSave,
}: TransactionPageProps) {
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const receiptRef = useRef<HTMLDivElement>(null)
  const lastShare = useRef<SharePayload | null>(null)

  const chosen = useMemo(
    () => services.filter((service) => draft.selectedIds.has(service.id)),
    [draft.selectedIds, services],
  )
  const total = chosen.reduce((sum, service) => sum + service.price, 0)

  const toggleService = (id: number) => {
    const next = new Set(draft.selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onDraftChange({ selectedIds: next })
  }

  const createReceiptBlob = async (): Promise<Blob> => {
    if (!receiptRef.current) throw new Error('Struk belum tersedia.')
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())))
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(receiptRef.current, {
      backgroundColor: '#fffdfa',
      scale: 2,
      useCORS: true,
    })
    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG gagal dibuat.')), 'image/png'))
  }

  const openWhatsApp = (phone: string, message: string) => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.location.href = url
  }

  const sendTextReceipt = (payload: SharePayload) => {
    openWhatsApp(payload.phone, payload.message)
  }

  const buildMessage = (record: ReceiptRecord): string => {
    const date = new Date(record.date)
    const lines = [
      '*B.CUTS BARBERSHOP*',
      shopSettings.address || '',
      `${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      `Order ID: ${record.orderId}`,
      `Pelanggan: ${record.customer}`,
      '',
      ...record.items.map((service) => `${service.name} - ${formatRupiah(service.price)}`),
      '',
      `*Total: ${formatRupiah(record.total)}*`,
      `Pembayaran: ${record.payment}`,
      `Status: ${record.status === 'Lunas' ? 'Lunas ✅' : 'Menunggu pembayaran'}`,
    ]
    if (record.payment === 'Transfer bank' && paymentSettings.bankInfo) lines.push(paymentSettings.bankInfo)
    if (record.payment === 'E-wallet' && paymentSettings.ewalletInfo) lines.push(paymentSettings.ewalletInfo)
    if (record.payment === 'QRIS' && record.status !== 'Lunas') lines.push('Scan QRIS pada gambar struk ya, kak.')
    lines.push('', 'Terima kasih sudah berkunjung dan cukur di B.Cuts Barbershop! 🙏', 'Ganteng baru siap tampil lagi. Sampai jumpa di potongan berikutnya!')
    return lines.filter((line, index) => line || index > 0).join('\n')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const normalizedPhone = normalizePhone(draft.phone)
    if (!isValidWhatsAppNumber(normalizedPhone)) {
      setPhoneError('Masukkan nomor WhatsApp Indonesia yang valid.')
      return
    }
    if (chosen.length === 0) {
      onNotify('Pilih minimal satu layanan.', 'error')
      return
    }

    const now = new Date()
    const [year, month, day] = draft.date.split('-').map(Number)
    const transactionDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds())
    const status = draft.paidNow ? 'Lunas' : 'Menunggu bayar'
    const customer = draft.customer.trim() || 'Pelanggan'
    const input: CreateTransactionInput = {
      customer,
      phone: normalizedPhone,
      items: chosen,
      total,
      payment: draft.payment,
      status,
      date: transactionDate.toISOString(),
    }

    setSubmitting(true)
    setPhoneError('')
    try {
      const saved = await onSave(input)
      const datePart = transactionDate.toISOString().slice(2, 10).replace(/-/g, '')
      const idPart = String(saved.id).replace(/\D/g, '').slice(-4) || String(Date.now()).slice(-4)
      const nextReceipt: ReceiptRecord = {
        orderId: `BC${datePart}-${idPart}`,
        customer,
        date: saved.date,
        items: chosen,
        total,
        payment: draft.payment,
        status,
      }
      const payload = { receipt: nextReceipt, phone: normalizedPhone, message: buildMessage(nextReceipt) }
      lastShare.current = payload
      flushSync(() => setReceipt(nextReceipt))
      onNotify('Transaksi berhasil disimpan.', 'success')
      sendTextReceipt(payload)
      onDraftChange({ customer: '', phone: '', paidNow: false, selectedIds: new Set<number>() })
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Gagal menyimpan transaksi.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const paymentDetail = receipt?.payment === 'Transfer bank'
    ? paymentSettings.bankInfo
    : receipt?.payment === 'E-wallet'
      ? paymentSettings.ewalletInfo
      : ''

  return (
    <div className="page transaction-page">
      <div className="page-heading"><div><p className="eyebrow">Kasir aktif</p><h2>Transaksi baru</h2><p>Pilih layanan, isi pelanggan, lalu simpan nota.</p></div></div>

      <form className="checkout-layout" onSubmit={submit}>
        <div className="checkout-main">
          <section className="content-card form-section">
            <div className="section-heading"><div><span className="step-number">1</span><h3>Pilih layanan</h3></div><small>{chosen.length} dipilih</small></div>
            {services.length === 0 ? (
              <div className="empty-state compact-empty"><strong>Layanan masih kosong</strong><button className="text-button" onClick={() => onNavigate('layanan')} type="button">Tambah layanan dahulu</button></div>
            ) : (
              <div className="service-choice-grid">
                {services.map((service) => {
                  const selected = draft.selectedIds.has(service.id)
                  return (
                    <button aria-pressed={selected} className={`service-choice ${selected ? 'is-selected' : ''}`} key={service.id} onClick={() => toggleService(service.id)} type="button">
                      <span className="choice-check">{selected ? <Icon name="check" size={14} /> : null}</span>
                      <strong>{service.name}</strong>
                      <small>{formatRupiah(service.price)}</small>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <section className="content-card form-section">
            <div className="section-heading"><div><span className="step-number">2</span><h3>Data pelanggan</h3></div></div>
            <div className="form-grid">
              <label><span className="field-label">Nama pelanggan</span><input onChange={(event) => onDraftChange({ customer: event.target.value })} placeholder="Contoh: Budi" type="text" value={draft.customer} /></label>
              <label><span className="field-label">Nomor WhatsApp</span><input className={phoneError ? 'input-error' : ''} inputMode="tel" onChange={(event) => { onDraftChange({ phone: event.target.value }); setPhoneError('') }} placeholder="0812 3456 7890" type="tel" value={draft.phone} />{phoneError ? <small className="input-error-text">{phoneError}</small> : null}</label>
              <label><span className="field-label">Tanggal transaksi</span><input onChange={(event) => onDraftChange({ date: event.target.value })} required type="date" value={draft.date} /></label>
            </div>
          </section>

          <section className="content-card form-section">
            <div className="section-heading"><div><span className="step-number">3</span><h3>Pembayaran</h3></div></div>
            <div className="payment-grid">
              {paymentMethods.map((method) => <button className={draft.payment === method ? 'is-selected' : ''} key={method} onClick={() => onDraftChange({ payment: method })} type="button"><span>{method === 'Tunai' ? '💵' : method === 'QRIS' ? '▦' : method === 'Transfer bank' ? '🏦' : '📱'}</span>{method}</button>)}
            </div>
            <label className="paid-toggle"><input checked={draft.paidNow} onChange={(event) => onDraftChange({ paidNow: event.target.checked })} type="checkbox" /><span className="toggle-ui" /><div><strong>Sudah dibayar</strong><small>Aktifkan setelah uang benar-benar diterima.</small></div></label>
          </section>
        </div>

        <aside className="checkout-summary">
          <section className="content-card summary-card">
            <p className="eyebrow">Ringkasan nota</p>
            <h3>{draft.customer.trim() || 'Pelanggan'}</h3>
            <div className="summary-items">
              {chosen.length === 0 ? <p className="summary-empty">Belum ada layanan dipilih.</p> : chosen.map((service) => <div key={service.id}><span>{service.name}</span><strong>{formatRupiah(service.price)}</strong></div>)}
            </div>
            <div className="summary-total"><span>Total</span><strong>{formatRupiah(total)}</strong></div>
            <div className="summary-meta"><span>{draft.payment}</span><span className={`status-pill ${draft.paidNow ? 'paid' : 'pending'}`}>{draft.paidNow ? 'Lunas' : 'Menunggu bayar'}</span></div>
            <button className="primary-button full-button" disabled={submitting || chosen.length === 0} type="submit">{submitting ? <span className="button-loader" /> : <Icon name="whatsapp" size={19} />}{submitting ? 'Menyimpan...' : 'Simpan & kirim nota'}</button>
            <small className="summary-note">Setelah tersimpan, chat WhatsApp pelanggan langsung terbuka dengan teks nota siap dikirim.</small>
          </section>
        </aside>
      </form>

      {receipt ? (
        <section className="receipt-result content-card">
          <div className="section-heading"><div><p className="eyebrow">Berhasil dibuat</p><h3>Struk transaksi</h3></div><span className="status-pill paid"><Icon name="check" size={14} /> Tersimpan</span></div>
          <div className="receipt-paper" ref={receiptRef}>
            <div className="receipt-brand"><img alt="Logo B.Cuts" src={logoUrl} /><h4>B.CUTS BARBERSHOP</h4><p>{shopSettings.address}</p><p>{shopSettings.phone ? `Telp/WA: ${shopSettings.phone}` : ''}</p></div>
            <div className="receipt-info"><div><span>Order ID</span><strong>{receipt.orderId}</strong></div><div><span>Pelanggan</span><strong>{receipt.customer}</strong></div><div><span>Tanggal</span><strong>{new Date(receipt.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</strong></div></div>
            <div className="receipt-items">{receipt.items.map((service) => <div key={service.id}><span>{service.name}</span><strong>{formatRupiah(service.price)}</strong></div>)}</div>
            <div className="receipt-total"><span>Total</span><strong>{formatRupiah(receipt.total)}</strong></div>
            <div className="receipt-payment"><div><span>Pembayaran</span><strong>{receipt.payment}</strong></div><div><span>Status</span><strong className={receipt.status === 'Lunas' ? 'receipt-paid' : 'receipt-pending'}>{receipt.status === 'Lunas' ? 'Lunas ✓' : 'Menunggu pembayaran'}</strong></div></div>
            {paymentDetail ? <div className="receipt-payment-detail">{paymentDetail}</div> : null}
            {receipt.payment === 'QRIS' && receipt.status !== 'Lunas' && paymentSettings.qrisImage ? <div className="receipt-qris"><img alt="QRIS pembayaran" src={paymentSettings.qrisImage} /><strong>Scan untuk membayar</strong></div> : null}
            <p className="receipt-thanks">Terima kasih sudah berkunjung.<br />Sampai jumpa di potongan berikutnya!</p>
          </div>
          <div className="receipt-actions">
            <button className="secondary-button" onClick={async () => { try { const blob = await createReceiptBlob(); downloadBlob(blob, `struk-bcuts-${receipt.orderId}.png`) } catch { onNotify('Gagal membuat PNG.', 'error') } }} type="button"><Icon name="download" size={18} /> Download PNG</button>
            <button className="primary-button" disabled={!lastShare.current} onClick={() => lastShare.current && sendTextReceipt(lastShare.current)} type="button"><Icon name="whatsapp" size={18} /> Kirim ulang ke WhatsApp</button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
