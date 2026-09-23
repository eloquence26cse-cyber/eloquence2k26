import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { getApiUrl, getWsUrl } from '../config/api';
import {
  FaBolt,
  FaGamepad,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaClipboard,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaPrint,
  FaUserPlus,
  FaUsers,
  FaShieldAlt,
  FaEdit,
  FaExclamationTriangle,
  FaExchangeAlt,
  FaEnvelope,
  FaGraduationCap,
  FaBuilding,
  FaCheckCircle,
  FaSpinner,
  FaBookOpen,
  FaTimes,
  FaLock,
  FaHome,
  FaCamera,
  FaDownload,
  FaQrcode,
  FaFire,
  FaCreditCard,
  FaChevronRight,
  FaInfoCircle,
  FaCopy
} from 'react-icons/fa';
import { submitRegistration, createPaymentOrder, verifyPaymentAndRegister, getCachedEvents, fetchEventsData, fetchRegistrationStatus, setCachedRegistrationStatus, uploadPaymentScreenshot } from '../services/api.js';
import { getEventSticker } from '../data/eventStickers.js';
import { findEvent, normalizeEvent } from '../utils/eventUtils.js';
import paymentQrImg from '../assets/payment_upi_qr.jpg';
import { QRCodeSVG } from 'qrcode.react';
import PaymentScreenshotUpload from '../components/PaymentScreenshotUpload.jsx';

// Helper to dynamically load official Razorpay Checkout SDK
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      return resolve(true);
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const createEmptyMember = (defaultCollege = '') => ({
  fullName: '',
  email: '',
  phone: '',
  whatsapp: '',
  sameAsPhone: true,
  college: defaultCollege || '',
  department: '',
  year: '',
});

export default function RegistrationPage({ eventId, initialGame, onNavigate }) {
  const initialEvents = getCachedEvents() || [];
  const initialSelected = eventId
    ? findEvent(initialEvents, eventId)
    : (initialEvents.length > 0 ? normalizeEvent(initialEvents[0]) : null);

  const [eventsList, setEventsList] = useState(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState(initialSelected);

  // Registration Closed Status State
  const [isRegClosed, setIsRegClosed] = useState(false);
  const [closedNotice, setClosedNotice] = useState('Registrations for ELOQUENCE 2026 are officially closed. Thank you for your overwhelming interest!');
  const [regClosedAt, setRegClosedAt] = useState(null);
  const [loadingRegStatus, setLoadingRegStatus] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let ws = null;
    let reconnectTimer = null;
    let isExplicitlyClosed = false;

    fetchRegistrationStatus()
      .then((data) => {
        if (!isMounted || !data) return;
        if (data.success) {
          const nextClosed = Boolean(data.isRegistrationClosed);
          setIsRegClosed(nextClosed);
          if (data.closedReason) setClosedNotice(data.closedReason);
          if (data.closedAt) setRegClosedAt(data.closedAt);
        }
      })
      .catch((err) => console.warn('Failed to load registration status:', err))
      .finally(() => {
        if (isMounted) setLoadingRegStatus(false);
      });

    // Auto-reconnecting real-time WebSocket connection
    const connectWebSocket = () => {
      if (isExplicitlyClosed || !isMounted) return;
      try {
        ws = new WebSocket(getWsUrl('/ws/registrations'));

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            if (msg.type === 'REGISTRATION_UPDATE' && msg.action === 'REGISTRATION_STATUS_UPDATED') {
              setCachedRegistrationStatus(msg.data);
              const nextClosed = Boolean(msg.data?.isRegistrationClosed);
              setIsRegClosed((prev) => {
                if (!prev && nextClosed) {
                  toast.error('Registrations have been closed by symposium administrators.', { id: 'reg-status-toast' });
                } else if (prev && !nextClosed) {
                  toast.success('Registrations have been re-opened!', { id: 'reg-status-toast' });
                }
                return nextClosed;
              });
              if (msg.data?.closedReason) setClosedNotice(msg.data.closedReason);
              if (msg.data?.closedAt) setRegClosedAt(msg.data.closedAt);
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          if (!isExplicitlyClosed && isMounted) {
            reconnectTimer = setTimeout(connectWebSocket, 3000);
          }
        };

        ws.onerror = () => {
          try { ws.close(); } catch (_) {}
        };
      } catch (e) {
        if (!isExplicitlyClosed && isMounted) {
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      isExplicitlyClosed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          try { ws.close(); } catch (e) {}
        } else if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => {
            try { ws.close(); } catch (e) {}
          };
        }
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchEventsData()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setEventsList(data);
          if (eventId) {
            const found = findEvent(data, eventId);
            if (found) {
              setSelectedEvent(found);
              initTeamMembersForEvent(found);
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load events in registration page:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  useEffect(() => {
    if (eventId && eventsList.length > 0) {
      const found = findEvent(eventsList, eventId);
      if (found) {
        setSelectedEvent(found);
        initTeamMembersForEvent(found);
      }
    }
  }, [eventId, eventsList]);

  // Stepper: 'participant' | 'team' | 'review' | 'success'
  const [step, setStep] = useState('participant');
  const [showSaveModal, setShowSaveModal] = useState(true);

  const formRef = useRef(null);
  const isEsports = selectedEvent ? (selectedEvent.id === 'nontech-05' || selectedEvent.id?.startsWith('nontech-05')) : eventId === 'nontech-05';
  const isTeam = Boolean(selectedEvent?.isTeam || selectedEvent?.is_team);
  const minMembers = Number(selectedEvent?.minMembers || selectedEvent?.min_members || 1);
  const maxMembers = Number(selectedEvent?.maxMembers || selectedEvent?.max_members || (isTeam ? 3 : 1));
  const feeType = selectedEvent?.feeType || selectedEvent?.fee_type || 'per_head';
  const isFixedTeam = Boolean(
    selectedEvent && (
      feeType === 'per_squad' ||
      feeType === 'per_team' ||
      (isTeam && minMembers > 1 && minMembers === maxMembers)
    )
  );

  const getValidGame = (g) => {
    if (!g) return 'FREE FIRE';
    const upper = String(g).toUpperCase();
    if (upper.includes('BGMI')) return 'BGMI';
    return 'FREE FIRE';
  };

  const [selectedGame, setSelectedGame] = useState(() => {
    if (initialGame) return getValidGame(initialGame);
    const hash = window.location.hash || '';
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      const q = new URLSearchParams(hash.substring(qIndex));
      if (q.get('game')) return getValidGame(q.get('game'));
    }
    return 'FREE FIRE';
  });

  const initialFields = {
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    sameAsPhone: true,
    college: '',
    department: '',
    year: '',
    teamName: '',
    teamMembers: [],
  };

  const [fields, setFields] = useState(() => {
    try {
      const saved = sessionStorage.getItem('eloquence_reg_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.fields) {
          return { ...initialFields, ...parsed.fields };
        }
      }
    } catch (e) {}
    return initialFields;
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [upiUtr, setUpiUtr] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotError, setScreenshotError] = useState(null);
  const [qrViewMode, setQrViewMode] = useState('dynamic'); // 'dynamic' | 'original'
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalCategory, setModalCategory] = useState('all');

  // Real-time persistence of entered details so changing event or navigating never loses data
  useEffect(() => {
    try {
      sessionStorage.setItem('eloquence_reg_draft', JSON.stringify({ fields, selectedGame }));
    } catch (e) {}
  }, [fields, selectedGame]);

  // Sync when eventId prop or eventsList changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (eventId) {
      if (eventsList.length > 0) {
        const ev = findEvent(eventsList, eventId);
        if (ev) {
          setSelectedEvent(ev);
          initTeamMembersForEvent(ev);
        }
      }
    } else {
      if (!isRegClosed && !loadingRegStatus) {
        if (onNavigate) onNavigate('events');
        else window.location.hash = '/events';
      }
    }
    if (initialGame) {
      setSelectedGame(getValidGame(initialGame));
    }
  }, [eventId, eventsList, initialGame, onNavigate]);

  // Helper to pre-populate team members based on event requirements WITHOUT erasing entered data
  const initTeamMembersForEvent = (event) => {
    if (!event) return;
    const ev = normalizeEvent(event);
    setFields((prev) => {
      const existing = Array.isArray(prev.teamMembers) ? prev.teamMembers : [];
      let nextMembers = [...existing];
      const evIsTeam = Boolean(ev.isTeam || ev.is_team);
      const evMin = Number(ev.minMembers || ev.min_members || 1);
      const evMax = Number(ev.maxMembers || ev.max_members || (evIsTeam ? 3 : 1));
      const evFeeType = ev.feeType || ev.fee_type || 'per_head';
      const isFixed = evFeeType === 'per_squad' || evFeeType === 'per_team' || (evIsTeam && evMin > 1 && evMin === evMax);

      if (isFixed && evMax > 1) {
        // Fixed squad / team (e.g. 4-player squad or 5-member team): 1 lead + (evMax - 1) members
        const targetCount = evMax - 1;
        while (nextMembers.length < targetCount) {
          nextMembers.push(createEmptyMember(prev.college));
        }
        if (nextMembers.length > targetCount) {
          nextMembers = nextMembers.slice(0, targetCount);
        }
      } else if (evIsTeam && evMin > 1) {
        // Min members required
        const minCount = Math.max(1, evMin - 1);
        while (nextMembers.length < minCount) {
          nextMembers.push(createEmptyMember(prev.college));
        }
        if (evMax && nextMembers.length > evMax - 1) {
          nextMembers = nextMembers.slice(0, evMax - 1);
        }
      } else if (evIsTeam && evMin <= 1) {
        // Optional extra members: start solo unless extra members already entered, capped at evMax - 1
        if (evMax && nextMembers.length > evMax - 1) {
          nextMembers = nextMembers.slice(0, evMax - 1);
        }
      } else {
        // Solo event: clear additional team members
        nextMembers = [];
      }
      return {
        ...prev,
        teamMembers: nextMembers,
      };
    });
  };

  // Fee calculation using event data
  const calculateTotalFee = () => {
    if (!selectedEvent) return { total: 0, formula: 'No event selected', count: 0, feePerHead: 0 };

    if (selectedEvent.id === 'nontech-07' || (selectedEvent.feeType === 'per_team' && selectedEvent.id === 'nontech-07')) {
      return {
        total: 250,
        formula: 'Flat ₹250 for 5-Member Team',
        count: 5,
        feePerHead: 50,
      };
    }

    if (selectedEvent.id === 'nontech-05' || selectedEvent.feeType === 'per_squad') {
      return {
        total: 200,
        formula: 'Flat ₹200 for 4-Player Squad',
        count: 4,
        feePerHead: 50,
      };
    }

    if (selectedEvent.feeType === 'per_team' || selectedEvent.feeType === 'fixed') {
      const flatTotal = selectedEvent.feePerHead || 250;
      const memCount = selectedEvent.maxMembers || 5;
      return {
        total: flatTotal,
        formula: `Flat ₹${flatTotal} for ${memCount}-Member Team`,
        count: memCount,
        feePerHead: Math.round(flatTotal / memCount),
      };
    }

    const participantCount = 1 + (fields.teamMembers ? fields.teamMembers.length : 0);
    const fee = selectedEvent.feePerHead || 0;
    const total = participantCount * fee;

    return {
      total,
      formula: total === 0 ? 'FREE' : `₹${fee} × ${participantCount} participant${participantCount > 1 ? 's' : ''}`,
      count: participantCount,
      feePerHead: fee,
    };
  };

  const feeInfo = calculateTotalFee();

  // Field change handler
  const handleChange = (field, value) => {
    setFields((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'phone' && prev.sameAsPhone) {
        updated.whatsapp = value;
      }
      return updated;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setServerError(null);
  };

  const handleSameAsPhoneToggle = (checked) => {
    setFields((prev) => ({
      ...prev,
      sameAsPhone: checked,
      whatsapp: checked ? prev.phone : '',
    }));
  };

  const handleTeamMemberFieldChange = (index, field, value) => {
    setFields((prev) => {
      const updated = [...prev.teamMembers];
      const member = { ...(updated[index] || createEmptyMember(prev.college)), [field]: value };
      if (field === 'phone' && member.sameAsPhone) {
        member.whatsapp = value;
      }
      updated[index] = member;
      return { ...prev, teamMembers: updated };
    });
    if (errors[`teamMember_${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`teamMember_${index}_${field}`]: undefined }));
    }
    setServerError(null);
  };

  const handleTeamMemberSameAsPhoneToggle = (index, checked) => {
    setFields((prev) => {
      const updated = [...prev.teamMembers];
      const member = {
        ...(updated[index] || createEmptyMember(prev.college)),
        sameAsPhone: checked,
        whatsapp: checked ? (updated[index]?.phone || '') : ''
      };
      updated[index] = member;
      return { ...prev, teamMembers: updated };
    });
  };

  const addTeamMember = () => {
    if (!selectedEvent) return;
    const max = Number(selectedEvent.maxMembers || selectedEvent.max_members || 3);
    if (fields.teamMembers.length + 1 < max) {
      setFields((prev) => ({
        ...prev,
        teamMembers: [...prev.teamMembers, createEmptyMember(prev.college)],
      }));
    }
  };

  const removeTeamMember = (index) => {
    if (isFixedTeam) return;
    setFields((prev) => {
      const updated = prev.teamMembers.filter((_, i) => i !== index);
      return { ...prev, teamMembers: updated };
    });
    setErrors((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (key.startsWith(`teamMember_${index}_`)) {
          delete updated[key];
        }
      });
      return updated;
    });
  };

  // Change Event action - opens modal to pick an event while completely preserving filled data
  const handleChangeEvent = () => {
    setShowEventModal(true);
  };

  const handleSelectNewEvent = (ev) => {
    if (!ev) return;
    if (ev.id === selectedEvent?.id) {
      setShowEventModal(false);
      return;
    }
    setSelectedEvent(ev);
    initTeamMembersForEvent(ev);
    if (ev.id === 'nontech-05') {
      setSelectedGame(getValidGame(selectedGame));
    }
    // Update hash without losing state
    window.location.hash = `/register?event=${encodeURIComponent(ev.id)}`;
    setShowEventModal(false);
    toast.success(`Event changed to "${ev.name}". All filled details preserved.`);
  };

  // Validation
  const validateParticipant = () => {
    const errs = {};
    if (!fields.fullName.trim()) {
      errs.fullName = 'Full Name is required.';
    } else if (fields.fullName.trim().length < 2) {
      errs.fullName = 'Name must be at least 2 characters.';
    }

    if (!fields.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      errs.email = 'Enter a valid email address (e.g. name@domain.com).';
    }

    if (!fields.phone.trim()) {
      errs.phone = 'Mobile number is required.';
    } else if (!/^[6-9]\d{9}$/.test(fields.phone.trim())) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number (starts with 6-9).';
    }

    if (fields.whatsapp && fields.whatsapp.trim() && !/^[6-9]\d{9}$/.test(fields.whatsapp.trim())) {
      errs.whatsapp = 'Enter a valid 10-digit WhatsApp number.';
    }

    if (!fields.college.trim()) {
      errs.college = 'College / Institution name is required.';
    }

    if (!fields.department.trim()) {
      errs.department = 'Department / Branch is required.';
    }

    if (!fields.year) {
      errs.year = 'Please select year of study.';
    }

    return errs;
  };

  const validateTeam = () => {
    const errs = {};
    if (!selectedEvent || !selectedEvent.isTeam) return errs;

    const hasExtraMembers = Array.isArray(fields.teamMembers) && fields.teamMembers.length > 0;
    const isRequiredTeam = (selectedEvent.minMembers && selectedEvent.minMembers > 1) || hasExtraMembers;

    if (isRequiredTeam) {
      if (!fields.teamName?.trim()) {
        errs.teamName = 'Team / Squad Name is required.';
      } else if (fields.teamName.trim().length < 2) {
        errs.teamName = 'Team Name must be at least 2 characters.';
      }
    }

    const totalCount = 1 + (Array.isArray(fields.teamMembers) ? fields.teamMembers.length : 0);
    if (selectedEvent.minMembers && totalCount < selectedEvent.minMembers) {
      if (selectedEvent.minMembers === selectedEvent.maxMembers) {
        errs.teamMembers = `This event strictly requires exactly ${selectedEvent.minMembers} team members to be filled.`;
      } else {
        errs.teamMembers = `This event requires at least ${selectedEvent.minMembers} team members.`;
      }
    }

    fields.teamMembers.forEach((member, idx) => {
      const num = idx + 2;
      const memObj = typeof member === 'string' ? { fullName: member } : (member || {});

      // Full Name
      if (!memObj.fullName?.trim()) {
        errs[`teamMember_${idx}_fullName`] = `Member ${num} Full Name is required.`;
      } else if (memObj.fullName.trim().length < 2) {
        errs[`teamMember_${idx}_fullName`] = `Member ${num} Name must be at least 2 characters.`;
      }

      // Email
      if (!memObj.email?.trim()) {
        errs[`teamMember_${idx}_email`] = `Member ${num} Email Address is required.`;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memObj.email.trim())) {
        errs[`teamMember_${idx}_email`] = `Enter a valid email address for Member ${num}.`;
      }

      // Mobile Number
      if (!memObj.phone?.trim()) {
        errs[`teamMember_${idx}_phone`] = `Member ${num} Mobile Number is required.`;
      } else if (!/^[6-9]\d{9}$/.test(memObj.phone.trim())) {
        errs[`teamMember_${idx}_phone`] = `Enter a valid 10-digit mobile number for Member ${num}.`;
      }

      // WhatsApp (validated if entered)
      if (memObj.whatsapp?.trim() && !/^[6-9]\d{9}$/.test(memObj.whatsapp.trim())) {
        errs[`teamMember_${idx}_whatsapp`] = `Enter a valid 10-digit WhatsApp number for Member ${num}.`;
      }

      // College
      if (!memObj.college?.trim()) {
        errs[`teamMember_${idx}_college`] = `Member ${num} College / Institution is required.`;
      }

      // Department
      if (!memObj.department?.trim()) {
        errs[`teamMember_${idx}_department`] = `Member ${num} Department / Branch is required.`;
      }

      // Year of study
      if (!memObj.year) {
        errs[`teamMember_${idx}_year`] = `Please select Year of Study for Member ${num}.`;
      }
    });

    return errs;
  };

  // Step transitions
  const handleProceedToTeamOrReview = (e) => {
    e.preventDefault();
    const errs = validateParticipant();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors({});

    if (selectedEvent?.isTeam || selectedEvent?.is_team) {
      setStep('team');
    } else {
      setStep('review');
    }
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleProceedToReviewFromTeam = (e) => {
    e.preventDefault();
    const errs = validateTeam();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors({});

    // If solo without an entered team name, auto-default gracefully
    if (!fields.teamName?.trim()) {
      setFields((prev) => ({
        ...prev,
        teamName: `${prev.fullName || 'Solo'} Squad`
      }));
    }

    setStep('review');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Final submission with Razorpay Payment Integration
  const handleFinalSubmit = async () => {
    // Validate everything once more
    const pErrors = validateParticipant();
    const tErrors = selectedEvent?.isTeam ? validateTeam() : {};
    const allErrors = { ...pErrors, ...tErrors };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setStep(Object.keys(pErrors).length > 0 ? 'participant' : 'team');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const activeEventPayload = isEsports
      ? { ...selectedEvent, name: `${selectedEvent.name} (${selectedGame})`, game: selectedGame }
      : selectedEvent;

    const totalPayable = Number(feeInfo.total) || 0;

    // ── CASE A: FREE EVENT (totalFee === 0) ──
    if (totalPayable === 0) {
      try {
        const response = await fetch(getApiUrl('/api/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentEvent: activeEventPayload,
            fields,
            totalFee: 0,
            game: isEsports ? selectedGame : null
          })
        });
        const data = await response.json();
        if (data.success) {
          toast.success('Congratulations, you are an Avenger now!', {
            duration: 5000,
            id: 'avenger-success-toast'
          });
          const resTicket = data.ticketData || {};
          setTicketData({
            ...resTicket,
            registrationId: resTicket.ticketCode || data.registrationId || 'ELQ26-REG',
            fullName: fields.fullName,
            college: fields.college,
            department: fields.department,
            year: fields.year,
            phone: fields.phone,
            email: fields.email,
            eventId: selectedEvent?.id,
            eventName: activeEventPayload.name,
            eventCategory: selectedEvent.category,
            isTeam: selectedEvent.isTeam,
            teamName: fields.teamName,
            participantCount: 1 + (fields.teamMembers ? fields.teamMembers.length : 0),
            totalFee: 0,
            totalAmount: 0,
            paymentStatus: 'FREE',
            paymentMethod: 'FREE_EVENT',
            game: isEsports ? selectedGame : null
          });
          setShowSaveModal(true);
          setStep('success');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          toast.error('Registration failed: ' + (data.message || 'Server error'));
          setServerError(data.message || 'Registration failed.');
        }
      } catch (err) {
        console.error('Free registration error:', err);
        toast.error('Server connection error. Please try again.');
        setServerError('Network error while communicating with registration server.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── CASE B: PAID EVENT → UPI QR PAYMENT FLOW ──
    const cleanUtr = (upiUtr || '').trim();
    if (!cleanUtr) {
      toast.error('Please enter the 12-digit UPI UTR / Transaction ID after completing payment.', {
        icon: <FaExclamationTriangle style={{ color: '#f59e0b' }} />
      });
      setIsSubmitting(false);
      return;
    }

    if (cleanUtr.length < 6) {
      toast.error('Please enter a valid 12-digit UPI UTR / Reference number from your payment app.', {
        icon: <FaExclamationTriangle style={{ color: '#f59e0b' }} />
      });
      setIsSubmitting(false);
      return;
    }

    // ── MANDATORY PAYMENT SCREENSHOT CHECK ──
    if (!screenshotFile) {
      setScreenshotError('Payment screenshot proof is mandatory. Please upload your payment receipt / screenshot to complete registration.');
      toast.error('Please upload your payment screenshot before confirming registration.', {
        icon: <FaExclamationTriangle style={{ color: '#ef4444' }} />
      });
      const uploadElem = document.getElementById('payment-screenshot-upload-box');
      if (uploadElem) {
        uploadElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setIsSubmitting(false);
      return;
    }

    try {
      const whatsappRaw = (fields.whatsapp && fields.whatsapp.trim()) || (fields.phone && fields.phone.trim()) || '';
      const clean10Digits = whatsappRaw.replace(/\D/g, '').slice(-10);
      const formattedContact = clean10Digits.length === 10
        ? `+91${clean10Digits}`
        : (whatsappRaw.startsWith('+91') ? whatsappRaw : (whatsappRaw ? `+91${whatsappRaw}` : ''));

      const response = await fetch(getApiUrl('/api/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEvent: activeEventPayload,
          fields: {
            ...fields,
            whatsapp: whatsappRaw,
            phone: whatsappRaw || fields.phone,
            contact: formattedContact,
            upiUtr: cleanUtr,
            transactionId: cleanUtr
          },
          totalFee: totalPayable,
          paymentMethod: 'UPI_QR',
          paymentStatus: 'paid',
          game: isEsports ? selectedGame : null
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Congratulations, you are an Avenger now!', {
          icon: <FaShieldAlt style={{ color: '#6366f1' }} />,
          duration: 5000,
          id: 'avenger-success-toast'
        });
        const resTicket = data.ticketData || {};
        const createdRegId = resTicket.ticketCode || data.registrationId || resTicket.id;

        // Mandatory payment screenshot upload and Sharp compression via backend
        if (screenshotFile && createdRegId) {
          try {
            const uploadRes = await uploadPaymentScreenshot(createdRegId, screenshotFile);
            if (uploadRes && uploadRes.path) {
              resTicket.paymentScreenshotPath = uploadRes.path;
              resTicket.payment_screenshot_path = uploadRes.path;
            } else if (uploadRes && !uploadRes.success) {
              toast.error(uploadRes.message || 'Payment screenshot upload warning. Please retain your receipt.', { duration: 6000 });
            }
          } catch (uploadErr) {
            console.warn('[Payment Screenshot Upload Notice]', uploadErr);
          }
        }

        setTicketData({
          ...resTicket,
          registrationId: resTicket.ticketCode || data.registrationId || 'ELQ26-REG',
          fullName: fields.fullName,
          college: fields.college,
          department: fields.department,
          year: fields.year,
          phone: fields.phone,
          email: fields.email,
          eventId: selectedEvent?.id,
          eventName: activeEventPayload.name,
          eventCategory: selectedEvent.category,
          isTeam: selectedEvent.isTeam,
          teamName: fields.teamName,
          participantCount: 1 + (fields.teamMembers ? fields.teamMembers.length : 0),
          totalFee: totalPayable,
          totalAmount: totalPayable,
          paymentStatus: 'PAID',
          paymentMethod: 'UPI_QR',
          transactionId: cleanUtr,
          upiUtr: cleanUtr,
          game: isEsports ? selectedGame : null
        });
        setShowSaveModal(true);
        setStep('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error('Registration failed: ' + (data.message || 'Server error'));
        setServerError(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error('UPI QR registration error:', err);
      toast.error('Server connection error. Please try again.');
      setServerError('Network error while communicating with registration server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to copy official UPI ID
  const handleCopyUpiId = () => {
    try {
      navigator.clipboard.writeText('6374229503@yesfam');
      setCopiedUpi(true);
      toast.success('UPI ID copied: 6374229503@yesfam', { icon: <FaCopy style={{ color: '#38bdf8' }} /> });
      setTimeout(() => setCopiedUpi(false), 3000);
    } catch (e) {
      toast.success('UPI ID: 6374229503@yesfam');
    }
  };

  // ── PRESERVED: Official Razorpay Payment Integration (Keys & logic 100% intact) ──
  const handleRazorpayCheckout = async () => {
    setIsSubmitting(true);
    setServerError(null);

    const activeEventPayload = isEsports
      ? { ...selectedEvent, name: `${selectedEvent.name} (${selectedGame})`, game: selectedGame }
      : selectedEvent;

    const totalPayable = Number(feeInfo.total) || 0;

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Could not load Razorpay payment gateway. Please check your internet connection.');
        setIsSubmitting(false);
        return;
      }

      const whatsappRaw = (fields.whatsapp && fields.whatsapp.trim()) || (fields.phone && fields.phone.trim()) || '';
      const clean10Digits = whatsappRaw.replace(/\D/g, '').slice(-10);
      const formattedContact = clean10Digits.length === 10
        ? `+91${clean10Digits}`
        : (whatsappRaw.startsWith('+91') ? whatsappRaw : (whatsappRaw ? `+91${whatsappRaw}` : ''));

      const orderPayload = {
        currentEvent: activeEventPayload,
        fields: {
          ...fields,
          whatsapp: whatsappRaw,
          phone: whatsappRaw || fields.phone,
          contact: formattedContact
        },
        totalFee: totalPayable,
        game: isEsports ? selectedGame : null
      };

      const orderData = await createPaymentOrder(orderPayload);
      if (!orderData.success || !orderData.orderId) {
        toast.error(orderData.message || 'Failed to initialize payment order.');
        setServerError(orderData.message || 'Could not initiate secure payment order with Razorpay.');
        setIsSubmitting(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: "ELOQUENCE '26",
        description: `Registration for ${activeEventPayload.name}`,
        order_id: orderData.orderId,
        prefill: {
          name: fields.fullName?.trim() || '',
          email: fields.email?.trim() || '',
          contact: formattedContact,
          method: 'upi'
        },
        readonly: {
          contact: true,
          email: true
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI (GPay, PhonePe, Paytm, QR)",
                instruments: [{ method: "upi" }]
              }
            },
            sequence: ["block.upi"],
            preferences: { show_default_blocks: true }
          }
        },
        notes: {
          event: activeEventPayload.name,
          category: selectedEvent.category,
          college: fields.college,
          team: fields.teamName || 'Solo',
          contact: formattedContact,
          whatsapp: formattedContact,
          phone: formattedContact,
          chosenPaymentMethod: 'UPI'
        },
        theme: { color: '#00f5ff' },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            toast('Payment window closed. You can review your details and retry payment anytime.', {
              icon: <FaInfoCircle />
            });
          }
        },
        handler: async (response) => {
          setIsSubmitting(true);
          try {
            const verifyRes = await verifyPaymentAndRegister({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              currentEvent: activeEventPayload,
              fields: {
                ...fields,
                whatsapp: whatsappRaw,
                phone: whatsappRaw || fields.phone,
                contact: formattedContact
              },
              totalFee: totalPayable,
              game: isEsports ? selectedGame : null,
              paymentMethod: 'RAZORPAY_UPI'
            });

            if (verifyRes.success && verifyRes.ticketData) {
              toast.success('Congratulations, you are an Avenger now!', {
                icon: <FaShieldAlt style={{ color: '#6366f1' }} />,
                duration: 5000,
                id: 'avenger-success-toast'
              });
              setTicketData({
                ...verifyRes.ticketData,
                eventId: verifyRes.ticketData.eventId || selectedEvent?.id,
                eventName: verifyRes.ticketData.eventName || activeEventPayload?.name
              });
              setShowSaveModal(true);
              setStep('success');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              const errMsg = verifyRes.message || 'Payment verification failed on server.';
              toast.error(errMsg);
              setServerError(errMsg);
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            toast.error(
              `Network error confirming payment. Please note Payment ID: ${response.razorpay_payment_id} and contact coordinators.`
            );
            setServerError('Server error during payment verification. Payment ID: ' + response.razorpay_payment_id);
          } finally {
            setIsSubmitting(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (failureRes) {
        console.error('Razorpay Payment Failed:', failureRes.error);
        toast.error(`Payment failed: ${failureRes.error.description || failureRes.error.reason || 'Transaction could not be completed.'}`);
        setIsSubmitting(false);
      });
      rzpInstance.open();

    } catch (paymentErr) {
      console.error('Razorpay initialization error:', paymentErr);
      toast.error('Unexpected error launching Razorpay checkout. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (ticketData?.registrationId) {
      navigator.clipboard.writeText(ticketData.registrationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const resetForNewRegistration = () => {
    if (onNavigate) {
      onNavigate('events');
    } else {
      window.location.hash = '/events';
    }
  };

  // ========================================================
  // REGISTRATIONS CLOSED VIEW (No form access allowed)
  // Checked first so that even if eventId is null, visitors
  // immediately see the official closed status screen.
  // ========================================================
  if (!loadingRegStatus && isRegClosed) {
    return (
      <div className="registration-page">
        <div className="registration-page-container">
          {/* Terminal Header */}
          <div className="reg-terminal-header">
            <div className="reg-terminal-brand">
              <span className="reg-terminal-sys-id">// SECURE SYMPOSIUM GATEWAY //</span>
              <h1 className="reg-terminal-title">ELOQUENCE'26 REGISTRATION TERMINAL</h1>
              <p className="reg-terminal-meta">
                9TH NATIONAL LEVEL TECHNICAL SYMPOSIUM • CAHCET MELVISHARAM • SEPTEMBER 26, 2026
              </p>
            </div>
            <div
              className="reg-terminal-status-badge"
              style={{
                borderColor: 'rgba(239, 68, 68, 0.5)',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)'
              }}
            >
              <span
                className="terminal-live-dot"
                style={{ background: '#ef4444', boxShadow: '0 0 10px #ef4444' }}
              />
              <span>ADMISSIONS CLOSED</span>
            </div>
          </div>

          {/* Cyber-Aesthetic Registrations Closed Panel */}
          <div
            className="reg-closed-panel"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 10, 12, 0.85) 0%, rgba(10, 15, 12, 0.95) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(239, 68, 68, 0.12)',
              borderRadius: '16px',
              padding: 'clamp(1.75rem, 5vw, 3.5rem)',
              textAlign: 'center',
              margin: '1.5rem 0',
              backdropFilter: 'blur(10px)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top Glowing Accent Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #ef4444, transparent)'
              }}
            />

            {/* Glowing Lock Icon */}
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '2px solid rgba(239, 68, 68, 0.5)',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: '#ef4444'
              }}
            >
              <FaLock size={32} />
            </div>

            {/* Status Pill */}
            <div style={{ marginBottom: '0.75rem' }}>
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '0.35rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                // PORTAL STATUS: REGISTRATIONS CLOSED //
              </span>
            </div>

            {/* Main Headline */}
            <h2
              style={{
                fontFamily: 'var(--font-display, monospace)',
                fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: '#ffffff',
                margin: '0 0 1rem',
                textShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
              }}
            >
              REGISTRATIONS ARE OFFICIALLY CLOSED
            </h2>

            {/* Custom Announcement Message */}
            <p
              style={{
                fontSize: 'clamp(0.92rem, 2.5vw, 1.08rem)',
                color: '#cbd5e1',
                lineHeight: 1.6,
                maxWidth: '640px',
                margin: '0 auto 2rem'
              }}
            >
              {closedNotice ||
                'Online registrations for ELOQUENCE 2026 have officially ended. We have reached maximum capacity across our competition events. Thank you to all participants for your tremendous response!'}
            </p>

            {/* Event Highlights & Venue Card */}
            <div
              style={{
                background: 'rgba(15, 23, 18, 0.7)',
                border: '1px solid rgba(57, 255, 136, 0.15)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                maxWidth: '600px',
                margin: '0 auto 2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <FaCalendarAlt style={{ color: 'var(--bright-green, #39ff88)', marginTop: '3px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#8c9d91', fontWeight: 700, textTransform: 'uppercase' }}>Event Date</div>
                  <div style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 600 }}>September 26, 2026</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <FaMapMarkerAlt style={{ color: 'var(--bright-green, #39ff88)', marginTop: '3px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#8c9d91', fontWeight: 700, textTransform: 'uppercase' }}>Venue</div>
                  <div style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600 }}>CAHCET, Melvisharam, Ranipet</div>
                </div>
              </div>
            </div>

            {/* Support Note */}
            <p
              style={{
                fontSize: '0.84rem',
                color: '#94a3b8',
                margin: '0 auto 2rem',
                maxWidth: '540px'
              }}
            >
              Already registered? Make sure to save your ticket pass and email confirmation. For inquiries, please reach out to the respective event coordinators.
            </p>

            {/* Quick Action Navigation Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('events')}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.85rem 1.6rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  borderRadius: '10px'
                }}
              >
                <FaBookOpen />
                <span>Explore Events & Rules</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('home')}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.85rem 1.6rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  borderRadius: '10px'
                }}
              >
                <FaHome />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="registration-page" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="events-loading-container"
          style={{ padding: '3rem 1.5rem', maxWidth: '480px' }}
        >
          {/* High-tech cyberpunk orbital radar loader */}
          <div className="cyber-loader-wrap">
            <motion.div
              className="cyber-orbit-ring-outer"
              animate={{ rotate: 360 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="cyber-orbit-ring-inner"
              animate={{ rotate: -360 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="cyber-loader-core"
              animate={{
                scale: [0.92, 1.08, 0.92],
                boxShadow: [
                  '0 0 15px rgba(57, 255, 136, 0.4)',
                  '0 0 28px rgba(0, 240, 255, 0.75)',
                  '0 0 15px rgba(57, 255, 136, 0.4)',
                ],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FaBolt className="cyber-loader-icon" />
            </motion.div>
          </div>

          <div className="cyber-loading-meta">
            <h4 className="cyber-loading-title">LOADING REGISTRATION</h4>
            <p className="cyber-loading-subtext">
              Preparing registration gateway
              <span className="cyber-loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </p>
            <div className="cyber-loading-beam-wrap">
              <motion.div
                className="cyber-loading-beam"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-page-container" ref={formRef}>
        {/* Terminal Header (Shown during form steps; omitted on success screen to keep page clean) */}
        {step !== 'success' && (
          <div className="reg-terminal-header">
            <div className="reg-terminal-brand">
              <span className="reg-terminal-sys-id">// SECURE SYMPOSIUM GATEWAY //</span>
              <h1 className="reg-terminal-title">ELOQUENCE'26 REGISTRATION TERMINAL</h1>
              <p className="reg-terminal-meta">
                9TH NATIONAL LEVEL TECHNICAL SYMPOSIUM • CAHCET MELVISHARAM • SEPTEMBER 26, 2026
              </p>
            </div>
            <div className="reg-terminal-status-badge">
              <span className="terminal-live-dot" />
              <span>ADMISSIONS ACTIVE</span>
            </div>
          </div>
        )}

        {/* Stepper Navigation with Cyberpunk Energy Beam Connections */}
        {step !== 'success' && (
          <nav className="reg-stepper" aria-label="Registration Progress">
            {/* Step 1: Participant Details */}
            <div
              className={`reg-step-item ${step === 'participant' ? 'active' : ['team', 'review'].includes(step) ? 'completed' : ''}`}
              onClick={() => ['team', 'review'].includes(step) && setStep('participant')}
              style={{ cursor: ['team', 'review'].includes(step) ? 'pointer' : 'default' }}
              title={['team', 'review'].includes(step) ? 'Click to edit Participant Details' : 'Step 1: Participant Details'}
            >
              <span className="reg-step-num">
                {['team', 'review'].includes(step) ? <FaCheck className="step-check-icon" /> : '01'}
                {step === 'participant' && <span className="reg-step-pulse-ring" />}
              </span>
              <span className="reg-step-label">PARTICIPANT DETAILS</span>
            </div>

            {/* Connector Beam 1 -> 2 */}
            <div className={`reg-step-connector ${['team', 'review'].includes(step) ? 'connector-active' : ''}`}>
              <div className="connector-track">
                <div className="connector-fill" />
                <div className="connector-laser-glow" />
              </div>
              <span className="connector-chevron"><FaChevronRight style={{ fontSize: '0.65rem' }} /></span>
            </div>

            {/* Step 2: Team Details (if team event) */}
            {(selectedEvent?.isTeam || selectedEvent?.is_team) && (
              <>
                <div
                  className={`reg-step-item ${step === 'team' ? 'active' : step === 'review' ? 'completed' : ''}`}
                  onClick={() => step === 'review' && setStep('team')}
                  style={{ cursor: step === 'review' ? 'pointer' : 'default' }}
                  title={step === 'review' ? 'Click to edit Team Details' : 'Step 2: Team Details'}
                >
                  <span className="reg-step-num">
                    {step === 'review' ? <FaCheck className="step-check-icon" /> : '02'}
                    {step === 'team' && <span className="reg-step-pulse-ring" />}
                  </span>
                  <span className="reg-step-label">TEAM DETAILS</span>
                </div>

                {/* Connector Beam 2 -> 3 */}
                <div className={`reg-step-connector ${step === 'review' ? 'connector-active' : ''}`}>
                  <div className="connector-track">
                    <div className="connector-fill" />
                    <div className="connector-laser-glow" />
                  </div>
                  <span className="connector-chevron"><FaChevronRight style={{ fontSize: '0.65rem' }} /></span>
                </div>
              </>
            )}

            {/* Step 3 (or 2 for solo): Review & Confirm */}
            <div className={`reg-step-item ${step === 'review' ? 'active' : ''}`}>
              <span className="reg-step-num">
                {(selectedEvent?.isTeam || selectedEvent?.is_team) ? '03' : '02'}
                {step === 'review' && <span className="reg-step-pulse-ring" />}
              </span>
              <span className="reg-step-label">REVIEW & CONFIRM</span>
            </div>
          </nav>
        )}

        {/* STEP 02 & 03: FORM VIEWS (Participant & Team Details) */}
        {(step === 'participant' || step === 'team') && selectedEvent && (
          <div className="reg-two-column-layout">
            {/* Left Column: Form Steps */}
            <div className="reg-form-col">
              {/* Selected Event HUD Banner */}
              <div className="selected-event-hud">
                <div className="hud-badge-row">
                  <span className={`hud-badge ${selectedEvent.category === 'technical' ? 'hud-badge-tech' : 'hud-badge-nontech'}`}>
                    {selectedEvent.category === 'technical' ? <FaBolt /> : <FaGamepad />}
                    {selectedEvent.category.toUpperCase()}
                  </span>
                  <span className="hud-fee-pill">{selectedEvent.fee}</span>
                  <button type="button" className="btn-change-event" onClick={handleChangeEvent}>
                    <FaExchangeAlt style={{ marginRight: '0.35rem' }} /> Change Event
                  </button>
                </div>
                <h2 className="hud-event-name">
                  {selectedEvent.name}
                  {isEsports && <span className="banner-game-badge"> — {selectedGame}</span>}
                </h2>
                <div className="hud-meta-grid">
                  <span><strong>Format:</strong> {selectedEvent.teamSize}</span>
                  <span><strong>Venue:</strong> {selectedEvent.venue || 'CSE Department Labs'}</span>
                  <span><strong>Time:</strong> {selectedEvent.timing || '10:00 AM – 1:00 PM'}</span>
                </div>
              </div>

              {/* STEP 01: PARTICIPANT DETAILS */}
              {step === 'participant' && (
                <form onSubmit={handleProceedToTeamOrReview} noValidate className="reg-card-panel">
                  <div className="panel-title-bar">
                    <div className="panel-title-left">
                      <span className="panel-step-tag">STEP 01</span>
                      <h3 className="panel-title">PARTICIPANT DETAILS</h3>
                    </div>
                    <span className="panel-req-hint">* Required Fields</span>
                  </div>

                  {isEsports && (
                    <div className="esports-game-select-section" id="reg-field-gameArena">
                      <label className="form-label">
                        SELECT GAME ARENA <span className="required-star">*</span>
                      </label>
                      <div className="esports-game-toggle-grid">
                        <button
                          type="button"
                          className={`esports-toggle-card ${selectedGame === 'FREE FIRE' ? 'active' : ''}`}
                          onClick={() => setSelectedGame('FREE FIRE')}
                        >
                          <div className="game-toggle-radio-circle">
                            {selectedGame === 'FREE FIRE' && <span className="game-toggle-radio-dot" />}
                          </div>
                          <div className="game-toggle-info">
                            <span className="game-toggle-title">FREE FIRE</span>
                            <span className="game-toggle-meta">4-Player Squad • Battle Royale</span>
                          </div>
                          <span className="game-toggle-badge">₹200 / Squad</span>
                        </button>
                        <button
                          type="button"
                          className={`esports-toggle-card ${selectedGame === 'BGMI' ? 'active' : ''}`}
                          onClick={() => setSelectedGame('BGMI')}
                        >
                          <div className="game-toggle-radio-circle">
                            {selectedGame === 'BGMI' && <span className="game-toggle-radio-dot" />}
                          </div>
                          <div className="game-toggle-info">
                            <span className="game-toggle-title">BGMI</span>
                            <span className="game-toggle-meta">4-Player Squad • Battle Royale</span>
                          </div>
                          <span className="game-toggle-badge">₹200 / Squad</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-grid-2col">
                    {/* Full Name */}
                    <div className={`form-group ${errors.fullName ? 'form-group-error' : ''}`} id="field-fullName">
                      <label className="form-label">
                        Full Name {selectedEvent.isTeam ? '(Team Leader)' : ''} <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={fields.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        required
                      />
                      {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                    </div>

                    {/* Email */}
                    <div className={`form-group ${errors.email ? 'form-group-error' : ''}`} id="field-email">
                      <label className="form-label">
                        Email Address <span className="required-star">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-input"
                        value={fields.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    {/* Phone */}
                    <div className={`form-group ${errors.phone ? 'form-group-error' : ''}`} id="field-phone">
                      <label className="form-label">
                        Mobile Number <span className="required-star">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-input"
                        maxLength={10}
                        value={fields.phone}
                        onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                        required
                      />
                      {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>

                    {/* WhatsApp */}
                    <div className={`form-group ${errors.whatsapp ? 'form-group-error' : ''}`} id="field-whatsapp">
                      <div className="whatsapp-label-row">
                        <label className="form-label">WhatsApp Number</label>
                        <label className="same-as-phone-toggle">
                          <input
                            type="checkbox"
                            checked={fields.sameAsPhone}
                            onChange={(e) => handleSameAsPhoneToggle(e.target.checked)}
                          />
                          <span>Same as Mobile</span>
                        </label>
                      </div>
                      <input
                        type="tel"
                        className="form-input"
                        maxLength={10}
                        value={fields.whatsapp}
                        onChange={(e) => handleChange('whatsapp', e.target.value.replace(/\D/g, ''))}
                        disabled={fields.sameAsPhone}
                      />
                      {errors.whatsapp && <span className="error-message">{errors.whatsapp}</span>}
                    </div>

                    {/* College */}
                    <div className={`form-group ${errors.college ? 'form-group-error' : ''}`} id="field-college">
                      <label className="form-label">
                        College / Institution Name <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={fields.college}
                        onChange={(e) => handleChange('college', e.target.value)}
                        required
                      />
                      {errors.college && <span className="error-message">{errors.college}</span>}
                    </div>

                    {/* Department */}
                    <div className={`form-group ${errors.department ? 'form-group-error' : ''}`} id="field-department">
                      <label className="form-label">
                        Department / Branch <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={fields.department}
                        onChange={(e) => handleChange('department', e.target.value)}
                        required
                      />
                      {errors.department && <span className="error-message">{errors.department}</span>}
                    </div>

                    {/* Year of Study */}
                    <div className={`form-group form-group-full ${errors.year ? 'form-group-error' : ''}`} id="field-year">
                      <label className="form-label">
                        Year of Study <span className="required-star">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={fields.year}
                        onChange={(e) => handleChange('year', e.target.value)}
                        required
                      >
                        <option value="">-- Select Year of Study --</option>
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      {errors.year && <span className="error-message">{errors.year}</span>}
                    </div>
                  </div>

                  <div className="panel-actions-row">
                    <button type="button" className="btn btn-secondary" onClick={handleChangeEvent}>
                      <FaExchangeAlt style={{ marginRight: '0.4rem' }} /> CHANGE EVENT
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {(selectedEvent?.isTeam || selectedEvent?.is_team) ? (
                        <>
                          CONTINUE TO TEAM DETAILS <FaArrowRight style={{ marginLeft: '0.4rem' }} />
                        </>
                      ) : (
                        <>
                          PROCEED TO REVIEW <FaArrowRight style={{ marginLeft: '0.4rem' }} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 02: TEAM DETAILS (Only for team events) */}
              {step === 'team' && (selectedEvent?.isTeam || selectedEvent?.is_team) && (
                <form onSubmit={handleProceedToReviewFromTeam} noValidate className="reg-card-panel">
                  <div className="panel-title-bar">
                    <div className="panel-title-left">
                      <span className="panel-step-tag">STEP 02</span>
                      <h3 className="panel-title">SQUAD / TEAM CONFIGURATION</h3>
                    </div>
                    <span className="panel-req-hint">{selectedEvent.teamSize || selectedEvent.team_size}</span>
                  </div>

                  <p className="team-intro-note">
                    Leader is automatically <strong>{fields.fullName || 'Lead Participant'}</strong>.
                    {selectedEvent.minMembers === selectedEvent.maxMembers && selectedEvent.minMembers > 1
                      ? ` This event strictly requires a team of exactly ${selectedEvent.maxMembers} members (Leader + ${selectedEvent.maxMembers - 1} members) — ₹${feeInfo.total} flat per team.`
                      : ` Add squad members according to the competition rules (Maximum ${selectedEvent.maxMembers} total participants).`}
                  </p>

                  {/* Team Name */}
                  <div className={`form-group ${errors.teamName ? 'form-group-error' : ''}`} id="field-teamName" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">
                      Squad / Team Name {(selectedEvent.minMembers && selectedEvent.minMembers > 1) || fields.teamMembers.length > 0 ? (
                        <span className="required-star">*</span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#9cb1a2', fontWeight: 400, marginLeft: '0.4rem' }}>(Optional for Solo)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={fields.teamName}
                      onChange={(e) => handleChange('teamName', e.target.value)}
                      required
                    />
                    {errors.teamName && <span className="error-message">{errors.teamName}</span>}
                  </div>

                  {/* Leader Card */}
                  <div className="leader-preview-card">
                    <div className="leader-badge">MEMBER 1 (SQUAD LEADER)</div>
                    <div className="leader-name">{fields.fullName || 'Lead Participant'}</div>
                    <div className="leader-info">
                      {fields.department && `${fields.department} • `}
                      {fields.year && `${fields.year} • `}
                      {fields.phone || fields.whatsapp} • {fields.email}
                    </div>
                  </div>

                  {/* Additional Members List */}
                  <div className="team-members-container">
                    <h4 className="members-subheading">// ADDITIONAL SQUAD MEMBERS:</h4>

                    {errors.teamMembers && (
                      <div className="error-message" style={{ marginBottom: '1rem', padding: '0.6rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '0.85rem' }}>
                        {errors.teamMembers}
                      </div>
                    )}

                    {fields.teamMembers.length === 0 && !isFixedTeam && (
                      <p className="no-members-hint">No extra members added yet. You can compete as a solo participant or add team members below.</p>
                    )}

                    {fields.teamMembers.map((member, idx) => {
                      const m = typeof member === 'string' ? { ...createEmptyMember(fields.college), fullName: member } : (member || createEmptyMember(fields.college));
                      return (
                        <div
                          key={idx}
                          className="team-member-entry"
                          id={`field-teamMember_${idx}`}
                          style={{ marginBottom: '1.25rem' }}
                        >
                          <div className="team-member-row-label" style={{ marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.74rem', fontWeight: '800', color: 'var(--bright-green)', letterSpacing: '0.1em' }}>
                                MEMBER {idx + 2} DETAILS
                              </span>
                              <span style={{ fontSize: '0.65rem', background: 'rgba(57, 255, 136, 0.1)', color: 'var(--bright-green)', padding: '0.12rem 0.45rem', borderRadius: '4px', fontWeight: '700' }}>
                                SQUAD MEMBER
                              </span>
                            </div>
                            {!isFixedTeam && (
                              <button
                                type="button"
                                className="remove-member-btn"
                                onClick={() => removeTeamMember(idx)}
                              >
                                Remove Member
                              </button>
                            )}
                          </div>

                          <div className="form-grid-2col">
                            {/* Full Name */}
                            <div className={`form-group ${errors[`teamMember_${idx}_fullName`] ? 'form-group-error' : ''}`} id={`field-teamMember_${idx}_fullName`}>
                              <label className="form-label">
                                Full Name <span className="required-star">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                value={m.fullName || ''}
                                onChange={(e) => handleTeamMemberFieldChange(idx, 'fullName', e.target.value)}
                                required
                              />
                              {errors[`teamMember_${idx}_fullName`] && (
                                <span className="error-message">{errors[`teamMember_${idx}_fullName`]}</span>
                              )}
                            </div>

                            {/* Email */}
                            <div className={`form-group ${errors[`teamMember_${idx}_email`] ? 'form-group-error' : ''}`} id={`field-teamMember_${idx}_email`}>
                              <label className="form-label">
                                Email Address <span className="required-star">*</span>
                              </label>
                              <input
                                type="email"
                                className="form-input"
                                value={m.email || ''}
                                onChange={(e) => handleTeamMemberFieldChange(idx, 'email', e.target.value)}
                                required
                              />
                              {errors[`teamMember_${idx}_email`] && (
                                <span className="error-message">{errors[`teamMember_${idx}_email`]}</span>
                              )}
                            </div>

                            {/* Mobile Phone */}
                            <div className={`form-group ${errors[`teamMember_${idx}_phone`] ? 'form-group-error' : ''}`} id={`field-teamMember_${idx}_phone`}>
                              <label className="form-label">
                                Mobile Number <span className="required-star">*</span>
                              </label>
                              <input
                                type="tel"
                                className="form-input"
                                maxLength={10}
                                value={m.phone || ''}
                                onChange={(e) => handleTeamMemberFieldChange(idx, 'phone', e.target.value.replace(/\D/g, ''))}
                                required
                              />
                              {errors[`teamMember_${idx}_phone`] && (
                                <span className="error-message">{errors[`teamMember_${idx}_phone`]}</span>
                              )}
                            </div>

                            {/* WhatsApp */}
                            <div className={`form-group ${errors[`teamMember_${idx}_whatsapp`] ? 'form-group-error' : ''}`} id={`field-teamMember_${idx}_whatsapp`}>
                              <div className="whatsapp-label-row">
                                <label className="form-label">WhatsApp Number</label>
                                <label className="same-as-phone-toggle">
                                  <input
                                    type="checkbox"
                                    checked={m.sameAsPhone !== false}
                                    onChange={(e) => handleTeamMemberSameAsPhoneToggle(idx, e.target.checked)}
                                  />
                                  <span>Same as Mobile</span>
                                </label>
                              </div>
                              <input
                                type="tel"
                                className="form-input"
                                maxLength={10}
                                value={m.whatsapp || ''}
                                onChange={(e) => handleTeamMemberFieldChange(idx, 'whatsapp', e.target.value.replace(/\D/g, ''))}
                                disabled={m.sameAsPhone !== false}
                              />
                              {errors[`teamMember_${idx}_whatsapp`] && (
                                <span className="error-message">{errors[`teamMember_${idx}_whatsapp`]}</span>
                              )}
                            </div>

                            {/* College */}
                            <div className={`form-group ${errors[`teamMember_${idx}_college`] ? 'form-group-error' : ''}`} id={`field-teamMember_${idx}_college`}>
                              <label className="form-label">
                                College / Institution <span className="required-star">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                value={m.college || ''}
                                onChange={(e) => handleTeamMemberFieldChange(idx, 'college', e.target.value)}
                                required
                              />
                              {errors[`teamMember_${idx}_college`] && (
                                <span className="error-message">{errors[`teamMember_${idx}_college`]}</span>
                              )}
                            </div>

                            {/* Department */}
                            <div className={`form-group ${errors[`teamMember_${idx}_department`] ? 'form-group-error' : ''}`} id={`field-teamMember_${idx}_department`}>
                              <label className="form-label">
                                Department / Branch <span className="required-star">*</span>
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                value={m.department || ''}
                                onChange={(e) => handleTeamMemberFieldChange(idx, 'department', e.target.value)}
                                required
                              />
                              {errors[`teamMember_${idx}_department`] && (
                                <span className="error-message">{errors[`teamMember_${idx}_department`]}</span>
                              )}
                            </div>

                            {/* Year of Study */}
                            <div className={`form-group form-group-full ${errors[`teamMember_${idx}_year`] ? 'form-group-error' : ''}`} id={`field-teamMember_${idx}_year`}>
                              <label className="form-label">
                                Year of Study <span className="required-star">*</span>
                              </label>
                              <select
                                className="form-select"
                                value={m.year || ''}
                                onChange={(e) => handleTeamMemberFieldChange(idx, 'year', e.target.value)}
                                required
                              >
                                <option value="">-- Select Year of Study --</option>
                                {YEARS.map((y) => (
                                  <option key={y} value={y}>
                                    {y}
                                  </option>
                                ))}
                              </select>
                              {errors[`teamMember_${idx}_year`] && (
                                <span className="error-message">{errors[`teamMember_${idx}_year`]}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Member Button if limit not reached */}
                    {!isFixedTeam && fields.teamMembers.length + 1 < (selectedEvent.maxMembers || selectedEvent.max_members || 3) && (
                      <button type="button" className="add-member-btn" onClick={addTeamMember}>
                        + ADD TEAM MEMBER (+₹{selectedEvent.feePerHead || selectedEvent.fee_per_head || 50}) • UP TO {selectedEvent.maxMembers || selectedEvent.max_members || 3} PARTICIPANTS
                      </button>
                    )}
                  </div>

                  <div className="panel-actions-row">
                    <button type="button" className="btn btn-secondary" onClick={() => setStep('participant')}>
                      <FaArrowLeft style={{ marginRight: '0.4rem' }} /> EDIT PARTICIPANT
                    </button>
                    <button type="submit" className="btn btn-primary">
                      PROCEED TO REVIEW <FaArrowRight style={{ marginLeft: '0.4rem' }} />
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column: Live Terminal Summary Card */}
            <aside className="reg-summary-col">
              <div className="reg-sticky-summary">
                <div className="summary-card-header">
                  <span className="summary-title-tag">TERMINAL SUMMARY</span>
                  <h4 className="summary-card-heading">FEE BREAKDOWN</h4>
                </div>

                <div className="summary-event-snippet">
                  <span className="snippet-cat">{selectedEvent.category.toUpperCase()}</span>
                  <div className="snippet-name">{selectedEvent.name}</div>
                  <div className="snippet-structure">{selectedEvent.teamSize}</div>
                </div>

                <div className="summary-lines">
                  <div className="summary-line">
                    <span className="line-label">Base Fee:</span>
                    <span className="line-val">{selectedEvent.fee}</span>
                  </div>
                  <div className="summary-line">
                    <span className="line-label">Registered Count:</span>
                    <span className="line-val">{feeInfo.count} {feeInfo.count === 1 ? 'Participant' : 'Participants'}</span>
                  </div>
                  <div className="summary-line">
                    <span className="line-label">Calculation:</span>
                    <span className="line-val line-calc">{feeInfo.formula}</span>
                  </div>
                  <div className="summary-line line-total">
                    <span className="line-label">TOTAL PAYABLE:</span>
                    <span className="line-val total-glow">
                      {feeInfo.total === 0 ? 'FREE' : `₹${feeInfo.total}`}
                    </span>
                  </div>
                </div>

                <div className="summary-desk-note">
                  <div className="desk-note-icon"><FaLock /></div>
                  <p>
                    <strong>Secure UPI Checkout:</strong> Instant online verification via UPI (Google Pay, PhonePe, Paytm, QR) powered by Razorpay with official E-Pass ticket generation.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* STEP 03 / 02: REVIEW & CONFIRM */}
        {step === 'review' && selectedEvent && (
          <div className="reg-review-view">
            <div className="review-panel-card">
              <div className="panel-title-bar">
                <div className="panel-title-left">
                  <span className="panel-step-tag">STEP {(selectedEvent.isTeam || selectedEvent.is_team) ? '03' : '02'}</span>
                  <h3 className="panel-title">REVIEW REGISTRATION</h3>
                </div>
                <span className="review-check-pill">
                  <FaShieldAlt style={{ marginRight: '0.35rem' }} /> READY FOR CONFIRMATION
                </span>
              </div>

              {serverError && (
                <div className="server-error-banner">
                  <FaExclamationTriangle style={{ marginRight: '0.5rem', flexShrink: 0 }} />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Review Sections Grid */}
              <div className="review-grid-sections">
                {/* 1. Participant Details */}
                <div className="review-section-box">
                  <div className="review-sec-header">
                    <h4>PARTICIPANT INFORMATION</h4>
                    <button type="button" className="btn-edit-sec" onClick={() => setStep('participant')}>
                      <FaEdit /> Edit
                    </button>
                  </div>
                  <div className="review-data-list">
                    <div className="review-row">
                      <span className="r-label">Full Name:</span>
                      <span className="r-val">{fields.fullName}</span>
                    </div>
                    <div className="review-row">
                      <span className="r-label">Email:</span>
                      <span className="r-val">{fields.email}</span>
                    </div>
                    <div className="review-row">
                      <span className="r-label">Mobile Number:</span>
                      <span className="r-val">{fields.phone}</span>
                    </div>
                    {fields.whatsapp && (
                      <div className="review-row">
                        <span className="r-label">WhatsApp:</span>
                        <span className="r-val">{fields.whatsapp}</span>
                      </div>
                    )}
                    <div className="review-row">
                      <span className="r-label">College:</span>
                      <span className="r-val">{fields.college}</span>
                    </div>
                    <div className="review-row">
                      <span className="r-label">Department:</span>
                      <span className="r-val">{fields.department}</span>
                    </div>
                    <div className="review-row">
                      <span className="r-label">Year of Study:</span>
                      <span className="r-val">{fields.year}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Competition Details */}
                <div className="review-section-box">
                  <div className="review-sec-header">
                    <h4>SELECTED SHOWDOWN</h4>
                    <button type="button" className="btn-edit-sec" onClick={handleChangeEvent}>
                      <FaExchangeAlt /> Change
                    </button>
                  </div>
                  <div className="review-data-list">
                    <div className="review-row">
                      <span className="r-label">Competition:</span>
                      <span className="r-val font-accent">
                        {selectedEvent.name}
                        {isEsports && ` (${selectedGame})`}
                      </span>
                    </div>
                    {isEsports && (
                      <div className="review-row">
                        <span className="r-label">Game Arena:</span>
                        <span className="r-val font-accent"><FaFire style={{ marginRight: '0.35rem' }} /> {selectedGame}</span>
                      </div>
                    )}
                    <div className="review-row">
                      <span className="r-label">Category:</span>
                      <span className="r-val">{selectedEvent.category.toUpperCase()}</span>
                    </div>
                    <div className="review-row">
                      <span className="r-label">Structure:</span>
                      <span className="r-val">{selectedEvent.teamSize}</span>
                    </div>
                    <div className="review-row">
                      <span className="r-label">Reporting Venue:</span>
                      <span className="r-val">{selectedEvent.venue || 'CSE Department Labs'}</span>
                    </div>
                    <div className="review-row">
                      <span className="r-label">Scheduled Time:</span>
                      <span className="r-val">{selectedEvent.timing || '10:00 AM – 1:00 PM'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Team Details (If Applicable) */}
                {(selectedEvent.isTeam || selectedEvent.is_team) && (
                  <div className="review-section-box review-full-col">
                    <div className="review-sec-header">
                      <h4>SQUAD CONFIGURATION</h4>
                      <button type="button" className="btn-edit-sec" onClick={() => setStep('team')}>
                        <FaEdit /> Edit Squad
                      </button>
                    </div>
                    <div className="review-data-list">
                      <div className="review-row">
                        <span className="r-label">Team Name:</span>
                        <span className="r-val font-bold">{fields.teamName || 'N/A'}</span>
                      </div>
                      <div className="review-row">
                        <span className="r-label">Leader (Member 1):</span>
                        <span className="r-val">
                          <strong>{fields.fullName}</strong>
                          <span style={{ display: 'block', fontSize: '0.78rem', color: '#9cb1a2' }}>
                            {[fields.department, fields.year, fields.phone].filter(Boolean).join(' • ')}
                          </span>
                        </span>
                      </div>
                      {fields.teamMembers.length > 0 ? (
                        fields.teamMembers.map((m, idx) => {
                          const mName = typeof m === 'string' ? m : (m.fullName || `Member ${idx + 2}`);
                          const mInfo = typeof m === 'object' ? [m.department, m.year, m.phone].filter(Boolean).join(' • ') : '';
                          return (
                            <div key={idx} className="review-row">
                              <span className="r-label">Member {idx + 2}:</span>
                              <span className="r-val">
                                <strong>{mName}</strong>
                                {mInfo && <span style={{ display: 'block', fontSize: '0.78rem', color: '#9cb1a2' }}>{mInfo}</span>}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="review-row">
                          <span className="r-label">Additional Members:</span>
                          <span className="r-val">Solo Participation</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Financial Summary */}
                <div className="review-section-box review-full-col review-finances-box">
                  <div className="review-sec-header">
                    <h4>REGISTRATION FEE & PAYMENT SUMMARY</h4>
                  </div>
                  <div className="review-finance-grid">
                    <div className="fin-item">
                      <span className="fin-label">BASE EVENT FEE</span>
                      <span className="fin-val">{selectedEvent.fee}</span>
                    </div>
                    <div className="fin-item">
                      <span className="fin-label">REGISTERED PARTICIPANTS</span>
                      <span className="fin-val">{feeInfo.count}</span>
                    </div>
                    <div className="fin-item">
                      <span className="fin-label">CALCULATION</span>
                      <span className="fin-val">{feeInfo.formula}</span>
                    </div>
                    <div className="fin-item fin-item-total">
                      <span className="fin-label">TOTAL PAYABLE AMOUNT</span>
                      <span className="fin-val fin-highlight">
                        {feeInfo.total === 0 ? 'FREE' : `₹${feeInfo.total}`}
                      </span>
                    </div>
                  </div>

                  {feeInfo.total > 0 ? (
                    <div className="upi-qr-payment-card">
                      <div className="upi-qr-header">
                        <div className="upi-qr-badge-left">
                          <FaQrcode style={{ color: '#00f5ff', fontSize: '1.05rem' }} />
                          <span>DIRECT UPI QR CODE PAYMENT</span>
                        </div>
                        <div className="upi-qr-badge-right">
                          <FaShieldAlt style={{ marginRight: '4px' }} />
                          <span>100% Verified UPI</span>
                        </div>
                      </div>

                      {/* Mode Switcher */}
                      <div className="upi-mode-switch-wrap">
                        <button
                          type="button"
                          className={`upi-mode-btn ${qrViewMode === 'dynamic' ? 'active' : ''}`}
                          onClick={() => setQrViewMode('dynamic')}
                        >
                          <FaBolt style={{ marginRight: '5px' }} />
                          Auto-Fill Amount QR (₹{feeInfo.total})
                        </button>
                        <button
                          type="button"
                          className={`upi-mode-btn ${qrViewMode === 'original' ? 'active' : ''}`}
                          onClick={() => setQrViewMode('original')}
                        >
                          <FaQrcode style={{ marginRight: '5px' }} />
                          FamPay Card Photo
                        </button>
                      </div>

                      <div className="upi-qr-body">
                        {/* The QR Image */}
                        <div className="upi-qr-img-wrap">
                          {qrViewMode === 'dynamic' ? (
                            <div className="fampay-card-mockup">
                              <div className="fampay-card-header">
                                <span className="fampay-card-name">Samnesh S</span>
                                <div className="fampay-card-vpa-pill">6374229503@yesfam</div>
                              </div>
                              <div className="fampay-qr-frame">
                                <QRCodeSVG
                                  value={`upi://pay?pa=6374229503@yesfam&pn=Samnesh%20S&am=${Number(feeInfo.total) || 0}&cu=INR&tn=Eloquence26`}
                                  size={215}
                                  bgColor="#ffffff"
                                  fgColor="#000000"
                                  level="H"
                                  marginSize={2}
                                  imageSettings={{
                                    src: '/fampay_center.png',
                                    height: 38,
                                    width: 38,
                                    excavate: true
                                  }}
                                />
                              </div>
                              <div className="fampay-card-footer">
                                <div className="fampay-amount-pill">
                                  AMOUNT: <strong>₹{feeInfo.total}</strong>
                                </div>
                                <div className="fampay-hint-text" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <FaBolt style={{ color: '#39FF88' }} /> Scan with GPay / PhonePe / Paytm to auto-fill ₹{feeInfo.total}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="upi-original-card-wrap">
                              <img
                                src={paymentQrImg}
                                alt="Samnesh S - 6374229503@yesfam UPI QR Code"
                                className="upi-qr-image"
                              />
                              <div className="upi-qr-amount-pill">
                                AMOUNT TO PAY: <strong>₹{feeInfo.total}</strong>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Payment Info & UTR Entry */}
                        <div className="upi-qr-info-col">
                          <div className="upi-info-item">
                            <span className="upi-info-label">BENEFICIARY / PAYEE NAME</span>
                            <span className="upi-info-val">Samnesh S</span>
                          </div>

                          <div className="upi-info-item upi-id-row">
                            <div>
                              <span className="upi-info-label">UPI ID / VPA</span>
                              <span className="upi-info-val code-font">6374229503@yesfam</span>
                            </div>
                            <button
                              type="button"
                              className="btn-copy-upi"
                              onClick={handleCopyUpiId}
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? (
                                <><FaCheck style={{ color: '#39ff88' }} /> Copied!</>
                              ) : (
                                <><FaCopy /> Copy UPI ID</>
                              )}
                            </button>
                          </div>

                          {/* Mobile Quick Link to open in GPay / PhonePe / Paytm */}
                          <a
                            href={`upi://pay?pa=6374229503@yesfam&pn=Samnesh%20S&am=${Number(feeInfo.total) || 0}&cu=INR&tn=Eloquence26`}
                            className="btn-mobile-upi-pay"
                          >
                            <FaBolt style={{ marginRight: '6px' }} />
                            Pay ₹{feeInfo.total} in UPI App (GPay / PhonePe)
                          </a>

                          {/* UTR Input */}
                          <div className="upi-utr-input-group">
                            <label htmlFor="upi-utr-input" className="upi-utr-label">
                              ENTER 12-DIGIT UPI TRANSACTION REF / UTR NUMBER <span style={{ color: '#ff4d4d' }}>*</span>
                            </label>
                            <input
                              id="upi-utr-input"
                              type="text"
                              className="form-control upi-utr-field"
                              placeholder="e.g. 423819283741 (from UPI receipt)"
                              value={upiUtr}
                              maxLength={22}
                              onChange={(e) => setUpiUtr(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                            />
                            <p className="upi-utr-help">
                              Scan QR above with any UPI app (Google Pay, PhonePe, Paytm, BHIM) — the <strong>₹{feeInfo.total}</strong> amount will appear automatically. Complete payment and enter your 12-digit UTR/Ref number to complete registration.
                            </p>
                          </div>

                          {/* Payment Screenshot Upload */}
                          <PaymentScreenshotUpload
                            file={screenshotFile}
                            onFileSelect={(selectedFile) => {
                              setScreenshotFile(selectedFile);
                              setScreenshotError(null);
                            }}
                            disabled={isSubmitting}
                            error={screenshotError}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="fin-desk-reminder">
                      * Free event entry. Registration will be confirmed immediately.
                    </p>
                  )}
                </div>
              </div>

              {/* Confirmation Actions */}
              <div className="panel-actions-row review-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setStep(selectedEvent.isTeam ? 'team' : 'participant')}
                  disabled={isSubmitting}
                >
                  <FaArrowLeft style={{ marginRight: '0.4rem' }} /> EDIT DETAILS
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-confirm-submit"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  style={feeInfo.total > 0 ? { background: 'linear-gradient(135deg, #00f5ff 0%, #0284c7 100%)', boxShadow: '0 0 22px rgba(0, 245, 255, 0.45)', color: '#000', fontWeight: '800' } : {}}
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="spinner-rotate" style={{ marginRight: '0.5rem' }} />
                      CONFIRMING REGISTRATION...
                    </>
                  ) : feeInfo.total === 0 ? (
                    <>CONFIRM REGISTRATION (FREE) →</>
                  ) : (
                    <>
                      <FaCheckCircle style={{ marginRight: '0.45rem', fontSize: '1.05rem' }} />
                      I HAVE PAID ₹{feeInfo.total} — CONFIRM REGISTRATION →
                    </>
                  )}
                </button>
              </div>
              {/* Razorpay standard gateway fallback removed for now - will be re-added later */}
            </div>
          </div>
        )}

        {/* STEP 05: SUCCESS SCREEN */}
        {step === 'success' && ticketData && (
          <div className="reg-success-view">
            {/* Pop-up Modal to prompt user to take screenshot or download */}
            {showSaveModal && typeof document !== 'undefined' && createPortal(
              <div className="save-pass-modal-overlay" onClick={() => setShowSaveModal(false)}>
                <div className="save-pass-modal" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="save-modal-close"
                    onClick={() => setShowSaveModal(false)}
                    aria-label="Close modal"
                  >
                    <FaTimes />
                  </button>

                  <div className="save-modal-icon-badge">
                    <FaCamera />
                  </div>

                  <span className="save-modal-tag">// CRITICAL CHECK-IN REQUIREMENT //</span>
                  <h3 className="save-modal-title">SAVE YOUR REGISTRATION PASS!</h3>
                  <p className="save-modal-desc">
                    Please <strong>take a screenshot</strong> or <strong>download</strong> your registration card right now. You must present this card and its official <strong>QR Code</strong> at the venue check-in desk for entry and event participation.
                  </p>

                  <div className="save-modal-tips">
                    <div className="save-tip-item">
                      <span className="save-tip-bullet"><FaCamera style={{ fontSize: '0.9rem' }} /></span>
                      <span><strong>On Mobile:</strong> Press <em>Power + Volume Down</em> to save an instant screenshot to your gallery.</span>
                    </div>
                    <div className="save-tip-item">
                      <span className="save-tip-bullet"><FaDownload style={{ fontSize: '0.9rem' }} /></span>
                      <span><strong>Download / PDF:</strong> Tap the download button below to save a high-res PDF or print copy.</span>
                    </div>
                  </div>

                  <div className="save-modal-actions">
                    <button
                      type="button"
                      className="btn-save-download"
                      onClick={() => {
                        setShowSaveModal(false);
                        setTimeout(() => window.print(), 200);
                      }}
                    >
                      <FaDownload style={{ marginRight: '0.5rem' }} /> DOWNLOAD / SAVE PASS (PDF)
                    </button>
                    <button
                      type="button"
                      className="btn-save-dismiss"
                      onClick={() => setShowSaveModal(false)}
                    >
                      <FaCheck style={{ marginRight: '0.45rem' }} /> I'VE SAVED IT — VIEW MY PASS
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {(() => {
              const eventSticker = getEventSticker(ticketData.eventId || ticketData.event_id || selectedEvent?.id || ticketData.eventName || selectedEvent);
              return eventSticker ? (
                <div className="success-character-badge" title={`${eventSticker.character} — ${ticketData.eventName}`}>
                  <img
                    src={eventSticker.src}
                    alt={eventSticker.alt || eventSticker.character}
                    className="success-character-img"
                    style={{
                      '--sticker-scale': eventSticker.scale || 1,
                      '--sticker-origin': eventSticker.cropPosition === 'top' ? 'top center' : 'center center'
                    }}
                  />
                </div>
              ) : (
                <div className="success-badge-icon">
                  <FaCheck />
                </div>
              );
            })()}

            <span className="success-pre-title">// AVENGERS INITIATIVE //</span>
            <h2 className="success-card-title">REGISTRATION SUCCESSFUL</h2>
            <p className="success-avenger-quote">
              Congratulations, you are an Avenger now!
            </p>
            <p className="success-card-sub">
              Your official symposium credential for <strong>{ticketData.eventName}</strong> is confirmed. Keep this pass ready for check-in.
            </p>

            {/* Official Cyber Credential Pass (Horizontal Landscape Pass with Live QR) */}
            <div className="ticket-pass ticket-pass-horizontal" id="official-symposium-pass">
              {/* Card Lanyard Hole Accent */}
              <div className="ticket-card-lanyard-notch" />

              <div className="ticket-pass-main-horizontal">
                {/* Left Stub: Event Branding, QR Code & Registration ID */}
                <div className="ticket-stub-left">
                  <div className="ticket-stub-brand">
                    <span className="ticket-fest-tag">ELOQUENCE'26 OFFICIAL PASS</span>
                    <h3 className="ticket-event-name">{ticketData.eventName}</h3>
                    <span className={`ticket-cat-badge ${ticketData.eventCategory === 'technical' ? 'badge-tech' : 'badge-nontech'}`}>
                      {ticketData.eventCategory === 'technical' ? <FaBolt style={{ marginRight: '0.3rem' }} /> : <FaGamepad style={{ marginRight: '0.3rem' }} />}
                      {ticketData.eventCategory.toUpperCase()} SHOWDOWN
                    </span>
                  </div>

                  {/* QR Code Frame */}
                  <div className="ticket-qr-frame">
                    <span className="qr-corner qr-tl" />
                    <span className="qr-corner qr-tr" />
                    <span className="qr-corner qr-bl" />
                    <span className="qr-corner qr-br" />

                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(ticketData.registrationId)}&color=000000&bgcolor=ffffff`}
                      alt={`QR Code for ${ticketData.registrationId}`}
                      className="ticket-qr-image"
                      loading="eager"
                    />
                    <div className="ticket-qr-caption">
                      <FaQrcode style={{ marginRight: '0.25rem', fontSize: '0.65rem' }} />
                      <span>SCAN FOR CHECK-IN</span>
                    </div>
                  </div>

                  {/* Registration ID & Copy Button */}
                  <div className="ticket-id-container">
                    <span className="ticket-code-label">OFFICIAL REGISTRATION ID</span>
                    <div className="ticket-code-value">{ticketData.registrationId}</div>
                    <button type="button" className="btn-copy-code" onClick={handleCopyId}>
                      {copied ? (
                        <>
                          <FaCheck style={{ marginRight: '0.35rem' }} /> COPIED TO CLIPBOARD
                        </>
                      ) : (
                        <>
                          <FaClipboard style={{ marginRight: '0.35rem' }} /> COPY REGISTRATION ID
                        </>
                      )}
                    </button>
                  </div>

                  <p className="ticket-scan-hint">
                    <FaBolt style={{ marginRight: '0.3rem', verticalAlign: '-1px' }} /> Present this QR at the venue entrance. Admin & coordinators will scan this for participation check-in.
                  </p>
                </div>

                {/* Perforated Stub Divider */}
                <div className="ticket-stub-divider" aria-hidden="true">
                  <div className="stub-notch stub-notch-top" />
                  <div className="stub-line" />
                  <div className="stub-notch stub-notch-bottom" />
                </div>

                {/* Right Body: Verified Badge & Participant Details */}
                <div className="ticket-body-right">
                  <div className="ticket-right-header">
                    <div className="ticket-right-meta">
                      <span className="ticket-delegate-badge">OFFICIAL PARTICIPANT CREDENTIAL</span>
                      <span className="ticket-host-text">CAHCET MELVISHARAM // SEPTEMBER 26, 2026</span>
                    </div>
                    <div className="ticket-card-shield">
                      <FaShieldAlt className="ticket-shield-icon" />
                      <span className="ticket-shield-text">VERIFIED</span>
                    </div>
                  </div>

                  {/* Card Details Grid */}
                  <div className="ticket-pass-grid">
                    <div className="ticket-info-item">
                      <span className="ticket-label">LEAD PARTICIPANT</span>
                      <span className="ticket-val">{ticketData.fullName}</span>
                    </div>

                    <div className="ticket-info-item">
                      <span className="ticket-label">COLLEGE / INSTITUTION</span>
                      <span className="ticket-val">{ticketData.college}</span>
                    </div>

                    <div className="ticket-info-item">
                      <span className="ticket-label">DEPARTMENT & YEAR</span>
                      <span className="ticket-val">{ticketData.department} ({ticketData.year})</span>
                    </div>

                    <div className="ticket-info-item">
                      <span className="ticket-label">CONTACT PHONE & EMAIL</span>
                      <span className="ticket-val">{ticketData.phone} • {ticketData.email}</span>
                    </div>

                    {ticketData.isTeam && ticketData.teamName && (
                      <div className="ticket-info-item">
                        <span className="ticket-label">SQUAD / TEAM NAME</span>
                        <span className="ticket-val">{ticketData.teamName} ({ticketData.participantCount || (1 + (ticketData.teamMembersList?.length || 0))} Total)</span>
                      </div>
                    )}

                    {ticketData.isTeam && ticketData.teamMembersList && ticketData.teamMembersList.length > 0 && (
                      <div className="ticket-info-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="ticket-label">SQUAD MEMBERS</span>
                        <span className="ticket-val">
                          1. {ticketData.fullName} (Leader)<br />
                          {ticketData.teamMembersList.map((tm, i) => (
                            <span key={i} style={{ display: 'inline-block', marginRight: '0.75rem' }}>
                              {i + 2}. {typeof tm === 'string' ? tm : (tm.fullName || tm.name)}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}

                    {(ticketData.game || isEsports) && (
                      <div className="ticket-info-item">
                        <span className="ticket-label">GAME ARENA</span>
                        <span className="ticket-val game-highlight"><FaFire style={{ marginRight: '0.35rem' }} /> {ticketData.game || selectedGame} SQUAD</span>
                      </div>
                    )}

                    <div className="ticket-info-item">
                      <span className="ticket-label">PAYMENT STATUS</span>
                      <span className="ticket-val status-confirmed" style={{ color: '#10b981' }}>
                        <FaCheckCircle style={{ marginRight: '0.35rem', verticalAlign: '-1px' }} />
                        {ticketData.paymentStatus === 'PAID'
                          ? 'PAID ONLINE (VERIFIED)'
                          : ticketData.paymentStatus === 'FREE'
                          ? 'FREE ENTRY'
                          : (ticketData.paymentStatus || 'CONFIRMED')}
                      </span>
                    </div>

                    <div className="ticket-info-item">
                      <span className="ticket-label">PAYMENT MODE</span>
                      <span className="ticket-val" style={{ color: '#00f5ff', fontWeight: '700' }}>
                        {ticketData.paymentMethod === 'RAZORPAY_UPI'
                          ? 'UPI (Razorpay)'
                          : ticketData.paymentMethod === 'UPI_QR'
                          ? 'UPI QR Scan'
                          : ticketData.paymentMethod === 'RAZORPAY'
                          ? 'Cards / Netbanking (Razorpay)'
                          : ticketData.paymentMethod === 'FREE_EVENT'
                          ? 'Free Entry'
                          : (ticketData.paymentMethod || 'ONLINE')}
                      </span>
                    </div>

                    {(ticketData.razorpayPaymentId || ticketData.transactionId || ticketData.upiUtr) && (
                      <div className="ticket-info-item">
                        <span className="ticket-label">
                          {ticketData.razorpayPaymentId ? 'RAZORPAY PAYMENT ID' : 'UPI TRANSACTION REF / UTR'}
                        </span>
                        <span className="ticket-val" style={{ color: '#00f5ff', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {ticketData.razorpayPaymentId || ticketData.transactionId || ticketData.upiUtr}
                        </span>
                      </div>
                    )}

                    <div className="ticket-info-item">
                      <span className="ticket-label">REGISTRATION FEE</span>
                      <span className="ticket-val fee-highlight">
                        {ticketData.totalAmount === 0 ? 'FREE' : `₹${ticketData.totalAmount}`}
                        {ticketData.paymentStatus === 'PAID' && ' (PAID)'}
                      </span>
                    </div>
                  </div>

                  {/* Right Section Footer */}
                  <div className="ticket-pass-footer">
                    <span>
                      <FaCalendarAlt style={{ marginRight: '0.35rem', verticalAlign: '-1px' }} />
                      September 26, 2026
                    </span>
                    <span>
                      <FaMapMarkerAlt style={{ marginRight: '0.35rem', verticalAlign: '-1px' }} />
                      CAHCET Campus, Melvisharam
                    </span>
                    <span>
                      <FaClock style={{ marginRight: '0.35rem', verticalAlign: '-1px' }} />
                      Logged: {ticketData.createdAtFormatted || '2026-09-26'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Security Strip */}
              <div className="ticket-card-bottom-bar">
                <span className="ticket-card-serial">AUTH-SEC // CAHCET-ELOQUENCE-2026 // {ticketData.registrationId}</span>
                <span className="ticket-card-badge-pill">OFFICIAL PARTICIPANT CREDENTIAL</span>
              </div>
            </div>

            {/* Success Actions */}
            <div className="success-actions">
              <button
                type="button"
                className="btn btn-primary btn-save-pass-main"
                onClick={() => window.print()}
              >
                <FaDownload style={{ marginRight: '0.45rem' }} /> DOWNLOAD / PRINT PASS
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-screenshot-tip"
                onClick={() => {
                  toast('Tip: Press Power + Volume Down on mobile (or Win+Shift+S on PC) to screenshot your card!', {
                    duration: 5000,
                  });
                }}
              >
                <FaCamera style={{ marginRight: '0.45rem' }} /> SCREENSHOT PASS
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForNewRegistration}>
                <FaUserPlus style={{ marginRight: '0.4rem' }} /> REGISTER ANOTHER EVENT
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => onNavigate && onNavigate('events')}>
                EXPLORE ALL EVENTS →
              </button>
            </div>
          </div>
        )}

        {/* Change Event Selection Modal */}
        {showEventModal && (
          <div className="change-event-modal-overlay" onClick={() => setShowEventModal(false)}>
            <div className="change-event-modal" onClick={(e) => e.stopPropagation()}>
              <div className="change-event-modal-header">
                <div>
                  <h3 className="change-event-modal-title">CHOOSE SYMPOSIUM EVENT</h3>
                  <p className="change-event-modal-sub">
                    Switch events freely — all your filled participant and squad details are preserved.
                  </p>
                </div>
                <button
                  type="button"
                  className="change-event-close-btn"
                  onClick={() => setShowEventModal(false)}
                  aria-label="Close modal"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="change-event-filters">
                <button
                  type="button"
                  className={`change-event-filter-btn ${modalCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setModalCategory('all')}
                >
                  ALL EVENTS ({eventsList.length})
                </button>
                <button
                  type="button"
                  className={`change-event-filter-btn ${modalCategory === 'technical' ? 'active' : ''}`}
                  onClick={() => setModalCategory('technical')}
                >
                  TECHNICAL ({eventsList.filter((e) => e.category === 'technical').length})
                </button>
                <button
                  type="button"
                  className={`change-event-filter-btn ${modalCategory === 'non-technical' ? 'active' : ''}`}
                  onClick={() => setModalCategory('non-technical')}
                >
                  NON-TECHNICAL ({eventsList.filter((e) => e.category === 'non-technical').length})
                </button>
              </div>

              <div className="change-event-list">
                {eventsList
                  .filter((e) => modalCategory === 'all' || e.category === modalCategory)
                  .map((ev) => {
                    const isSelected = selectedEvent?.id === ev.id;
                    return (
                      <div
                        key={ev.id}
                        className={`change-event-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectNewEvent(ev)}
                      >
                        <div className="change-event-item-top">
                          <span
                            className={`hud-badge ${
                              ev.category === 'technical' ? 'hud-badge-tech' : 'hud-badge-nontech'
                            }`}
                            style={{ fontSize: '0.62rem', padding: '0.15rem 0.5rem' }}
                          >
                            {ev.category === 'technical' ? <FaBolt /> : <FaGamepad />}
                            {ev.category.toUpperCase()}
                          </span>
                          <span className="change-event-item-fee">{ev.fee}</span>
                        </div>
                        <h4 className="change-event-item-name">{ev.name}</h4>
                        <div className="change-event-item-meta">
                          <span>{ev.teamSize || 'Individual'}</span>
                          {isSelected ? (
                            <span style={{ color: '#39ff88', fontWeight: '800', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <FaCheck /> CURRENT
                            </span>
                          ) : (
                            <span style={{ color: 'var(--silver)', fontSize: '0.72rem' }}>SELECT →</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
