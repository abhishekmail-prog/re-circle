import React from 'react'
import QRCode from 'qrcode.react'
import './QRCode.css'

const QRCodeComponent = ({ value, size = 200, showDownload = true }) => {
  const downloadQR = () => {
    const canvas = document.getElementById('qr-code-canvas')
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `qr-${value}.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
  }

  return (
    <div className="qr-code-container">
      <div className="qr-code-wrapper">
        <QRCode
          id="qr-code-canvas"
          value={value}
          size={size}
          level="H"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#2e7d32"
        />
      </div>
      {showDownload && (
        <button className="btn btn-primary btn-sm" onClick={downloadQR}>
          📥 Download QR Code
        </button>
      )}
      <p className="qr-code-value">Lot ID: {value}</p>
    </div>
  )
}

export default QRCodeComponent
