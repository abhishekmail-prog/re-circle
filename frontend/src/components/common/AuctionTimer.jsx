import React, { useState, useEffect } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { FaHourglassHalf, FaCheckCircle } from 'react-icons/fa'
import './AuctionTimer.css'

/**
 * Countdown timer for an auction.
 * Shows HH:MM:SS remaining; when expired, shows "Auction ended".
 */
const AuctionTimer = ({ endsAt, status, compact = false }) => {
  const { t } = useTranslation()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!endsAt) return null

  const ended =
    status === 'MATCHED' ||
    status === 'PAID' ||
    status === 'COMPLETED' ||
    status === 'HANDED_OVER'

  const end = new Date(endsAt).getTime()
  const diff = Math.max(0, end - now)
  const expired = diff <= 0

  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  const isUrgent = !expired && hours === 0 && minutes < 60

  if (compact) {
    return (
      <span className={`auction-timer compact ${isUrgent ? 'urgent' : ''}`}>
        <FaHourglassHalf />
        {ended || expired
          ? t('auction.ended')
          : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
      </span>
    )
  }

  return (
    <div className={`auction-timer-banner ${isUrgent ? 'urgent' : ''} ${ended || expired ? 'ended' : ''}`}>
      <div className="auction-timer-label">
        {ended ? (
          <>
            <FaCheckCircle /> {t('auction.closed')}
          </>
        ) : expired ? (
          <>
            <FaHourglassHalf /> {t('auction.ended')}
          </>
        ) : (
          <>
            <FaHourglassHalf /> {t('auction.timeLeft')}
          </>
        )}
      </div>
      {!ended && (
        <div className="auction-timer-clock">
          {String(hours).padStart(2, '0')}:
          {String(minutes).padStart(2, '0')}:
          {String(seconds).padStart(2, '0')}
        </div>
      )}
    </div>
  )
}

export default AuctionTimer
