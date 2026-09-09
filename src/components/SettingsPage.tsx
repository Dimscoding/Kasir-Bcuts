import { useRef, type ChangeEvent } from 'react'
import { Icon } from './Icon'
import type { PaymentSettings, ShopSettings } from '../types'

interface SettingsPageProps {
  payment: PaymentSettings
  shop: ShopSettings
  onPaymentChange: (settings: PaymentSettings) => void
  onShopChange: (settings: ShopSettings) => void
  onLogout: () => Promise<void>
  onNotify: (message: string, kind?: 'success' | 'error' | 'info') => void
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca gambar.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Format gambar tidak didukung.'))
      image.onload = () => {
        const maxSize = 640
        let width = image.width
        let height = image.height
        if (width > height && width > maxSize) {
          height = Math.round(height * (maxSize / width))
          width = maxSize
        } else if (height > maxSize) {
          width = Math.round(width * (maxSize / height))
          height = maxSize
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (!context) return reject(new Error('Canvas tidak tersedia.'))
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.78))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export function SettingsPage({ payment, shop, onPaymentChange, onShopChange, onLogout, onNotify }: SettingsPageProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleQris = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const qrisImage = await compressImage(file)
      onPaymentChange({ ...payment, qrisImage })
      onNotify('Gambar QRIS berhasil disimpan.', 'success')
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Gagal menyimpan gambar QRIS.', 'error')
    }
  }

  return (
    <div className="page settings-page">
      <div className="page-heading"><div><p className="eyebrow">Konfigurasi</p><h2>Pengaturan kasir</h2><p>Informasi ini dipakai pada struk digital pelanggan.</p></div></div>

      <div className="settings-grid">
        <section className="content-card settings-card">
          <div className="card-title-icon"><span><Icon name="home" /></span><div><h3>Informasi toko</h3><p>Muncul pada bagian atas struk.</p></div></div>
          <label className="field-label" htmlFor="shop-address">Alamat B.Cuts</label>
          <input id="shop-address" onChange={(event) => onShopChange({ ...shop, address: event.target.value })} placeholder="Jl. Hos Cokroaminoto, Monjok Barat" type="text" value={shop.address} />
          <label className="field-label" htmlFor="shop-phone">Nomor telepon/WhatsApp toko</label>
          <input id="shop-phone" onChange={(event) => onShopChange({ ...shop, phone: event.target.value })} placeholder="0878 xxxx xxxx" type="tel" value={shop.phone} />
          <p className="autosave-note"><Icon name="check" size={14} /> Tersimpan otomatis</p>
        </section>

        <section className="content-card settings-card">
          <div className="card-title-icon"><span><Icon name="wallet" /></span><div><h3>Metode pembayaran</h3><p>Detail pembayaran ditampilkan sesuai pilihan transaksi.</p></div></div>
          <label className="field-label" htmlFor="bank-info">Rekening bank</label>
          <input id="bank-info" onChange={(event) => onPaymentChange({ ...payment, bankInfo: event.target.value })} placeholder="BCA 1234567890 a.n. B.Cuts" type="text" value={payment.bankInfo} />
          <label className="field-label" htmlFor="ewallet-info">E-wallet</label>
          <input id="ewallet-info" onChange={(event) => onPaymentChange({ ...payment, ewalletInfo: event.target.value })} placeholder="DANA 08xx a.n. B.Cuts" type="text" value={payment.ewalletInfo} />

          <label className="field-label">Kode QRIS</label>
          {payment.qrisImage ? (
            <div className="qris-preview-card">
              <img alt="Preview QRIS B.Cuts" src={payment.qrisImage} />
              <div><strong>QRIS aktif</strong><p>Gambar akan dimasukkan pada struk QRIS.</p><button className="text-button danger-text" onClick={() => { onPaymentChange({ ...payment, qrisImage: '' }); if (fileRef.current) fileRef.current.value = '' }} type="button">Hapus QRIS</button></div>
            </div>
          ) : (
            <label className="upload-zone" htmlFor="qris-upload"><Icon name="plus" size={21} /><strong>Upload gambar QRIS</strong><small>JPG atau PNG, akan dikompres otomatis</small></label>
          )}
          <input accept="image/*" className="visually-hidden" id="qris-upload" onChange={handleQris} ref={fileRef} type="file" />
          {payment.qrisImage ? <button className="secondary-button full-button" onClick={() => fileRef.current?.click()} type="button"><Icon name="edit" size={17} /> Ganti gambar QRIS</button> : null}
        </section>

        <section className="content-card settings-card account-card">
          <div className="card-title-icon"><span><Icon name="settings" /></span><div><h3>Akun kasir</h3><p>Keluar dari sesi kasir pada perangkat ini.</p></div></div>
          <button className="danger-button full-button" onClick={onLogout} type="button"><Icon name="logout" size={18} /> Keluar dari akun</button>
        </section>
      </div>
    </div>
  )
}
