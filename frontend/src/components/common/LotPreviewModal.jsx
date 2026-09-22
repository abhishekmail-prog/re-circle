import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuth } from '../../context/AuthContext'
import { useWebSocket } from '../../context/WebSocketContext'
import bidApi from '../../api/bids'
import {
  FaTimes, FaTrophy, FaBox, FaWeightHanging, FaUser,
  FaMapMarkerAlt, FaGavel, FaCheck
} from 'react-icons/fa'
import './LotPreviewModal.css'

const IMG_BASE = 'http://localhost:8080'

const LotPreviewModal = ({ lot, onClose, onBidPlaced }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { client, connected } = useWebSocket()
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [placing, setPlacing] = useState(false)
  const [err, setErr] = useState(null)

  const fetchBids = useCallback(async () => {
    if (!lot?.lotId) return
    setLoading(true)
    try {
      const res = await bidApi.list(lot.lotId)
      setBids(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error('bids fetch failed', e)
      setBids([])
    } finally {
      setLoading(false)
    }
  }, [lot?.lotId])

  useEffect(() => { fetchBids() }, [fetchBids])

  // Live updates for this lot's bids
  useEffect(() => {
    if (!client || !connected || !lot?.lotId) return
    const sub = client.subscribe(`/topic/lots/${lot.lotId}/bids`, () => fetchBids())
    return () => sub.unsubscribe()
  }, [client, connected, lot?.lotId, fetchBids])

  const highest = bids[0]
  const myBid = bids.find(b => b.recycler?.user?.email === user?.email)
  const isTop = !!highest && highest.recycler?.user?.email === user?.email
  const wasOutbid = !!myBid && !isTop

  const minBid = highest ? Math.floor(highest.amountPerKg) + 1 : 1
  const inputVal = parseFloat(input) || 0
  const inputValid = inputVal >= minBid

  const handleBid = async () => {
    if (!inputValid || placing) return
    setPlacing(true)
    setErr(null)
    try {
      await bidApi.place(lot.lotId, inputVal)
      setInput('')
      await fetchBids()
      if (typeof onBidPlaced === 'function') onBidPlaced()
    } catch (e) {
      setErr(e?.response?.data?.error || 'Bid failed')
    } finally {
      setPlacing(false)
    }
  }

  if (!lot) return null

  const imgSrc = lot.imageUrl
    ? (lot.imageUrl.startsWith('http') ? lot.imageUrl : IMG_BASE + lot.imageUrl)
    : null

  return (
    <div className="lpm-overlay" onClick={onClose}>
      <div className="lpm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="lpm-close" onClick={onClose} aria-label="close">
          <FaTimes />
        </button>

        {imgSrc ? (
          <img src={imgSrc} alt={lot.lotId} className="lpm-image" />
        ) : (
          <div className="lpm-image lpm-image-empty">
            <FaBox />
          </div>
        )}

        <div className="lpm-body">
          <div className="lpm-header">
            <h3>{lot.materialCategory?.name || '—'}</h3>
            <span className="lpm-lot-id">{lot.lotId}</span>
          </div>

          <div className="lpm-meta">
            <span><FaWeightHanging /> {lot.weightKg || 0} kg</span>
            <span><FaUser /> {lot.collector?.fullName || '—'}</span>
            {lot.collectionAddress && (
              <span><FaMapMarkerAlt /> {lot.collectionAddress}</span>
            )}
          </div>

          {highest ? (
            <div className={`lpm-top-bid ${isTop ? 'mine' : ''}`}>
              <div className="lpm-top-left">
                <FaTrophy />
                <div>
                  <div className="lpm-top-label">{t('auction.currentHighest')}</div>
                  <div className="lpm-top-company">
                    {highest.recycler?.companyName}
                  </div>
                </div>
              </div>
              <div className="lpm-top-amount">
                ₹{highest.amountPerKg}/kg
              </div>
            </div>
          ) : (
            <div className="lpm-no-bids">{t('auction.noBidsYet')}</div>
          )}

          {isTop && (
            <div className="lpm-status-ok">
              <FaCheck /> {t('auction.youAreHighest')}
            </div>
          )}
          {wasOutbid && (
            <div className="lpm-status-bad">
              ⚠️ {t('auction.outbid')} — {t('auction.minBid')} ₹{minBid}/kg
            </div>
          )}

          {bids.length > 0 && (
            <div className="lpm-bid-list">
              {bids.map((b, i) => {
                const isMe = b.recycler?.user?.email === user?.email
                return (
                  <div key={b.id || i} className={`lpm-bid-row ${isMe ? 'is-me' : ''}`}>
                    <span>{i + 1}. {b.recycler?.companyName || '—'}</span>
                    <span>₹{b.amountPerKg}/kg</span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="lpm-bid-input">
            <label>{t('auction.yourBid')}</label>
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`≥ ${minBid}`}
              min={minBid}
              step="1"
            />
            {input && !inputValid && (
              <div className="lpm-hint-bad">
                {t('auction.minBid')} ₹{minBid}/kg
              </div>
            )}
            {input && inputValid && (
              <div className="lpm-hint-ok">
                × {lot.weightKg} kg = ₹{(inputVal * (lot.weightKg || 0)).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          {err && <div className="lpm-error">{err}</div>}

          <button
            className="lpm-place-btn"
            disabled={!inputValid || placing}
            onClick={handleBid}
          >
            <FaGavel /> {placing ? t('common.loading') : t('auction.placeBid')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LotPreviewModal
