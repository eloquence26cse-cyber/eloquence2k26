import { useState, useRef, useEffect } from 'react';
import {
  FaCloudUploadAlt,
  FaImage,
  FaCheckCircle,
  FaTimes,
  FaSyncAlt,
  FaExclamationTriangle,
  FaShieldAlt,
  FaEye
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function PaymentScreenshotUpload({
  file,
  onFileSelect,
  disabled = false,
  error = null
}) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Sync preview URL when file changes
  useEffect(() => {
    if (!file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateAndHandleFile = (selectedFile) => {
    setLocalError(null);
    if (!selectedFile) return;

    // 1. Validate file type
    const mime = (selectedFile.type || '').toLowerCase();
    const name = (selectedFile.name || '').toLowerCase();
    const ext = name.split('.').pop();

    const isValidType =
      ACCEPTED_MIME_TYPES.includes(mime) || ACCEPTED_EXTENSIONS.includes(ext);

    if (!isValidType) {
      const err = 'Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.';
      setLocalError(err);
      toast.error(err, { icon: <FaExclamationTriangle style={{ color: '#ef4444' }} /> });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validate file size (10 MB maximum)
    if (selectedFile.size > MAX_FILE_SIZE) {
      const err = `File size is ${formatFileSize(selectedFile.size)}, which exceeds the 10 MB maximum limit. Please choose a smaller image.`;
      setLocalError(err);
      toast.error(err, { icon: <FaExclamationTriangle style={{ color: '#ef4444' }} /> });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    onFileSelect(selectedFile);
  };

  const handleInputChange = (e) => {
    const selected = e.target.files && e.target.files[0];
    validateAndHandleFile(selected);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const dropped = e.dataTransfer.files && e.dataTransfer.files[0];
    validateAndHandleFile(dropped);
  };

  const handleRemove = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLocalError(null);
    onFileSelect(null);
  };

  const handleBrowseClick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const displayError = error || localError;

  return (
    <div id="payment-screenshot-upload-box" className="payment-screenshot-upload-container" style={{ marginTop: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.45rem',
          flexWrap: 'wrap',
          gap: '0.4rem'
        }}
      >
        <label
          htmlFor="payment-screenshot-input"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: '800',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#00f5ff'
          }}
        >
          <FaImage size={13} />
          PAYMENT SCREENSHOT
          <span
            style={{
              fontSize: '0.68rem',
              color: '#f87171',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '1px 7px',
              borderRadius: '4px',
              fontWeight: '800',
              letterSpacing: '0.04em'
            }}
          >
            MANDATORY *
          </span>
        </label>
        <span
          style={{
            fontSize: '0.72rem',
            color: '#38bdf8',
            background: 'rgba(2, 132, 199, 0.15)',
            border: '1px solid rgba(2, 132, 199, 0.3)',
            padding: '2px 8px',
            borderRadius: '999px',
            fontWeight: '600'
          }}
        >
          Max 10 MB &bull; JPG, PNG, WEBP
        </span>
      </div>

      <input
        ref={fileInputRef}
        id="payment-screenshot-input"
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      {/* Upload Zone / Drop Area when no file selected */}
      {!file ? (
        <div
          onClick={handleBrowseClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: displayError
              ? '2px dashed #ef4444'
              : isDragging
              ? '2px dashed #00f5ff'
              : '2px dashed rgba(56, 189, 248, 0.35)',
            borderRadius: '12px',
            padding: '1.4rem 1rem',
            textAlign: 'center',
            background: displayError
              ? 'rgba(239, 68, 68, 0.08)'
              : isDragging
              ? 'rgba(0, 245, 255, 0.08)'
              : 'rgba(15, 23, 42, 0.65)',
            boxShadow: displayError ? '0 0 15px rgba(239, 68, 68, 0.25)' : 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: displayError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(2, 132, 199, 0.2)',
              border: displayError ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.6rem auto',
              color: displayError ? '#f87171' : '#38bdf8'
            }}
          >
            <FaCloudUploadAlt size={22} />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBrowseClick}
            disabled={disabled}
            style={{
              padding: '0.45rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              borderRadius: '8px',
              border: displayError ? '1px solid #ef4444' : '1px solid rgba(56, 189, 248, 0.4)',
              background: displayError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(14, 165, 233, 0.15)',
              color: displayError ? '#fca5a5' : '#38bdf8',
              cursor: disabled ? 'not-allowed' : 'pointer',
              marginBottom: '0.5rem'
            }}
          >
            [ Choose Payment Screenshot ]
          </button>

          <p
            style={{
              margin: '0 0 0.25rem 0',
              fontSize: '0.82rem',
              fontWeight: '600',
              color: displayError ? '#fca5a5' : '#e2e8f0'
            }}
          >
            Upload screenshot showing UPI UTR &amp; payment amount (Required)
          </p>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Tap or drag &amp; drop receipt &bull; Auto-compressed to WebP before storing
          </span>
        </div>
      ) : (
        /* Selected Image Preview Card */
        <div
          style={{
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '12px',
            background: 'rgba(6, 78, 59, 0.15)',
            padding: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
            {/* Thumbnail Preview */}
            <div
              onClick={() => setShowFullPreview(true)}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
                background: '#0f172a'
              }}
              title="Click to view full preview"
            >
              <img
                src={previewUrl}
                alt="Selected payment proof preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <FaEye size={14} />
              </div>
            </div>

            {/* File Details */}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={file.name}
              >
                {file.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '2px',
                  fontSize: '0.74rem'
                }}
              >
                <span style={{ color: '#34d399', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <FaCheckCircle size={10} /> {formatFileSize(file.size)}
                </span>
                <span style={{ color: '#64748b' }}>&bull;</span>
                <span style={{ color: '#94a3b8' }}>Ready to compress</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Replace / Remove */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => !disabled && fileInputRef.current && fileInputRef.current.click()}
              disabled={disabled}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                padding: '0.4rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: '700',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Replace with another screenshot"
            >
              <FaSyncAlt size={10} />
              <span>Replace</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                padding: '0.4rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.76rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Remove screenshot"
            >
              <FaTimes size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Validation Error Message */}
      {displayError && (
        <div
          style={{
            marginTop: '0.45rem',
            padding: '0.45rem 0.75rem',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FaExclamationTriangle size={12} style={{ flexShrink: 0 }} />
          <span>{displayError}</span>
        </div>
      )}

      {/* Full Preview Modal Popup */}
      {showFullPreview && previewUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={() => setShowFullPreview(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              background: '#0f172a',
              borderRadius: '12px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                background: 'rgba(15, 23, 42, 0.95)',
                borderBottom: '1px solid rgba(56, 189, 248, 0.2)'
              }}
            >
              <div style={{ color: '#00f5ff', fontSize: '0.85rem', fontWeight: '700' }}>
                Payment Screenshot Preview
              </div>
              <button
                type="button"
                onClick={() => setShowFullPreview(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                <FaTimes />
              </button>
            </div>
            <div style={{ padding: '0.5rem', maxHeight: '75vh', overflow: 'auto', textAlign: 'center' }}>
              <img
                src={previewUrl}
                alt="Payment proof enlarged preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '6px'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
