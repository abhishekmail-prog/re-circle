import React, { useState, useEffect, useCallback } from 'react'
import { FaCopy, FaCheck, FaShareAlt, FaWhatsapp } from 'react-icons/fa'
import { useTranslation } from '../../hooks/useTranslation'
import './CopyButton.css'

/**
 * CopyButton — copy-to-clipboard + share (native share sheet when available,
 * WhatsApp Web fallback otherwise).
 */
const CopyButton = ({
  value,
  shareText,
  size = 'sm',
  showShare = true
}) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [nativeShare, setNativeShare] = useState(false)

  useEffect(() => {
    setNativeShare(
      typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    )
  }, [])

  const handleCopy = useCallback(async (e) => {
    e?.stopPropagation?.()
    if (!value) return

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const ta = document.createElement('textarea')
        ta.value = value
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }, [value])

  const handleShare = useCallback(async (e) => {
    e?.stopPropagation?.()
    if (!value) return

    const msg = shareText || value

    if (nativeShare) {
      try {
        await navigator.share({ title: t('common.share'), text: msg })
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
      return
    }

    // Fallback — open WhatsApp with pre-filled message
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }, [value, shareText, nativeShare, t])

  if (!value) return null

  const cls = `copy-btn copy-btn-${size}${copied ? ' is-copied' : ''}`

  return (
    <span className="copy-btn-wrapper">
      <button
        type="button"
        className={cls}
        onClick={handleCopy}
        title={copied ? t('common.copied') : t('common.copy')}
        aria-label={copied ? t('common.copied') : t('common.copy')}
      >
        {copied ? <FaCheck /> : <FaCopy />}
        <span className="copy-btn-label">
          {copied ? t('common.copied') : t('common.copy')}
        </span>
      </button>

      {showShare && (
        <button
          type="button"
          className={`copy-btn copy-btn-${size} copy-btn-share`}
          onClick={handleShare}
          title={t('common.share')}
          aria-label={t('common.share')}
        >
          {nativeShare ? <FaShareAlt /> : <FaWhatsapp />}
          <span className="copy-btn-label">
            {nativeShare ? t('common.share') : 'WhatsApp'}
          </span>
        </button>
      )}
    </span>
  )
}

export default CopyButton
