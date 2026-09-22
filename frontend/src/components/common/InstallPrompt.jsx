import React, { useState, useEffect } from 'react'
import { FaDownload, FaTimes, FaMobileAlt } from 'react-icons/fa'
import { useTranslation } from '../../hooks/useTranslation'
import './InstallPrompt.css'

const DISMISS_KEY = 'recircle-install-dismissed'
const DISMISS_DAYS = 14

const InstallPrompt = () => {
  const { t } = useTranslation()
  const [promptEvent, setPromptEvent] = useState(null)
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Respect prior dismissal
    const dismissedAt = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10)
    const daysSince = (Date.now() - dismissedAt) / 86400000
    if (dismissedAt && daysSince < DISMISS_DAYS) return

    // iOS Safari: no beforeinstallprompt, show manual instructions
    const ua = window.navigator.userAgent
    const iOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    if (iOS && !standalone) {
      setIsIOS(true)
      setTimeout(() => setVisible(true), 3000)
      return
    }

    // Android / desktop Chromium: capture the install event
    const handler = (e) => {
      e.preventDefault()
      setPromptEvent(e)
      setTimeout(() => setVisible(true), 2000)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // If already installed, hide
    window.addEventListener('appinstalled', () => {
      setVisible(false)
      setPromptEvent(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!promptEvent) return
    promptEvent.prompt()
    const choice = await promptEvent.userChoice
    console.log('Install choice:', choice.outcome)
    if (choice.outcome === 'accepted') {
      setVisible(false)
    }
    setPromptEvent(null)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="install-banner" role="dialog" aria-label="Install app">
      <div className="install-icon">
        <FaMobileAlt />
      </div>

      <div className="install-text">
        <strong>{t('install.title')}</strong>
        {isIOS ? (
          <span>{t('install.iosHint')}</span>
        ) : (
          <span>{t('install.subtitle')}</span>
        )}
      </div>

      <div className="install-actions">
        {!isIOS && promptEvent && (
          <button className="install-btn" onClick={handleInstall}>
            <FaDownload /> {t('install.install')}
          </button>
        )}
        <button className="install-close" onClick={handleDismiss} aria-label="dismiss">
          <FaTimes />
        </button>
      </div>
    </div>
  )
}

export default InstallPrompt
