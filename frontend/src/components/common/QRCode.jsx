import React from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { useTranslation } from '../../hooks/useTranslation'
import './QRCode.css'

const QRCodeComponent = ({ value, size = 200, showDownload = true }) => {
  const { t } = useTranslation()
  const canvasId = `qr-${value}`

  const downloadQR = () => {
    const canvas = document.getElementById(canvasId)
    if (!canvas) return
    // If a user passed a non-canvas element by mistake, guard it
    if (typeof canvas.toDataURL !== 'function') return

    const pngUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = pngUrl
    link.download = `qr-${value}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!value) {
    return (
      <div className="qr-code-container">
        <p className="qr-code-value">{t('common.noData')}</p>
      </div>
    )
  }

  return (
    <div className="qr-code-container">
      <div className="qr-code-wrapper">
        <QRCodeCanvas
          id={canvasId}
          value={value}
          size={size}
          level="H"
          marginSize={2}
          bgColor="#ffffff"
          fgColor="#2e7d32"
        />
      </div>
      {showDownload && (
        <button className="btn btn-primary btn-sm" onClick={downloadQR}>
          {t('lotDetail.downloadQR')}
        </button>
      )}
      <p className="qr-code-value">
        {t('lotDetail.lotId')}: {value}
      </p>
    </div>
  )
}

export default QRCodeComponent
