import React, { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import './AdminRecyclers.css'

const AdminRecyclers = () => {
  const [recyclers, setRecyclers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRecyclers()
  }, [])

  const fetchRecyclers = async () => {
    try {
      const response = await api.get('/admin/recyclers')
      setRecyclers(response.data)
    } catch (err) {
      setError('Failed to fetch recyclers')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id) => {
    try {
      await api.put(`/admin/recyclers/${id}/verify`)
      toast.success('Recycler verified successfully!')
      // Refresh list
      fetchRecyclers()
    } catch (err) {
      toast.error('Failed to verify recycler')
    }
  }

  if (loading) return <div className="loading-state">Loading recyclers...</div>
  if (error) return <div className="error-state">{error}</div>

  return (
    <div className="admin-recyclers">
      <h1>🏭 Recyclers</h1>
      <div className="recyclers-list">
        {recyclers.map((recycler) => (
          <div key={recycler.id} className="recycler-card">
            <div className="recycler-info">
              <h3>{recycler.companyName}</h3>
              <p>{recycler.facilityAddress}</p>
              <p>Service Area: {recycler.serviceArea}</p>
              <p>Pickup: {recycler.pickupAvailable ? '✅ Available' : '❌ Not Available'}</p>
            </div>
            <div className="recycler-status">
              <span className={`badge ${recycler.authorized ? 'badge-success' : 'badge-warning'}`}>
                {recycler.authorized ? 'Verified' : 'Pending'}
              </span>
              {!recycler.authorized && (
                <button className="btn btn-primary btn-sm" onClick={() => handleVerify(recycler.id)}>
                  Verify
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminRecyclers
