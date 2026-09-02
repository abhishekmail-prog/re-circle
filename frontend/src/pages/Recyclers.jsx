import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import './Recyclers.css'

const Recyclers = () => {
  const [recyclers, setRecyclers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRecycler, setSelectedRecycler] = useState(null)
  const [selecting, setSelecting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchRecyclers()
  }, [])

  const fetchRecyclers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/recyclers')
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        const weightKg = 5
        const recyclersWithEarnings = response.data.map(recycler => {
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
            isBestDeal: false,
            selected: false
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
        setRecyclers([])
        setError('No recyclers found.')
      }
    } catch (err) {
      setError('Failed to fetch recyclers.')
      toast.error('Failed to load recyclers')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRecycler = async (recycler) => {
    setSelectedRecycler(recycler.id)
    setSelecting(true)
    
    try {
      // Create a lot first
      const lotData = {
        materialCategoryName: 'PCB',
        description: 'Demo lot for recycler selection',
        weightKg: 5,
        condition: 'GOOD',
        sourceType: 'HOUSEHOLD',
        collectionLatitude: 19.0760,
        collectionLongitude: 72.8777,
        collectionAddress: 'Mumbai, Maharashtra'
      }
      
      const lotResponse = await api.post('/lots', lotData)
      const lotId = lotResponse.data.lotId
      
      // Then select recycler
      await api.post(`/lots/${lotId}/select-recycler`, {
        recyclerId: recycler.id
      })
      
      toast.success(`✅ Recycler selected successfully! Lot created.`)
      navigate('/dashboard')
    } catch (error) {
      console.error('Selection error:', error)
      toast.error('Failed to select recycler. Please try again.')
    } finally {
      setSelecting(false)
      setSelectedRecycler(null)
    }
  }

  if (loading) {
    return <div className="loading-state">Loading recyclers...</div>
  }

  if (error) {
    return (
      <div className="recyclers-page">
        <h1 className="page-title">🏭 Find Recyclers</h1>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#f44336' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchRecyclers} style={{ marginTop: '16px' }}>
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  if (recyclers.length === 0) {
    return (
      <div className="recyclers-page">
        <h1 className="page-title">🏭 Find Recyclers</h1>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p>No recyclers available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="recyclers-page">
      <h1 className="page-title">🏭 Find Recyclers</h1>
      <p className="page-subtitle text-muted">Compare recyclers and find the best deal</p>

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
              disabled={selecting && selectedRecycler === recycler.id}
            >
              {selecting && selectedRecycler === recycler.id ? 'Selecting...' : 'Select Recycler'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Recyclers
