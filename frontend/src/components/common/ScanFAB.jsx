import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaQrcode } from 'react-icons/fa'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import QRScanner from './QRScanner'
import './ScanFAB.css'

/**
 * Floating scan button for recyclers — UPI-style.
 * Tap → opens the QRScanner modal → on scan, verifies the lot is
 * assigned to this recycler and jumps to Handovers.
 */
const ScanFAB = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(null)

  if (user?.role !== 'RECYCLER') return null

  const handleScan = async (decodedText) => {
    setOpen(false)
    setError(null)

    let lotId = decodedText
    const match = decodedText.match(/(RC-\d{4}-\d+)/)
    if (match) lotId = match[1]

    try {
      const res = await api.get(`/lots/lot/${lotId}`)
      const lot = res.data

      if (!lot || !lot.lotId) {
        setError(t('auction.scanNotFound') + ` (${lotId})`)
        setTimeout(() => setError(null), 4500)
        return
      }

      const assignedEmail = lot.selectedRecycler?.user?.email
      const mine = assignedEmail && assignedEmail === user?.email

      if (!mine) {
        setError(t('auction.scanNotYours'))
        setTimeout(() => setError(null), 4500)
        return
      }

      navigate(`/recycler/handovers?scan=${encodeURIComponent(lotId)}`)
    } catch (e) {
      console.error('Scan lookup failed:', e)
      setError(t('auction.scanNotFound') + ` (${lotId})`)
      setTimeout(() => setError(null), 4500)
    }
  }

  return (
    <>
      {error && (
        <div className="scan-fab-toast" role="alert">
          {error}
        </div>
      )}

      <button
        type="button"
        className="scan-fab"
        onClick={() => setOpen(true)}
        aria-label={t('auction.scanNow')}
        title={t('auction.scanNow')}
      >
        <FaQrcode />
        <span className="scan-fab-label">{t('auction.scanNow')}</span>
      </button>

      <QRScanner
        open={open}
        onClose={() => setOpen(false)}
        onScan={handleScan}
      />
    </>
  )
}

export default ScanFAB
