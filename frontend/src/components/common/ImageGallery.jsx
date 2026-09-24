import React, { useState, useEffect } from 'react'
import { FaChevronLeft, FaChevronRight, FaBox } from 'react-icons/fa'
import './ImageGallery.css'

import { API_URL as IMG_BASE } from '../../config'

const resolveUrl = (u) => {
  if (!u) return null
  if (u.startsWith('http') || u.startsWith('data:')) return u
  return IMG_BASE + (u.startsWith('/') ? u : '/' + u)
}

/**
 * ImageGallery — main image + thumbnail strip + prev/next arrows.
 * Falls back gracefully to a placeholder if no images.
 *
 * Props:
 *   imageUrl    (string)  — primary image (fallback)
 *   imageUrls   (string)  — comma-separated list OR array
 *   alt         (string)  — alt text
 *   height      (number)  — main image height in px (default 300)
 *   thumbnails  (boolean) — show strip (default true)
 */
const ImageGallery = ({
  imageUrl,
  imageUrls,
  alt = 'photo',
  height = 300,
  thumbnails = true
}) => {
  // Normalize to array
  const urls = React.useMemo(() => {
    const list = []
    if (Array.isArray(imageUrls)) {
      list.push(...imageUrls)
    } else if (typeof imageUrls === 'string' && imageUrls.trim()) {
      list.push(...imageUrls.split(',').map((s) => s.trim()))
    }
    if (list.length === 0 && imageUrl) list.push(imageUrl)
    return list.filter((u) => u && u.trim())
  }, [imageUrl, imageUrls])

  const [idx, setIdx] = useState(0)

  useEffect(() => {
    // Reset to first if the source changes
    setIdx(0)
  }, [urls.length])

  if (urls.length === 0) {
    return (
      <div className="ig-empty" style={{ height }}>
        <FaBox />
        <span>No photo</span>
      </div>
    )
  }

  const current = urls[Math.min(idx, urls.length - 1)]
  const hasPrev = idx > 0
  const hasNext = idx < urls.length - 1

  const goPrev = (e) => {
    e?.stopPropagation?.()
    if (hasPrev) setIdx(idx - 1)
  }
  const goNext = (e) => {
    e?.stopPropagation?.()
    if (hasNext) setIdx(idx + 1)
  }

  return (
    <div className="ig-wrap">
      <div className="ig-main" style={{ height }}>
        <img src={resolveUrl(current)} alt={alt} />

        {urls.length > 1 && (
          <>
            <button
              type="button"
              className="ig-arrow ig-prev"
              onClick={goPrev}
              disabled={!hasPrev}
              aria-label="Previous photo"
            >
              <FaChevronLeft />
            </button>
            <button
              type="button"
              className="ig-arrow ig-next"
              onClick={goNext}
              disabled={!hasNext}
              aria-label="Next photo"
            >
              <FaChevronRight />
            </button>

            <span className="ig-counter">
              {idx + 1} / {urls.length}
            </span>
          </>
        )}
      </div>

      {thumbnails && urls.length > 1 && (
        <div className="ig-thumbs">
          {urls.map((u, i) => (
            <button
              key={i}
              type="button"
              className={`ig-thumb ${i === idx ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setIdx(i)
              }}
              aria-label={`Photo ${i + 1}`}
            >
              <img src={resolveUrl(u)} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
