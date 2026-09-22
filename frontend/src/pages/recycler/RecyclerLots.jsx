import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useWebSocket } from '../../context/WebSocketContext'
import { useTranslation } from '../../hooks/useTranslation'
import api from '../../api/axios'
import { FaGavel, FaBox, FaSync, FaTrophy, FaExclamationTriangle } from 'react-icons/fa'
import LotPreviewModal from '../../components/common/LotPreviewModal'
import './RecyclerDashboard.css'

const IMG_BASE = 'http://localhost:8080'

const RecyclerLots = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { client, connected } = useWebSocket()
  const [allLots, setAllLots] = useState([])
  const [summaries, setSummaries] = useState({}) // { [lotId]: { count, highestAmountPerKg, highestBidderEmail, highestBidderCompany } }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLot, setSelectedLot] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/lots')
      const lots = Array.isArray(res.data) ? res.data : []
      setAllLots(lots)

      // Fetch bid summaries in ONE batch call
      const open = lots.filter(l => l.status === 'CREATED' || l.status === 'BIDDING')
      if (open.length > 0) {
        try {
          const sum = await api.post('/lots/bids-summary', {
            lotIds: open.map(l => l.lotId)
          })
          setSummaries(sum.data || {})
        } catch (e) {
          console.warn('bids-summary failed', e)
          setSummaries({})
        }
      } else {
        setSummaries({})
      }
    } catch (e) {
      console.error('Failed to load lots:', e)
      setError(t('common.error'))
      setAllLots([])
      setSummaries({})
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Live refresh on any lot event
  useEffect(() => {
    if (!client || !connected) return
    const sub = client.subscribe('/topic/lots', () => fetchAll())
    return () => sub.unsubscribe()
  }, [client, connected, fetchAll])

  // Refresh on tab focus
  useEffect(() => {
    const h = () => { if (document.visibilityState === 'visible') fetchAll() }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [fetchAll])

  // Refresh on any bid on any lot (my session or someone else's)
  useEffect(() => {
    if (!client || !connected) return
    // Subscribe to a broad topic? Simpler: re-fetch summaries when any lot updates
    // The /topic/lots event already covers it, but bids trigger /topic/lots/{id}/bids
    // We'll also poll summaries every 8s while page is visible
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const open = allLots.filter(l => l.status === 'CREATED' || l.status === 'BIDDING')
        if (open.length > 0) {
          api.post('/lots/bids-summary', { lotIds: open.map(l => l.lotId) })
            .then(r => setSummaries(r.data || {}))
            .catch(() => {})
        }
      }
    }, 8000)
    return () => clearInterval(id)
  }, [client, connected, allLots])

  const openLots = allLots.filter(
    l => l.status === 'CREATED' || l.status === 'BIDDING'
  )

  const myAssignedLots = allLots.filter(
    l =>
      l.selectedRecycler?.user?.email === user?.email &&
      (l.status === 'MATCHED' ||
        l.status === 'HANDED_OVER' ||
        l.status === 'PAYMENT_PENDING')
  )

  const getStatusBadge = (status) => ({
    CREATED: 'badge-info',
    BIDDING: 'badge-warning',
    MATCHED: 'badge-warning',
    PICKUP_SCHEDULED: 'badge-info',
    HANDED_OVER: 'badge-success',
    PAYMENT_PENDING: 'badge-warning',
    PAID: 'badge-success',
    COMPLETED: 'badge-success'
  }[status] || 'badge-info')

  const getThumb = (lot) => {
    // Prefer the first URL from the multi-photo list
    let first = lot.imageUrl
    if (lot.imageUrls) {
      const arr = typeof lot.imageUrls === 'string'
        ? lot.imageUrls.split(',')
        : lot.imageUrls
      if (Array.isArray(arr) && arr.length > 0) first = arr[0].trim()
    }
    if (!first) return null
    return first.startsWith('http') ? first : IMG_BASE + (first.startsWith('/') ? first : '/' + first)
  }

  return (
    <div className="recycler-dashboard">
      <div className="dashboard-header">
        <h1>{t('recyclerLots.title')}</h1>
        <p className="text-muted">{t('recyclerLots.subtitle')}</p>
      </div>

      <div style={{ margin: '12px 0' }}>
        <button className="btn btn-outline" onClick={fetchAll} disabled={loading}>
          <FaSync /> {t('common.retry')}
        </button>
      </div>

      {error && (
        <div style={{
          background: '#ffebee', color: '#b71c1c',
          padding: '10px 16px', borderRadius: '8px', marginBottom: '12px'
        }}>
          {error}
        </div>
      )}

      <div className="card incoming-lots">
        <h3>
          <FaGavel /> {t('auction.openLots')} ({openLots.length})
        </h3>

        {loading ? (
          <div className="empty-state"><p>{t('common.loading')}</p></div>
        ) : openLots.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '48px' }}>🎉</span>
            <p>{t('auction.noOpenLots')}</p>
          </div>
        ) : (
          <div className="lots-list">
            {openLots.map((lot) => {
              const s = summaries[lot.lotId] || {}
              const thumb = getThumb(lot)
              const isMine = s.highestBidderEmail && s.highestBidderEmail === user?.email
              const outbid = s.count > 0 && !isMine

              return (
                <div
                  key={lot.lotId}
                  className={`lot-item rl-row ${outbid ? 'rl-outbid' : ''}`}
                  onClick={() => setSelectedLot(lot)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="rl-thumb">
                    {thumb ? (
                      <img src={thumb} alt="" />
                    ) : (
                      <FaBox />
                    )}
                  </div>

                  <div className="lot-info rl-info">
                    <span className="lot-id">{lot.lotId}</span>
                    <span className="lot-material">
                      {lot.materialCategory?.name || '—'}
                    </span>
                    <span className="lot-weight">{lot.weightKg} kg</span>
                    <span className="lot-collector">
                      👤 {lot.collector?.fullName || '—'}
                    </span>
                  </div>

                  <div className="rl-right">
                    {s.count > 0 ? (
                      <span className={`rl-top-chip ${isMine ? 'mine' : ''}`}>
                        <FaTrophy /> ₹{s.highestAmountPerKg}/kg
                      </span>
                    ) : (
                      <span className="rl-top-chip empty">
                        {t('auction.noBidsYet')}
                      </span>
                    )}
                    {outbid && (
                      <span className="rl-outbid-flag">
                        <FaExclamationTriangle /> {t('auction.outbid')}
                      </span>
                    )}
                    <span className={`badge ${getStatusBadge(lot.status)}`}>
                      {lot.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
                <div className="rl-thumb">
                  {getThumb(lot) ? <img src={getThumb(lot)} alt="" /> : <FaBox />}
                </div>
                <div className="lot-info rl-info">
                  <span className="lot-id">{lot.lotId}</span>
                  <span className="lot-material">
                    {lot.materialCategory?.name || '—'}
                  </span>
                  <span className="lot-weight">{lot.weightKg} kg</span>
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

      {selectedLot && (
        <LotPreviewModal
          lot={selectedLot}
          onClose={() => setSelectedLot(null)}
          onBidPlaced={fetchAll}
        />
      )}
    </div>
  )
}

export default RecyclerLots
