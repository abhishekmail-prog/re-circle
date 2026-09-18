import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuth } from '../../context/AuthContext'
import { useWebSocket } from '../../context/WebSocketContext'
import bidApi from '../../api/bids'
import { FaGavel, FaCheck, FaTrophy } from 'react-icons/fa'
import './BidPanel.css'

/**
 * Live bid panel — shown on LotDetail.
 * Collector sees all bids + Accept button.
 * Recycler sees their own bid highlighted.
 */
const BidPanel = ({ lot, onLotUpdated }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { client, connected } = useWebSocket()
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)

  const isCollectorOfThisLot =
    user?.email && lot?.collector?.email && user.email === lot.collector.email

  const lotIsOpen =
    lot?.status === 'CREATED' || lot?.status === 'BIDDING'

  // ── Load bids ────────────────────────────────────────────
  const fetchBids = useCallback(async () => {
    if (!lot?.lotId) return
    setLoading(true)
    try {
      const res = await bidApi.list(lot.lotId)
      setBids(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Failed to load bids:', err)
      setBids([])
    } finally {
      setLoading(false)
    }
  }, [lot?.lotId])

  useEffect(() => {
    fetchBids()
  }, [fetchBids])

  // ── Live updates via WebSocket ───────────────────────────
  useEffect(() => {
    if (!client || !connected || !lot?.lotId) return

    const sub = client.subscribe(`/topic/lots/${lot.lotId}/bids`, (msg) => {
      let payload
      try {
        payload = JSON.parse(msg.body)
      } catch {
        return
      }

      // Acceptance event — refetch lot + bids
      if (payload.event === 'ACCEPTED') {
        fetchBids()
        if (typeof onLotUpdated === 'function') onLotUpdated()
        return
      }

      // New / updated bid — merge into list (highest first)
      setBids((prev) => {
        const existing = prev.findIndex((b) => b.id === payload.id)
        let next
        if (existing >= 0) {
          next = [...prev]
          next[existing] = payload
        } else {
          next = [...prev, payload]
        }
        return next.sort((a, b) => (b.amountPerKg || 0) - (a.amountPerKg || 0))
      })
    })

    return () => sub.unsubscribe()
  }, [client, connected, lot?.lotId, fetchBids, onLotUpdated])

  const handleAccept = async (bidId) => {
    if (!lot?.lotId) return
    setAccepting(bidId)
    try {
      await bidApi.accept(lot.lotId, bidId)
      await fetchBids()
      if (typeof onLotUpdated === 'function') onLotUpdated()
    } catch (err) {
      console.error('Accept failed:', err)
    } finally {
      setAccepting(null)
    }
  }

  if (!lot) return null

  const best = bids[0]
  const totalBids = bids.length

  return (
    <div className="card bid-panel">
      <div className="bid-panel-header">
        <h3>
          <FaGavel /> {t('auction.liveBids')} ({totalBids})
          {connected && <span className="bid-panel-live" title="Live">●</span>}
        </h3>
        {best && (
          <span className="bid-panel-best">
            <FaTrophy /> {t('auction.highest')}: ₹{best.amountPerKg}/kg
          </span>
        )}
      </div>

      {loading ? (
        <p className="bid-empty">{t('common.loading')}</p>
      ) : totalBids === 0 ? (
        <p className="bid-empty">
          {lotIsOpen ? t('auction.noBidsYet') : t('auction.noBids')}
        </p>
      ) : (
        <div className="bid-list">
          {bids.map((bid, idx) => {
            const isBest = idx === 0 && lotIsOpen
            const isMine =
              user?.email && bid.recycler?.user?.email === user.email
            const isAccepted = bid.status === 'ACCEPTED'
            const isRejected = bid.status === 'REJECTED'

            return (
              <div
                key={bid.id}
                className={`bid-row ${isBest ? 'is-best' : ''} ${
                  isMine ? 'is-mine' : ''
                } ${isAccepted ? 'is-accepted' : ''} ${
                  isRejected ? 'is-rejected' : ''
                }`}
              >
                <div className="bid-company">
                  <span className="bid-company-name">
                    {bid.recycler?.companyName || '—'}
                    {isMine && (
                      <span className="bid-you"> ({t('auction.you')})</span>
                    )}
                  </span>
                  {isBest && (
                    <span className="bid-badge-best">
                      <FaTrophy /> {t('auction.highest')}
                    </span>
                  )}
                  {isAccepted && (
                    <span className="bid-badge-accepted">
                      <FaCheck /> {t('auction.accepted')}
                    </span>
                  )}
                  {isRejected && (
                    <span className="bid-badge-rejected">
                      {t('auction.rejected')}
                    </span>
                  )}
                </div>

                <div className="bid-amounts">
                  <span className="bid-amount-per-kg">
                    ₹{bid.amountPerKg}/kg
                  </span>
                  <span className="bid-total">
                    ₹{bid.totalAmount?.toFixed(2)}
                  </span>
                </div>

                {isCollectorOfThisLot && lotIsOpen && bid.status === 'PENDING' && (
                  <button
                    className="btn btn-success btn-sm bid-accept-btn"
                    onClick={() => handleAccept(bid.id)}
                    disabled={accepting === bid.id}
                  >
                    <FaCheck />{' '}
                    {accepting === bid.id
                      ? t('auction.accepting')
                      : t('auction.accept')}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BidPanel
