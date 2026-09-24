import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  FaSearch, 
  FaQrcode, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaUserCheck, 
  FaCamera, 
  FaCameraRetro, 
  FaTimes, 
  FaPrint, 
  FaUndo, 
  FaPhone, 
  FaEnvelope, 
  FaUniversity, 
  FaCalendarAlt, 
  FaUsers, 
  FaTicketAlt, 
  FaMoneyBillWave, 
  FaSyncAlt,
  FaFileImage,
  FaCheck,
  FaExclamationTriangle,
  FaHourglassHalf,
  FaBolt,
  FaHandPaper,
  FaVideo,
  FaImage,
  FaInfoCircle,
  FaBullseye,
  FaSpinner,
  FaClock,
  FaBan
} from 'react-icons/fa';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import { getApiUrl } from '../config/api';

/**
 * Robust Multi-Pass QR Code Decoder for Uploaded Images
 * Supports BarcodeDetector API, jsQR with contrast/binarization enhancements, and Html5Qrcode fallback.
 */
async function decodeQRFromImage(file) {
  // Method 1: Hardware-Accelerated BarcodeDetector (Modern Chrome/Edge/Safari/Android)
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const imgBitmap = await createImageBitmap(file);
      const barcodes = await barcodeDetector.detect(imgBitmap);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }
    } catch (e) {
      // Continue to canvas-based jsQR
    }
  }

  // Method 2: Load Image onto Canvas for Multi-Pass jsQR Detection
  const img = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image file'));
      image.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  const maxDim = Math.max(img.width, img.height);
  const targetScales = [
    maxDim > 1000 ? 1000 / maxDim : 1.0, // normalized max 1000px
    1.0,                                 // native resolution
    0.6,                                 // downscaled for large phone captures
    1.4                                  // zoomed for small ticket codes
  ];

  const uniqueScales = [...new Set(targetScales)];

  for (const scale of uniqueScales) {
    const width = Math.max(10, Math.round(img.width * scale));
    const height = Math.max(10, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) continue;

    ctx.drawImage(img, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);

    // Pass A: Direct raw scan with inverted attempt
    let code = jsQR(imgData.data, width, height, { inversionAttempts: 'attemptBoth' });
    if (code && code.data) return code.data;

    // Pass B: Grayscale & Contrast Boost (factor 1.6)
    const grayData = new Uint8ClampedArray(imgData.data);
    let totalBrightness = 0;
    for (let i = 0; i < grayData.length; i += 4) {
      const lum = grayData[i] * 0.299 + grayData[i + 1] * 0.587 + grayData[i + 2] * 0.114;
      totalBrightness += lum;
      const enhanced = Math.min(255, Math.max(0, (lum - 128) * 1.6 + 128));
      grayData[i] = enhanced;
      grayData[i + 1] = enhanced;
      grayData[i + 2] = enhanced;
    }
    code = jsQR(grayData, width, height, { inversionAttempts: 'attemptBoth' });
    if (code && code.data) return code.data;

    // Pass C: Adaptive Binarization (Otsu-style thresholding)
    const threshold = totalBrightness / (width * height);
    const binarizedData = new Uint8ClampedArray(imgData.data);
    for (let i = 0; i < binarizedData.length; i += 4) {
      const lum = binarizedData[i] * 0.299 + binarizedData[i + 1] * 0.587 + binarizedData[i + 2] * 0.114;
      const v = lum >= threshold ? 255 : 0;
      binarizedData[i] = v;
      binarizedData[i + 1] = v;
      binarizedData[i + 2] = v;
    }
    code = jsQR(binarizedData, width, height, { inversionAttempts: 'attemptBoth' });
    if (code && code.data) return code.data;
  }

  // Method 3: html5-qrcode isolated fallback
  if (typeof document !== 'undefined') {
    const tempDiv = document.createElement('div');
    const tempId = 'temp-qr-eval-' + Math.random().toString(36).substring(2, 9);
    tempDiv.id = tempId;
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    try {
      const html5Qr = new Html5Qrcode(tempId);
      const res = await html5Qr.scanFile(file, false);
      try { await html5Qr.clear(); } catch (e) {}
      document.body.removeChild(tempDiv);
      if (res) return res;
    } catch (e) {
      if (tempDiv.parentNode) document.body.removeChild(tempDiv);
    }
  }

  throw new Error('Could not detect QR code in this image');
}

export default function ParticipantVerifier({ 
  token, 
  user, 
  isDark, 
  registrations = [], 
  events = [], 
  allocatedEventId,
  allocatedEventName,
  onRefreshRegistrations,
  onVerificationSuccess,
  onPrintTicket 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('verified'); // 'verified' | 'all' | 'flagged' | 'unverified' | 'admitted'
  const [eventFilter, setEventFilter] = useState(allocatedEventId || 'all');
  const [modeFilter, setModeFilter] = useState('all'); // 'all' | 'online' | 'offline'

  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanAlert, setScanAlert] = useState(null); // { type: 'unverified'|'flagged'|'not_found', participant?: object, reason?: string, message?: string }

  // Sync eventFilter if allocatedEventId changes
  useEffect(() => {
    if (allocatedEventId) {
      setEventFilter(allocatedEventId);
    }
  }, [allocatedEventId]);

  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState('camera'); // 'camera' | 'file'
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [autoVerifyOnScan, setAutoVerifyOnScan] = useState(() => {
    try {
      const saved = localStorage.getItem('auto_verify_on_scan');
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const html5QrCodeRef = useRef(null);
  const isStartingScannerRef = useRef(false);
  const isScannerOpenRef = useRef(false);
  const lastScannedKeyRef = useRef('');
  const lastScannedTimeRef = useRef(0);
  const isScanDebounceRef = useRef(false);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Helper functions
  const isOnlineRecord = (r) => {
    return Boolean(
      r?.payment_status ||
      r?.paymentMode === 'online' ||
      (r?.ticket_code && r.ticket_code.startsWith('ELQ26-')) ||
      (r?.ticketCode && r.ticketCode.startsWith('ELQ26-')) ||
      (r?.registrationId && r.registrationId.startsWith('ELQ26-'))
    );
  };

  const isFlaggedRecord = (r) => {
    return Boolean(
      r?.is_flagged === true ||
      r?.isFlagged === true ||
      r?.verification_status === 'flagged' ||
      r?.verificationStatus === 'flagged'
    );
  };

  const getFlagReason = (r) => {
    return r?.flag_reason || r?.flagReason || r?.flagNote || r?.reason || 'Payment amount not credited / UTR mismatch at Registration Desk';
  };

  const isRegistrationVerified = (r) => {
    if (isFlaggedRecord(r)) return false;
    return Boolean(
      r?.is_verified === true ||
      r?.isVerified === true ||
      r?.verification_status === 'verified' ||
      r?.verificationStatus === 'verified'
    );
  };

  const isEventAdmitted = (r) => {
    if (isFlaggedRecord(r) || !isRegistrationVerified(r)) return false;
    return Boolean(
      r?.attendance_status === 'verified' ||
      r?.attendanceStatus === 'verified' ||
      r?.attendance_status === 'PRESENT' ||
      r?.attendanceStatus === 'PRESENT' ||
      r?.attended === true ||
      r?.checkedIn === true
    );
  };

  const isVerifiedRecord = (r) => {
    return isRegistrationVerified(r);
  };

  const getTicketCode = (r) => {
    return r?.ticket_code || r?.ticketCode || r?.registrationId || r?.id || 'N/A';
  };

  const getParticipantName = (r) => {
    return r?.full_name || r?.fullName || r?.name || 'N/A';
  };

  const getEventName = (r) => {
    if (r?.eventName) return r.eventName;
    if (r?.event_name) return r.event_name;
    const evId = r?.event_id || r?.eventId;
    const found = events.find(e => e.id === evId || String(e.id) === String(evId));
    return found ? found.name : (evId || 'Symposium Event');
  };

  const getEventCategory = (r) => {
    if (r?.eventCategory) return r.eventCategory;
    if (r?.category) return r.category;
    const evId = r?.event_id || r?.eventId;
    const found = events.find(e => e.id === evId || String(e.id) === String(evId));
    return found ? found.category : 'technical';
  };

  const getFee = (r) => {
    return Number(r?.total_fee ?? r?.totalAmount ?? r?.fee ?? 0);
  };

  const getTeamMembers = (r) => {
    if (!r) return [];
    if (Array.isArray(r.registration_members) && r.registration_members.length > 0) {
      return r.registration_members.map(m => m.member_name || m.name || m);
    }
    if (Array.isArray(r.teamMembersList) && r.teamMembersList.length > 0) {
      return r.teamMembersList;
    }
    if (Array.isArray(r.teamMembers) && r.teamMembers.length > 0) {
      return r.teamMembers;
    }
    if (typeof r.team_members === 'string') {
      try {
        const parsed = JSON.parse(r.team_members);
        if (Array.isArray(parsed)) return parsed.map(m => typeof m === 'string' ? m : (m.name || m));
      } catch (e) {
        if (r.team_members.trim()) return [r.team_members.trim()];
      }
    }
    return [];
  };

  // Keep selectedParticipant in sync when registrations list updates
  useEffect(() => {
    if (selectedParticipant && !isVerifying) {
      const currentCode = getTicketCode(selectedParticipant);
      const updated = registrations.find(r => getTicketCode(r) === currentCode || (r.id && r.id === selectedParticipant.id));
      if (updated) {
        setSelectedParticipant(updated);
      }
    }
  }, [registrations, isVerifying]);

  // Handle scanned ticket or input string
  const handleProcessScanCode = async (decodedText) => {
    if (!decodedText) return;
    const cleanText = String(decodedText).trim();
    if (!cleanText) return;

    const now = Date.now();
    // Scan Debounce: ignore duplicate scan bursts within 2.5s
    if (isScanDebounceRef.current || (lastScannedKeyRef.current === cleanText && (now - lastScannedTimeRef.current < 2500))) {
      return;
    }

    isScanDebounceRef.current = true;
    lastScannedKeyRef.current = cleanText;
    lastScannedTimeRef.current = now;

    // Immediately stop camera scanner so continuous frame loop halts
    isScannerOpenRef.current = false;
    setIsScannerOpen(false);
    await stopScanner();

    // Extract ticket code if embedded in URL or JSON
    let lookupKey = cleanText;
    if (cleanText.includes('code=')) {
      const match = cleanText.match(/code=([^&]+)/);
      if (match) lookupKey = match[1];
    } else if (cleanText.includes('ticket=')) {
      const match = cleanText.match(/ticket=([^&]+)/);
      if (match) lookupKey = match[1];
    } else if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
      try {
        const obj = JSON.parse(cleanText);
        lookupKey = obj.ticketCode || obj.ticket_code || obj.id || cleanText;
      } catch (e) {
        // use raw
      }
    }

    const keyLower = lookupKey.toLowerCase();

    // Look for match in registrations list
    const matched = registrations.find(r => {
      const ticket = getTicketCode(r).toLowerCase();
      const id = String(r.id || '').toLowerCase();
      const phone = String(r.phone || '').toLowerCase();
      const email = String(r.email || '').toLowerCase();
      const name = getParticipantName(r).toLowerCase();

      return ticket === keyLower || 
             ticket.includes(keyLower) || 
             id === keyLower || 
             phone === keyLower || 
             email === keyLower ||
             name === keyLower;
    });

    if (matched) {
      const isFlagged = isFlaggedRecord(matched);
      const isRegVerified = isRegistrationVerified(matched);
      const flagReason = getFlagReason(matched);

      if (isFlagged) {
        // FLAGGED RECORD!
        // When scanned, it MUST be showed and it MUST SHOW THE REASON!
        setSelectedParticipant(matched);
        setSearchTerm(getTicketCode(matched));
        setScanAlert({
          type: 'flagged',
          participant: matched,
          reason: flagReason
        });

        // Distinct audio buzzer alert for flagged participant
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, audioCtx.currentTime); // Low warning A3
          osc.frequency.setValueAtTime(146.83, audioCtx.currentTime + 0.15); // Drop to D3
          gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.45);
        } catch (e) {}

        toast.error(
          `ENTRY BLOCKED: ${getParticipantName(matched)} is FLAGGED in Registration Verification.\nReason: "${flagReason}"`,
          { id: 'scan-verify-toast', duration: 8500 }
        );
      } else if (!isRegVerified) {
        // NOT VERIFIED in Registration Verification (payment or desk check pending)
        // Only ones verified in registration verification will be showed!
        setSelectedParticipant(null);
        setSearchTerm('');
        setScanAlert({
          type: 'unverified',
          participant: matched,
          reason: 'Desk verification pending (Payment / UTR verification required at Registration Desk)'
        });

        // Caution tone
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(330, audioCtx.currentTime);
          osc.frequency.setValueAtTime(220, audioCtx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.35);
        } catch (e) {}

        toast.error(
          `ADMISSION DENIED: ${getParticipantName(matched)} (#${getTicketCode(matched)}) is NOT verified in Registration Verification. Only desk-verified participants will be showed.`,
          { id: 'scan-verify-toast', duration: 7500 }
        );
      } else {
        // VERIFIED in Registration Verification!
        // This participant WILL BE SHOWED!
        setSelectedParticipant(matched);
        setSearchTerm(getTicketCode(matched));
        setScanAlert(null);

        // Play success chime
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        } catch (e) {}

        const isAlreadyAdmitted = isEventAdmitted(matched);

        // If this participant is already selected on the open card, prevent auto-verify loops
        const isCurrentCard = selectedParticipant && (
          getTicketCode(selectedParticipant).toLowerCase() === getTicketCode(matched).toLowerCase() || 
          (selectedParticipant.id && selectedParticipant.id === matched.id)
        );

        if (isAlreadyAdmitted) {
          toast.success(
            `${getParticipantName(matched)} is ALREADY ADMITTED & PRESENT!`,
            { id: 'scan-verify-toast', duration: 4500 }
          );
        } else if (isCurrentCard) {
          // Already opened on inspection card; do not auto-admit in loop
        } else if (autoVerifyOnScan) {
          // Automatically verify and admit in database
          await handleToggleVerification(matched, true);
        } else {
          toast.success(
            `Registration Desk Verified: ${getParticipantName(matched)} is eligible for admission`,
            { id: 'scan-verify-toast', duration: 4000 }
          );
        }
      }
    } else {
      setSelectedParticipant(null);
      setScanAlert({
        type: 'not_found',
        message: `No participant registration found matching "${lookupKey}"`
      });
      setSearchTerm(lookupKey);
      toast.error(`No registration matched: "${lookupKey}"`, { id: 'scan-verify-toast' });
    }

    // Release scan debounce lock after 1.5s
    setTimeout(() => {
      isScanDebounceRef.current = false;
    }, 1500);
  };

  // Camera Scanner Lifecycle
  useEffect(() => {
    let isMounted = true;
    if (isScannerOpen && scannerMode === 'camera') {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isScannerOpen, scannerMode, selectedCameraId]);

  const stopScanner = async () => {
    isScannerOpenRef.current = false;
    try {
      // Force kill video stream tracks on any active camera elements in DOM
      const targetEl = document.getElementById('qr-reader-target');
      if (targetEl) {
        const videos = targetEl.querySelectorAll('video');
        videos.forEach(v => {
          if (v.srcObject && typeof v.srcObject.getTracks === 'function') {
            v.srcObject.getTracks().forEach(t => {
              try { t.stop(); } catch (e) {}
            });
          }
        });
      }

      if (html5QrCodeRef.current) {
        const instance = html5QrCodeRef.current;
        html5QrCodeRef.current = null;
        try {
          if (instance.isScanning) {
            await instance.stop();
          }
        } catch (stopErr) {}
        try {
          await instance.clear();
        } catch (clearErr) {}
      }
    } catch (e) {
      console.warn('Error stopping scanner:', e);
    } finally {
      setScannerActive(false);
    }
  };

  const startScanner = async () => {
    if (isStartingScannerRef.current) return;
    isStartingScannerRef.current = true;
    isScannerOpenRef.current = true;
    setScannerError('');

    try {
      await stopScanner();
      isScannerOpenRef.current = true;

      // Allow 120ms for DOM element '#qr-reader-target' to mount cleanly
      await new Promise(r => setTimeout(r, 120));

      if (!isScannerOpenRef.current) return;

      const targetEl = document.getElementById('qr-reader-target');
      if (!targetEl || !isScannerOpenRef.current) {
        return;
      }

      // Query available camera devices
      const devices = await Html5Qrcode.getCameras();
      if (!isScannerOpenRef.current) return;

      if (!devices || devices.length === 0) {
        setScannerError('No camera devices found on this device');
        return;
      }

      setCameras(devices);
      const camId = selectedCameraId || devices[devices.length - 1].id; // default to back camera
      if (!selectedCameraId) setSelectedCameraId(camId);

      if (!isScannerOpenRef.current) return;

      const html5Qr = new Html5Qrcode('qr-reader-target');
      html5QrCodeRef.current = html5Qr;

      await html5Qr.start(
        camId,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleProcessScanCode(decodedText);
        },
        () => {
          // scanning frames
        }
      );

      if (!isScannerOpenRef.current) {
        try {
          if (html5Qr.isScanning) await html5Qr.stop();
          await html5Qr.clear();
        } catch (e) {}
        html5QrCodeRef.current = null;
        setScannerActive(false);
      } else {
        setScannerActive(true);
      }
    } catch (err) {
      console.warn('QR Scanner Start Error:', err);
      const errMsg = String(err?.message || err);
      if (errMsg.includes('Permission') || errMsg.includes('denied') || errMsg.includes('NotAllowedError')) {
        setScannerError('Camera access denied. Please allow camera permission in your browser or use "Upload QR Image".');
      } else if (errMsg.includes('NotFound') || errMsg.includes('DevicesNotFoundError')) {
        setScannerError('No camera found. Please use the "Upload QR Image" option or enter ticket code manually.');
      } else {
        setScannerError('Camera initialized or busy. You can also upload a QR photo or enter code manually.');
      }
      setScannerActive(false);
    } finally {
      isStartingScannerRef.current = false;
    }
  };

  const handleFileUploadScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Scanning image for QR code...');
    setIsProcessingImage(true);

    try {
      const decodedText = await decodeQRFromImage(file);
      toast.dismiss(loadingToast);
      handleProcessScanCode(decodedText);
    } catch (err) {
      toast.dismiss(loadingToast);
      console.warn('QR Code Image Scan Error:', err);
      toast.error('Could not detect QR code in this image. Try another photo or enter code manually.', { duration: 4500 });
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle or Confirm Verification API Call
  const handleToggleVerification = async (participant, desiredStatus = true) => {
    if (!participant || isVerifying) return;
    const participantId = participant.id || getTicketCode(participant);
    const code = getTicketCode(participant);

    if (desiredStatus) {
      if (isFlaggedRecord(participant)) {
        toast.error(`Cannot admit participant. Ticket is FLAGGED: "${getFlagReason(participant)}"`, { duration: 6000 });
        return;
      }
      if (!isRegistrationVerified(participant)) {
        toast.error(`Cannot admit participant. Registration verification pending at Registration Desk.`, { duration: 5000 });
        return;
      }
    }

    setIsVerifying(true);

    const verifiedAt = desiredStatus ? new Date().toISOString() : null;
    const verifiedBy = desiredStatus ? (user?.username || user?.role || 'Coordinator') : null;

    // 1. Optimistic Update immediately so the badge flips without lag
    const updatedObj = {
      ...participant,
      is_verified: true, // Remains verified in registration
      attendance_status: desiredStatus ? 'verified' : 'pending',
      attendanceStatus: desiredStatus ? 'verified' : 'pending',
      attended: desiredStatus,
      checkedIn: desiredStatus,
      verified_at: verifiedAt,
      verifiedAt: verifiedAt,
      verified_by: verifiedBy,
      verifiedBy: verifiedBy
    };
    setSelectedParticipant(updatedObj);

    // Prevent immediate auto-scan re-verification burst for this participant
    lastScannedKeyRef.current = code;
    lastScannedTimeRef.current = Date.now();
    isScanDebounceRef.current = true;

    try {
      const res = await fetch(getApiUrl(`/api/admin/registrations/${encodeURIComponent(participantId)}/verify`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          isVerified: true,
          attendance_status: desiredStatus ? 'verified' : 'pending',
          action: desiredStatus ? 'admit' : 'unadmit',
          verifiedAt: verifiedAt,
          verifiedBy: verifiedBy
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          desiredStatus 
            ? `${getParticipantName(participant)} admitted & attendance recorded!`
            : `Admission reset for ${getParticipantName(participant)}`,
          { id: `verify-status-${code}`, duration: 4000 }
        );

        const targetAtt = desiredStatus ? 'verified' : 'pending';
        const finalRecord = {
          ...updatedObj,
          ...(data.data || {}),
          attendance_status: targetAtt,
          attendanceStatus: targetAtt,
          attended: desiredStatus,
          checkedIn: desiredStatus,
          verified_at: verifiedAt,
          verifiedAt: verifiedAt,
          verified_by: verifiedBy,
          verifiedBy: verifiedBy
        };
        setSelectedParticipant(finalRecord);

        // Trigger global dashboard refresh if provided
        if (typeof onRefreshRegistrations === 'function') {
          onRefreshRegistrations();
        }
        if (typeof onVerificationSuccess === 'function' && desiredStatus) {
          onVerificationSuccess(finalRecord);
        }
      } else {
        toast.error(data.message || 'Failed to update attendance status', { id: `verify-err-${code}`, duration: 6000 });
        setSelectedParticipant(participant);
      }
    } catch (err) {
      console.error('Verification request error:', err);
      toast.error('Server error updating attendance', { id: `verify-err-${code}` });
      setSelectedParticipant(participant);
    } finally {
      setIsVerifying(false);
      setTimeout(() => {
        isScanDebounceRef.current = false;
      }, 3000);
    }
  };

  // Filter registrations list for table / search
  const filteredList = registrations.filter(r => {
    // Status filter
    const isRegVer = isRegistrationVerified(r);
    const isFlagged = isFlaggedRecord(r);
    const isAdmitted = isEventAdmitted(r);

    if (statusFilter === 'verified' && !isRegVer) return false;
    if (statusFilter === 'flagged' && !isFlagged) return false;
    if (statusFilter === 'unverified' && (isRegVer || isFlagged)) return false;
    if (statusFilter === 'admitted' && !isAdmitted) return false;

    // Mode filter
    const isOnline = isOnlineRecord(r);
    if (modeFilter === 'online' && !isOnline) return false;
    if (modeFilter === 'offline' && isOnline) return false;

    // Event filter
    if (eventFilter !== 'all') {
      const evId = r.event_id || r.eventId;
      if (evId !== eventFilter && String(evId) !== String(eventFilter)) return false;
    }

    // Search query
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;

    const ticket = getTicketCode(r).toLowerCase();
    const name = getParticipantName(r).toLowerCase();
    const phone = String(r.phone || '').toLowerCase();
    const email = String(r.email || '').toLowerCase();
    const college = String(r.college || '').toLowerCase();
    const dept = String(r.department || '').toLowerCase();
    const teamName = String(r.team_name || r.teamName || '').toLowerCase();
    const members = getTeamMembers(r).join(' ').toLowerCase();
    const flagReason = getFlagReason(r).toLowerCase();

    return (
      ticket.includes(q) ||
      name.includes(q) ||
      phone.includes(q) ||
      email.includes(q) ||
      college.includes(q) ||
      dept.includes(q) ||
      teamName.includes(q) ||
      members.includes(q) ||
      flagReason.includes(q)
    );
  });

  // Calculate statistics
  const totalCount = registrations.length;
  const regVerifiedCount = registrations.filter(isRegistrationVerified).length;
  const flaggedCount = registrations.filter(isFlaggedRecord).length;
  const unverifiedCount = registrations.filter(r => !isRegistrationVerified(r) && !isFlaggedRecord(r)).length;
  const admittedCount = registrations.filter(isEventAdmitted).length;
  const totalRevenue = registrations.reduce((sum, r) => sum + getFee(r), 0);
  const verifiedPercent = regVerifiedCount > 0 ? Math.round((admittedCount / regVerifiedCount) * 100) : 0;

  // Visual Styles
  const S = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.75rem',
      width: '100%',
      fontFamily: 'Inter, system-ui, sans-serif'
    },
    // Top Banner
    headerCard: {
      background: isDark 
        ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
        : 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
      borderRadius: '18px',
      padding: '1.75rem 2rem',
      border: isDark ? '1px solid #334155' : '1px solid #bfdbfe',
      boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.4)' : '0 4px 20px rgba(37,99,235,0.06)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1.5rem'
    },
    headerTitle: {
      fontSize: '1.6rem',
      fontWeight: '800',
      color: isDark ? '#f8fafc' : '#1e3a8a',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    headerSubtitle: {
      fontSize: '0.9rem',
      color: isDark ? '#94a3b8' : '#475569',
      margin: '6px 0 0 0',
      fontWeight: '500'
    },
    // Stats Grid
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1.25rem'
    },
    statCard: {
      background: isDark ? '#111827' : '#ffffff',
      borderRadius: '16px',
      padding: '1.35rem 1.5rem',
      border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      transition: 'all 0.2s ease'
    },
    statLabel: {
      fontSize: '0.78rem',
      fontWeight: '700',
      color: isDark ? '#9ca3af' : '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.04em'
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: '800',
      color: isDark ? '#f9fafb' : '#0f172a'
    },
    statBadge: {
      fontSize: '0.8rem',
      fontWeight: '700',
      padding: '0.25rem 0.6rem',
      borderRadius: '999px',
      alignSelf: 'flex-start',
      marginTop: '4px'
    },

    // Search and Action Bar
    searchSection: {
      background: isDark ? '#111827' : '#ffffff',
      borderRadius: '16px',
      padding: '1.5rem',
      border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    },
    searchRow: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    searchInputWrapper: {
      position: 'relative',
      flex: 1,
      minWidth: '280px'
    },
    searchInput: {
      width: '100%',
      padding: '0.9rem 1rem 0.9rem 2.85rem',
      borderRadius: '12px',
      border: isDark ? '2px solid #334155' : '2px solid #cbd5e1',
      background: isDark ? '#1e293b' : '#f8fafc',
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: '1rem',
      fontWeight: '600',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s ease'
    },
    searchIconInside: {
      position: 'absolute',
      left: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: isDark ? '#94a3b8' : '#64748b',
      fontSize: '1.2rem',
      pointerEvents: 'none'
    },
    clearSearchBtn: {
      position: 'absolute',
      right: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'transparent',
      border: 'none',
      color: isDark ? '#94a3b8' : '#64748b',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center'
    },
    scanToggleBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0.85rem 1.4rem',
      borderRadius: '12px',
      background: isScannerOpen ? '#dc2626' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      color: '#ffffff',
      fontWeight: '700',
      fontSize: '0.95rem',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap'
    },
    filterPillRow: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      alignItems: 'center'
    },
    filterSelect: {
      padding: '0.6rem 1rem',
      borderRadius: '10px',
      border: isDark ? '1px solid #374151' : '1px solid #cbd5e1',
      background: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: '0.88rem',
      fontWeight: '600',
      outline: 'none',
      cursor: 'pointer'
    },

    // QR Scanner Box
    scannerCard: {
      background: isDark ? '#0f172a' : '#000000',
      color: '#ffffff',
      borderRadius: '18px',
      padding: '1.75rem',
      border: '2px solid #3b82f6',
      boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.25rem',
      position: 'relative',
      overflow: 'hidden'
    },
    cameraFrame: {
      width: '100%',
      maxWidth: '380px',
      minHeight: '320px',
      borderRadius: '14px',
      overflow: 'hidden',
      background: '#000000',
      border: '2px dashed #60a5fa',
      position: 'relative'
    },

    // Selected Inspection Card
    detailsHeroCard: {
      background: isDark ? '#111827' : '#ffffff',
      borderRadius: '20px',
      border: isDark ? '2px solid #2563eb' : '2px solid #3b82f6',
      boxShadow: isDark ? '0 12px 35px rgba(37,99,235,0.25)' : '0 10px 30px rgba(37,99,235,0.12)',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    },
    detailsHeader: {
      padding: '1.5rem 2rem',
      background: isDark ? '#1a2436' : '#eff6ff',
      borderBottom: isDark ? '1px solid #2b3952' : '1px solid #dbeafe',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    statusBadgeBig: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0.6rem 1.25rem',
      borderRadius: '999px',
      fontWeight: '800',
      fontSize: '0.95rem',
      letterSpacing: '0.03em',
      textTransform: 'uppercase'
    },
    detailsBody: {
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.75rem'
    },
    gridTwoCol: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1.5rem'
    },
    infoBlock: {
      background: isDark ? '#1e293b' : '#f8fafc',
      padding: '1.25rem',
      borderRadius: '12px',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem'
    },
    infoBlockLabel: {
      fontSize: '0.78rem',
      fontWeight: '700',
      color: isDark ? '#94a3b8' : '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.04em'
    },
    infoBlockValue: {
      fontSize: '1.05rem',
      fontWeight: '700',
      color: isDark ? '#f8fafc' : '#0f172a'
    },
    actionButtonsBar: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
      paddingTop: '1rem',
      borderTop: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9'
    },
    confirmBtn: {
      flex: 1,
      minWidth: '220px',
      padding: '1rem 1.75rem',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      color: '#ffffff',
      fontWeight: '800',
      fontSize: '1.1rem',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      boxShadow: '0 6px 20px rgba(16,185,129,0.35)',
      transition: 'all 0.2s ease'
    },
    undoBtn: {
      padding: '0.85rem 1.4rem',
      borderRadius: '12px',
      background: isDark ? '#374151' : '#f1f5f9',
      color: isDark ? '#f3f4f6' : '#475569',
      fontWeight: '700',
      fontSize: '0.95rem',
      border: isDark ? '1px solid #4b5563' : '1px solid #cbd5e1',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    printBtn: {
      padding: '0.85rem 1.4rem',
      borderRadius: '12px',
      background: isDark ? '#1e3a8a' : '#eff6ff',
      color: isDark ? '#93c5fd' : '#1d4ed8',
      fontWeight: '700',
      fontSize: '0.95rem',
      border: isDark ? '1px solid #2563eb' : '1px solid #bfdbfe',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },

    // Results Table
    tableCard: {
      background: isDark ? '#111827' : '#ffffff',
      borderRadius: '16px',
      border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
      overflow: 'hidden'
    },
    tableHeader: {
      padding: '1.25rem 1.5rem',
      borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: isDark ? '#1a2234' : '#f8fafc'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      background: isDark ? '#111827' : '#ffffff',
      padding: '1rem 1.25rem',
      textAlign: 'left',
      color: isDark ? '#9ca3af' : '#64748b',
      fontWeight: '700',
      fontSize: '0.78rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0'
    },
    tr: {
      borderBottom: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9',
      cursor: 'pointer',
      transition: 'background 0.15s ease'
    },
    td: {
      padding: '1rem 1.25rem',
      color: isDark ? '#cbd5e1' : '#334155',
      fontSize: '0.9rem'
    }
  };

  return (
    <div style={S.wrapper}>
      {/* ==================== 1. TOP HEADER & METRICS ==================== */}
      <div style={S.headerCard}>
        <div>
          <h1 style={S.headerTitle}>
            <FaUserCheck style={{ color: '#2563eb' }} />
            Search & Verify Participant
          </h1>
          <p style={S.headerSubtitle}>
            Scan QR code or search by Ticket Code, Name, Phone, Email, College or Roll Number to verify on-site admission.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={() => {
              if (typeof onRefreshRegistrations === 'function') {
                onRefreshRegistrations();
                toast.success('Registration list refreshed');
              }
            }}
            style={{
              padding: '0.75rem 1.2rem',
              borderRadius: '10px',
              background: isDark ? '#1e293b' : '#ffffff',
              color: isDark ? '#f8fafc' : '#0f172a',
              border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FaSyncAlt /> Refresh Data
          </button>
        </div>
      </div>

      {/* ==================== 2. STATS CARDS ==================== */}
      <div style={S.statsGrid}>
        <div style={S.statCard}>
          <span style={S.statLabel}>Total Registrations</span>
          <span style={S.statNumber}>{totalCount}</span>
          <span style={{ ...S.statBadge, background: isDark ? '#1e293b' : '#f1f5f9', color: isDark ? '#94a3b8' : '#475569' }}>
            All Records
          </span>
        </div>

        <div style={S.statCard}>
          <span style={S.statLabel}>Registration Verified</span>
          <span style={{ ...S.statNumber, color: '#10b981' }}>{regVerifiedCount}</span>
          <span style={{ ...S.statBadge, background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#6ee7b7' : '#047857', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FaCheck /> {admittedCount} Admitted ({verifiedPercent}%)
          </span>
        </div>

        <div style={S.statCard}>
          <span style={S.statLabel}>Flagged &amp; Blocked</span>
          <span style={{ ...S.statNumber, color: '#ef4444' }}>{flaggedCount}</span>
          <span style={{ ...S.statBadge, background: isDark ? '#450a0a' : '#fef2f2', color: isDark ? '#f87171' : '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FaBan /> UTR Issues / Rejected
          </span>
        </div>

        <div style={S.statCard}>
          <span style={S.statLabel}>Pending Desk Review</span>
          <span style={{ ...S.statNumber, color: '#f59e0b' }}>{unverifiedCount}</span>
          <span style={{ ...S.statBadge, background: isDark ? '#451a03' : '#fffbeb', color: isDark ? '#fcd34d' : '#b45309', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <FaHourglassHalf /> Awaiting Desk
          </span>
        </div>
      </div>

      {/* ==================== 3. SEARCH & QR SCANNER BAR ==================== */}
      <div style={S.searchSection}>
        <div style={S.searchRow}>
          <div style={S.searchInputWrapper}>
            <FaSearch style={S.searchIconInside} />
            <input 
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Ticket Code (e.g. ELQ26-TCH-...), Name, Phone, Email, College..."
              style={S.searchInput}
              autoFocus
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => { setSearchTerm(''); searchInputRef.current?.focus(); }}
                style={S.clearSearchBtn}
                title="Clear Search"
              >
                <FaTimes size={16} />
              </button>
            )}
          </div>

          <button 
            type="button" 
            onClick={() => {
              const next = !isScannerOpen;
              isScannerOpenRef.current = next;
              setIsScannerOpen(next);
            }}
            style={S.scanToggleBtn}
          >
            <FaQrcode size={18} />
            {isScannerOpen ? 'Close QR Scanner' : 'Scan Ticket QR Code'}
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !autoVerifyOnScan;
              setAutoVerifyOnScan(next);
              try { localStorage.setItem('auto_verify_on_scan', JSON.stringify(next)); } catch (e) {}
              toast.success(next ? 'Auto-Admit on Scan ENABLED' : 'Auto-Admit DISABLED (Inspect Mode)', { id: 'auto-verify-toggle-toast' });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              background: autoVerifyOnScan 
                ? (isDark ? '#064e3b' : '#ecfdf5') 
                : (isDark ? '#1f2937' : '#f1f5f9'),
              color: autoVerifyOnScan 
                ? (isDark ? '#6ee7b7' : '#047857') 
                : (isDark ? '#9ca3af' : '#64748b'),
              border: autoVerifyOnScan 
                ? '1px solid #10b981' 
                : `1px solid ${isDark ? '#374151' : '#cbd5e1'}`,
              fontSize: '0.82rem',
              fontWeight: '800',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
            title="When ON, scanning a QR code automatically admits & verifies the participant in the database."
          >
            {autoVerifyOnScan ? <FaBolt size={14} color="#10b981" /> : <FaHandPaper size={14} color="#9ca3af" />}
            <span>{autoVerifyOnScan ? 'Auto-Admit: ON' : 'Auto-Admit: OFF'}</span>
          </button>
        </div>

        {/* Filters */}
        <div style={S.filterPillRow}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' }}>
            Filters:
          </span>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={S.filterSelect}
          >
            <option value="verified">Registration Verified Only ({regVerifiedCount})</option>
            <option value="all">All Registrations ({totalCount})</option>
            <option value="flagged">[Blocked] Flagged Registrations ({flaggedCount})</option>
            <option value="unverified">Pending Desk Verification ({unverifiedCount})</option>
            <option value="admitted">Admitted / Present Only ({admittedCount})</option>
          </select>

          <select 
            value={modeFilter} 
            onChange={(e) => setModeFilter(e.target.value)}
            style={S.filterSelect}
          >
            <option value="all">All Registration Modes</option>
            <option value="online">Online Web Portal</option>
            <option value="offline">On-Site Desk Registration</option>
          </select>

          <select 
            value={eventFilter} 
            onChange={(e) => setEventFilter(e.target.value)}
            style={S.filterSelect}
          >
            <option value="all">All Symposium Events</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.name} ({ev.category})
              </option>
            ))}
          </select>

          {(searchTerm || statusFilter !== 'all' || modeFilter !== 'all' || eventFilter !== 'all') && (
            <button 
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setModeFilter('all');
                setEventFilter('all');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ==================== 4. LIVE QR CODE SCANNER MODAL / VIEW ==================== */}
      {isScannerOpen && (
        <div style={S.scannerCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaCamera size={20} style={{ color: '#60a5fa' }} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>Live QR Code Verification Scanner</h3>
            </div>
            <button 
              type="button" 
              onClick={() => setIsScannerOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button"
              onClick={() => setScannerMode('camera')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: scannerMode === 'camera' ? '#2563eb' : '#334155',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FaVideo /> Use Camera
            </button>
            <button 
              type="button"
              disabled={isProcessingImage}
              onClick={() => {
                setScannerMode('file');
                fileInputRef.current?.click();
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: scannerMode === 'file' ? '#2563eb' : '#334155',
                color: '#ffffff',
                border: 'none',
                cursor: isProcessingImage ? 'wait' : 'pointer',
                fontWeight: '700',
                fontSize: '0.85rem',
                opacity: isProcessingImage ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isProcessingImage ? (
                <>
                  <FaSpinner className="spinner-rotate" /> Analyzing QR Image...
                </>
              ) : (
                <>
                  <FaImage /> Upload QR Image
                </>
              )}
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileUploadScan} 
              style={{ display: 'none' }} 
            />
          </div>

          {scannerMode === 'camera' && (
            <>
              {cameras.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Switch Camera:</span>
                  <select 
                    value={selectedCameraId} 
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: '#1e293b', color: '#ffffff', border: '1px solid #475569', fontSize: '0.85rem' }}
                  >
                    {cameras.map(cam => (
                      <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id}`}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target div for html5-qrcode */}
              <div id="qr-reader-target" style={S.cameraFrame}></div>

              {scannerError ? (
                <div style={{ color: '#f87171', fontSize: '0.88rem', textAlign: 'center', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <FaExclamationTriangle /> {scannerError}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                  Hold participant ticket QR code in front of the camera to verify automatically.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* ==================== 4.5 UNVERIFIED SCAN REJECTION ALERT BANNER ==================== */}
      {scanAlert && scanAlert.type === 'unverified' && scanAlert.participant && !selectedParticipant && (
        <div style={{
          background: isDark ? 'linear-gradient(135deg, #451a03 0%, #291503 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          boxShadow: isDark ? '0 10px 25px rgba(245,158,11,0.25)' : '0 6px 20px rgba(245,158,11,0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
            <div style={{
              background: '#f59e0b',
              color: '#ffffff',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FaExclamationTriangle size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  background: isDark ? '#78350f' : '#fde68a',
                  color: isDark ? '#fef3c7' : '#92400e',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px'
                }}>
                  #{getTicketCode(scanAlert.participant)}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: isDark ? '#fef3c7' : '#92400e' }}>
                  Admission Denied — Desk Verification Pending
                </h3>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.92rem', color: isDark ? '#fde68a' : '#78350f', fontWeight: '700' }}>
                Participant: {getParticipantName(scanAlert.participant)} ({getEventName(scanAlert.participant)})
              </p>
              <div style={{ fontSize: '0.82rem', color: isDark ? '#cbd5e1' : '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaExclamationTriangle style={{ color: '#eab308', flexShrink: 0 }} />
                <span>This participant has NOT been verified at the Registration Desk (Payment / UTR unconfirmed). In accordance with event policy, only participants verified in Registration Verification will be showed and admitted.</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScanAlert(null)}
            style={{
              background: isDark ? '#78350f' : '#fde68a',
              color: isDark ? '#fef3c7' : '#92400e',
              border: isDark ? '1px solid #b45309' : '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '0.55rem 1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Dismiss Alert
          </button>
        </div>
      )}

      {/* ==================== 5. SELECTED PARTICIPANT VERIFICATION SHOWCASE ==================== */}
      {selectedParticipant && (() => {
        const isFlagged = isFlaggedRecord(selectedParticipant);
        const isRegVer = isRegistrationVerified(selectedParticipant);
        const isAdmitted = isEventAdmitted(selectedParticipant);
        const flagReason = getFlagReason(selectedParticipant);

        return (
          <div style={{
            ...S.detailsHeroCard,
            border: isFlagged
              ? (isDark ? '2px solid #ef4444' : '2px solid #dc2626')
              : isRegVer
              ? (isDark ? '2px solid #10b981' : '2px solid #059669')
              : (isDark ? '2px solid #f59e0b' : '2px solid #d97706'),
            boxShadow: isFlagged
              ? (isDark ? '0 12px 35px rgba(239,68,68,0.3)' : '0 10px 30px rgba(220,38,38,0.15)')
              : isRegVer
              ? (isDark ? '0 12px 35px rgba(16,185,129,0.25)' : '0 10px 30px rgba(16,185,129,0.12)')
              : (isDark ? '0 12px 35px rgba(245,158,11,0.25)' : '0 10px 30px rgba(245,158,11,0.12)')
          }}>
            {/* Header Banner with Live Status */}
            <div style={{
              ...S.detailsHeader,
              background: isFlagged
                ? (isDark ? '#2b1215' : '#fef2f2')
                : isRegVer
                ? (isDark ? '#062d22' : '#ecfdf5')
                : (isDark ? '#2d1e0d' : '#fffbeb'),
              borderBottom: isFlagged
                ? (isDark ? '1px solid #7f1d1d' : '1px solid #fecaca')
                : isRegVer
                ? (isDark ? '1px solid #065f46' : '1px solid #a7f3d0')
                : (isDark ? '1px solid #78350f' : '1px solid #fde68a')
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: '800', 
                    color: isFlagged 
                      ? (isDark ? '#fca5a5' : '#b91c1c') 
                      : (isDark ? '#93c5fd' : '#1d4ed8'),
                    background: isFlagged 
                      ? (isDark ? '#7f1d1d' : '#fee2e2') 
                      : (isDark ? '#1e3a8a' : '#dbeafe'),
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px'
                  }}>
                    #{getTicketCode(selectedParticipant)}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '600' }}>
                    {isOnlineRecord(selectedParticipant) ? 'Online Registration' : 'Desk On-Site Registration'}
                  </span>
                </div>
                <h2 style={{ margin: '6px 0 0 0', fontSize: '1.45rem', fontWeight: '800', color: isDark ? '#f8fafc' : '#0f172a' }}>
                  {getParticipantName(selectedParticipant)}
                </h2>
              </div>

              {/* Verification Status Pill */}
              {isFlagged ? (
                <span style={{ 
                  ...S.statusBadgeBig, 
                  background: isDark ? '#450a0a' : '#fef2f2', 
                  color: isDark ? '#f87171' : '#b91c1c',
                  border: isDark ? '1px solid #dc2626' : '1px solid #fca5a5'
                }}>
                  <FaBan size={18} />
                  FLAGGED &amp; ENTRY BLOCKED
                </span>
              ) : isRegVer ? (
                <span style={{ 
                  ...S.statusBadgeBig, 
                  background: isDark ? '#064e3b' : '#ecfdf5', 
                  color: isDark ? '#34d399' : '#047857',
                  border: isDark ? '1px solid #059669' : '1px solid #a7f3d0'
                }}>
                  <FaCheckCircle size={18} />
                  {isAdmitted ? 'ADMITTED & PRESENT' : 'REGISTRATION VERIFIED'}
                </span>
              ) : (
                <span style={{ 
                  ...S.statusBadgeBig, 
                  background: isDark ? '#451a03' : '#fffbeb', 
                  color: isDark ? '#fbbf24' : '#b45309',
                  border: isDark ? '1px solid #d97706' : '1px solid #fde68a'
                }}>
                  <FaExclamationTriangle size={18} />
                  DESK PENDING
                </span>
              )}
            </div>

            {/* Body Information */}
            <div style={S.detailsBody}>
              {/* ==================== FLAGGED REASON ALERT BANNER ==================== */}
              {isFlagged && (
                <div style={{
                  background: isDark ? 'rgba(127, 29, 29, 0.45)' : '#fef2f2',
                  border: '2px solid #ef4444',
                  borderRadius: '14px',
                  padding: '1.25rem 1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FaBan size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: isDark ? '#fca5a5' : '#b91c1c' }}>
                        ENTRY BLOCKED: PARTICIPANT IS FLAGGED IN REGISTRATION VERIFICATION
                      </h3>
                      <span style={{ fontSize: '0.85rem', color: isDark ? '#f87171' : '#991b1b', fontWeight: '600' }}>
                        This ticket was flagged by the Registration Verification team. Admission cannot be granted.
                      </span>
                    </div>
                  </div>

                  {/* PROMINENT REASON BOX */}
                  <div style={{
                    background: isDark ? 'rgba(0, 0, 0, 0.45)' : '#ffffff',
                    border: isDark ? '1.5px solid rgba(239, 68, 68, 0.5)' : '1.5px solid #fca5a5',
                    borderRadius: '10px',
                    padding: '1rem 1.35rem'
                  }}>
                    <div style={{
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: isDark ? '#fca5a5' : '#b91c1c',
                      marginBottom: '6px'
                    }}>
                      Reason for Flagging:
                    </div>
                    <div style={{
                      fontSize: '1.15rem',
                      fontWeight: '800',
                      color: isDark ? '#ffffff' : '#7f1d1d',
                      lineHeight: '1.45'
                    }}>
                      "{flagReason}"
                    </div>
                    {selectedParticipant.flagged_at && (
                      <div style={{ fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '6px' }}>
                        Flagged on: {new Date(selectedParticipant.flagged_at).toLocaleString()}
                        {selectedParticipant.flagged_by && ` by ${selectedParticipant.flagged_by}`}
                      </div>
                    )}
                  </div>

                  <div style={{
                    fontSize: '0.84rem',
                    color: isDark ? '#fca5a5' : '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600'
                  }}>
                    <FaExclamationTriangle size={15} />
                    <span>Resolution: Participant must visit the Main Registration Desk with payment proof (UPI receipt / passbook) to clear this flag.</span>
                  </div>
                </div>
              )}

              {/* Timestamp of admission if present */}
              {isAdmitted && (selectedParticipant.verified_at || selectedParticipant.verifiedAt) && (
                <div style={{
                  background: isDark ? '#064e3b' : '#ecfdf5',
                  border: isDark ? '1px solid #059669' : '1px solid #6ee7b7',
                  borderRadius: '10px',
                  padding: '0.75rem 1.25rem',
                  color: isDark ? '#a7f3d0' : '#065f46',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaCheckCircle size={16} />
                  Admitted to event on {new Date(selectedParticipant.verified_at || selectedParticipant.verifiedAt).toLocaleDateString()} at {new Date(selectedParticipant.verified_at || selectedParticipant.verifiedAt).toLocaleTimeString()}
                  {(selectedParticipant.verified_by || selectedParticipant.verifiedBy) && ` (Admitted by: ${selectedParticipant.verified_by || selectedParticipant.verifiedBy})`}
                </div>
              )}

              <div style={S.gridTwoCol}>
                {/* Event Info */}
                <div style={S.infoBlock}>
                  <span style={S.infoBlockLabel}>Event Enrolled</span>
                  <span style={{ ...S.infoBlockValue, color: '#2563eb' }}>
                    {getEventName(selectedParticipant)}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'capitalize' }}>
                    {getEventCategory(selectedParticipant)} Event
                  </span>
                </div>

                {/* College & Department */}
                <div style={S.infoBlock}>
                  <span style={S.infoBlockLabel}>College & Department</span>
                  <span style={S.infoBlockValue}>
                    {selectedParticipant.college || 'C. Abdul Hakeem College of Engg & Tech'}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                    {selectedParticipant.department || 'CSE'} • {selectedParticipant.year || '3rd Year'}
                  </span>
                </div>

                {/* Contact Phone */}
                <div style={S.infoBlock}>
                  <span style={S.infoBlockLabel}>Contact Phone</span>
                  <span style={S.infoBlockValue}>
                    <FaPhone size={14} style={{ marginRight: '6px', color: '#10b981' }} />
                    {selectedParticipant.phone || 'N/A'}
                  </span>
                  {selectedParticipant.email && (
                    <span style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                      <FaEnvelope size={12} style={{ marginRight: '4px' }} /> {selectedParticipant.email}
                    </span>
                  )}
                </div>

                {/* Fee & Payment */}
                <div style={S.infoBlock}>
                  <span style={S.infoBlockLabel}>Registration Fee</span>
                  <span style={{ ...S.infoBlockValue, color: isFlagged ? '#ef4444' : '#10b981', fontSize: '1.25rem' }}>
                    ₹{getFee(selectedParticipant)}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                    {isFlagged ? (
                      <strong style={{ color: '#ef4444' }}>FLAGGED / DISPUTED</strong>
                    ) : isRegVer ? (
                      <strong style={{ color: '#10b981' }}>DESK VERIFIED &amp; CONFIRMED</strong>
                    ) : (
                      <strong style={{ color: '#f59e0b' }}>PAYMENT PENDING VERIFICATION</strong>
                    )}
                  </span>
                </div>
              </div>

              {/* Team Details if team event */}
              {getTeamMembers(selectedParticipant).length > 0 && (
                <div style={S.infoBlock}>
                  <span style={S.infoBlockLabel}>
                    Team Details: {selectedParticipant.team_name || selectedParticipant.teamName || 'Team'} ({getTeamMembers(selectedParticipant).length + 1} Members)
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    <span style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      background: isDark ? '#1e3a8a' : '#dbeafe',
                      color: isDark ? '#bfdbfe' : '#1e40af',
                      fontSize: '0.85rem',
                      fontWeight: '700'
                    }}>
                      1. {getParticipantName(selectedParticipant)} (Lead)
                    </span>
                    {getTeamMembers(selectedParticipant).map((m, idx) => (
                      <span key={idx} style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        background: isDark ? '#374151' : '#f1f5f9',
                        color: isDark ? '#f3f4f6' : '#334155',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {idx + 2}. {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div style={S.actionButtonsBar}>
                {isFlagged ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    background: isDark ? '#450a0a' : '#fef2f2',
                    border: '2px solid #ef4444',
                    color: isDark ? '#fca5a5' : '#b91c1c',
                    fontWeight: '800',
                    fontSize: '0.98rem',
                    flex: 1
                  }}>
                    <FaBan size={22} style={{ flexShrink: 0 }} />
                    <div>
                      <div>ADMISSION BLOCKED — TICKET IS FLAGGED</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600', opacity: 0.9 }}>
                        Reason: "{flagReason}"
                      </div>
                    </div>
                  </div>
                ) : !isRegVer ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    background: isDark ? '#451a03' : '#fffbeb',
                    border: '2px solid #f59e0b',
                    color: isDark ? '#fcd34d' : '#92400e',
                    fontWeight: '800',
                    fontSize: '0.98rem',
                    flex: 1
                  }}>
                    <FaExclamationTriangle size={22} style={{ flexShrink: 0 }} />
                    <div>
                      <div>ADMISSION LOCKED — DESK VERIFICATION REQUIRED</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600', opacity: 0.9 }}>
                        Only participants verified in Registration Verification can be admitted.
                      </div>
                    </div>
                  </div>
                ) : !isAdmitted ? (
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={() => handleToggleVerification(selectedParticipant, true)}
                    style={S.confirmBtn}
                  >
                    <FaCheck size={20} />
                    {isVerifying ? 'Confirming Admission...' : 'Confirm Verification & Admit Participant'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={() => handleToggleVerification(selectedParticipant, false)}
                    style={{
                      ...S.undoBtn,
                      opacity: isVerifying ? 0.7 : 1,
                      cursor: isVerifying ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <FaUndo size={14} className={isVerifying ? 'fa-spin' : ''} />
                    {isVerifying ? 'Resetting Admission...' : 'Undo / Reset Admission'}
                  </button>
                )}

                {typeof onPrintTicket === 'function' && isRegVer && (
                  <button
                    type="button"
                    onClick={() => onPrintTicket(selectedParticipant)}
                    style={S.printBtn}
                  >
                    <FaPrint size={15} />
                    Print Verified Ticket
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedParticipant(null)}
                  style={{
                    padding: '0.85rem 1.2rem',
                    borderRadius: '12px',
                    background: isDark ? '#1e293b' : '#f1f5f9',
                    color: isDark ? '#cbd5e1' : '#64748b',
                    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Close Card
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 6. SEARCH MATCHES & PARTICIPANT LIST ==================== */}
      <div style={S.tableCard}>
        <div style={S.tableHeader}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: isDark ? '#f8fafc' : '#0f172a' }}>
              Participant Registrations ({filteredList.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>
              Click on any participant row to inspect details or confirm desk verification.
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Ticket Code</th>
                <th style={S.th}>Participant Name</th>
                <th style={S.th}>Event</th>
                <th style={S.th}>College / Dept</th>
                <th style={S.th}>Phone</th>
                <th style={S.th}>Fee</th>
                <th style={S.th}>Status</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3.5rem', textAlign: 'center', color: isDark ? '#64748b' : '#94a3b8' }}>
                    <FaSearch size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>No participants found matching your criteria</p>
                    <span style={{ fontSize: '0.82rem' }}>Try searching by Ticket Code, Name, or Phone number</span>
                  </td>
                </tr>
              ) : (
                filteredList.map((r, idx) => {
                  const isFlagged = isFlaggedRecord(r);
                  const isRegVer = isRegistrationVerified(r);
                  const isAdmitted = isEventAdmitted(r);
                  const isSelected = selectedParticipant && (
                    selectedParticipant.id === r.id || 
                    getTicketCode(selectedParticipant) === getTicketCode(r)
                  );

                  return (
                    <tr 
                      key={r.id || idx} 
                      style={{
                        ...S.tr,
                        background: isSelected 
                          ? (isDark ? '#1e293b' : '#eff6ff') 
                          : isFlagged
                          ? (isDark ? 'rgba(127, 29, 29, 0.15)' : '#fff5f5')
                          : 'transparent'
                      }}
                      onClick={() => setSelectedParticipant(r)}
                    >
                      <td style={S.td}>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: '800', 
                          color: isFlagged ? '#ef4444' : '#2563eb',
                          background: isFlagged 
                            ? (isDark ? '#450a0a' : '#fee2e2') 
                            : (isDark ? '#1e293b' : '#eff6ff'),
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.85rem'
                        }}>
                          {getTicketCode(r)}
                        </span>
                      </td>

                      <td style={S.td}>
                        <div style={{ fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}>
                          {getParticipantName(r)}
                        </div>
                        {r.email && (
                          <div style={{ fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                            {r.email}
                          </div>
                        )}
                      </td>

                      <td style={S.td}>
                        <span style={{ fontWeight: '600' }}>{getEventName(r)}</span>
                        <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'capitalize' }}>
                          {getEventCategory(r)}
                        </div>
                      </td>

                      <td style={S.td}>
                        <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                          {r.college || 'CAHCET'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                          {r.department || 'CSE'}
                        </div>
                      </td>

                      <td style={S.td}>
                        <span style={{ fontWeight: '600' }}>{r.phone || 'N/A'}</span>
                      </td>

                      <td style={S.td}>
                        <span style={{ fontWeight: '700', color: isFlagged ? '#ef4444' : '#10b981' }}>₹{getFee(r)}</span>
                      </td>

                      <td style={S.td}>
                        {isFlagged ? (
                          <div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              background: isDark ? '#450a0a' : '#fef2f2',
                              color: isDark ? '#f87171' : '#b91c1c',
                              border: isDark ? '1px solid #991b1b' : '1px solid #fecaca'
                            }}>
                              <FaBan size={11} /> FLAGGED
                            </span>
                            <div 
                              style={{ 
                                fontSize: '0.72rem', 
                                color: isDark ? '#f87171' : '#dc2626', 
                                marginTop: '3px', 
                                maxWidth: '160px', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap',
                                fontWeight: '600'
                              }} 
                              title={getFlagReason(r)}
                            >
                              Reason: {getFlagReason(r)}
                            </div>
                          </div>
                        ) : isRegVer ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            background: isDark ? '#064e3b' : '#ecfdf5',
                            color: isDark ? '#6ee7b7' : '#047857'
                          }}>
                            <FaCheck /> {isAdmitted ? 'ADMITTED' : 'VERIFIED'}
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            background: isDark ? '#451a03' : '#fffbeb',
                            color: isDark ? '#fcd34d' : '#b45309'
                          }}>
                            <FaHourglassHalf /> PENDING
                          </span>
                        )}
                      </td>

                      <td style={{ ...S.td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {isFlagged ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedParticipant(r);
                              }}
                              style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                background: isDark ? '#450a0a' : '#fef2f2',
                                color: isDark ? '#fca5a5' : '#b91c1c',
                                border: isDark ? '1px solid #7f1d1d' : '1px solid #fca5a5',
                                fontWeight: '700',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <FaBan size={12} /> Blocked (View)
                            </button>
                          ) : !isRegVer ? (
                            <button
                              type="button"
                              disabled
                              style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                background: isDark ? '#1e293b' : '#f1f5f9',
                                color: isDark ? '#64748b' : '#94a3b8',
                                border: '1px solid transparent',
                                fontWeight: '600',
                                fontSize: '0.78rem',
                                cursor: 'not-allowed'
                              }}
                            >
                              Desk Pending
                            </button>
                          ) : !isAdmitted ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleVerification(r, true);
                              }}
                              style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                background: '#059669',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: '700',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <FaCheck size={12} /> Admit
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedParticipant(r);
                              }}
                              style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                background: isDark ? '#1e293b' : '#f1f5f9',
                                color: isDark ? '#93c5fd' : '#2563eb',
                                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                                fontWeight: '700',
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                            >
                              View Card
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
