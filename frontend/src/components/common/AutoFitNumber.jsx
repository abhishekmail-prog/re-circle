import React, { useState, useEffect, useRef } from 'react'

/**
 * AutoFitNumber — shrinks font size to fit content.
 * If it can't fit on one line at minSize, allows wrapping to 2 lines.
 */
const AutoFitNumber = ({ children, className = '', maxSize = 32, minSize = 12 }) => {
  const ref = useRef(null)
  const [size, setSize] = useState(maxSize)
  const [wrap, setWrap] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Reset
    setWrap(false)
    el.style.fontSize = maxSize + 'px'
    el.style.whiteSpace = 'nowrap'

    let current = maxSize
    // Shrink while it overflows and we're above minSize
    while (current > minSize && el.scrollWidth > el.clientWidth + 1) {
      current -= 1
      el.style.fontSize = current + 'px'
    }

    // If still overflowing at minSize, allow wrapping
    if (el.scrollWidth > el.clientWidth + 1) {
      el.style.whiteSpace = 'normal'
      el.style.wordBreak = 'break-word'
      setWrap(true)
    }

    setSize(current)
  }, [children, maxSize, minSize])

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: 'inline-block',
        maxWidth: '100%',
        fontSize: size + 'px',
        lineHeight: wrap ? 1.15 : 1.15,
        whiteSpace: wrap ? 'normal' : 'nowrap',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
        overflow: 'visible'
      }}
    >
      {children}
    </span>
  )
}

export default AutoFitNumber
