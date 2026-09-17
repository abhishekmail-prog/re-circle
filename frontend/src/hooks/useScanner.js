import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

/**
 * useScanner — portable camera-scanning hook.
 *
 * Web implementation uses html5-qrcode.
 * To port to React Native later: replace the `start`/`stop` bodies
 * with expo-barcode-scanner (or vision-camera). The public API
 * (start, stop, scanning, error, lastResult) stays identical.
 */
export const useScanner = (elementId, { facingMode = 'environment' } = {}) => {
  const scannerRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [lastResult, setLastResult] = useState(null)

  const stop = useCallback(async () => {
    const scanner = scannerRef.current
    if (!scanner) {
      setScanning(false)
      return
    }
    try {
      // html5-qrcode throws if stop() called when not scanning — guard it
      await scanner.stop()
      scanner.clear()
    } catch (e) {
      // already stopped, harmless
    } finally {
      scannerRef.current = null
      setScanning(false)
    }
  }, [])

  const start = useCallback(
    async (onDecode) => {
      setError(null)
      setLastResult(null)

      // HTTPS or localhost check — mobile browsers block camera otherwise
      if (
        typeof window !== 'undefined' &&
        !window.isSecureContext
      ) {
        setError('insecure-context')
        return
      }

      // Check for camera API
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('no-camera-api')
        return
      }

      try {
        const scanner = new Html5Qrcode(elementId, {
          verbose: false,
          // mobile: prefer rear camera; desktop: any
          experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        })
        scannerRef.current = scanner

        await scanner.start(
          { facingMode },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            // success — fire callback and stop scanning
            setLastResult(decodedText)
            if (typeof onDecode === 'function') onDecode(decodedText)
            stop()
          },
          () => {
            // per-frame failure (no QR yet) — ignore, this fires constantly
          }
        )

        setScanning(true)
      } catch (e) {
        console.error('Scanner start failed:', e)
        const msg = (e?.message || '').toLowerCase()
        if (msg.includes('permission') || msg.includes('denied')) {
          setError('permission-denied')
        } else if (msg.includes('no camera') || msg.includes('notfound')) {
          setError('no-camera')
        } else {
          setError('unknown')
        }
        setScanning(false)
      }
    },
    [elementId, facingMode, stop]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return { start, stop, scanning, error, lastResult }
}
