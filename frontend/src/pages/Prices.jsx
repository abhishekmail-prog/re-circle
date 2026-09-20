import React, { useState, useEffect, useCallback } from 'react'
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa'
import api from '../api/axios'
import { useTranslation } from '../hooks/useTranslation'
import './Prices.css'


const SPEECH_LANG = {
  en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN',
  te: 'te-IN', kn: 'kn-IN', ml: 'ml-IN'
}

const SPEAK_LABELS = {
  en: { price: 'Current price', up: 'trending up', down: 'trending down', per_kg: 'rupees per kilogram', category: 'Category', listen: 'Listen' },
  hi: { price: 'आज का भाव', up: 'भाव बढ़ रहा है', down: 'भाव गिर रहा है', per_kg: 'रुपये प्रति किलो', category: 'श्रेणी', listen: 'सुनें' },
  mr: { price: 'आजचा भाव', up: 'भाव वाढत आहे', down: 'भाव कमी होत आहे', per_kg: 'रुपये प्रति किलो', category: 'श्रेणी', listen: 'ऐका' },
  ta: { price: 'இன்றைய விலை', up: 'விலை ஏறுகிறது', down: 'விலை குறைகிறது', per_kg: 'ரூபாய் ஒரு கிலோ', category: 'வகை', listen: 'கேட்க' },
  te: { price: 'నేటి ధర', up: 'ధర పెరుగుతోంది', down: 'ధర తగ్గుతోంది', per_kg: 'రూపాయలు కిలోకు', category: 'వర్గం', listen: 'వినండి' },
  kn: { price: 'ಇಂದಿನ ಬೆಲೆ', up: 'ಬೆಲೆ ಏರುತ್ತಿದೆ', down: 'ಬೆಲೆ ಇಳಿಯುತ್ತಿದೆ', per_kg: 'ರೂಪಾಯಿ ಪ್ರತಿ ಕಿಲೋ', category: 'ವರ್ಗ', listen: 'ಕೇಳಿ' },
  ml: { price: 'ഇന്നത്തെ വില', up: 'വില കൂടുന്നു', down: 'വില കുറയുന്നു', per_kg: 'രൂപ ഒരു കിലോയ്ക്ക്', category: 'വിഭാഗം', listen: 'കേൾക്കുക' }
}

const Prices = () => {
  const { t, language } = useTranslation()
  const [speaking, setSpeaking] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('PCB')
  const [priceData, setPriceData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const categories = [
    'CRT',
    'LCD Panel',
    'PCB',
    'Cable',
    'Battery',
    'Motor',
    'Mixed plastic',
    'Mobile phone',
    'Laptop'
  ]

  const getDemoPriceData = useCallback((category) => {
    const basePrices = {
      CRT: 120,
      'LCD Panel': 150,
      PCB: 500,
      Cable: 350,
      Battery: 100,
      Motor: 250,
      'Mixed plastic': 50,
      'Mobile phone': 800,
      Laptop: 900
    }
    const base = basePrices[category] || 300
    return {
      category,
      currentPrice: base + (Math.random() - 0.5) * 100,
      minPrice: base * 0.8,
      maxPrice: base * 1.2,
      trend: (Math.random() - 0.5) * 20,
      recentPrices: Array.from({ length: 10 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString(),
        price: base + (Math.random() - 0.5) * 80,
        location: 'Mumbai'
      }))
    }
  }, [])

  const speakPrice = useCallback(() => {
    if (!priceData) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const lang = language || 'en'
    const labels = SPEAK_LABELS[lang] || SPEAK_LABELS.en
    const price = Math.round(priceData.currentPrice || 0)
    const trend = (priceData.trend || 0) >= 0 ? labels.up : labels.down
    const text = `${labels.category}: ${selectedCategory}. ${labels.price}: ${price} ${labels.per_kg}. ${trend}.`

    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = SPEECH_LANG[lang] || 'en-IN'
    utt.rate = 0.95
    const voices = window.speechSynthesis.getVoices()
    const v = voices.find((vv) => vv.lang && vv.lang.startsWith(utt.lang.split('-')[0]))
    if (v) utt.voice = v

    utt.onstart = () => setSpeaking(true)
    utt.onend = () => setSpeaking(false)
    utt.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utt)
  }, [language, priceData, selectedCategory])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/prices?category=${selectedCategory}`)
      setPriceData(response.data)
    } catch (err) {
      console.error('Price fetch error:', err)
      setError(t('prices.error'))
      setPriceData(getDemoPriceData(selectedCategory))
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, t, getDemoPriceData])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  return (
    <div className="prices-page">
      <h1 className="page-title">💰 {t('prices.title')}</h1>
      <p className="page-subtitle text-muted">{t('prices.subtitle')}</p>

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

      {loading && <div className="loading-state">{t('prices.loading')}</div>}

      {error && <div className="error-state">{error}</div>}

      {priceData && !loading && (
        <>
          <div className="price-cards">
            <div className="card price-card current-price">
              <div className="card-label">{t('prices.currentPrice')}</div>
              <div className="card-value">
                ₹{priceData.currentPrice?.toFixed(2) || 'N/A'}
                {t('prices.perKg')}
              </div>
            </div>

            <div className="card price-card range-price">
              <div className="card-label">{t('prices.priceRange')}</div>
              <div className="card-value">
                ₹{priceData.minPrice?.toFixed(2) || 'N/A'} - ₹
                {priceData.maxPrice?.toFixed(2) || 'N/A'}
                {t('prices.perKg')}
              </div>
            </div>

            <div className="card price-card trend">
              <div className="card-label">{t('prices.trend')}</div>
              <div
                className="card-value"
                style={{
                  color: (priceData.trend || 0) >= 0 ? '#4caf50' : '#f44336'
                }}
              >
                {(priceData.trend || 0) >= 0 ? '📈 +' : '📉 '}
                {Math.abs(priceData.trend || 0).toFixed(1)}%
              </div>
            </div>

            <div className="card price-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={speakPrice}
                disabled={speaking}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {speaking ? <FaVolumeMute /> : <FaVolumeUp />}
                {(SPEAK_LABELS[language] || SPEAK_LABELS.en).listen}
              </button>
            </div>
          </div>

          <div className="card recent-prices">
            <h3>{t('prices.historical')}</h3>
            <div className="price-history">
              {priceData.recentPrices?.slice(0, 15).map((price, index) => (
                <div key={index} className="price-entry">
                  <span className="price-date">
                    {price.date
                      ? new Date(price.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </span>
                  <span className="price-amount">
                    ₹
                    {typeof price.price === 'number'
                      ? price.price.toFixed(2)
                      : price.price}
                    {t('prices.perKg')}
                  </span>
                  <span className="price-location">
                    {price.location || 'India'}
                  </span>
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
