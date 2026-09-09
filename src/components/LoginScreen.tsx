import { useState, type FormEvent } from 'react'
import { Icon } from './Icon'
import logoUrl from '../assets/logo-bcuts.png?url'

interface LoginScreenProps {
  configurationReady: boolean
  onLogin: (pin: string) => Promise<void>
}

export function LoginScreen({ configurationReady, onLogin }: LoginScreenProps) {
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const triggerError = (message: string) => {
    setError(message)
    setShake(false)
    window.requestAnimationFrame(() => setShake(true))
    window.setTimeout(() => setShake(false), 420)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!configurationReady) {
      triggerError('Konfigurasi server belum dipasang di Vercel.')
      return
    }
    if (!/^\d{6}$/.test(pin)) {
      triggerError('PIN harus terdiri dari 6 angka.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await onLogin(pin)
    } catch {
      setPin('')
      triggerError('PIN salah, coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-screen">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <form className={`login-card ${shake ? 'is-shaking' : ''}`} onSubmit={submit}>
        <div className="brand-mark brand-mark-large">
          <img alt="Logo B.Cuts Barbershop" src={logoUrl} />
        </div>
        <p className="eyebrow">Private cashier workspace</p>
        <h1>Kasir B.Cuts</h1>
        <p className="login-copy">Masuk untuk mengelola transaksi, layanan, dan laporan barbershop.</p>

        <label className="field-label" htmlFor="login-pin">PIN karyawan</label>
        <div className={`pin-field ${error ? 'has-error' : ''}`}>
          <input
            autoComplete="current-password"
            autoFocus
            id="login-pin"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, '').slice(0, 6))
              setError('')
            }}
            placeholder="••••••"
            type={showPin ? 'text' : 'password'}
            value={pin}
          />
          <button
            aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
            className="icon-button"
            onClick={() => setShowPin((value) => !value)}
            type="button"
          >
            <Icon name={showPin ? 'eyeOff' : 'eye'} size={19} />
          </button>
        </div>
        <div aria-live="polite" className={`field-error ${error || !configurationReady ? 'is-visible' : ''}`}>
          {error || (!configurationReady ? 'Konfigurasi server belum dipasang di Vercel.' : 'Placeholder')}
        </div>

        <button className="primary-button login-button" disabled={loading || !configurationReady} type="submit">
          {loading ? <span className="button-loader" /> : null}
          {loading ? 'Memeriksa PIN...' : 'Masuk ke kasir'}
        </button>
        <div className="secure-note"><span /> Akses khusus karyawan B.Cuts</div>
      </form>
    </main>
  )
}
