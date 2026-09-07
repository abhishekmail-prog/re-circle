import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
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

  // Fallback demo recyclers
  const demoRecyclers = [
    { id: 'demo1', companyName: 'GreenCycle Solutions', authorized: true, pickupAvailable: true, serviceArea: 'Pune', serviceRadiusKm: 15, contactPerson: 'Rajesh Patel', contactPhone: '9876543212' },
    { id: 'demo2', companyName: 'EcoRecycle Industries', authorized: true, pickupAvailable: false, serviceArea: 'Mumbai', serviceRadiusKm: 10, contactPerson: 'Sneha Sharma', contactPhone: '9876543213' },
    { id: 'demo3', companyName: 'TechRecycle Solutions', authorized: true, pickupAvailable: true, serviceArea: 'Bangalore', serviceRadiusKm: 20, contactPerson: 'Vikram Reddy', contactPhone: '9876543214' },
    { id: 'demo4', companyName: 'E-Waste Hub', authorized: false, pickupAvailable: false, serviceArea: 'Delhi NCR', serviceRadiusKm: 12, contactPerson: 'Arjun Singh', contactPhone: '9876543215' },
  ]

  useEffect(() => {
    fetchRecyclers()
  }, [])

  const fetchRecyclers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/recyclers')
      let data = response.data
      
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch (e) {
          setError('Using demo recycler data')
          data = demoRecyclers
        }
      }
      
      if (Array.isArray(data) && data.length > 0) {
        const weightKg = 5
        const recyclersWithEarnings = data.map(recycler => {
          const pricePerKg = 450 + Math.random() * 100
          const saleValue = pricePerKg * weightKg
          const transportCost = recycler.pickupAvailable ? 0 : 150 + (recycler.serviceRadiusKm || 10) * 8
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
        
        if (recyclersWithEarnings.length > 0) {
          const best = recyclersWithEarnings.reduce((a, b) => 
            a.netEarnings > b.netEarnings ? a : b
          )
          best.isBestDeal = true
        }
        
        setRecyclers(recyclersWithEarnings)
      } else {
        setRecyclers(demoRecyclers.map(r => ({ ...r, pricePerKg: 500, saleValue: 2500, transportCost: 0, netEarnings: 2500, isBestDeal: false })))
        setError('Using demo recycler data')
      }
    } catch (err) {
      console.error('❌ Error:', err)
      setError('Using demo recycler data')
      setRecyclers(demoRecyclers.map(r => ({ ...r, pricePerKg: 500, saleValue: 2500, transportCost: 0, netEarnings: 2500, isBestDeal: false })))
      toast.info('🏭 Using demo recycler data')
    } finally {
      setLoading(false)
    }
  }

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
        collectionLatitude: 19.0760,
        collectionLongitude: 72.8777
      }
      
      const lotResponse = await api.post('/lots', lotData)
      const lot = lotResponse.data
      const lotId = lot.lotId
      
      if (!lotId) {
        throw new Error('No lot ID returned from server')
      }
      
      await api.post(`/lots/${lotId}/select-recycler`, {
        recyclerId: recycler.id
      })
      
      toast.success(`✅ Recycler ${recycler.companyName} selected!`)
      navigate(`/lot/${lotId}`)
      
    } catch (error) {
      console.error('❌ Selection error:', error)
      toast.error(error.response?.data || 'Failed to select recycler. Using demo mode.')
      // Navigate to demo lot detail
      navigate('/lot/RC-DEMO-000001')
    } finally {
      setSelecting(false)
    }
  }

  if (loading) {
    return <div className="loading-state">Loading recyclers...</div>
  }

  if (recyclers.length === 0) {
    return (
      <div className="recyclers-page">
        <h1 className="page-title">🏭 Find Recyclers</h1>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p>No recyclers available. Using demo data.</p>
          <button className="btn btn-primary" onClick={fetchRecyclers} style={{ marginTop: '16px' }}>
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="recyclers-page">
      <h1 className="page-title">🏭 Find Recyclers</h1>
      <p className="page-subtitle text-muted">Compare recyclers and find the best deal</p>

      {error && (
        <div className="demo-banner" style={{ background: '#fff3e0', padding: '8px 16px', borderRadius: '8px', marginBottom: '16px', color: '#e65100' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="lot-summary">
        <div className="card">
          <h4>📦 Your Demo Lot</h4>
          <div className="lot-details">
            <span>Material: <strong>PCB</strong></span>
            <span>Weight: <strong>5 kg</strong></span>
          </div>
        </div>
      </div>

      <div className="recyclers-grid">
        {recyclers.map((recycler) => (
          <div key={recycler.id} className={`card recycler-card ${recycler.isBestDeal ? 'best-deal' : ''}`}>
            {recycler.isBestDeal && (
              <div className="best-deal-badge">🥇 Best Deal</div>
            )}
            
            <div className="recycler-header">
              <h3>{recycler.companyName || 'Unknown'}</h3>
              <span className={`badge ${recycler.authorized ? 'badge-success' : 'badge-danger'}`}>
                {recycler.authorized ? '✅ Authorized' : '❌ Not Authorized'}
              </span>
            </div>

            <div className="recycler-details">
              <div className="detail-row">
                <span className="label">📍 Location</span>
                <span className="value">{recycler.serviceArea || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Distance</span>
                <span className="value">{recycler.serviceRadiusKm || 10} km</span>
              </div>
              <div className="detail-row">
                <span className="label">Pickup</span>
                <span className={`value ${recycler.pickupAvailable ? 'text-success' : 'text-danger'}`}>
                  {recycler.pickupAvailable ? '✅ Available' : '❌ Not Available'}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Offer Price</span>
                <span className="value">₹{recycler.pricePerKg?.toFixed(2) || 'N/A'}/kg</span>
              </div>
              <div className="detail-row">
                <span className="label">Sale Value</span>
                <span className="value">₹{recycler.saleValue?.toFixed(2) || 0}</span>
              </div>
              <div className="detail-row">
                <span className="label">Transport Cost</span>
                <span className="value text-danger">-₹{recycler.transportCost?.toFixed(2) || 0}</span>
              </div>
              <div className="detail-row highlight">
                <span className="label">💰 Net Earnings</span>
                <span className="value">₹{recycler.netEarnings?.toFixed(2) || 0}</span>
              </div>
            </div>

            {recycler.isBestDeal && (
              <div className="recommendation-reason">
                💡 Recommended: Highest net earnings with {recycler.pickupAvailable ? 'free pickup' : 'lowest transport cost'}
              </div>
            )}

            <button 
              className={`btn ${recycler.isBestDeal ? 'btn-primary' : 'btn-outline'} btn-block`}
              onClick={() => handleSelectRecycler(recycler)}
              disabled={selecting}
            >
              {selecting ? 'Processing...' : 'Select Recycler'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Recyclers
