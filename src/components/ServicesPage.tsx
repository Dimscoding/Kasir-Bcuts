import { Icon } from './Icon'
import type { ServiceItem } from '../types'
import { formatRupiah } from '../lib/utils'

interface ServicesPageProps {
  services: ServiceItem[]
  onChange: (services: ServiceItem[]) => void
}

export function ServicesPage({ services, onChange }: ServicesPageProps) {
  const updateService = (id: number, patch: Partial<ServiceItem>) => {
    onChange(services.map((service) => service.id === id ? { ...service, ...patch } : service))
  }

  const addService = () => {
    const nextId = services.reduce((max, service) => Math.max(max, service.id), 0) + 1
    onChange([...services, { id: nextId, name: 'Layanan baru', price: 0 }])
  }

  const removeService = (service: ServiceItem) => {
    if (!window.confirm(`Hapus layanan “${service.name}”?`)) return
    onChange(services.filter((item) => item.id !== service.id))
  }

  return (
    <div className="page services-page">
      <div className="page-heading">
        <div><p className="eyebrow">Katalog B.Cuts</p><h2>Daftar layanan</h2><p>Perubahan tersimpan otomatis di perangkat ini.</p></div>
        <button className="primary-button" onClick={addService} type="button"><Icon name="plus" size={18} /> Tambah layanan</button>
      </div>

      {services.length === 0 ? (
        <section className="content-card empty-state">
          <span><Icon name="scissors" size={28} /></span>
          <strong>Belum ada layanan</strong>
          <p>Tambahkan layanan pertama untuk mulai membuat transaksi.</p>
          <button className="primary-button" onClick={addService} type="button">Tambah layanan</button>
        </section>
      ) : (
        <section className="service-editor-grid">
          {services.map((service, index) => (
            <article className="service-editor-card" key={service.id}>
              <div className="service-card-head">
                <span className="service-number">{String(index + 1).padStart(2, '0')}</span>
                <button aria-label={`Hapus ${service.name}`} className="icon-button danger-icon" onClick={() => removeService(service)} type="button"><Icon name="trash" size={17} /></button>
              </div>
              <label className="field-label" htmlFor={`service-name-${service.id}`}>Nama layanan</label>
              <input id={`service-name-${service.id}`} onChange={(event) => updateService(service.id, { name: event.target.value })} type="text" value={service.name} />
              <label className="field-label" htmlFor={`service-price-${service.id}`}>Harga</label>
              <div className="price-input"><span>Rp</span><input id={`service-price-${service.id}`} min="0" onChange={(event) => updateService(service.id, { price: Math.max(0, Number(event.target.value) || 0) })} step="500" type="number" value={service.price} /></div>
              <div className="service-preview"><span>Harga tampil</span><strong>{formatRupiah(service.price)}</strong></div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
