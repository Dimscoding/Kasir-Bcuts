import type { ViewName } from '../types'
import { Icon } from './Icon'

interface BottomNavProps {
  activeView: ViewName
  onChange: (view: ViewName) => void
}

const navItems: Array<{
  view: ViewName
  label: string
  icon: 'home' | 'history' | 'plus' | 'scissors' | 'settings'
  featured?: boolean
}> = [
  { view: 'dashboard', label: 'Beranda', icon: 'home' },
  { view: 'riwayat', label: 'Riwayat', icon: 'history' },
  { view: 'transaksi', label: 'Transaksi', icon: 'plus', featured: true },
  { view: 'layanan', label: 'Layanan', icon: 'scissors' },
  { view: 'pengaturan', label: 'Setelan', icon: 'settings' },
]

export function BottomNav({ activeView, onChange }: BottomNavProps) {
  return (
    <nav aria-label="Navigasi utama" className="bottom-nav">
      {navItems.map((item) => (
        <button
          aria-current={activeView === item.view ? 'page' : undefined}
          className={`nav-button ${item.featured ? 'nav-featured' : ''} ${activeView === item.view ? 'is-active' : ''}`}
          key={item.view}
          onClick={() => onChange(item.view)}
          type="button"
        >
          <span className="nav-icon-wrap"><Icon name={item.icon} size={item.featured ? 24 : 21} /></span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
