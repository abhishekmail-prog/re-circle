import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuth } from '../../context/AuthContext'
import { useWebSocket } from '../../context/WebSocketContext'
import bidApi from '../../api/bids'
import {
  FaTimes, FaTrophy, FaBox, FaWeightHanging, FaUser,
  FaMapMarkerAlt, FaGavel, FaCheck
} from 'react-icons/fa'
import ImageGallery from './ImageGallery'
import './LotPreviewModal.css'

import { API_URL as IMG_BASE } from '../../config'

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
    const globalSub = client.subscribe('/topic/lots', (msg) => {
      try {
        const data = JSON.parse(msg.body)
        if (data.lotId === lot.lotId) fetchBids()
      } catch {}
    })
    return () => {
      sub.unsubscribe()
      globalSub.unsubscribe()
    }
  }, [client, connected, lot?.lotId, fetchBids])

  const lotClosed = lot.status !== 'CREATED' && lot.status !== 'BIDDING'
  const highest = bids[0]

  const iAmWinning =
    highest && highest.recycler?.user?.email === user?.email
  const winnerEmail = lot.selectedRecycler?.user?.email
  const iWon = lotClosed && winnerEmail && winnerEmail === user?.email
  const iLost = lotClosed && winnerEmail && winnerEmail !== user?.email
  const auctionAbandoned = lotClosed && !winnerEmail
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
    ? ((lot.imageUrl.startsWith('http') || lot.imageUrl.startsWith('data:')) ? lot.imageUrl : IMG_BASE + lot.imageUrl)
    : null

  return (
    <div className="lpm-overlay" onClick={onClose}>
      <div className="lpm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="lpm-close" onClick={onClose} aria-label="close">
          <FaTimes />
        </button>

        <ImageGallery
          imageUrl={lot.imageUrl}
          imageUrls={lot.imageUrls}
          alt={lot.lotId}
          height={280}
          thumbnails={true}
        />

        <div className="lpm-body">

          {iWon && (
            <div style={{
              background: 'linear-gradient(135deg, #34a853 0%, #0f9d58 100%)',
              color: '#fff',
              borderRadius: 16,
              padding: '20px 18px',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.6rem', lineHeight: 1 }}>🎉</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: 6 }}>
                Bid Accepted!
              </div>
              <div style={{ fontSize: '0.92rem', opacity: 0.95, marginTop: 4 }}>
                You won this lot. Meet the collector to scan the QR and complete handover.
              </div>
            </div>
          )}

          {iLost && (
            <div style={{
              background: '#fce8e6',
              border: '1px solid #f5c6cb',
              color: '#a51e17',
              borderRadius: 16,
              padding: '20px 18px',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.6rem', lineHeight: 1 }}>😞</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 6 }}>
                Auction Closed
              </div>
              <div style={{ fontSize: '0.92rem', marginTop: 4 }}>
                Another recycler won this lot. Try bidding on other open lots.
              </div>
            </div>
          )}

          {auctionAbandoned && (
            <div style={{
              background: '#f1f3f4',
              color: '#5f6368',
              borderRadius: 16,
              padding: '16px 18px',
              marginBottom: 16,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                Auction Closed
              </div>
              <div style={{ fontSize: '0.88rem', marginTop: 4 }}>
                The collector closed this lot without selecting a winner.
              </div>
            </div>
          )}
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

          {lotClosed && (
            <div style={{
              padding: '12px 16px',
              background: '#fef7e0',
              border: '1px solid #fde293',
              borderRadius: 12,
              color: '#b26a00',
              fontWeight: 600,
              fontSize: '0.92rem',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              ⚠️ Auction closed — this lot is now {lot.status}
            </div>
          )}

          <div className="lpm-bid-input">
            <label>{t('auction.yourBid')}</label>
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lotClosed ? '—' : `≥ ${minBid}`}
              min={minBid}
              step="1"
              disabled={lotClosed}
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
