import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'
import './LotDetail.css'

const LotDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lot, setLot] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchLotDetails()
    } else {
      setLoading(false)
      toast.error('Invalid lot ID')
      navigate('/dashboard')
    }
  }, [id])

  const fetchLotDetails = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/lots/${id}`)
      console.log('✅ Lot details:', response.data)
      setLot(response.data)
    } catch (error) {
      console.error('❌ Failed to fetch lot:', error)
      toast.error('Failed to load lot details')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'CREATED': 'badge-info',
      'MATCHED': 'badge-warning',
      'PICKUP_SCHEDULED': 'badge-warning',
      'IN_TRANSIT': 'badge-warning',
      'HANDED_OVER': 'badge-success',
      'RECEIVED': 'badge-success',
      'PAYMENT_PENDING': 'badge-warning',
      'PAID': 'badge-success',
      'COMPLETED': 'badge-success'
    }
    return statusMap[status] || 'badge-info'
  }

  if (loading) {
    return <div className="loading-state">Loading lot details...</div>
  }

  if (!lot) {
    return <div className="error-state">Lot not found</div>
  }

  return (
    <div className="lot-detail-page">
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard')}>
        ← Back to Dashboard
      </button>

      <div className="lot-header">
        <h1 className="page-title">📋 Lot Details</h1>
        <span className={`badge ${getStatusBadge(lot.status)}`}>
          {lot.status || 'CREATED'}
        </span>
      </div>

      <div className="lot-info-grid">
        <div className="card lot-info-card">
          <div className="card-header">
            <span className="card-title">📌 Basic Information</span>
          </div>
          <div className="info-row">
            <span className="info-label">Lot ID</span>
            <span className="info-value">{lot.lotId || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Material</span>
            <span className="info-value">{lot.materialCategory?.name || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Weight</span>
            <span className="info-value">{lot.weightKg || 0} kg</span>
          </div>
          <div className="info-row">
            <span className="info-label">Condition</span>
            <span className="info-value">{lot.condition || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Source</span>
            <span className="info-value">{lot.sourceType || 'N/A'}</span>
          </div>
        </div>

        <div className="card lot-info-card">
          <div className="card-header">
            <span className="card-title">💰 Value Information</span>
          </div>
          <div className="info-row">
            <span className="info-label">Estimated Value</span>
            <span className="info-value">₹{lot.estimatedValue?.toFixed(2) || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LotDetail
