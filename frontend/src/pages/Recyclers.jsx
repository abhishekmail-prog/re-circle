import React, { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import './Recyclers.css'

const Recyclers = () => {
  const { t } = useTranslation()
  const [recyclers, setRecyclers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selecting, setSelecting] = useState(false)
  const navigate = useNavigate()

  const demoRecyclers = [
    { id: 'demo1', companyName: 'GreenCycle Solutions', authorized: true, pickupAvailable: true, serviceArea: 'Pune', serviceRadiusKm: 15, contactPerson: 'Rajesh Patel', contactPhone: '9876543212' },
    { id: 'demo2', companyName: 'EcoRecycle Industries', authorized: true, pickupAvailable: false, serviceArea: 'Mumbai', serviceRadiusKm: 10, contactPerson: 'Sneha Sharma', contactPhone: '9876543213' },
    { id: 'demo3', companyName: 'TechRecycle Solutions', authorized: true, pickupAvailable: true, serviceArea: 'Bangalore', serviceRadiusKm: 20, contactPerson: 'Vikram Reddy', contactPhone: '9876543214' },
    { id: 'demo4', companyName: 'E-Waste Hub', authorized: false, pickupAvailable: false, serviceArea: 'Delhi NCR', serviceRadiusKm: 12, contactPerson: 'Arjun Singh', contactPhone: '9876543215' }
  ]

  const decorateWithEarnings = (list) => {
    const weightKg = 5
    const enriched = list.map((recycler) => {
      const pricePerKg = 450 + Math.random() * 100
      const saleValue = pricePerKg * weightKg
      const transportCost = recycler.pickupAvailable
        ? 0
        : 150 + (recycler.serviceRadiusKm || 10) * 8
      const netEarnings = saleValue - transportCost
      return {
        ...recycler,
        pricePerKg: Math.round(pricePerKg * 100) / 100,
        saleValue: Math.round(saleValue * 100) / 100,
        transportCost: Math.round(transportCost * 100) / 100,
        netEarnings: Math.round(netEarnings * 100) / 100,
        isBestDeal: false
      }
    })
    if (enriched.length > 0) {
      const best = enriched.reduce((a, b) =>
        a.netEarnings > b.netEarnings ? a : b
      )
      best.isBestDeal = true
    }
    return enriched
  }

  const fetchRecyclers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/recyclers')
      let data = response?.data

      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch {
          data = demoRecyclers
          setError(t('recyclers.error'))
        }
      }

      if (Array.isArray(data) && data.length > 0) {
        setRecyclers(decorateWithEarnings(data))
      } else {
        setRecyclers(decorateWithEarnings(demoRecyclers))
        setError(t('recyclers.error'))
      }
    } catch (err) {
      console.error('Recyclers fetch error:', err)
      setRecyclers(decorateWithEarnings(demoRecyclers))
      setError(t('recyclers.error'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchRecyclers()
  }, [fetchRecyclers])

  const handleSelectRecycler = async (recycler) => {
    if (selecting) return
    setSelecting(true)

    try {
      const lotData = {
        materialCategoryName: 'PCB',
        description: 'Demo lot from recycler selection',
        weightKg: 5,
        condition: 'GOOD',
        sourceType: 'HOUSEHOLD',
        collectionAddress: 'Mumbai, Maharashtra',
        collectionLatitude: 19.076,
        collectionLongitude: 72.8777
      }

      const lotResponse = await api.post('/lots', lotData)
      const lot = lotResponse.data
      const lotId = lot.lotId

      if (!lotId) throw new Error('No lot ID returned from server')

      await api.post(`/lots/${lotId}/select-recycler`, {
        recyclerId: recycler.id
      })

      console.log(`Recycler ${recycler.companyName} selected!`)
      navigate(`/lot/${lotId}`)
    } catch (error) {
      console.error('Selection error:', error)
      console.error('Failed to select recycler. Using demo mode.')
      navigate('/lot/RC-DEMO-000001')
    } finally {
      setSelecting(false)
    }
  }

  if (loading) {
    return <div className="loading-state">{t('recyclers.loading')}</div>
  }

  if (recyclers.length === 0) {
    return (
      <div className="recyclers-page">
        <h1 className="page-title">{t('recyclers.title')}</h1>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p>{t('recyclers.noRecyclers')}</p>
          <button className="btn btn-primary" onClick={fetchRecyclers} style={{ marginTop: '16px' }}>
            {t('recyclers.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="recyclers-page">
      <h1 className="page-title">🏭 {t('recyclers.title')}</h1>
      <p className="page-subtitle text-muted">{t('recyclers.subtitle')}</p>

      {error && (
        <div className="demo-banner" style={{ background: '#fff3e0', padding: '8px 16px', borderRadius: '8px', marginBottom: '16px', color: '#e65100' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="lot-summary">
        <div className="card">
          <h4>{t('recyclers.yourLot')}</h4>
          <div className="lot-details">
            <span>{t('recyclers.material')} <strong>PCB</strong></span>
            <span>{t('recyclers.weight')} <strong>5 kg</strong></span>
          </div>
        </div>
      </div>

      <div className="recyclers-grid">
        {recyclers.map((recycler) => (
          <div key={recycler.id} className={`card recycler-card ${recycler.isBestDeal ? 'best-deal' : ''}`}>
            {recycler.isBestDeal && (
              <div className="best-deal-badge">{t('recyclers.bestDeal')}</div>
            )}

            <div className="recycler-header">
              <h3>{recycler.companyName || 'Unknown'}</h3>
              <span className={`badge ${recycler.authorized ? 'badge-success' : 'badge-danger'}`}>
                {recycler.authorized ? t('recyclers.authorized') : t('recyclers.notAuthorized')}
              </span>
            </div>

            <div className="recycler-details">
              <div className="detail-row">
                <span className="label">{t('recyclers.location')}</span>
                <span className="value">{recycler.serviceArea || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('recyclers.distance')}</span>
                <span className="value">{recycler.serviceRadiusKm || 10} km</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('recyclers.pickup')}</span>
                <span className={`value ${recycler.pickupAvailable ? 'text-success' : 'text-danger'}`}>
                  {recycler.pickupAvailable ? t('recyclers.available') : t('recyclers.notAvailable')}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">{t('recyclers.offerPrice')}</span>
                <span className="value">₹{recycler.pricePerKg?.toFixed(2) || 'N/A'}/kg</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('recyclers.saleValue')}</span>
                <span className="value">₹{recycler.saleValue?.toFixed(2) || 0}</span>
              </div>
              <div className="detail-row">
                <span className="label">{t('recyclers.transportCost')}</span>
                <span className="value text-danger">-₹{recycler.transportCost?.toFixed(2) || 0}</span>
              </div>
              <div className="detail-row highlight">
                <span className="label">{t('recyclers.netEarnings')}</span>
                <span className="value">₹{recycler.netEarnings?.toFixed(2) || 0}</span>
              </div>
            </div>

            {recycler.isBestDeal && (
              <div className="recommendation-reason">
                {t('recyclers.recommended', {
                  reason: recycler.pickupAvailable
                    ? t('recyclers.freePickup')
                    : t('recyclers.lowestTransport')
                })}
              </div>
            )}

            <button
              className={`btn ${recycler.isBestDeal ? 'btn-primary' : 'btn-outline'} btn-block`}
              onClick={() => handleSelectRecycler(recycler)}
              disabled={selecting}
            >
              {selecting ? t('recyclers.selecting') : t('recyclers.select')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Recyclers
