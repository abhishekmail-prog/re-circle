import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import './Prices.css'

const Prices = () => {
  const [selectedCategory, setSelectedCategory] = useState('PCB')
  const [priceData, setPriceData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const categories = ['CRT', 'LCD Panel', 'PCB', 'Cable', 'Battery', 'Motor', 'Mixed plastic', 'Mobile phone', 'Laptop']

  useEffect(() => {
    fetchPrices()
  }, [selectedCategory])

  const fetchPrices = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/prices?category=${selectedCategory}`)
      setPriceData(response.data)
    } catch (err) {
      console.error('Price fetch error:', err)
      setError('Failed to fetch prices. Using demo data.')
      // Set demo data as fallback
      setPriceData({
        category: selectedCategory,
        currentPrice: Math.random() * 500 + 200,
        minPrice: Math.random() * 300 + 100,
        maxPrice: Math.random() * 600 + 300,
        trend: (Math.random() - 0.5) * 20,
        recentPrices: Array.from({ length: 10 }, (_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString(),
          price: Math.random() * 400 + 200,
          location: 'Mumbai'
        }))
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="prices-page">
      <h1 className="page-title">💰 Today's Prices</h1>
      <p className="page-subtitle text-muted">Check current market rates for e-waste materials</p>

      <div className="category-selector">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && <div className="loading-state">Loading prices...</div>}

      {error && <div className="error-state">{error}</div>}

      {priceData && !loading && (
        <>
          <div className="price-cards">
            <div className="card price-card current-price">
              <div className="card-label">Current Market Price</div>
              <div className="card-value">₹{priceData.currentPrice?.toFixed(2) || 'N/A'}/kg</div>
            </div>

            <div className="card price-card range-price">
              <div className="card-label">Price Range</div>
              <div className="card-value">
                ₹{priceData.minPrice?.toFixed(2) || 'N/A'} - ₹{priceData.maxPrice?.toFixed(2) || 'N/A'}/kg
              </div>
            </div>

            <div className="card price-card trend">
              <div className="card-label">Trend</div>
              <div className="card-value" style={{ 
                color: (priceData.trend || 0) >= 0 ? '#4caf50' : '#f44336' 
              }}>
                {(priceData.trend || 0) >= 0 ? '📈 +' : '📉 '}{Math.abs(priceData.trend || 0).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="card recent-prices">
            <h3>📊 Recent Price History</h3>
            <div className="price-history">
              {priceData.recentPrices?.slice(0, 15).map((price, index) => (
                <div key={index} className="price-entry">
                  <span className="price-date">
                    {price.date ? new Date(price.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                  <span className="price-amount">₹{typeof price.price === 'number' ? price.price.toFixed(2) : price.price}/kg</span>
                  <span className="price-location">{price.location || 'India'}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Prices
