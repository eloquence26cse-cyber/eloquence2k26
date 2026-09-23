import { useState, useEffect, useRef } from 'react';
import {
  FaTimes,
  FaSearchPlus,
  FaSearchMinus,
  FaUndo,
  FaCheckCircle,
  FaTimesCircle,
  FaCopy,
  FaSpinner,
  FaExclamationTriangle,
  FaReceipt,
  FaShieldAlt,
  FaExternalLinkAlt
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getPaymentScreenshot } from '../services/api';

// Shared in-memory session cache for payment screenshot signed URLs
// Ensures viewing the same participant multiple times makes 0 API calls and 0 DB queries
const screenshotSessionCache = new Map();

export default function PaymentScreenshotViewerModal({
  registration,
  token,
  isOpen,
  onClose,
  onVerify,
  onReject,
  isDark = true
}) {
  const [loading, setLoading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const containerRef = useRef(null);

  const regId = registration?.id || registration?.ticket_code || registration?.ticketCode || registration?.registrationId;
  const ticketCode = registration?.ticketCode || registration?.ticket_code || regId || 'N/A';
  const participantName = registration?.fullName || registration?.full_name || registration?.leadName || 'Participant';
  const amount = Number(registration?.totalAmount || registration?.totalFee || registration?.total_fee || 0);
  const utr = (
    registration?.upiUtr ||
    registration?.upi_utr ||
    registration?.transactionId ||
    registration?.transaction_id ||
    registration?.razorpayPaymentId ||
    registration?.razorpay_payment_id ||
    ''
  ).toString().trim();

  const isVerified =
    registration?.is_verified ||
    registration?.isVerified ||
    registration?.verification_status === 'verified' ||
    registration?.verificationStatus === 'verified' ||
    (registration?.payment_status || '').toUpperCase() === 'VERIFIED';

  const isRejected =
    registration?.is_flagged ||
    registration?.isFlagged ||
    registration?.verification_status === 'flagged' ||
    registration?.verificationStatus === 'flagged' ||
    (registration?.payment_status || '').toUpperCase() === 'REJECTED';

  // Fetch screenshot signed URL on demand when modal opens (with 0-DB caching)
  useEffect(() => {
    if (!isOpen || !regId) {
      setScreenshotUrl(null);
      setFetchError(null);
      setZoomLevel(1);
      setPanPos({ x: 0, y: 0 });
      return;
    }

    let screenshotPath = registration?.payment_screenshot_path || registration?.paymentScreenshotPath || registration?.screenshotPath || null;
    if (!screenshotPath && registration?.venue_snapshot) {
      try {
        const snap = typeof registration.venue_snapshot === 'string' ? JSON.parse(registration.venue_snapshot) : registration.venue_snapshot;
        if (snap) {
          screenshotPath = snap.payment_screenshot_path || snap.paymentScreenshotPath || snap.screenshotPath || null;
        }
      } catch (e) {}
    }
    const cacheKey = screenshotPath || regId;

    // 0-Network & 0-DB if already cached in session
    if (screenshotSessionCache.has(cacheKey)) {
      setScreenshotUrl(screenshotSessionCache.get(cacheKey));
      setLoading(false);
      setFetchError(null);
      setZoomLevel(1);
      setPanPos({ x: 0, y: 0 });
      return;
    }

    let isMounted = true;
    setLoading(true);
    setFetchError(null);
    setZoomLevel(1);
    setPanPos({ x: 0, y: 0 });

    getPaymentScreenshot(regId, token, screenshotPath)
      .then((data) => {
        if (!isMounted) return;
        if (data.success && (data.signedUrl || data.url)) {
          const finalUrl = data.signedUrl || data.url;
          screenshotSessionCache.set(cacheKey, finalUrl);
          setScreenshotUrl(finalUrl);
        } else {
          setFetchError(data.message || 'Payment screenshot could not be loaded');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setFetchError('Network error connecting to payment storage service');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, regId, token, registration]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.35, 4));
  const handleZoomOut = () => {
    setZoomLevel((z) => {
      const next = Math.max(z - 0.35, 0.75);
      if (next <= 1) setPanPos({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPos({ x: 0, y: 0 });
  };

  // Pan / drag handlers when zoomed in
  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanPos({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCopyUtr = () => {
    if (!utr) return;
    try {
      navigator.clipboard.writeText(utr);
      toast.success(`Copied UTR: ${utr}`);
    } catch (e) {
      toast.success(`UTR: ${utr}`);
    }
  };

  const handleTriggerVerify = async () => {
    if (!onVerify) return;
    setIsProcessingAction(true);
    try {
      await onVerify(registration);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleTriggerReject = async () => {
    if (!onReject) return;
    setIsProcessingAction(true);
    try {
      await onReject(registration);
    } finally {
      setIsProcessingAction(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: isDark ? '#0f172a' : '#ffffff',
          borderRadius: '16px',
          border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: isDark ? '#1e293b' : '#f8fafc',
            borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(2, 132, 199, 0.2)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <FaReceipt size={17} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    color: isDark ? '#f8fafc' : '#0f172a'
                  }}
                >
                  Payment Screenshot Verification
                </h3>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: '800',
                    fontSize: '0.78rem',
                    background: isDark ? '#0284c722' : '#eff6ff',
                    color: '#38bdf8',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}
                >
                  #{ticketCode}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                {participantName} &bull; {registration?.college || 'Symposium Participant'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: isDark ? '#94a3b8' : '#64748b',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px'
            }}
            title="Close viewer (Esc)"
          >
            <FaTimes />
          </button>
        </div>

        {/* Verification Meta Pill Banner */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            background: isDark ? '#141e33' : '#f1f5f9',
            borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Amount */}
            <div>
              <span style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                PAYMENT AMOUNT
              </span>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#10b981' }}>
                ₹{amount}
              </div>
            </div>

            {/* UTR Number */}
            <div>
              <span style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                ENTERED UTR NO
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                {utr ? (
                  <>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: '800',
                        fontSize: '0.92rem',
                        color: isDark ? '#fde047' : '#b45309',
                        background: isDark ? '#422006' : '#fef3c7',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {utr}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUtr}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isDark ? '#94a3b8' : '#64748b',
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                      title="Copy UTR number"
                    >
                      <FaCopy size={11} />
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: isDark ? '#64748b' : '#94a3b8', fontStyle: 'italic' }}>
                    No UTR entered
                  </span>
                )}
              </div>
            </div>

            {/* Verification Status */}
            <div>
              <span style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                STATUS
              </span>
              <div style={{ marginTop: '2px' }}>
                {isVerified ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: isDark ? '#064e3b' : '#ecfdf5',
                      color: isDark ? '#6ee7b7' : '#047857',
                      border: isDark ? '1px solid #047857' : '1px solid #a7f3d0',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.74rem',
                      fontWeight: '800'
                    }}
                  >
                    <FaCheckCircle size={10} /> &check; VERIFIED
                  </span>
                ) : isRejected ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: isDark ? '#451a1a' : '#fef2f2',
                      color: '#ef4444',
                      border: isDark ? '1px solid #991b1b' : '1px solid #fecaca',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.74rem',
                      fontWeight: '800'
                    }}
                  >
                    <FaTimesCircle size={10} /> &#10005; REJECTED
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: isDark ? '#78350f' : '#fef3c7',
                      color: isDark ? '#fde68a' : '#92400e',
                      border: isDark ? '1px solid #92400e' : '1px solid #fde68a',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.74rem',
                      fontWeight: '800'
                    }}
                  >
                    PENDING
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Zoom Controls Bar */}
          {screenshotUrl && !loading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isDark ? '#1e293b' : '#ffffff',
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                padding: '3px 8px',
                borderRadius: '8px'
              }}
            >
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.75}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#e2e8f0' : '#334155',
                  cursor: zoomLevel <= 0.75 ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: zoomLevel <= 0.75 ? 0.4 : 1
                }}
                title="Zoom Out"
              >
                <FaSearchMinus size={13} />
              </button>

              <span style={{ fontSize: '0.75rem', fontWeight: '700', minWidth: '40px', textAlign: 'center', color: isDark ? '#94a3b8' : '#64748b' }}>
                {Math.round(zoomLevel * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#e2e8f0' : '#334155',
                  cursor: zoomLevel >= 4 ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: zoomLevel >= 4 ? 0.4 : 1
                }}
                title="Zoom In"
              >
                <FaSearchPlus size={13} />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                disabled={zoomLevel === 1 && panPos.x === 0 && panPos.y === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDark ? '#e2e8f0' : '#334155',
                  cursor: zoomLevel === 1 ? 'not-allowed' : 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '4px',
                  opacity: zoomLevel === 1 ? 0.4 : 1
                }}
                title="Reset Zoom"
              >
                <FaUndo size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Modal Body / Image Viewport */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            minHeight: '340px',
            maxHeight: '58vh',
            position: 'relative',
            overflow: 'hidden',
            background: isDark ? '#0b0f19' : '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {loading && (
            <div style={{ textAlign: 'center', color: '#38bdf8', padding: '3rem' }}>
              <FaSpinner className="spinner-rotate" size={32} style={{ marginBottom: '0.8rem' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Loading payment screenshot...</div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Generating secure temporary access token</span>
            </div>
          )}

          {fetchError && !loading && (
            <div style={{ textAlign: 'center', color: '#f87171', padding: '3rem', maxWidth: '440px' }}>
              <FaExclamationTriangle size={32} style={{ opacity: 0.8, marginBottom: '0.8rem' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                Screenshot Unavailable
              </div>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
                {fetchError}
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                Old registrations or free events may not have an uploaded screenshot.
              </div>
            </div>
          )}

          {screenshotUrl && !loading && (
            <div
              style={{
                transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${zoomLevel})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                display: 'inline-block',
                maxHeight: '100%',
                maxWidth: '100%'
              }}
            >
              <img
                src={screenshotUrl}
                alt={`Payment screenshot proof for #${ticketCode}`}
                style={{
                  maxHeight: '52vh',
                  maxWidth: '85vw',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  pointerEvents: 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: isDark ? '#1e293b' : '#f8fafc',
            borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FaShieldAlt style={{ color: '#10b981' }} />
            <span>Encrypted Supabase storage reference &bull; Temporary signed access</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Verify Payment Button */}
            {!isVerified && (
              <button
                type="button"
                onClick={handleTriggerVerify}
                disabled={isProcessingAction}
                style={{
                  background: '#10b981',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: isProcessingAction ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isProcessingAction ? 0.6 : 1
                }}
                title="Mark payment as VERIFIED"
              >
                <FaCheckCircle size={12} />
                <span>Verify Payment</span>
              </button>
            )}

            {/* Reject Payment Button */}
            {!isRejected && (
              <button
                type="button"
                onClick={handleTriggerReject}
                disabled={isProcessingAction}
                style={{
                  background: isDark ? '#451a1a' : '#fef2f2',
                  border: isDark ? '1px solid #7f1d1d' : '1px solid #fecaca',
                  color: '#ef4444',
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: isProcessingAction ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isProcessingAction ? 0.6 : 1
                }}
                title="Mark payment as REJECTED / FLAGGED"
              >
                <FaTimesCircle size={12} />
                <span>Reject Payment</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: isDark ? '#334155' : '#e2e8f0',
                border: 'none',
                color: isDark ? '#f8fafc' : '#334155',
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
