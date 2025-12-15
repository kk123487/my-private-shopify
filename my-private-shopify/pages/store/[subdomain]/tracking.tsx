import React, { useState } from 'react'
import styles from './tracking.module.css'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface TrackingInfo {
  orderId: string
  trackingNumber: string
  carrier: string
  status: string
  statusDescription: string
  lastUpdate: string
  estimatedDelivery: string
  currentLocation?: string
}

const TrackingPage: React.FC = () => {
  const router = useRouter()
  const { subdomain } = router.query
  const [searchQuery, setSearchQuery] = useState('')
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setError('Please enter an order ID or tracking number')
      return
    }

    setLoading(true)
    setError(null)
    setTrackingInfo(null)

    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(searchQuery)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Tracking information not found')
      }

      setTrackingInfo(data.tracking)
    } catch (err: any) {
      setError(err.message || 'Error fetching tracking information')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#28a745'
      case 'in_transit':
        return '#007bff'
      case 'pending':
      case 'processing':
        return '#ffc107'
      case 'failed':
      case 'returned':
        return '#dc3545'
      default:
        return '#6c757d'
    }
  }

  const getStatusIcon = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '✓'
      case 'in_transit':
        return '→'
      case 'pending':
        return '⏳'
      case 'failed':
        return '✗'
      case 'returned':
        return '↩'
      default:
        return '•'
    }
  }

  return (
    <div className={styles.trackingContainer}>
      <Link href={`/store/${subdomain}`}>
        <a className={styles.trackingBackLink}>
          ← Back to store
        </a>
      </Link>

      <h1>Track Your Order</h1>
      <p className={styles.trackingDescription}>
        Enter your order ID or tracking number to view shipping status
      </p>

      <form onSubmit={handleSearch} className={styles.trackingForm}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Order ID or tracking number"
          className={styles.trackingInput}
        />
        <button
          type="submit"
          disabled={loading}
          className={styles.trackingButton}
        >
          {loading ? 'Searching…' : 'Track'}
        </button>
      </form>

      {error && (
        <div className={styles.trackingError}>
          <p className={styles.trackingErrorText}>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {trackingInfo && (
        <div className={styles.trackingDetails}>
          <div className={styles.trackingDetailsCard}>
            <h2 className={styles.trackingDetailsTitle}>Tracking Details</h2>

            <div className={styles.trackingDetailsGrid}>
              <div>
                <p className={styles.trackingDetailsLabel}>Order ID</p>
                <p className={styles.trackingDetailsValue}>{trackingInfo.orderId}</p>
              </div>

              <div>
                <p className={styles.trackingDetailsLabel}>Tracking Number</p>
                <p className={styles.trackingDetailsValue}>{trackingInfo.trackingNumber}</p>
              </div>

              <div>
                <p className={styles.trackingDetailsLabel}>Carrier</p>
                <p className={styles.trackingDetailsCarrier}>{trackingInfo.carrier}</p>
              </div>

              <div>
                <p className={styles.trackingDetailsLabel}>Status</p>
                <p
                  className={
                    `${styles.trackingDetailsStatus} ` +
                    (trackingInfo.status.toLowerCase() === 'delivered'
                      ? styles.statusDelivered
                      : trackingInfo.status.toLowerCase() === 'in_transit'
                      ? styles.statusInTransit
                      : ['pending', 'processing'].includes(trackingInfo.status.toLowerCase())
                      ? styles.statusPending
                      : ['failed', 'returned'].includes(trackingInfo.status.toLowerCase())
                      ? styles.statusFailed
                      : styles.statusDefault)
                  }
                >
                  {getStatusIcon(trackingInfo.status)} {trackingInfo.statusDescription}
                </p>
              </div>
            </div>

            {trackingInfo.currentLocation && (
              <div className={styles.trackingCurrentLocation}>
                <p className={styles.trackingCurrentLocationLabel}>Current Location</p>
                <p className={styles.trackingCurrentLocationValue}>{trackingInfo.currentLocation}</p>
              </div>
            )}

            <div className={styles.trackingMetaGrid}>
              <div>
                <p className={styles.trackingMetaLabel}>Last Updated</p>
                <p className={styles.trackingMetaValue}>
                  {new Date(trackingInfo.lastUpdate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div>
                <p className={styles.trackingMetaLabel}>Estimated Delivery</p>
                <p className={styles.trackingMetaValue}>
                  {new Date(trackingInfo.estimatedDelivery).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.trackingActions}>
            <Link href={`/store/${subdomain}`}>
              <a className={styles.trackingBackButton}>
                Back to store
              </a>
            </Link>
            <button
              onClick={() => {
                setSearchQuery('')
                setTrackingInfo(null)
                setError(null)
              }}
              className={styles.trackingSearchAgainButton}
            >
              Search Again
            </button>
          </div>
        </div>
      )}

      {!trackingInfo && !error && !loading && (
        <div className={styles.trackingEmptyState}>
          <p className={styles.trackingEmptyStateText}>
            Enter an order ID or tracking number above to get started
          </p>
        </div>
      )}
    </div>
  )
}

export default TrackingPage
