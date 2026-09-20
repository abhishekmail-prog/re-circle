import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useWebSocket } from '../../context/WebSocketContext'
import { useTranslation } from '../../hooks/useTranslation'
import api from '../../api/axios'
import bidApi from '../../api/bids'
import { FaGavel, FaBox, FaSync, FaTrophy, FaCheck } from 'react-icons/fa'
import './RecyclerDashboard.css'

const RecyclerLots = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { client, connected } = useWebSocket()
  const [allLots, setAllLots] = useState([])
  const [myBids, setMyBids] = useState({}) // { [lotId]: { id, amountPerKg, status } }
  const [bidInputs, setBidInputs] = useState({})
  const [placing, setPlacing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/lots')
      const lots = Array.isArray(res.data) ? res.data : []
      setAllLots(lots)
      // NOTE: we do NOT fan-out a /bids call per lot here.
      // That caused 30+ parallel requests and races. Instead, we only
      // remember "your bid" for lots you actually bid on in this session.
    } catch (e) {
      console.error('Failed to load lots:', e)
      setError(t('common.error'))
      setAllLots([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Live updates — refetch when any lot is created or its status changes
  useEffect(() => {
    if (!client || !connected) return
    const sub = client.subscribe('/topic/lots', (msg) => {
      console.log('Lot event (recycler lots):', msg.body)
      fetchAll()
    })
    return () => sub.unsubscribe()
  }, [client, connected, fetchAll])

  // Refetch when the tab comes back into focus
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') fetchAll()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [fetchAll])

  const handlePlaceBid = async (lot) => {
    const amount = parseFloat(bidInputs[lot.lotId])
    if (!amount || amount <= 0) {
      console.error('Invalid bid amount')
      return
    }
    setPlacing(lot.lotId)
    try {
      const res = await bidApi.place(lot.lotId, amount)
      const bid = res.data

      // Optimistically update: record my bid locally
      setMyBids((prev) => ({
        ...prev,
        [lot.lotId]: {
          id: bid.id,
          amountPerKg: bid.amountPerKg,
          status: bid.status
        }
      }))

      // Flip the lot's status to BIDDING locally (no refetch)
      setAllLots((prev) =>
        prev.map((l) =>
          l.lotId === lot.lotId && l.status === 'CREATED'
            ? { ...l, status: 'BIDDING' }
            : l
        )
      )

      setBidInputs((prev) => ({ ...prev, [lot.lotId]: '' }))
      console.log(t('auction.bidPlaced'))
    } catch (e) {
      console.error(t('auction.bidError'), e?.response?.data || e.message)
    } finally {
      setPlacing(null)
    }
  }

  const isMyBidPending = (lotId) => {
    const b = myBids[lotId]
    return b && b.status === 'PENDING'
  }

  const openLots = allLots.filter(
    (l) => l.status === 'CREATED' || l.status === 'BIDDING'
  )

  const myAssignedLots = allLots.filter(
    (l) =>
      l.selectedRecycler?.user?.email === user?.email &&
      (l.status === 'MATCHED' ||
        l.status === 'HANDED_OVER' ||
        l.status === 'PAYMENT_PENDING')
  )

  const getStatusBadge = (status) => {
    const map = {
      CREATED: 'badge-info',
      BIDDING: 'badge-warning',
      MATCHED: 'badge-warning',
      PICKUP_SCHEDULED: 'badge-info',
      HANDED_OVER: 'badge-success',
      PAYMENT_PENDING: 'badge-warning',
      PAID: 'badge-success',
      COMPLETED: 'badge-success'
    }
    return map[status] || 'badge-info'
  }

  return (
    <div className="recycler-dashboard">
      <div className="dashboard-header">
        <h1>{t('recyclerLots.title')}</h1>
        <p className="text-muted">{t('recyclerLots.subtitle')}</p>
      </div>

      <div style={{ margin: '12px 0', display: 'flex', gap: '12px' }}>
        <button className="btn btn-outline" onClick={fetchAll} disabled={loading}>
          <FaSync /> {t('common.retry')}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: '#ffebee',
            color: '#b71c1c',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}
        >
          {error}
        </div>
      )}

      {/* ─── OPEN LOTS FOR BIDDING ───────────────────────── */}
      <div className="card incoming-lots">
        <h3>
          <FaGavel /> {t('auction.openLots')} ({openLots.length})
        </h3>
        {loading ? (
          <div className="empty-state">
            <p>{t('common.loading')}</p>
          </div>
        ) : openLots.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '48px' }}>🎉</span>
            <p>{t('auction.noOpenLots')}</p>
          </div>
        ) : (
          <div className="lots-list">
            {openLots.map((lot) => {
              const myBid = myBids[lot.lotId]
              const bidIsPending = isMyBidPending(lot.lotId)
              const inputValue = bidInputs[lot.lotId] ?? ''

              return (
                <div key={lot.lotId} className="lot-item">
                  <div className="lot-info">
                    <span className="lot-id">{lot.lotId}</span>
                    <span className="lot-material">
                      {lot.materialCategory?.name || '—'}
                    </span>
                    <span className="lot-weight">{lot.weightKg} kg</span>
                    <span className="lot-collector">
                      👤 {lot.collector?.fullName || '—'}
                    </span>
                    <span className={`badge ${getStatusBadge(lot.status)}`}>
                      {lot.status}
                    </span>
                  </div>

                  <div
                    className="lot-actions"
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}
                  >
                    {myBid && (
                      <span
                        className="bid-your-amount"
                        style={{
                          fontSize: '0.85rem',
                          color: bidIsPending ? '#1565c0' : '#666'
                        }}
                      >
                        {bidIsPending ? (
                          <>
                            <FaTrophy /> {t('auction.you')}: ₹
                            {myBid.amountPerKg}/kg
                          </>
                        ) : (
                          <>
                            <FaCheck /> {myBid.status}: ₹
                            {myBid.amountPerKg}/kg
                          </>
                        )}
                      </span>
                    )}

                    <input
                      type="number"
                      className="form-control"
                      style={{ width: '110px' }}
                      placeholder="₹/kg"
                      value={inputValue}
                      onChange={(e) =>
                        setBidInputs((prev) => ({
                          ...prev,
                          [lot.lotId]: e.target.value
                        }))
                      }
                      step="1"
                      min="1"
                      title="Bid amount per kilogram"
                    />
                    {inputValue && parseFloat(inputValue) > 0 && (
                      <span
                        style={{
                          fontSize: '0.82rem',
                          color: '#0d47a1',
                          background: '#e3f2fd',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        × {lot.weightKg} kg = <strong>₹
                          {(parseFloat(inputValue) * (lot.weightKg || 0)).toLocaleString('en-IN')}
                        </strong>
                      </span>
                    )}
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handlePlaceBid(lot)}
                      disabled={placing === lot.lotId || !inputValue}
                    >
                      <FaGavel />{' '}
                      {placing === lot.lotId
                        ? t('common.loading')
                        : t('auction.placeBid')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── MY MATCHED LOTS ──────────────────────────── */}
      <div className="card incoming-lots" style={{ marginTop: '16px' }}>
        <h3>
          <FaBox /> {t('recyclerLots.title')} ({myAssignedLots.length})
        </h3>
        {myAssignedLots.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '48px' }}>📭</span>
            <p>{t('recyclerDashboard.noIncomingLots')}</p>
          </div>
        ) : (
          <div className="lots-list">
            {myAssignedLots.map((lot) => (
              <div key={lot.lotId} className="lot-item">
                <div className="lot-info">
                  <span className="lot-id">{lot.lotId}</span>
                  <span className="lot-material">
                    {lot.materialCategory?.name || '—'}
                  </span>
                  <span className="lot-weight">{lot.weightKg} kg</span>
                  <span className="lot-collector">
                    👤 {lot.collector?.fullName || '—'}
                  </span>
                </div>
                <div className="lot-actions">
                  <span className={`badge ${getStatusBadge(lot.status)}`}>
                    {lot.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecyclerLots
