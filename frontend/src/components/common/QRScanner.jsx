import React, { useState, useEffect } from 'react'
import { FaCamera, FaTimes, FaKeyboard } from 'react-icons/fa'
import { useTranslation } from '../../hooks/useTranslation'
import { useScanner } from '../../hooks/useScanner'
import './QRScanner.css'

const SCANNER_ELEMENT_ID = 'qr-scanner-region'

const QRScanner = ({ open, onClose, onScan }) => {
  const { t } = useTranslation()
  const [manualMode, setManualMode] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const { start, stop, scanning, error } = useScanner(SCANNER_ELEMENT_ID)

  // Auto-start camera when modal opens (unless we're in manual mode)
  useEffect(() => {
    if (open && !manualMode) {
      // Small delay to let the DOM element mount
      const timer = setTimeout(() => {
        start((decodedText) => {
          if (typeof onScan === 'function') onScan(decodedText)
        })
      }, 150)
      return () => {
        clearTimeout(timer)
        stop()
      }
    } else {
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, manualMode])

  // Close handler: stop camera first
  const handleClose = async () => {
    await stop()
    setManualValue('')
    setManualMode(false)
    if (typeof onClose === 'function') onClose()
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    const v = manualValue.trim().toUpperCase()
    if (!v) return
    if (typeof onScan === 'function') onScan(v)
    handleClose()
  }

  const errorMessage = () => {
    switch (error) {
      case 'insecure-context':
        return t('scanner.insecureContext')
      case 'no-camera-api':
      case 'no-camera':
        return t('scanner.noCamera')
      case 'permission-denied':
        return t('scanner.permissionDenied')
      default:
        return t('scanner.cameraError')
    }
  }

  if (!open) return null

  return (
    <div className="qr-scanner-overlay" onClick={handleClose}>
      <div className="qr-scanner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qr-scanner-header">
          <div className="qr-scanner-title">
            <FaCamera />
            <span>{t('scanner.title')}</span>
          </div>
          <button
            className="qr-scanner-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {!manualMode && (
          <>
            <div id={SCANNER_ELEMENT_ID} className="qr-scanner-region" />

            {scanning && !error && (
              <p className="qr-scanner-hint">{t('scanner.scanning')}</p>
            )}

            {error && (
              <div className="qr-scanner-error">
                <p>{errorMessage()}</p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => start((decodedText) => onScan(decodedText))}
                >
                  {t('common.retry')}
                </button>
              </div>
            )}

            <div className="qr-scanner-divider">
              <span>{t('common.cancel')}</span>
            </div>

            <button
              className="btn btn-outline btn-block"
              onClick={() => setManualMode(true)}
            >
              <FaKeyboard /> {t('scanner.manualEntry')}
            </button>
          </>
        )}

        {manualMode && (
          <form onSubmit={handleManualSubmit} className="qr-scanner-manual">
            <label>{t('scanner.enterLotId')}</label>
            <input
              type="text"
              inputMode="text"
              autoFocus
              className="form-control"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="RC-2024-000005"
            />
            <div className="qr-scanner-manual-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setManualMode(false)}
              >
                {t('common.back')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('common.confirm')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default QRScanner
