import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  FaChartBar, 
  FaUsers, 
  FaSignOutAlt, 
  FaPlus, 
  FaUserShield, 
  FaEdit, 
  FaTrash, 
  FaChevronDown, 
  FaChevronRight, 
  FaUserCheck,
  FaShieldAlt,
  FaHandshake,
  FaUserTie,
  FaGlobe,
  FaPhone,
  FaEnvelope,
  FaUpload,
  FaToggleOn,
  FaToggleOff,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaRupeeSign,
  FaFilter,
  FaCheck,
  FaTimes,
  FaImage,
  FaClock,
  FaMapMarkerAlt,
  FaBolt,
  FaGamepad,
  FaPalette,
  FaCircle,
  FaSun,
  FaMoon,
  FaFilePdf,
  FaPaperPlane,
  FaThLarge,
  FaTable,
  FaBars,
  FaIdCard,
  FaClipboardList,
  FaPrint,
  FaSearch,
  FaCashRegister,
  FaDownload,
  FaArrowRight,
  FaSyncAlt,
  FaCheckCircle,
  FaInfoCircle,
  FaUserPlus,
  FaListOl,
  FaQrcode,
  FaRocket,
  FaCode,
  FaTerminal,
  FaStar,
  FaLayerGroup,
  FaCopy,
  FaLock,
  FaUnlock,
  FaExclamationTriangle,
  FaSpinner,
  FaBuilding,
  FaCamera,
  FaCrown,
  FaWhatsapp,
  FaPhoneAlt,
  FaBell,
  FaFire,
  FaCrosshairs,
  FaMagic
} from 'react-icons/fa';
import defaultEvents from '../data/events.js';
import rulesData from '../data/rules.js';
import { getEventBanner, defaultEventImages } from '../data/eventImages.js';
import { getApiUrl } from '../config/api';
import ParticipantVerifier from '../components/ParticipantVerifier.jsx';
import RegistrationVerification from '../components/RegistrationVerification.jsx';
import PaymentScreenshotViewerModal from '../components/PaymentScreenshotViewerModal.jsx';
import EditRegistrationModal from '../components/EditRegistrationModal.jsx';
import EventRegistrationCharts from '../components/EventRegistrationCharts.jsx';
import {
  fetchAdminHomepageCoordinators,
  createHomepageCoordinatorTeam,
  updateHomepageCoordinatorTeam,
  toggleHomepageCoordinatorTeam,
  deleteHomepageCoordinatorTeam,
  updateRegistrationStatus,
  fetchEventAllocations,
  updateEventAllocation,
  fetchEventsData
} from '../services/api.js';

const EXISTING_POSTER_PRESETS = [
  { id: 'tech-01', label: 'Slide Craft (PPT)', img: defaultEventImages['tech-01'] },
  { id: 'tech-02', label: 'Crack the Code (Coding)', img: defaultEventImages['tech-02'] },
  { id: 'tech-03', label: 'Tech Battle (Quiz)', img: defaultEventImages['tech-03'] },
  { id: 'tech-04', label: 'Web / Prompt Design', img: defaultEventImages['tech-04'] },
  { id: 'tech-05', label: 'Chart Canvas (Poster)', img: defaultEventImages['tech-05'] },
  { id: 'tech-06', label: 'UI / UX Design', img: defaultEventImages['tech-06'] },
  { id: 'nontech-01', label: 'Snap & Reel (Media)', img: defaultEventImages['nontech-01'] },
  { id: 'nontech-02', label: 'Link Up (Connections)', img: defaultEventImages['nontech-02'] },
  { id: 'nontech-03', label: 'Hunt Zone (Treasure)', img: defaultEventImages['nontech-03'] },
  { id: 'nontech-04', label: 'Henna Heist (Mehandi)', img: defaultEventImages['nontech-04'] },
  { id: 'nontech-05', label: 'Battle of Champions (Gaming)', img: defaultEventImages['nontech-05'] },
  { id: 'nontech-06', label: '64 Squares (Chess)', img: defaultEventImages['nontech-06'] },
];

export const COORDINATOR_THEMES = [
  {
    id: 'emerald',
    name: 'Emerald Green',
    roleHint: 'Default for Coordinators',
    primaryColor: '#39ff88',
    secondaryColor: '#00a83b',
    bgColor: '#040a06',
    borderGlow: 'rgba(57, 255, 136, 0.4)',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    badgeText: '#10b981',
    description: 'Electric emerald green - standard sympo leadership theme'
  },
  {
    id: 'cyan',
    name: 'Sky Blue',
    roleHint: 'Default for Website & Tech Team',
    primaryColor: '#00f0ff',
    secondaryColor: '#0077b6',
    bgColor: '#020e18',
    borderGlow: 'rgba(0, 240, 255, 0.4)',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    badgeText: '#38bdf8',
    description: 'Electric sky blue cyber glow - perfect for web & technical crew'
  },
  {
    id: 'gold',
    name: 'Royal Gold',
    roleHint: 'Core Leadership / Executive',
    primaryColor: '#ffd700',
    secondaryColor: '#b99358',
    bgColor: '#0a0804',
    borderGlow: 'rgba(245, 228, 184, 0.4)',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    badgeText: '#fbbf24',
    description: 'Luxurious prestige amber gold - presidential & core committee'
  },
  {
    id: 'purple',
    name: 'Neon Purple',
    roleHint: 'Creative & Media Crew',
    primaryColor: '#d946ef',
    secondaryColor: '#7928ca',
    bgColor: '#0d0216',
    borderGlow: 'rgba(217, 70, 239, 0.4)',
    badgeBg: 'rgba(217, 70, 239, 0.15)',
    badgeBorder: 'rgba(217, 70, 239, 0.35)',
    badgeText: '#f472b6',
    description: 'Cyberpunk neon violet - ideal for design, media & visual arts'
  },
  {
    id: 'crimson',
    name: 'Cyber Crimson',
    roleHint: 'Operations & Disciplinary',
    primaryColor: '#ff3b5c',
    secondaryColor: '#be123c',
    bgColor: '#140306',
    borderGlow: 'rgba(255, 59, 92, 0.4)',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeBorder: 'rgba(244, 63, 94, 0.35)',
    badgeText: '#fb7185',
    description: 'High-intensity neon crimson - discipline, logistics & security'
  },
  {
    id: 'orange',
    name: 'Radiant Orange',
    roleHint: 'Publicity & Outreach',
    primaryColor: '#ff9100',
    secondaryColor: '#c2410c',
    bgColor: '#140802',
    borderGlow: 'rgba(255, 145, 0, 0.4)',
    badgeBg: 'rgba(251, 146, 60, 0.15)',
    badgeBorder: 'rgba(251, 146, 60, 0.35)',
    badgeText: '#fb923c',
    description: 'Dynamic fiery orange - sponsorship, publicity & marketing'
  }
];

export const suggestCoordinatorTheme = (roleText = '', tagText = '') => {
  const combined = `${roleText || ''} ${tagText || ''}`.toLowerCase();
  if (/(web|website|tech|code|developer|software|site|cyber|portal|app|dev)/i.test(combined)) {
    return {
      tier: 'cyan',
      reason: 'Recommended for Website & Tech Crew',
      name: 'Sky Blue'
    };
  }
  if (/(design|media|creative|art|photo|video|promo|poster|reel)/i.test(combined)) {
    return {
      tier: 'purple',
      reason: 'Recommended for Design & Media Team',
      name: 'Neon Purple'
    };
  }
  if (/(exec|president|chair|patron|honor|secretar)/i.test(combined)) {
    return {
      tier: 'gold',
      reason: 'Recommended for Executive Leadership',
      name: 'Royal Gold'
    };
  }
  if (/(operation|logistics|discipline|stage|venue|security|crowd)/i.test(combined)) {
    return {
      tier: 'crimson',
      reason: 'Recommended for Operations & Logistics',
      name: 'Cyber Crimson'
    };
  }
  if (/(sponsor|pr|publicity|marketing|outreach|finance)/i.test(combined)) {
    return {
      tier: 'orange',
      reason: 'Recommended for Publicity & Sponsorship',
      name: 'Radiant Orange'
    };
  }
  // Default for coordinator / leadership
  return {
    tier: 'emerald',
    reason: 'Default for Student Coordinators & Leadership',
    name: 'Emerald Green'
  };
};

export default function AdminDashboard({ token, user, onLogout }) {
  const loggedRole = String(user?.role || 'admin').toLowerCase();
  const isVerificationRole = loggedRole === 'verification' || loggedRole.includes('verify') || loggedRole.includes('verification');
  const isAdminOrSuper = !isVerificationRole && (loggedRole === 'admin' || loggedRole === 'superadmin');
  const isRegCoordinator = !isVerificationRole && (loggedRole.includes('registration') || loggedRole.includes('reg_coord') || loggedRole === 'registration coordinator');
  const isLeadCoordinator = !isVerificationRole && (loggedRole.includes('lead') || loggedRole === 'lead coordinator' || loggedRole === 'lead_coordinator');

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_active_tab');
      if (saved) {
        if (isVerificationRole) {
          if (saved === 'dashboard' || saved === 'registration-verification') return saved;
          return 'dashboard';
        }
        if (!isAdminOrSuper && (saved === 'manage-users' || saved === 'manage-roles' || saved === 'close-rg')) {
          return isRegCoordinator ? 'registration' : 'dashboard';
        }
        return saved;
      }
    } catch (e) {}
    if (isVerificationRole) return 'dashboard';
    if (isRegCoordinator) return 'registration';
    return 'dashboard';
  });

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('admin_theme') || 'light');
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('admin_theme', next);
  };

  // Redirect if verification or non-admin user accesses restricted tabs
  useEffect(() => {
    if (isVerificationRole && activeTab !== 'dashboard' && activeTab !== 'registration-verification') {
      setActiveTab('dashboard');
    } else if (!isAdminOrSuper && !isVerificationRole && (activeTab === 'manage-users' || activeTab === 'manage-roles' || activeTab === 'close-rg')) {
      setActiveTab(isRegCoordinator ? 'registration' : 'dashboard');
    }
  }, [activeTab, isAdminOrSuper, isRegCoordinator, isVerificationRole]);

  // ==================== EVENTS STATE ====================
  const [eventsList, setEventsList] = useState(defaultEvents);
  const [eventFilter, setEventFilter] = useState('all');
  const [eventSearch, setEventSearch] = useState('');
  const [isEventEditModalOpen, setIsEventEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Event Edit Form Fields
  const [eventName, setEventName] = useState('');
  const [eventAlias, setEventAlias] = useState('');
  const [eventSubtitle, setEventSubtitle] = useState('');
  const [eventCategory, setEventCategory] = useState('technical');
  const [eventVenue, setEventVenue] = useState('');
  const [eventTiming, setEventTiming] = useState('');
  const [eventFee, setEventFee] = useState('');
  const [eventTeamSize, setEventTeamSize] = useState('');
  const [eventTag, setEventTag] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventImage, setEventImage] = useState('');
  const [eventImagePreview, setEventImagePreview] = useState('');
  const [isUploadingEventImage, setIsUploadingEventImage] = useState(false);

  // Venue Image State
  const [eventVenueImage, setEventVenueImage] = useState('');
  const [eventVenueImagePreview, setEventVenueImagePreview] = useState('');
  const [isUploadingVenueImage, setIsUploadingVenueImage] = useState(false);
  const venueFileInputRef = useRef(null);

  // Event Rules State
  const [eventRules, setEventRules] = useState([]);
  const [rulesInputMode, setRulesInputMode] = useState('list'); // 'list' | 'bulk'
  const [bulkRulesText, setBulkRulesText] = useState('');

  // Event Rounds State
  const [eventRounds, setEventRounds] = useState([]);
  const [roundsInputMode, setRoundsInputMode] = useState('list'); // 'list' | 'bulk'
  const [bulkRoundsText, setBulkRoundsText] = useState('');

  const eventFileInputRef = useRef(null);

  // ==================== REGISTRATIONS STATE ====================
  const [registrationsList, setRegistrationsList] = useState([]);
  const [regModeFilter, setRegModeFilter] = useState('all'); // 'all' | 'online' | 'offline'
  const [regCategoryFilter, setRegCategoryFilter] = useState('all'); // 'all' | 'technical' | 'non-technical'
  const [regEventFilter, setRegEventFilter] = useState('all');
  const [regSearchQuery, setRegSearchQuery] = useState('');
  const [selectedRegDetails, setSelectedRegDetails] = useState(null);
  const [isRegDetailsModalOpen, setIsRegDetailsModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState(null);
  const [isEditRegModalOpen, setIsEditRegModalOpen] = useState(false);
  const [isOnSiteRegisterModalOpen, setIsOnSiteRegisterModalOpen] = useState(false);
  const [isDeletingRegId, setIsDeletingRegId] = useState(null);
  const [viewerScreenshotReg, setViewerScreenshotReg] = useState(null);

  // UTR & Verification metrics for badge & notification queue
  const utrRegistrationsList = registrationsList.filter(r => {
    const utr = r.upiUtr || r.upi_utr || r.transactionId || r.transaction_id || r.razorpayPaymentId || r.razorpay_payment_id;
    const isOnline = (r.paymentMethod || r.payment_method || '').toUpperCase().includes('UPI') ||
      (r.paymentMethod || r.payment_method || '').toUpperCase().includes('ONLINE');
    return Boolean(utr) || isOnline;
  });

  const unverifiedRegistrations = registrationsList.filter(r => {
    const isVerified = r.is_verified === true || r.isVerified === true ||
      r.verification_status === 'verified' || r.verificationStatus === 'verified' ||
      r.attendance_status === 'verified';
    return !isVerified;
  });

  const pendingUtrCount = unverifiedRegistrations.length;

  const [isQuickVerifyingId, setIsQuickVerifyingId] = useState(null);

  const executeDirectVerifyRegistration = (regId, regTicket) => {
    setIsQuickVerifyingId(regId);
    const toastId = toast.loading(`Verifying participant #${regTicket || regId}...`);

    fetch(getApiUrl(`/api/admin/registrations/${regId}/verify`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'verified',
        isVerified: true,
        action: 'verify'
      })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          toast.success(`Participant #${regTicket || regId} verified successfully!`, { id: toastId });
          setRegistrationsList(prev => prev.map(item => {
            const matchId = item.id === regId || item.ticket_code === regTicket || item.registrationId === regId;
            if (matchId) {
              return {
                ...item,
                is_verified: true,
                isVerified: true,
                verification_status: 'verified',
                verificationStatus: 'verified'
              };
            }
            return item;
          }));
          fetchRegistrations();
          fetchDashboardData();
        } else {
          toast.error(resData.message || 'Failed to verify registration', { id: toastId });
        }
      })
      .catch(err => {
        console.error('Error verifying registration:', err);
        toast.error('Network error verifying registration', { id: toastId });
      })
      .finally(() => {
        setIsQuickVerifyingId(null);
      });
  };

  // Helper to extract Payment Screenshot Path from record or venue_snapshot
  const getRegScreenshot = (r) => {
    if (!r) return null;
    if (r.payment_screenshot_path) return r.payment_screenshot_path;
    if (r.paymentScreenshotPath) return r.paymentScreenshotPath;
    if (r.screenshotPath) return r.screenshotPath;
    if (r.screenshot_path) return r.screenshot_path;
    if (r.venue_snapshot) {
      try {
        const snap = typeof r.venue_snapshot === 'string' ? JSON.parse(r.venue_snapshot) : r.venue_snapshot;
        if (snap) {
          return snap.payment_screenshot_path || snap.paymentScreenshotPath || snap.screenshotPath || null;
        }
      } catch (e) {}
    }
    return null;
  };

  const handleQuickVerifyRegistration = (reg) => {
    const regId = typeof reg === 'string' ? reg : (reg.id || reg.ticket_code || reg.registrationId);
    if (!regId) return;

    const regObj = typeof reg === 'object' && reg !== null ? reg : registrationsList.find(r => r.id === regId || r.ticket_code === regId);
    const fee = Number(regObj?.totalAmount || regObj?.totalFee || regObj?.total_fee || 0);
    const hasScreenshot = Boolean(getRegScreenshot(regObj));

    if (fee > 0) {
      if (hasScreenshot) {
        // Open screenshot viewer modal so admin inspects payment proof before verifying
        setViewerScreenshotReg(regObj);
        return;
      } else {
        toast.error('Cannot verify: Payment screenshot has not been uploaded for this paid registration. Participant must provide payment proof.', {
          icon: <FaExclamationTriangle style={{ color: '#ef4444' }} />,
          duration: 5000
        });
        return;
      }
    }

    // Free event without fee: verify directly
    executeDirectVerifyRegistration(regId, regObj?.ticket_code || regId);
  };

  // Registration Analytics & Event Helpers
  const isOnlineRecord = (r) => (r.payment_method || r.paymentMethod) !== 'ON_SITE_DESK';

  const getEventName = (r) => {
    if (!r) return 'General Registration';
    const all = (Array.isArray(eventsList) && eventsList.length > 0) ? eventsList : defaultEvents;
    const evId = String(r.event_id || r.eventId || '').trim().toLowerCase();
    const directName = r.eventName || r.event_name;
    const evt = all.find(e => {
      const eId = String(e.id || '').toLowerCase();
      const eNum = String(e.number || '').toLowerCase();
      const eName = String(e.name || '').toLowerCase();
      const eAlias = String(e.alias || '').toLowerCase();
      return (
        (evId && (eId === evId || eNum === evId || eName === evId || eAlias === evId)) ||
        (directName && directName !== '-' && (eName === directName.toLowerCase() || eAlias === directName.toLowerCase()))
      );
    });
    return evt ? evt.name : ((directName && directName !== '-') ? directName : (evId ? `Event (${evId})` : 'General Registration'));
  };

  const getDetailedTeamMembers = (r) => {
    if (!r) return [];
    const leadName = (r.fullName || r.full_name || r.leadName || '').trim().toLowerCase();

    let rawList = [];
    if (Array.isArray(r.teamMembers) && r.teamMembers.length > 0) {
      rawList = r.teamMembers;
    } else if (Array.isArray(r.team_members) && r.team_members.length > 0) {
      rawList = r.team_members;
    } else if (typeof r.team_members === 'string' && r.team_members.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(r.team_members);
        if (Array.isArray(parsed) && parsed.length > 0) rawList = parsed;
      } catch (e) {}
    } else if (Array.isArray(r.registration_members) && r.registration_members.length > 0) {
      rawList = r.registration_members;
    } else if (Array.isArray(r.teamMembersList) && r.teamMembersList.length > 0) {
      rawList = r.teamMembersList;
    } else if (r.venue_snapshot && typeof r.venue_snapshot === 'string' && r.venue_snapshot.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(r.venue_snapshot);
        if (Array.isArray(parsed.team_members) && parsed.team_members.length > 0) {
          rawList = parsed.team_members;
        }
      } catch (e) {}
    } else if (r.venueSnapshot && typeof r.venueSnapshot === 'object' && Array.isArray(r.venueSnapshot.team_members)) {
      rawList = r.venueSnapshot.team_members;
    }

    if (!Array.isArray(rawList) || rawList.length === 0) return [];

    // Filter out the team leader so the lead's name is NEVER recurring or duplicated as Member #2
    const secondaryList = rawList.filter((m) => {
      if (!m) return false;
      const memberName = (typeof m === 'string' ? m : (m.fullName || m.name || m.member_name || '')).trim().toLowerCase();
      if (!memberName) return false;
      if (typeof m === 'object') {
        if (m.role && String(m.role).toLowerCase().includes('lead')) return false;
        if (m.isLeader || m.is_leader) return false;
        if (Number(m.member_number || m.memberNumber) === 1) return false;
      }
      if (leadName && (memberName === leadName || memberName.includes(leadName) || leadName.includes(memberName))) {
        return false;
      }
      return true;
    });

    return secondaryList.map((m, idx) => {
      if (typeof m === 'string') {
        return {
          memberNumber: idx + 2,
          fullName: m.trim(),
          name: m.trim(),
          phone: '',
          whatsapp: '',
          email: '',
          college: r.college || '',
          department: r.department || '',
          year: r.year || ''
        };
      }
      const memberName = (m.fullName || m.name || m.member_name || `Member ${idx + 2}`).trim();
      return {
        memberNumber: idx + 2,
        fullName: memberName,
        name: memberName,
        phone: m.phone || m.whatsapp || '',
        whatsapp: m.whatsapp || m.phone || '',
        email: m.email || '',
        college: m.college || r.college || '',
        department: m.department || r.department || '',
        year: m.year || r.year || ''
      };
    });
  };

  const getTeamMembers = (r) => {
    return getDetailedTeamMembers(r).map(m => m.fullName || m.name);
  };

  const getEventCategory = (r) => {
    if (!r) return 'technical';
    const all = (Array.isArray(eventsList) && eventsList.length > 0) ? eventsList : defaultEvents;
    const evtId = String(r.event_id || r.eventId || '').trim().toLowerCase();
    const evt = all.find(e => String(e.id || '').toLowerCase() === evtId);
    if (evt && evt.category) return evt.category;
    if (r.category || r.eventCategory) return r.category || r.eventCategory;
    const ticket = String(r.ticket_code || r.ticketCode || '').toUpperCase();
    if (ticket.includes('TCH')) return 'technical';
    if (ticket.includes('NTC') || ticket.includes('NT-') || ticket.includes('-NT')) return 'non-technical';
    return evtId.startsWith('tech') ? 'technical' : 'non-technical';
  };

  const isVerifiedRecord = (r) => {
    return Boolean(
      r.is_verified === true ||
      r.isVerified === true ||
      r.verification_status === 'verified' ||
      r.verificationStatus === 'verified' ||
      r.attendance_status === 'verified'
    );
  };

  const getFee = (r) => Number(r.total_fee || r.totalAmount || r.total_amount || 0);

  const verifiedRegistrations = registrationsList.filter(isVerifiedRecord);
  const onlineRegs = registrationsList.filter(isOnlineRecord);
  const offlineRegs = registrationsList.filter(r => !isOnlineRecord(r));
  const verifiedOnlineRegs = onlineRegs.filter(isVerifiedRecord);
  const verifiedOfflineRegs = offlineRegs.filter(isVerifiedRecord);
  const techRegs = registrationsList.filter(r => getEventCategory(r) === 'technical');
  const nonTechRegs = registrationsList.filter(r => getEventCategory(r) === 'non-technical');

  // Revenue is calculated ONLY from verified / accepted payments
  const totalRevenue = verifiedRegistrations.reduce((sum, r) => sum + getFee(r), 0);
  const onlineRevenue = verifiedOnlineRegs.reduce((sum, r) => sum + getFee(r), 0);
  const offlineRevenue = verifiedOfflineRegs.reduce((sum, r) => sum + getFee(r), 0);
  const techRevenue = techRegs.filter(isVerifiedRecord).reduce((sum, r) => sum + getFee(r), 0);
  const nonTechRevenue = nonTechRegs.filter(isVerifiedRecord).reduce((sum, r) => sum + getFee(r), 0);

  // Filtered registrations for the dedicated Registrations tab
  const filteredRegistrations = registrationsList.filter(r => {
    if (regModeFilter === 'online' && !isOnlineRecord(r)) return false;
    if (regModeFilter === 'offline' && isOnlineRecord(r)) return false;
    if (regCategoryFilter !== 'all' && getEventCategory(r) !== regCategoryFilter) return false;
    if (regEventFilter !== 'all' && (r.event_id || r.eventId) !== regEventFilter) return false;

    const q = regSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = (r.full_name || r.fullName || '').toLowerCase();
    const ticket = (r.ticket_code || r.registrationId || r.id || '').toString().toLowerCase();
    const phone = (r.phone || '').toLowerCase();
    const email = (r.email || '').toLowerCase();
    const college = (r.college || '').toLowerCase();
    const dept = (r.department || '').toLowerCase();
    const evtName = getEventName(r).toLowerCase();
    const teamName = (r.team_name || r.teamName || '').toLowerCase();
    const members = getTeamMembers(r).join(' ').toLowerCase();

    return (
      name.includes(q) ||
      ticket.includes(q) ||
      phone.includes(q) ||
      email.includes(q) ||
      college.includes(q) ||
      dept.includes(q) ||
      evtName.includes(q) ||
      teamName.includes(q) ||
      members.includes(q)
    );
  });

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) {
      return toast.error('No registrations found to export');
    }

    const headers = [
      'Ticket Code / ID',
      'Mode',
      'Participant Name',
      'Email',
      'Phone',
      'WhatsApp',
      'College',
      'Department',
      'Year',
      'Event ID',
      'Event Name',
      'Category',
      'Team Name',
      'Team Members',
      'Total Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Registration Date'
    ];

    const rows = filteredRegistrations.map(r => {
      const isOnline = isOnlineRecord(r);
      const members = getTeamMembers(r).join('; ');
      const dateStr = r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : (r.createdAtFormatted || 'N/A');
      return [
        `"${(r.ticket_code || r.registrationId || r.id || '').toString().replace(/"/g, '""')}"`,
        isOnline ? 'Online' : 'Offline Desk',
        `"${(r.full_name || r.fullName || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${(r.whatsapp || '').replace(/"/g, '""')}"`,
        `"${(r.college || '').replace(/"/g, '""')}"`,
        `"${(r.department || '').replace(/"/g, '""')}"`,
        `"${(r.year || '').replace(/"/g, '""')}"`,
        `"${(r.event_id || r.eventId || '').replace(/"/g, '""')}"`,
        `"${getEventName(r).replace(/"/g, '""')}"`,
        getEventCategory(r),
        `"${(r.team_name || r.teamName || '').replace(/"/g, '""')}"`,
        `"${members.replace(/"/g, '""')}"`,
        getFee(r),
        r.payment_method || r.paymentMethod || (isOnline ? 'ONLINE' : 'ON_SITE_DESK'),
        r.payment_status || r.paymentStatus || 'CONFIRMED',
        `"${dateStr}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `eloquence2026_registrations_${regModeFilter}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredRegistrations.length} registrations to CSV`);
  };

  // PDF Export Handler for Filtered Registrations
  const handleExportRegistrationsPDF = () => {
    if (filteredRegistrations.length === 0) {
      return toast.error('No registrations found to export');
    }

    const win = window.open('', '_blank');
    if (!win) return toast.error('Please allow popups to export PDF');

    const activeEventObj = eventsList.find(e => (e.id || e._id) === regEventFilter);
    const eventFilterLabel = regEventFilter === 'all' 
      ? `All Symposium Events (${eventsList.length})` 
      : (activeEventObj ? `[${(activeEventObj.category || '').toUpperCase()}] ${activeEventObj.name}` : regEventFilter);
    
    const modeLabel = regModeFilter === 'online' 
      ? 'Online Portal Only' 
      : regModeFilter === 'offline' 
        ? 'Offline Desk Only' 
        : 'All Modes (Online & Offline)';

    const categoryLabel = regCategoryFilter === 'technical'
      ? 'Technical Events Only'
      : regCategoryFilter === 'non-technical'
        ? 'Non-Technical Events Only'
        : 'All Categories';

    const totalFeeSum = filteredRegistrations.reduce((sum, r) => sum + getFee(r), 0);
    const verifiedCount = filteredRegistrations.filter(isVerifiedRecord).length;
    const generatedDateStr = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const rowsHtml = filteredRegistrations.map((reg, idx) => {
      const isOnline = isOnlineRecord(reg);
      const isVerified = isVerifiedRecord(reg);
      const ticketId = reg.ticket_code || reg.registrationId || reg.id || '-';
      const pName = reg.full_name || reg.fullName || 'Anonymous';
      const evtName = getEventName(reg);
      const category = getEventCategory(reg);
      const isTech = category === 'technical';
      const feeAmt = getFee(reg);
      const members = getTeamMembers(reg);
      const isTeam = Boolean(members.length > 0 || reg.team_name || reg.teamName);
      const teamName = reg.team_name || reg.teamName || '';

      const rawTimestamp = reg.created_at || reg.createdAt;
      let dateStr = '';
      if (rawTimestamp) {
        try {
          const d = new Date(rawTimestamp);
          if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + '<br/><span style="color:#64748b;font-size:9px;">' +
                      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + '</span>';
          }
        } catch (e) {}
      }
      if (!dateStr && (reg.timestamp || reg.createdAtFormatted)) {
        dateStr = reg.timestamp || reg.createdAtFormatted;
      }
      if (!dateStr) dateStr = 'N/A';

      const paymentMethod = reg.payment_method || reg.paymentMethod || (isOnline ? 'Online' : 'Cash');
      const utrNo = reg.utr_number || reg.utrNumber || reg.utr || '';

      return `
        <tr>
          <td style="text-align: center; font-weight: 700; color: #475569;">${idx + 1}</td>
          <td>
            <div style="font-weight: 800; color: #1e3a8a; font-family: monospace; font-size: 11px;">#${ticketId}</div>
            ${utrNo ? `<div style="font-size: 9px; color: #0284c7; font-weight: 600;">UTR: ${utrNo}</div>` : ''}
          </td>
          <td>
            <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${pName}</div>
            <div style="font-size: 10px; color: #475569;">${reg.college || 'CAHCET'}</div>
            ${reg.department ? `<div style="font-size: 9px; color: #64748b;">${reg.department} ${reg.year ? `(${reg.year})` : ''}</div>` : ''}
          </td>
          <td>
            <div style="font-size: 10.5px; color: #0f172a; font-weight: 600;">${reg.phone || '-'}</div>
            <div style="font-size: 9.5px; color: #475569;">${reg.email || '-'}</div>
            ${reg.whatsapp && reg.whatsapp !== reg.phone ? `<div style="font-size: 9px; color: #059669; font-weight: 600;">WA: ${reg.whatsapp}</div>` : ''}
          </td>
          <td>
            <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${evtName}</div>
            <span class="badge ${isTech ? 'badge-tech' : 'badge-nontech'}">${category ? category.toUpperCase() : 'EVENT'}</span>
          </td>
          <td>
            <div><span class="badge ${isOnline ? 'badge-online' : 'badge-offline'}">${isOnline ? 'ONLINE' : 'OFFLINE DESK'}</span></div>
            ${isTeam ? `
              <div style="margin-top: 3px; font-size: 9.5px; color: #334155;">
                <span class="badge-team">Team: ${teamName || 'Yes'}</span>
                ${members.length > 0 ? `<div style="color: #64748b; font-size: 9px; margin-top: 2px;">+${members.length} members: ${members.join(', ')}</div>` : ''}
              </div>
            ` : '<div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">Individual</div>'}
          </td>
          <td>
            <div style="font-weight: 800; color: #0f172a; font-size: 11px;">₹${feeAmt}</div>
            <div style="font-size: 9px; color: #64748b;">${paymentMethod}</div>
            <span class="badge ${isVerified ? 'badge-verified' : 'badge-pending'}">${isVerified ? 'VERIFIED' : 'CONFIRMED'}</span>
          </td>
          <td style="font-size: 10px; color: #334155; white-space: nowrap;">
            ${dateStr}
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Eloquence 2026 - Participant Registrations Report</title>
        <style>
          @page {
            size: landscape;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            padding: 16px;
            font-size: 11px;
            line-height: 1.35;
          }
          .no-print-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            color: #ffffff;
            padding: 10px 18px;
            border-radius: 8px;
            margin-bottom: 16px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.15);
          }
          .no-print-bar h3 {
            font-size: 13.5px;
            font-weight: 700;
          }
          .action-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 7px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .action-btn:hover {
            background: #1d4ed8;
          }
          .action-btn.btn-close {
            background: #475569;
            margin-left: 8px;
          }
          .action-btn.btn-close:hover {
            background: #334155;
          }
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              padding: 0;
            }
          }
          .doc-header {
            border-bottom: 2.5px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .title-area h1 {
            font-size: 19px;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: -0.3px;
          }
          .title-area h2 {
            font-size: 11.5px;
            color: #475569;
            font-weight: 600;
            margin-top: 1px;
          }
          .title-area p {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
          }
          .meta-box {
            text-align: right;
            font-size: 10px;
            color: #475569;
            line-height: 1.5;
          }
          .meta-box strong {
            color: #0f172a;
          }
          .kpi-strip {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin-bottom: 12px;
          }
          .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 7px 10px;
            border-radius: 6px;
          }
          .kpi-label {
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .kpi-val {
            font-size: 13.5px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            padding: 7px 8px;
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            border: 1px solid #334155;
          }
          td {
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          .badge {
            display: inline-block;
            font-size: 8px;
            font-weight: 700;
            padding: 1.5px 5px;
            border-radius: 4px;
            text-transform: uppercase;
          }
          .badge-tech { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
          .badge-nontech { background: #fce7f3; color: #9d174d; border: 1px solid #fbcfe8; }
          .badge-online { background: #eff6ff; color: #1d4ed8; }
          .badge-offline { background: #ecfdf5; color: #047857; }
          .badge-verified { background: #dcfce7; color: #15803d; }
          .badge-pending { background: #fef9c3; color: #a16207; }
          .badge-team { background: #f1f5f9; color: #334155; font-size: 8.5px; padding: 1px 4px; border-radius: 3px; font-weight: 600; display: inline-block; }
          .doc-footer {
            margin-top: 18px;
            padding-top: 8px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9.5px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="no-print no-print-bar">
          <div>
            <h3>Participant Registrations Master Sheet &bull; ${filteredRegistrations.length} Records</h3>
            <span style="font-size: 11px; opacity: 0.85;">Ready to print or save as PDF. Click below or press Ctrl+P.</span>
          </div>
          <div>
            <button class="action-btn" onclick="window.print()">
              <span>&#128438; Print / Save as PDF</span>
            </button>
            <button class="action-btn btn-close" onclick="window.close()">Close</button>
          </div>
        </div>

        <div class="doc-header">
          <div class="title-area">
            <h1>ELOQUENCE 2026 &mdash; PARTICIPANT REGISTRATION AUDIT SHEET</h1>
            <h2>DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING &bull; C. ABDUL HAKEEM COLLEGE OF ENGG &amp; TECH</h2>
            <p>National Level Technical Symposium &bull; Melvisharam, Ranipet &bull; Official Registry Record</p>
          </div>
          <div class="meta-box">
            <div>Generated: <strong>${generatedDateStr}</strong></div>
            <div>Mode: <strong>${modeLabel}</strong></div>
            <div>Category: <strong>${categoryLabel}</strong></div>
            <div>Event: <strong>${eventFilterLabel}</strong></div>
          </div>
        </div>

        <div class="kpi-strip">
          <div class="kpi-card">
            <div class="kpi-label">Filtered Records</div>
            <div class="kpi-val">${filteredRegistrations.length} / ${registrationsList.length}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Verified / Admitted</div>
            <div class="kpi-val" style="color: #15803d;">${verifiedCount}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Total Fee Collection</div>
            <div class="kpi-val" style="color: #1e40af;">&#8377;${totalFeeSum}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Event Scope</div>
            <div class="kpi-val" style="font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${eventFilterLabel}">${eventFilterLabel}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Portal Scope</div>
            <div class="kpi-val" style="font-size: 11px;">${regModeFilter.toUpperCase()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 24px; text-align: center;">#</th>
              <th style="width: 105px;">Ticket / ID</th>
              <th>Participant &amp; College</th>
              <th style="width: 135px;">Contact Info</th>
              <th style="width: 135px;">Event &amp; Category</th>
              <th style="width: 115px;">Mode &amp; Team</th>
              <th style="width: 95px;">Fee &amp; Status</th>
              <th style="width: 100px;">Date &amp; Time</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="doc-footer">
          <div>Eloquence 2026 Admin Portal &bull; Generated dynamically for Administrative Audit &bull; Page 1</div>
          <div>Authorized Signature: ____________________________________</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    win.document.write(htmlContent);
    win.document.close();
    toast.success(`Generated PDF sheet for ${filteredRegistrations.length} registrations`);
  };

  // Print Registration Ticket / Receipt
  const handlePrintTicket = (reg) => {
    if (!reg) return;
    const isOnline = isOnlineRecord(reg);
    const members = getTeamMembers(reg);
    const win = window.open('', '_blank');
    if (!win) return toast.error('Please allow popups to print ticket');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Eloquence 2026 - Ticket #${reg.ticket_code || reg.registrationId || reg.id}</title>
        <style>
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          body { padding: 40px; background: #f8fafc; color: #0f172a; margin: 0; }
          .ticket-card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 2px solid #2563eb; box-shadow: 0 10px 25px rgba(0,0,0,0.08); overflow: hidden; }
          .header { background: #2563eb; color: #ffffff; padding: 24px 30px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 4px 0 0 0; opacity: 0.9; font-size: 13px; }
          .badge-mode { padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 12px; text-transform: uppercase; background: ${isOnline ? '#eff6ff' : '#ecfdf5'}; color: ${isOnline ? '#1d4ed8' : '#047857'}; }
          .body { padding: 30px; display: flex; flex-direction: column; gap: 20px; }
          .ticket-code { background: #f1f5f9; padding: 12px 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
          .code-val { font-size: 18px; font-weight: 800; color: #2563eb; letter-spacing: 0.5px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .info-box { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .val { font-size: 14px; font-weight: 600; color: #0f172a; }
          .footer { padding: 16px 30px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
          @media print {
            body { padding: 0; background: #ffffff; }
            .ticket-card { box-shadow: none; border-color: #000; }
          }
        </style>
      </head>
      <body>
        <div class="ticket-card">
          <div class="header">
            <div>
              <h1>ELOQUENCE 2026</h1>
              <p>National Level Technical Symposium • C. Abdul Hakeem College of Engg & Tech</p>
            </div>
            <span class="badge-mode">${isOnline ? 'Online Registration' : 'Offline Desk Entry'}</span>
          </div>
          <div class="body">
            <div class="ticket-code">
              <div>
                <div class="label">Ticket Reference / Code</div>
                <div class="code-val">#${reg.ticket_code || reg.registrationId || reg.id}</div>
                <div style="margin-top: 4px;">
                  <span class="label">Status: </span>
                  <span style="color: #10b981; font-weight: 700; font-size: 13px;">${reg.is_verified || reg.isVerified ? 'VERIFIED & ADMITTED' : 'CONFIRMED'}</span>
                </div>
              </div>
              <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(reg.ticket_code || reg.registrationId || reg.id)}" 
                  alt="QR Code" 
                  style="width: 75px; height: 75px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; padding: 3px;"
                />
                <span style="font-size: 10px; color: #64748b; font-weight: 600;">Scan at Entry</span>
              </div>
            </div>

            <div class="grid-2">
              <div class="info-box">
                <div class="label">Participant Name</div>
                <div class="val">${reg.full_name || reg.fullName}</div>
              </div>
              <div class="info-box">
                <div class="label">Contact Phone</div>
                <div class="val">${reg.phone || 'N/A'}</div>
              </div>
              <div class="info-box">
                <div class="label">College Name</div>
                <div class="val">${reg.college || 'N/A'}</div>
              </div>
              <div class="info-box">
                <div class="label">Department & Year</div>
                <div class="val">${reg.department || ''} • ${reg.year || ''}</div>
              </div>
              <div class="info-box">
                <div class="label">Event Enrolled</div>
                <div class="val" style="color: #2563eb;">${getEventName(reg)}</div>
              </div>
              <div class="info-box">
                <div class="label">Category</div>
                <div class="val" style="text-transform: capitalize;">${getEventCategory(reg)} Event</div>
              </div>
              <div class="info-box">
                <div class="label">Total Fee Paid</div>
                <div class="val" style="color: #10b981; font-size: 16px;">₹${getFee(reg)}</div>
              </div>
              <div class="info-box">
                <div class="label">Payment Mode</div>
                <div class="val">${isOnline ? 'Online Web Portal' : 'On-Site Registration Desk'}</div>
              </div>
            </div>

            ${members.length > 0 ? `
              <div class="info-box" style="margin-top: 4px;">
                <div class="label">Team Details: ${reg.team_name || reg.teamName || 'Team'} (${members.length + 1} Members)</div>
                <div class="val" style="font-size: 13px; line-height: 1.6;">
                  1. ${reg.full_name || reg.fullName} (Lead)<br/>
                  ${members.map((m, idx) => `${idx + 2}. ${m}`).join('<br/>')}
                </div>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            Present this ticket at the registration desk on event day. Validated by Eloquence Admin Desk.
          </div>
        </div>
        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
  };

  // Delete Registration Handler
  const handleDeleteRegistration = (reg) => {
    const id = reg.id || reg.registrationId || reg.ticket_code;
    const name = reg.full_name || reg.fullName || 'this participant';
    if (!window.confirm(`Are you sure you want to permanently delete the registration for "${name}" (#${id})?`)) {
      return;
    }

    setIsDeletingRegId(id);
    const toastId = toast.loading('Deleting registration...');

    fetch(getApiUrl(`/api/admin/registrations/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast.success('Registration deleted successfully', { id: toastId });
          setRegistrationsList(prev => prev.filter(r => (r.id !== id && r.registrationId !== id && r.ticket_code !== id)));
          if (selectedRegDetails && (selectedRegDetails.id === id || selectedRegDetails.registrationId === id || selectedRegDetails.ticket_code === id)) {
            setIsRegDetailsModalOpen(false);
            setSelectedRegDetails(null);
          }
          fetchDashboardData();
        } else {
          toast.error(data.message || 'Failed to delete registration', { id: toastId });
        }
      })
      .catch(err => {
        console.error('Delete registration error:', err);
        toast.error('Network error deleting registration', { id: toastId });
      })
      .finally(() => {
        setIsDeletingRegId(null);
      });
  };

  // ==================== PARTICIPANT LIST STATE & HELPERS ====================
  const [partEventFilter, setPartEventFilter] = useState('all');
  const [partCategoryFilter, setPartCategoryFilter] = useState('all');
  const [partSearch, setPartSearch] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Send Modal States & Esports Track Handlers
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendTargetEvent, setSendTargetEvent] = useState(null);
  const [selectedCoordName, setSelectedCoordName] = useState('');
  const [isSendingList, setIsSendingList] = useState(false);
  const [sendGameScope, setSendGameScope] = useState('ALL'); // 'ALL' | 'FREE FIRE' | 'BGMI'
  const [bocGameFilter, setBocGameFilter] = useState('all'); // 'all' | 'FREE FIRE' | 'BGMI'

  // Esports identification & normalization helpers
  const isEsportsEvent = (evt) => {
    if (!evt) return false;
    const id = String(evt.id || evt.eventId || '').toLowerCase();
    const name = String(evt.name || evt.eventName || '').toLowerCase();
    return id === 'nontech-05' || name.includes('battle of champion') || name.includes('battle of the champion');
  };

  const getRegEsportsGame = (r) => {
    if (!r) return 'FREE FIRE';
    if (r.game && typeof r.game === 'string' && r.game.trim()) return r.game.trim().toUpperCase();
    if (r.venue_snapshot?.game && typeof r.venue_snapshot.game === 'string' && r.venue_snapshot.game.trim()) {
      return r.venue_snapshot.game.trim().toUpperCase();
    }
    const tn = String(r.team_name || r.teamName || '').toUpperCase();
    const notes = String(r.notes || '').toUpperCase();
    if (tn.includes('BGMI') || notes.includes('BGMI')) return 'BGMI';
    if (tn.includes('FREE FIRE') || tn.includes('FREEFIRE') || notes.includes('FREE FIRE')) return 'FREE FIRE';
    return 'FREE FIRE';
  };

  const formatTournamentRosterText = (evt, gameScope = 'ALL') => {
    if (!evt) return '';
    const isEsports = isEsportsEvent(evt);
    let regs = registrationsList.filter(r => (r.event_id || r.eventId) === evt.id);
    if (isEsports && gameScope && gameScope !== 'ALL' && gameScope !== 'all') {
      regs = regs.filter(r => getRegEsportsGame(r) === gameScope.toUpperCase());
    }

    const titleScope = isEsports && gameScope && gameScope !== 'ALL' && gameScope !== 'all' ? ` [${gameScope.toUpperCase()} DIVISION]` : '';
    let text = `🏆 *ELOQUENCE 2026 — OFFICIAL TOURNAMENT ROSTER*\n`;
    text += `🎯 *EVENT:* ${evt.name}${titleScope}\n`;
    text += `📍 *VENUE:* ${evt.venue || 'CSE Dept Lab'}\n`;
    text += `👥 *TOTAL SQUADS / ENTRIES:* ${regs.length}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (regs.length === 0) {
      text += `No registrations recorded yet.\n`;
      return text;
    }

    regs.forEach((r, idx) => {
      const gameBadge = isEsports ? ` [${getRegEsportsGame(r)}]` : '';
      const teamName = r.team_name || r.teamName ? ` "${r.team_name || r.teamName}"` : '';
      const lead = r.full_name || r.fullName || 'Lead Player';
      const phone = r.phone || '-';
      const ticket = r.ticket_code || r.registrationId || r.id || '-';
      const college = r.college || 'CAHCET';
      const members = getTeamMembers(r);

      text += `*#${idx + 1}${teamName}${gameBadge}*\n`;
      text += `🎫 Ticket: ${ticket}\n`;
      text += `👑 Captain: ${lead} (📞 ${phone})\n`;
      text += `🏫 College: ${college}\n`;
      if (members.length > 0) {
        text += `👥 Squad (${members.length + 1} players):\n`;
        text += `   1. ${lead} (Captain)\n`;
        members.forEach((m, mIdx) => {
          text += `   ${mIdx + 2}. ${m}\n`;
        });
      }
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `⚡ Eloquence 2026 Tournament Management`;
    return text;
  };

  const handleCopyRosterToClipboard = (evt, gameScope = 'ALL') => {
    const text = formatTournamentRosterText(evt, gameScope);
    if (!text) return toast.error('No roster data to copy');
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`Tournament roster for ${evt.name} copied to clipboard!`))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };

  const handleShareRosterWhatsApp = (evt, gameScope = 'ALL', targetPhone = '') => {
    const text = formatTournamentRosterText(evt, gameScope);
    if (!text) return toast.error('No roster data to share');
    const encoded = encodeURIComponent(text);
    const cleanPhone = (targetPhone || '').replace(/\D/g, '');
    const url = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleShareSquadWhatsApp = (reg, evt) => {
    const phone = (reg?.phone || '').replace(/\D/g, '');
    const isEsports = isEsportsEvent(evt);
    const game = isEsports ? getRegEsportsGame(reg) : '';
    const teamName = reg?.team_name || reg?.teamName || 'Your Team';
    const members = getTeamMembers(reg);
    let msg = `Hello ${reg?.full_name || 'Participant'}! 👋\n`;
    msg += `This is an official update from *Eloquence 2026 - ${evt?.name || 'Symposium'}*.\n\n`;
    msg += `🎫 *Ticket:* ${reg?.ticket_code || reg?.registrationId || reg?.id}\n`;
    if (isEsports) msg += `🎮 *Game Track:* ${game}\n`;
    msg += `🛡️ *Team / Entry:* ${teamName}\n`;
    if (members.length > 0) {
      msg += `👥 *Squad Members:*\n1. ${reg?.full_name || 'Lead'} (Captain)\n${members.map((m, i) => `${i + 2}. ${m}`).join('\n')}\n`;
    }
    msg += `📍 *Venue:* ${evt?.venue || 'CSE Lab'}\n\n`;
    msg += `Please report to the registration desk on time. Best wishes! 🚀`;

    const url = phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const participantFilteredRegs = registrationsList.filter(r => {
    if (partEventFilter !== 'all') {
      if (partEventFilter === 'nontech-05::FREE FIRE') {
        if ((r.event_id || r.eventId) !== 'nontech-05') return false;
        if (getRegEsportsGame(r) !== 'FREE FIRE') return false;
      } else if (partEventFilter === 'nontech-05::BGMI') {
        if ((r.event_id || r.eventId) !== 'nontech-05') return false;
        if (getRegEsportsGame(r) !== 'BGMI') return false;
      } else if ((r.event_id || r.eventId) !== partEventFilter) {
        return false;
      }
    }
    if (partCategoryFilter !== 'all' && getEventCategory(r) !== partCategoryFilter) return false;

    const q = partSearch.toLowerCase().trim();
    if (!q) return true;
    const name = (r.full_name || r.fullName || '').toLowerCase();
    const teamName = (r.team_name || r.teamName || '').toLowerCase();
    const ticket = (r.ticket_code || r.registrationId || r.id || '').toString().toLowerCase();
    const phone = (r.phone || '').toLowerCase();
    const college = (r.college || '').toLowerCase();
    const members = getTeamMembers(r).join(' ').toLowerCase();
    const game = getRegEsportsGame(r).toLowerCase();

    return name.includes(q) || teamName.includes(q) || ticket.includes(q) || phone.includes(q) || college.includes(q) || members.includes(q) || game.includes(q);
  });

  const handleExportPDF = (targetEvt, filterGame = 'ALL') => {
    const isEsports = isEsportsEvent(targetEvt);
    let evtRegs = registrationsList.filter(r => (r.event_id || r.eventId) === targetEvt.id);
    if (isEsports && filterGame && filterGame !== 'ALL' && filterGame !== 'all') {
      evtRegs = evtRegs.filter(r => getRegEsportsGame(r) === filterGame.toUpperCase());
    }

    const win = window.open('', '_blank');
    if (!win) return toast.error('Please allow popups to export PDF');

    const subTitle = isEsports && filterGame && filterGame !== 'ALL' && filterGame !== 'all' ? ` — ${filterGame.toUpperCase()} DIVISION` : '';
    const ffCount = evtRegs.filter(r => getRegEsportsGame(r) === 'FREE FIRE').length;
    const bgmiCount = evtRegs.filter(r => getRegEsportsGame(r) === 'BGMI').length;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${targetEvt.name}${subTitle} - Official Participant Sheet</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #2563eb; padding-bottom: 12px; }
          .header h1 { margin: 0; color: #1e3a8a; font-size: 24px; text-transform: uppercase; letter-spacing: 0.5px; }
          .header p { margin: 6px 0 0 0; color: #64748b; font-size: 14px; font-weight: 600; }
          .info-bar { display: flex; justify-content: space-between; background: #f8fafc; padding: 10px 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; flex-wrap: wrap; gap: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 9px 12px; text-align: left; vertical-align: top; }
          th { background: #1e293b; color: #ffffff; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { display: inline-block; background: #059669; color: #ffffff; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge-ff { display: inline-block; background: #ea580c; color: #ffffff; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge-bgmi { display: inline-block; background: #0891b2; color: #ffffff; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .members-box { background: #f1f5f9; padding: 6px 8px; border-radius: 6px; font-size: 11px; margin-top: 3px; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ELOQUENCE 2026 — OFFICIAL PARTICIPANT SHEET</h1>
          <p>DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING</p>
        </div>

        <div class="info-bar">
          <div><strong>EVENT:</strong> ${targetEvt.name}${subTitle} (${targetEvt.category.toUpperCase()})</div>
          ${isEsports && (!filterGame || filterGame === 'ALL' || filterGame === 'all') ? `<div><strong>TRACKS:</strong> 🔥 Free Fire: ${ffCount} | 🎯 BGMI: ${bgmiCount}</div>` : ''}
          <div><strong>TOTAL REGISTRATIONS:</strong> ${evtRegs.length}</div>
          <div><strong>DATE:</strong> ${new Date().toLocaleDateString()}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th style="width: 90px;">Ticket Code</th>
              ${isEsports ? '<th style="width: 85px;">Esports Game</th>' : ''}
              <th style="width: 110px;">Team Name</th>
              <th>Lead Participant / Captain</th>
              <th>Phone & Email</th>
              <th>Squad Members</th>
              <th>College & Dept</th>
            </tr>
          </thead>
          <tbody>
            ${evtRegs.map((r, i) => {
              const members = getTeamMembers(r);
              const game = getRegEsportsGame(r);
              const gameBadge = game === 'BGMI' ? '<span class="badge-bgmi">🎯 BGMI</span>' : '<span class="badge-ff">🔥 FREE FIRE</span>';
              return `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${r.ticket_code || r.registrationId || r.id || '-'}</strong></td>
                  ${isEsports ? `<td>${gameBadge}</td>` : ''}
                  <td>${r.team_name || r.teamName ? `<span class="badge">${r.team_name || r.teamName}</span>` : 'Individual'}</td>
                  <td><strong>${r.full_name || r.fullName || 'Anonymous'}</strong></td>
                  <td>${r.phone || '-'}<br/><span style="color:#64748b;font-size:11px;">${r.email || '-'}</span></td>
                  <td>
                    ${members.length > 0 ? `<strong>${members.length + 1} Players:</strong><div class="members-box">1. ${r.full_name || r.fullName} (Captain)<br/>${members.map((m, idx) => `${idx + 2}. ${m}`).join('<br/>')}</div>` : 'Individual Entry'}
                  </td>
                  <td>${r.college || 'CAHCET'}<br/><span style="color:#64748b;font-size:11px;">${r.department || ''} (${r.year || ''})</span></td>
                </tr>
              `;
            }).join('')}
            ${evtRegs.length === 0 ? `<tr><td colspan="${isEsports ? 8 : 7}" style="text-align:center;padding:20px;">No registered participants for this selection.</td></tr>` : ''}
          </tbody>
        </table>

        <div class="footer">
          <div>Generated on: ${new Date().toLocaleString()}</div>
          <div>Authorized Signature: _______________________</div>
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;
    win.document.write(htmlContent);
    win.document.close();
  };

  const [selectedCoordUsername, setSelectedCoordUsername] = useState('');

  const handleOpenSendModal = (evt) => {
    if (!evt) return;
    setSendTargetEvent(evt);
    setSendGameScope('ALL');
    const targetEvtId = String(evt?.id || '').toLowerCase();
    // 1. First check if a login account is allocated for this event
    const allocatedUser = (users || []).find(u => {
      const uEvents = u?.assignedEvents || (u?.eventId ? [u.eventId] : []);
      return Array.isArray(uEvents) && uEvents.some(e => String(e || '').toLowerCase() === targetEvtId);
    });

    // 2. Also check coordinators list
    const assignedCoord = (coordinators || []).find(c => Array.isArray(c?.assignedEvents) && c.assignedEvents.some(e => String(e || '').toLowerCase() === targetEvtId));

    if (allocatedUser) {
      setSelectedCoordUsername(allocatedUser.username || '');
      setSelectedCoordName(assignedCoord?.name || allocatedUser.username || '');
    } else if (assignedCoord) {
      setSelectedCoordUsername(assignedCoord.name || '');
      setSelectedCoordName(assignedCoord.name || '');
    } else if (users && users.length > 0) {
      setSelectedCoordUsername(users[0]?.username || '');
      setSelectedCoordName(users[0]?.username || '');
    } else if (coordinators && coordinators.length > 0) {
      setSelectedCoordUsername(coordinators[0]?.name || '');
      setSelectedCoordName(coordinators[0]?.name || '');
    } else {
      setSelectedCoordUsername('');
      setSelectedCoordName('');
    }
    setIsSendModalOpen(true);
  };

  const handleConfirmSendList = () => {
    if (!sendTargetEvent || !selectedCoordName.trim()) {
      return toast.error('Please select an Event Coordinator');
    }

    const isEsports = isEsportsEvent(sendTargetEvent);
    const effectiveScope = isEsports ? sendGameScope : 'ALL';

    setIsSendingList(true);
    const scopeLabel = isEsports && effectiveScope !== 'ALL' ? ` (${effectiveScope})` : '';
    const toastId = toast.loading(`Dispatching list for "${sendTargetEvent.name}${scopeLabel}" to ${selectedCoordUsername || selectedCoordName}...`);

    fetch(getApiUrl('/api/send-participant-list'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: sendTargetEvent.id,
        eventName: sendTargetEvent.name,
        coordinatorName: selectedCoordName.trim(),
        coordinatorUsername: selectedCoordUsername.trim() || selectedCoordName.trim(),
        gameScope: effectiveScope
      })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          toast.success(resData.message || 'Participant list sent successfully!', { id: toastId, duration: 5000 });
          setIsSendModalOpen(false);
          fetchDispatches();
        } else {
          toast.error(resData.message || 'Failed to send list', { id: toastId });
        }
      })
      .catch(err => {
        console.error('Send list error:', err);
        toast.error('Network error while dispatching list', { id: toastId });
      })
      .finally(() => setIsSendingList(false));
  };

  // Dispatches State & Handlers
  const [dispatchesList, setDispatchesList] = useState([]);
  const [editingDispatchId, setEditingDispatchId] = useState(null);
  const [editCoordNameInput, setEditCoordNameInput] = useState('');
  const [isEditDispatchModalOpen, setIsEditDispatchModalOpen] = useState(false);

  const fetchDispatches = () => {
    fetch(getApiUrl('/api/dispatches'))
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setDispatchesList(result.data);
        }
      })
      .catch(err => console.warn('Error fetching dispatches list:', err));
  };

  const handleDeleteDispatch = (id, eventName, coordinatorName) => {
    if (!window.confirm(`Are you sure you want to delete and revoke the dispatched list for "${eventName}" sent to ${coordinatorName}?`)) return;

    const toastId = toast.loading(`Revoking dispatched list for ${eventName}...`);
    fetch(getApiUrl(`/api/dispatches/${id}`), { method: 'DELETE' })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success(result.message || 'Dispatch deleted & revoked successfully!', { id: toastId });
          fetchDispatches();
        } else {
          toast.error(result.message || 'Failed to delete dispatch', { id: toastId });
        }
      })
      .catch(err => {
        console.error('Delete dispatch error:', err);
        toast.error('Network error while deleting dispatch', { id: toastId });
      });
  };

  const handleOpenEditDispatchModal = (dispatch) => {
    setEditingDispatchId(dispatch.id);
    setEditCoordNameInput(dispatch.coordinatorName);
    setIsEditDispatchModalOpen(true);
  };

  const handleSaveDispatchEdit = (e) => {
    e.preventDefault();
    if (!editingDispatchId || !editCoordNameInput.trim()) return toast.error('Please enter a coordinator name');

    const toastId = toast.loading('Updating dispatched list...');
    fetch(getApiUrl(`/api/dispatches/${editingDispatchId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinatorName: editCoordNameInput.trim() })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success('Dispatch re-assigned successfully!', { id: toastId });
          setIsEditDispatchModalOpen(false);
          fetchDispatches();
        } else {
          toast.error(result.message || 'Failed to update dispatch', { id: toastId });
        }
      })
      .catch(err => {
        console.error('Update dispatch error:', err);
        toast.error('Network error while updating dispatch', { id: toastId });
      });
  };

  // Form State for On-Site Registration Tab
  const [onSiteEventId, setOnSiteEventId] = useState('');
  const [onSiteFullName, setOnSiteFullName] = useState('');
  const [onSiteEmail, setOnSiteEmail] = useState('');
  const [onSitePhone, setOnSitePhone] = useState('');
  const [onSiteCollege, setOnSiteCollege] = useState('C. Abdul Hakeem College of Engineering & Technology');
  const [onSiteDept, setOnSiteDept] = useState('CSE');
  const [onSiteYear, setOnSiteYear] = useState('3rd Year');
  const [onSiteTeamName, setOnSiteTeamName] = useState('');
  const [onSiteTeamMembers, setOnSiteTeamMembers] = useState(['']);
  const [isRegisteringOnSite, setIsRegisteringOnSite] = useState(false);

  // ==================== USERS STATE ====================
  const [users, setUsers] = useState([]);
  const [isUserFormVisible, setIsUserFormVisible] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('');

  // ==================== ROLES STATE ====================
  const [roles, setRoles] = useState([]);
  const [isRoleFormVisible, setIsRoleFormVisible] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleNameInput, setRoleNameInput] = useState('');


  // ==================== SPONSORS STATE ====================
  const [sponsors, setSponsors] = useState([]);
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [sponsorCategoryFilter, setSponsorCategoryFilter] = useState('all');
  const [isSponsorFormVisible, setIsSponsorFormVisible] = useState(false);
  const [editingSponsorId, setEditingSponsorId] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Sponsor Form Fields
  const [sponsorName, setSponsorName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [sponsorLogo, setSponsorLogo] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [sponsorDesc, setSponsorDesc] = useState('');
  const [sponsorWebsite, setSponsorWebsite] = useState('');
  const [sponsorLocationUrl, setSponsorLocationUrl] = useState('');
  const [sponsorContactName, setSponsorContactName] = useState('');
  const [sponsorContactEmail, setSponsorContactEmail] = useState('');
  const [sponsorContactPhone, setSponsorContactPhone] = useState('');
  const [sponsorCategory, setSponsorCategory] = useState('Elite');
  const [sponsorDisplayOrder, setSponsorDisplayOrder] = useState('1');
  const [sponsorIsActive, setSponsorIsActive] = useState(true);

  const fileInputRef = useRef(null);

  // ==================== COORDINATORS STATE ====================
  const [coordinators, setCoordinators] = useState([]);
  const [coordSearch, setCoordSearch] = useState('');
  const [coordEventFilter, setCoordEventFilter] = useState('all');
  const [memberViewTab, setMemberViewTab] = useState('events'); // 'events' | 'table'
  const [isCoordFormVisible, setIsCoordFormVisible] = useState(false);
  const [editingCoordId, setEditingCoordId] = useState(null);

  // Coordinator Form Fields
  const [coordName, setCoordName] = useState('');
  const [coordPhone, setCoordPhone] = useState('');
  const [coordWhatsapp, setCoordWhatsapp] = useState('');
  const [coordEmail, setCoordEmail] = useState('');
  const [coordDept, setCoordDept] = useState('CSE');
  const [coordYear, setCoordYear] = useState('3rd Year');
  const [coordRole, setCoordRole] = useState('Lead Coordinator');
  const [coordEvents, setCoordEvents] = useState([]);
  const [coordGame, setCoordGame] = useState('');
  const [coordDisplayOrder, setCoordDisplayOrder] = useState('1');
  const [coordIsActive, setCoordIsActive] = useState(true);

  // ==================== HOMEPAGE STUDENT COORDINATORS STATE ====================
  const [homepageTeams, setHomepageTeams] = useState([]);
  const [hpTeamSearch, setHpTeamSearch] = useState('');
  const [isHpTeamModalOpen, setIsHpTeamModalOpen] = useState(false);
  const [editingHpTeamId, setEditingHpTeamId] = useState(null);

  // Form fields
  const [hpTeamRole, setHpTeamRole] = useState('');
  const [hpTeamTag, setHpTeamTag] = useState('TEAM');
  const [hpTeamIcon, setHpTeamIcon] = useState('Users');
  const [hpTeamTier, setHpTeamTier] = useState('emerald');
  const [hpTeamTierManuallySelected, setHpTeamTierManuallySelected] = useState(false);
  const [hpTeamDesc, setHpTeamDesc] = useState('');
  const [hpTeamOrder, setHpTeamOrder] = useState('1');
  const [hpTeamIsActive, setHpTeamIsActive] = useState(true);
  const [hpTeamMembers, setHpTeamMembers] = useState([]);
  
  // Quick Member Input fields
  const [newMemberName, setNewMemberName] = useState('');
  const [batchMembersText, setBatchMembersText] = useState('');
  const [isBatchInputOpen, setIsBatchInputOpen] = useState(false);

  const fetchRegistrations = () => {
    fetch(getApiUrl('/api/registrations'))
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.registrations)) {
          setRegistrationsList(result.registrations);
        } else if (Array.isArray(result)) {
          setRegistrationsList(result);
        }
      })
      .catch(err => console.warn('Error fetching registrations list:', err));
  };


  // ==================== CLOSE RG (REGISTRATION STATUS) STATE ====================
  const [registrationSettings, setRegistrationSettings] = useState({
    isRegistrationClosed: false,
    closedReason: 'ONLINE REGISTRATIONS ARE CLOSED',
    onSpotNotice: 'ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM',
    closedAt: null,
    closedBy: null
  });
  const [isCloseRgModalOpen, setIsCloseRgModalOpen] = useState(false);
  const [closeRgPendingAction, setCloseRgPendingAction] = useState('close'); // 'close' | 'open'
  const [customClosedReason, setCustomClosedReason] = useState('ONLINE REGISTRATIONS ARE CLOSED');
  const [customOnSpotNotice, setCustomOnSpotNotice] = useState('ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM');
  const [isTogglingCloseRg, setIsTogglingCloseRg] = useState(false);
  const [isSavingCustomReason, setIsSavingCustomReason] = useState(false);
  // ==================== EVENT ALLOCATION STATE ====================
  const [allocUsersList, setAllocUsersList] = useState([]);
  const [allocUserSearch, setAllocUserSearch] = useState('');
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [selectedAllocUser, setSelectedAllocUser] = useState(null);
  const [selectedAllocEvents, setSelectedAllocEvents] = useState([]);
  const [isSavingAlloc, setIsSavingAlloc] = useState(false);

  // Quick Create Coordinator Account with Allocation
  const [isCreateCoordLoginModalOpen, setIsCreateCoordLoginModalOpen] = useState(false);
  const [newCoordUsername, setNewCoordUsername] = useState('');
  const [newCoordPassword, setNewCoordPassword] = useState('');
  const [newCoordRole, setNewCoordRole] = useState('Lead Coordinator');
  const [newCoordAllocEvents, setNewCoordAllocEvents] = useState(['tech-01']);
  const [isCreatingCoordLogin, setIsCreatingCoordLogin] = useState(false);

  const fetchAllocations = () => {
    fetchEventAllocations(token)
      .then(result => {
        if (result.success && Array.isArray(result.data?.users) && result.data.users.length > 0) {
          setAllocUsersList(result.data.users);
        } else if (users && users.length > 0) {
          setAllocUsersList(users.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            assignedEvents: Array.isArray(u.assignedEvents) ? u.assignedEvents : (Array.isArray(u.assigned_events) ? u.assigned_events : (u.eventId ? [u.eventId] : []))
          })));
        }
      })
      .catch(err => {
        console.warn('Error fetching event allocations:', err);
        if (users && users.length > 0) {
          setAllocUsersList(users.map(u => ({
            id: u.id,
            username: u.username,
            role: u.role,
            assignedEvents: Array.isArray(u.assignedEvents) ? u.assignedEvents : (Array.isArray(u.assigned_events) ? u.assigned_events : (u.eventId ? [u.eventId] : []))
          })));
        }
      });
  };

  const handleOpenAllocModal = (userItem) => {
    setSelectedAllocUser(userItem);
    const currAssigned = Array.isArray(userItem.assignedEvents) ? userItem.assignedEvents : (Array.isArray(userItem.assigned_events) ? userItem.assigned_events : (userItem.eventId ? [userItem.eventId] : []));
    setSelectedAllocEvents([...currAssigned]);
    setIsAllocModalOpen(true);
  };

  const handleToggleAllocEvent = (eventId) => {
    setSelectedAllocEvents(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  const handleSaveAllocations = async (e) => {
    if (e) e.preventDefault();
    if (!selectedAllocUser) return;

    setIsSavingAlloc(true);
    const toastId = toast.loading(`Saving event allocation for ${selectedAllocUser.username}...`);

    try {
      const res = await updateEventAllocation({
        userId: selectedAllocUser.id,
        username: selectedAllocUser.username,
        assignedEvents: selectedAllocEvents
      }, token);

      if (res.success) {
        toast.success(`Allocated ${selectedAllocEvents.length} event(s) to ${selectedAllocUser.username}!`, { id: toastId });
        setAllocUsersList(prev => prev.map(u => {
          if (u.id === selectedAllocUser.id || String(u.username || '').toLowerCase() === String(selectedAllocUser.username || '').toLowerCase()) {
            return { ...u, assignedEvents: selectedAllocEvents, assigned_events: selectedAllocEvents, eventId: selectedAllocEvents[0] || null };
          }
          return u;
        }));
        setUsers(prev => prev.map(u => {
          if (u.id === selectedAllocUser.id || String(u.username || '').toLowerCase() === String(selectedAllocUser.username || '').toLowerCase()) {
            return { ...u, assignedEvents: selectedAllocEvents, assigned_events: selectedAllocEvents, eventId: selectedAllocEvents[0] || null };
          }
          return u;
        }));
        setIsAllocModalOpen(false);
        fetchUsers();
        fetchCoordinators();
        fetchAllocations();
      } else {
        toast.error(res.message || 'Failed to update allocation', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error saving allocation', { id: toastId });
    } finally {
      setIsSavingAlloc(false);
    }
  };

  const handleCreateCoordWithAlloc = async (e) => {
    e.preventDefault();
    if (!newCoordUsername.trim() || !newCoordPassword.trim()) {
      return toast.error('Please enter username and password');
    }

    setIsCreatingCoordLogin(true);
    const toastId = toast.loading(`Creating coordinator account for ${newCoordUsername}...`);

    try {
      // 1. Create user
      const userRes = await fetch(getApiUrl('/api/admin/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newCoordUsername.trim(),
          password: newCoordPassword.trim(),
          role: newCoordRole
        })
      });
      const userData = await userRes.json();

      if (!userData.success) {
        toast.error(userData.message || 'Failed to create user', { id: toastId });
        setIsCreatingCoordLogin(false);
        return;
      }

      // 2. Allocate events to newly created user
      await updateEventAllocation({
        userId: userData.data?.id,
        username: newCoordUsername.trim(),
        assignedEvents: newCoordAllocEvents
      }, token);

      const createdUserObj = {
        id: userData.data?.id || Date.now(),
        username: newCoordUsername.trim(),
        role: newCoordRole,
        assignedEvents: newCoordAllocEvents
      };

      setAllocUsersList(prev => [...prev.filter(u => u.username !== createdUserObj.username), createdUserObj]);
      setUsers(prev => [...prev.filter(u => u.username !== createdUserObj.username), { id: createdUserObj.id, username: createdUserObj.username, role: createdUserObj.role }]);

      toast.success(`Coordinator account "${newCoordUsername}" created & allocated to ${newCoordAllocEvents.length} event(s)!`, { id: toastId, duration: 5000 });
      setIsCreateCoordLoginModalOpen(false);
      setNewCoordUsername('');
      setNewCoordPassword('');
      setNewCoordAllocEvents(['tech-01']);
      fetchUsers();
      fetchAllocations();
      fetchCoordinators();
    } catch (err) {
      toast.error('Network error creating coordinator account', { id: toastId });
    } finally {
      setIsCreatingCoordLogin(false);
    }
  };

  const fetchRegistrationSettings = () => {
    fetch(getApiUrl('/api/registration-status'))
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          setRegistrationSettings(result.data);
          setCustomClosedReason(result.data.closedReason || 'ONLINE REGISTRATIONS ARE CLOSED');
          setCustomOnSpotNotice(result.data.onSpotNotice || 'ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM');
        }
      })
      .catch(err => console.warn('Error fetching registration settings:', err));
  };

  const handleOpenCloseRgModal = (action) => {
    setCloseRgPendingAction(action);
    setCustomClosedReason(registrationSettings.closedReason || 'ONLINE REGISTRATIONS ARE CLOSED');
    setCustomOnSpotNotice(registrationSettings.onSpotNotice || 'ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM');
    setIsCloseRgModalOpen(true);
  };

  const handleConfirmCloseRgToggle = async () => {
    if (!isAdminOrSuper) return;
    setIsTogglingCloseRg(true);
    const shouldClose = closeRgPendingAction === 'close';
    try {
      const res = await updateRegistrationStatus(token, {
        isRegistrationClosed: shouldClose,
        closedReason: customClosedReason.trim() || registrationSettings.closedReason || 'ONLINE REGISTRATIONS ARE CLOSED',
        onSpotNotice: customOnSpotNotice.trim() || registrationSettings.onSpotNotice || 'ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM'
      });
      if (res.success && res.data) {
        setRegistrationSettings(res.data);
        setIsCloseRgModalOpen(false);
        toast.success(shouldClose ? 'Registrations have been closed across all symposium events.' : 'Registrations have been re-opened successfully.');
      } else {
        toast.error(res.message || 'Failed to update registration status.');
      }
    } catch (err) {
      toast.error('Network error updating registration status.');
    } finally {
      setIsTogglingCloseRg(false);
    }
  };

  const handleSaveCustomReason = async () => {
    if (!isAdminOrSuper) return;
    setIsSavingCustomReason(true);
    try {
      const res = await updateRegistrationStatus(token, {
        isRegistrationClosed: registrationSettings.isRegistrationClosed,
        closedReason: customClosedReason.trim() || 'ONLINE REGISTRATIONS ARE CLOSED',
        onSpotNotice: customOnSpotNotice.trim() || 'ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM'
      });
      if (res.success && res.data) {
        setRegistrationSettings(res.data);
        toast.success('Closing marquee ticker & spot registration note saved successfully!');
      } else {
        toast.error(res.message || 'Failed to update announcement message.');
      }
    } catch (err) {
      toast.error('Network error saving announcement message.');
    } finally {
      setIsSavingCustomReason(false);
    }
  };

  // ==================== REAL-TIME REGISTRATION WEBSOCKET ====================
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let isMounted = true;

    const connectWS = () => {
      try {
        const wsUrl = getWsUrl('/ws/registrations');
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isMounted) return;
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'REGISTRATION_UPDATE') {
              // Automatically refresh registrations and live analytics
              fetchRegistrations();
              fetchDashboardData();

              const action = msg.action;
              const rData = msg.data || {};
              const ticket = rData.ticketCode || rData.ticket_code || rData.registrationId || rData.id || '';
              const name = rData.fullName || rData.leadName || rData.full_name || 'Participant';
              const evt = rData.eventName || 'Event';

              if (action === 'REGISTRATION_STATUS_UPDATED') {
                setRegistrationSettings(rData);
                setCustomClosedReason(rData.closedReason || '');
                if (rData.isRegistrationClosed) {
                  toast.error('Alert: Registration portal has been CLOSED across all events.', { duration: 6000 });
                } else {
                  toast.success('Alert: Registration portal has been RE-OPENED for all events.', { duration: 6000 });
                }
              } else if (action === 'CREATE') {
                toast.success(`Live Registration: ${name} (${evt})!`, { duration: 5000 });
              } else if (action === 'VERIFY') {
                toast.success(`Live Update: Registration #${ticket} verified!`, { duration: 4000 });
              } else if (action === 'DELETE') {
                toast(`Live Update: Registration #${ticket} deleted`, { duration: 4000 });
              }
            }
          } catch (e) {
            console.warn('WS message parse error:', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWS, 3000);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setWsConnected(false);
        };
      } catch (err) {
        if (isMounted) {
          reconnectTimeout = setTimeout(connectWS, 5000);
        }
      }
    };

    connectWS();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        try { ws.close(); } catch (e) {}
      }
    };
  }, []);


  // ==================== INITIAL DATA FETCH ====================
  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
    fetchRoles();
    fetchEvents();
    fetchSponsors();
    fetchCoordinators();
    fetchHomepageTeams();
    fetchRegistrations();
    fetchRegistrationSettings();
    fetchAllocations();
    fetchDispatches();
  }, [token]);

  // Handle ESC key to close modal overlays
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isUserFormVisible) resetUserForm();
        if (isRoleFormVisible) resetRoleForm();
        if (isEventEditModalOpen) resetEventEditModal();
        if (isSponsorFormVisible) resetSponsorForm();
        if (isCoordFormVisible) resetCoordForm();
        if (isRegDetailsModalOpen) {
          setIsRegDetailsModalOpen(false);
          setSelectedRegDetails(null);
        }
        if (isOnSiteRegisterModalOpen) {
          setIsOnSiteRegisterModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUserFormVisible, isRoleFormVisible, isEventEditModalOpen, isSponsorFormVisible, isCoordFormVisible, isRegDetailsModalOpen, isOnSiteRegisterModalOpen]);

  const handleAuthError = () => {
    toast.error('Session expired or unauthorized');
    onLogout();
  };

  const handleOnSiteRegisterSubmit = (e) => {
    e.preventDefault();
    if (!onSiteEventId) return toast.error('Please select an event');
    if (!onSiteFullName.trim()) return toast.error('Participant name is required');
    if (!onSitePhone.trim() || !/^[6-9]\d{9}$/.test(onSitePhone.trim().replace(/\s+/g, ''))) {
      return toast.error('Valid 10-digit phone number is required');
    }
    if (!onSiteEmail.trim()) return toast.error('Email address is required');

    const selectedEvt = eventsList.find(evt => evt.id === onSiteEventId);
    if (!selectedEvt) return toast.error('Event not found');

    const validMembers = onSiteTeamMembers.filter(m => m.trim().length > 0);
    const memberCount = 1 + validMembers.length;
    const feePerHead = selectedEvt.feePerHead || 50;
    const isFixedTeam = selectedEvt.feeType === 'per_team' || selectedEvt.feeType === 'per_squad' || selectedEvt.feeType === 'fixed';
    const totalFee = selectedEvt.isTeam && isFixedTeam
      ? (selectedEvt.id === 'nontech-07' ? 250 : (selectedEvt.id === 'nontech-05' ? 200 : (selectedEvt.feePerHead || 250)))
      : (feePerHead * memberCount);

    const payload = {
      currentEvent: selectedEvt,
      fields: {
        fullName: onSiteFullName.trim(),
        email: onSiteEmail.trim(),
        phone: onSitePhone.trim(),
        college: onSiteCollege.trim(),
        department: onSiteDept.trim(),
        year: onSiteYear,
        teamName: selectedEvt.isTeam ? onSiteTeamName.trim() : null,
        teamMembers: validMembers
      },
      totalFee
    };

    setIsRegisteringOnSite(true);
    const toastId = toast.loading('Processing on-site registration...');

    fetch(getApiUrl('/api/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          const ticketCode = resData.ticketData?.ticketCode || 'ELQ26-REG';
          toast.success(`Registration successful! Ticket Code: ${ticketCode}`, { id: toastId, duration: 6000 });
          setOnSiteFullName('');
          setOnSiteEmail('');
          setOnSitePhone('');
          setOnSiteTeamName('');
          setOnSiteTeamMembers(['']);
          setIsOnSiteRegisterModalOpen(false);
          fetchRegistrations();
          fetchDashboardData();
        } else {
          toast.error(resData.message || 'Registration failed', { id: toastId });
        }
      })
      .catch(err => {
        console.error('Registration API error:', err);
        toast.error('Network error during registration', { id: toastId });
      })
      .finally(() => setIsRegisteringOnSite(false));
  };

  const fetchDashboardData = () => {
    fetch(getApiUrl('/api/admin/dashboard'), { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(result => {
        if (result.success) setData(result.data);
        else handleAuthError();
      })
      .catch(handleAuthError)
      .finally(() => setLoading(false));
  };

  const fetchUsers = () => {
    fetch(getApiUrl('/api/admin/users'), { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(result => { 
        if (result.success) setUsers(result.data); 
      })
      .catch(console.error);
  };

  const fetchRoles = () => {
    fetch(getApiUrl('/api/admin/roles'), { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(result => { 
        if (result.success) {
          setRoles(result.data);
          if (result.data.length > 0 && !userRole) {
            setUserRole(result.data[0].name);
          }
        }
      })
      .catch(console.error);
  };

  const fetchEvents = () => {
    fetch(getApiUrl('/api/admin/events'), { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          setEventsList(result.data);
        }
      })
      .catch(() => {
        // Fallback to defaultEvents if API is unreachable
        setEventsList(defaultEvents);
      });
  };

  const fetchSponsors = () => {
    fetch(getApiUrl('/api/admin/sponsors'), { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(result => {
        if (result.success) setSponsors(result.data);
      })
      .catch(console.error);
  };

  const fetchCoordinators = () => {
    fetch(getApiUrl('/api/admin/coordinators'), { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(result => {
        if (result.success) setCoordinators(result.data);
      })
      .catch(console.error);
  };

  // ==================== USER HANDLERS ====================
  const resetUserForm = () => {
    setUsername('');
    setPassword('');
    setUserRole(roles.length > 0 ? roles[0].name : '');
    setEditingUserId(null);
    setIsUserFormVisible(false);
  };

  const handleOpenCreateUserForm = () => {
    resetUserForm();
    setIsUserFormVisible(true);
  };

  const handleOpenEditUserForm = (user) => {
    setUsername(user.username);
    setPassword('');
    setUserRole(user.role);
    setEditingUserId(user.id);
    setIsUserFormVisible(true);
  };

  const handleSubmitUser = (e) => {
    e.preventDefault();
    if (!username || !userRole) return toast.error('Please fill in required fields');
    if (!editingUserId && !password) return toast.error('Password is required for new users');

    const loadingToast = toast.loading(editingUserId ? 'Updating user...' : 'Creating user...');
    const method = editingUserId ? 'PUT' : 'POST';
    const url = editingUserId ? getApiUrl(`/api/admin/users/${editingUserId}`) : getApiUrl('/api/admin/users');

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ username, password, role: userRole })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success(`User ${editingUserId ? 'updated' : 'created'} successfully!`, { id: loadingToast });
          if (editingUserId) {
            setUsers(users.map(u => u.id === editingUserId ? result.data : u));
          } else {
            setUsers([...users, result.data]);
          }
          resetUserForm();
        } else {
          toast.error(result.message || 'Operation failed', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error', { id: loadingToast }));
  };

  const handleDeleteUser = (id, targetUsername) => {
    if (!window.confirm(`Are you sure you want to delete user "${targetUsername}"?`)) return;
    const loadingToast = toast.loading('Deleting user...');

    fetch(getApiUrl(`/api/admin/users/${id}`), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success('User deleted successfully', { id: loadingToast });
          setUsers(users.filter(u => u.id !== id));
          if (editingUserId === id) resetUserForm();
        } else {
          toast.error(result.message || 'Failed to delete user', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error', { id: loadingToast }));
  };

  // ==================== ROLE HANDLERS ====================
  const resetRoleForm = () => {
    setRoleNameInput('');
    setEditingRoleId(null);
    setIsRoleFormVisible(false);
  };

  const handleOpenCreateRoleForm = () => {
    resetRoleForm();
    setIsRoleFormVisible(true);
  };

  const handleOpenEditRoleForm = (roleItem) => {
    setRoleNameInput(roleItem.name);
    setEditingRoleId(roleItem.id);
    setIsRoleFormVisible(true);
  };

  const handleSubmitRole = (e) => {
    e.preventDefault();
    if (!roleNameInput.trim()) return toast.error('Role name is required');

    const loadingToast = toast.loading(editingRoleId ? 'Updating role...' : 'Creating role...');
    const method = editingRoleId ? 'PUT' : 'POST';
    const url = editingRoleId ? getApiUrl(`/api/admin/roles/${editingRoleId}`) : getApiUrl('/api/admin/roles');

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: roleNameInput.trim() })
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success(`Role ${editingRoleId ? 'updated' : 'created'} successfully!`, { id: loadingToast });
          if (editingRoleId) {
            setRoles(roles.map(r => r.id === editingRoleId ? result.data : r));
            fetchUsers();
          } else {
            setRoles([...roles, result.data]);
          }
          resetRoleForm();
        } else {
          toast.error(result.message || 'Operation failed', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error', { id: loadingToast }));
  };

  const handleDeleteRole = (id, roleName) => {
    if (!window.confirm(`Are you sure you want to delete role "${roleName}"?`)) return;
    const loadingToast = toast.loading('Deleting role...');

    fetch(getApiUrl(`/api/admin/roles/${id}`), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success('Role deleted successfully', { id: loadingToast });
          setRoles(roles.filter(r => r.id !== id));
          if (editingRoleId === id) resetRoleForm();
        } else {
          toast.error(result.message || 'Failed to delete role', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error', { id: loadingToast }));
  };

  // ==================== EVENT HANDLERS ====================
  const parseBulkRules = (text) => {
    if (!text || typeof text !== 'string') return [];
    return text
      .split('\n')
      .map(line => line.replace(/^(\d+[\.\)]\s*|[-*•]\s*)/, '').trim())
      .filter(line => line.length > 0);
  };

  const handleAddRule = () => {
    setEventRules(prev => [...prev, '']);
  };

  const handleRuleChange = (index, value) => {
    setEventRules(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleRemoveRule = (index) => {
    setEventRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveRule = (index, direction) => {
    setEventRules(prev => {
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === prev.length - 1)) return prev;
      const copy = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      const tmp = copy[index];
      copy[index] = copy[target];
      copy[target] = tmp;
      return copy;
    });
  };

  // ── Round Management Handlers ──
  const handleAddRound = () => {
    setEventRounds(prev => [
      ...prev,
      { name: `Round ${prev.length + 1}`, time: '', desc: '' }
    ]);
  };

  const handleRoundChange = (index, field, value) => {
    setEventRounds(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveRound = (index) => {
    setEventRounds(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveRound = (index, direction) => {
    setEventRounds(prev => {
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === prev.length - 1)) return prev;
      const copy = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      const tmp = copy[index];
      copy[index] = copy[target];
      copy[target] = tmp;
      return copy;
    });
  };

  const formatRoundsToBulkText = (rounds) => {
    if (!Array.isArray(rounds)) return '';
    return rounds
      .map(r => {
        if (typeof r === 'string') return r;
        const name = (r.name || r.title || '').trim();
        const time = (r.time || r.duration || '').trim();
        const desc = (r.desc || r.description || '').trim();
        if (time && desc) return `${name} | ${time} | ${desc}`;
        if (time) return `${name} | ${time}`;
        if (desc) return `${name} | ${desc}`;
        return name;
      })
      .filter(Boolean)
      .join('\n');
  };

  const parseBulkRounds = (text) => {
    if (!text || typeof text !== 'string') return [];
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        let clean = line.replace(/^(\d+[\.\)]\s*|[-*•]\s*)/, '').trim();
        if (!clean) return null;

        if (clean.includes('|')) {
          const parts = clean.split('|').map(p => p.trim());
          if (parts.length >= 3) {
            return { name: parts[0], time: parts[1], desc: parts.slice(2).join(' | ') };
          } else if (parts.length === 2) {
            const isDuration = /\b(min|mins|minutes|hour|hours|hr|hrs|am|pm)\b/i.test(parts[1]);
            if (isDuration) {
              return { name: parts[0], time: parts[1], desc: '' };
            }
            return { name: parts[0], time: '', desc: parts[1] };
          }
        }

        if (clean.includes(':')) {
          const colonIdx = clean.indexOf(':');
          const namePart = clean.substring(0, colonIdx).trim();
          const restPart = clean.substring(colonIdx + 1).trim();
          const timeMatch = restPart.match(/\(([^)]*(?:min|mins|hour|hours|hr|hrs|am|pm)[^)]*)\)/i);
          let time = '';
          let desc = restPart;
          if (timeMatch) {
            time = timeMatch[1].trim();
            desc = restPart.replace(timeMatch[0], '').trim();
          }
          return { name: namePart, time, desc };
        }

        return { name: clean, time: '', desc: '' };
      })
      .filter(Boolean);
  };

  const resetEventEditModal = () => {
    setEditingEvent(null);
    setEventName('');
    setEventAlias('');
    setEventSubtitle('');
    setEventCategory('technical');
    setEventVenue('');
    setEventTiming('');
    setEventFee('');
    setEventTeamSize('');
    setEventTag('');
    setEventDesc('');
    setEventImage('');
    setEventImagePreview('');
    setEventVenueImage('');
    setEventVenueImagePreview('');
    setIsUploadingVenueImage(false);
    setEventRules([]);
    setBulkRulesText('');
    setRulesInputMode('list');
    setEventRounds([]);
    setBulkRoundsText('');
    setRoundsInputMode('list');
    setIsEventEditModalOpen(false);
    if (eventFileInputRef.current) eventFileInputRef.current.value = '';
    if (venueFileInputRef.current) venueFileInputRef.current.value = '';
  };

  const handleOpenCreateEventModal = () => {
    resetEventEditModal();
    setEventFee('₹50 per head');
    setEventTiming('10:00 AM – 01:00 PM');
    setEventVenue('CSE Seminar Hall');
    setEventVenueImage('');
    setEventVenueImagePreview('');
    setEventTeamSize('Individual');
    setEventRules(['']);
    setBulkRulesText('');
    setRulesInputMode('list');
    setEventRounds([{ name: 'Round 1: Preliminary Round', time: '30 Mins', desc: '' }]);
    setBulkRoundsText('Round 1: Preliminary Round | 30 Mins');
    setRoundsInputMode('list');
    setIsEventEditModalOpen(true);
  };

  const handleOpenEditEventModal = (eventItem) => {
    setEditingEvent(eventItem);
    setEventName(eventItem.name || '');
    setEventAlias(eventItem.alias || eventItem.name || '');
    setEventSubtitle(eventItem.subtitle || '');
    setEventCategory(eventItem.category || 'technical');
    setEventVenue(eventItem.venue || '');
    setEventVenueImage(eventItem.venueImage || eventItem.venue_image || '');
    setEventVenueImagePreview(eventItem.venueImage || eventItem.venue_image || '');
    setEventTiming(eventItem.timing || '');
    setEventFee(eventItem.fee || '');
    setEventTeamSize(eventItem.teamSize || '');
    setEventTag(eventItem.tag || '');
    setEventDesc(eventItem.description || '');
    setEventImage(eventItem.image || '');
    setEventImagePreview(getEventBanner(eventItem) || '');

    const existingRules = (Array.isArray(eventItem.rules) && eventItem.rules.length > 0)
      ? eventItem.rules
      : (rulesData[eventItem.id]?.rules || []);
    const initialRules = existingRules.length > 0 ? [...existingRules] : [''];
    setEventRules(initialRules);
    setBulkRulesText(initialRules.join('\n'));
    setRulesInputMode('list');

    const existingRounds = (Array.isArray(eventItem.rounds) && eventItem.rounds.length > 0)
      ? eventItem.rounds
      : (rulesData[eventItem.id]?.rounds || []);
    const normalizedRounds = existingRounds.map((r, i) => {
      if (typeof r === 'string') {
        const parts = r.split(':');
        if (parts.length > 1) {
          return { name: parts[0].trim(), time: '', desc: parts.slice(1).join(':').trim() };
        }
        return { name: r.trim(), time: '', desc: '' };
      }
      return {
        name: r.name || r.title || `Round ${i + 1}`,
        time: r.time || r.duration || '',
        desc: r.desc || r.description || ''
      };
    });
    const initialRounds = normalizedRounds.length > 0 ? normalizedRounds : [{ name: 'Round 1: Preliminary Round', time: '', desc: '' }];
    setEventRounds(initialRounds);
    setBulkRoundsText(formatRoundsToBulkText(initialRounds));
    setRoundsInputMode('list');

    setIsEventEditModalOpen(true);
  };

  const handleEventImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Please select a valid image file (PNG, JPG, WEBP, SVG)');
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image size exceeds 5MB limit');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setEventImagePreview(base64);
      setEventImage(base64);

      setIsUploadingEventImage(true);
      const loadingToast = toast.loading('Attaching event picture...');

      fetch(getApiUrl('/api/admin/upload'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageBase64: base64,
          fileName: file.name,
          type: 'event'
        })
      })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setEventImage(result.url);
            setEventImagePreview(result.url);
            toast.success('Event picture attached! Save to persist in DB.', { id: loadingToast });
          } else {
            toast.error(result.message || 'Upload failed', { id: loadingToast });
          }
        })
        .catch(() => {
          toast.error('Network error uploading picture', { id: loadingToast });
        })
        .finally(() => setIsUploadingEventImage(false));
    };
    reader.readAsDataURL(file);
  };

  const handleVenueImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Please select a valid image file (PNG, JPG, WEBP, SVG)');
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image size exceeds 5MB limit');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setEventVenueImagePreview(base64);
      setEventVenueImage(base64);

      setIsUploadingVenueImage(true);
      const loadingToast = toast.loading('Attaching venue photo...');

      fetch(getApiUrl('/api/admin/upload'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageBase64: base64,
          fileName: file.name,
          type: 'venue'
        })
      })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setEventVenueImage(result.url);
            setEventVenueImagePreview(result.url);
            toast.success('Venue photo attached! Click Save Event to persist.', { id: loadingToast });
          } else {
            toast.error(result.message || 'Upload failed', { id: loadingToast });
          }
        })
        .catch(() => {
          toast.error('Network error uploading venue photo', { id: loadingToast });
        })
        .finally(() => setIsUploadingVenueImage(false));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEventEdit = (e) => {
    e.preventDefault();
    if (!eventName.trim() || !eventVenue.trim() || !eventTiming.trim() || !eventFee.trim()) {
      return toast.error('Please fill in all required event details');
    }

    const activeRulesList = rulesInputMode === 'bulk' ? parseBulkRules(bulkRulesText) : eventRules;
    const cleanedRules = activeRulesList
      .map(r => (typeof r === 'string' ? r.replace(/^(\d+[\.\)]\s*|[-*•]\s*)/, '').trim() : ''))
      .filter(r => r.length > 0);

    const activeRoundsList = roundsInputMode === 'bulk' ? parseBulkRounds(bulkRoundsText) : eventRounds;
    const cleanedRounds = activeRoundsList
      .map(r => {
        if (typeof r === 'string') return { name: r.trim(), time: '', desc: '' };
        return {
          name: (r.name || r.title || '').trim(),
          time: (r.time || r.duration || '').trim(),
          desc: (r.desc || r.description || '').trim()
        };
      })
      .filter(r => r.name.length > 0 || r.desc.length > 0);

    const loadingToast = toast.loading(editingEvent ? 'Saving event changes...' : 'Creating new event...');
    const url = editingEvent ? getApiUrl(`/api/admin/events/${editingEvent.id}`) : getApiUrl('/api/admin/events');
    const method = editingEvent ? 'PUT' : 'POST';

    const payload = {
      name: eventName.trim(),
      alias: eventAlias.trim() || eventName.trim(),
      subtitle: eventSubtitle.trim(),
      category: eventCategory,
      venue: eventVenue.trim(),
      venueImage: eventVenueImage.trim(),
      timing: eventTiming.trim(),
      fee: eventFee.trim(),
      teamSize: eventTeamSize.trim(),
      tag: eventTag.trim() || (eventCategory === 'technical' ? 'Technical Presentation' : 'Non-Technical Event'),
      description: eventDesc.trim(),
      image: eventImage.trim(),
      rules: cleanedRules,
      rounds: cleanedRounds
    };

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success(editingEvent ? 'Event updated! Changes live in database & events page.' : 'Event created successfully in database!', { id: loadingToast });
          resetEventEditModal();
          fetchEvents();
          fetchEventsData(true);
        } else {
          toast.error(result.message || 'Failed to save event', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server connection error', { id: loadingToast }));
  };

  const handleDeleteEvent = (eventId, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete event "${name}"?`)) {
      return;
    }
    const loadingToast = toast.loading(`Deleting event ${name} from live database...`);
    fetch(getApiUrl(`/api/admin/events/${eventId}`), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success('Event deleted successfully from live database', { id: loadingToast });
          fetchEvents();
          fetchEventsData(true);
        } else {
          toast.error(result.message || 'Failed to delete event', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error deleting event', { id: loadingToast }));
  };

  // ==================== SPONSOR HANDLERS ====================
  const resetSponsorForm = () => {
    setSponsorName('');
    setCompanyName('');
    setSponsorLogo('');
    setLogoPreview('');
    setSponsorDesc('');
    setSponsorWebsite('');
    setSponsorLocationUrl('');
    setSponsorContactName('');
    setSponsorContactEmail('');
    setSponsorContactPhone('');
    setSponsorCategory('Elite');
    setSponsorDisplayOrder(String(sponsors.length + 1));
    setSponsorIsActive(true);
    setEditingSponsorId(null);
    setIsSponsorFormVisible(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenCreateSponsorForm = () => {
    resetSponsorForm();
    setIsSponsorFormVisible(true);
  };

  const handleOpenEditSponsorForm = (sponsor) => {
    setSponsorName(sponsor.name || '');
    setCompanyName(sponsor.companyName || '');
    setSponsorLogo(sponsor.logo || '');
    setLogoPreview(sponsor.logo || '');
    setSponsorDesc(sponsor.description || '');
    setSponsorWebsite(sponsor.website || '');
    setSponsorLocationUrl(sponsor.locationUrl || sponsor.location_url || '');
    setSponsorContactName(sponsor.contactName || '');
    setSponsorContactEmail(sponsor.contactEmail || '');
    setSponsorContactPhone(sponsor.contactPhone || '');
    setSponsorCategory(sponsor.category || 'Elite');
    setSponsorDisplayOrder(String(sponsor.displayOrder !== undefined ? sponsor.displayOrder : 1));
    setSponsorIsActive(sponsor.isActive !== false);
    setEditingSponsorId(sponsor.id);
    setIsSponsorFormVisible(true);
  };

  const handleLogoFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Please select an image file (PNG, JPG, WEBP, SVG)');
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image size exceeds 5MB limit');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setLogoPreview(base64);
      setSponsorLogo(base64);

      // Upload automatically to backend
      setIsUploadingLogo(true);
      const loadingToast = toast.loading('Uploading logo asset...');

      fetch(getApiUrl('/api/admin/upload'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageBase64: base64,
          fileName: file.name,
          type: 'sponsor'
        })
      })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setSponsorLogo(result.url);
            toast.success('Logo uploaded successfully', { id: loadingToast });
          } else {
            toast.error(result.message || 'Upload failed', { id: loadingToast });
          }
        })
        .catch(() => {
          toast.error('Network error uploading logo', { id: loadingToast });
        })
        .finally(() => setIsUploadingLogo(false));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitSponsor = (e) => {
    e.preventDefault();
    if (!sponsorName.trim()) {
      return toast.error('Sponsor name is required');
    }

    if (sponsorContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sponsorContactEmail.trim())) {
      return toast.error('Please enter a valid contact email');
    }

    const payload = {
      name: sponsorName.trim(),
      companyName: companyName.trim(),
      logo: sponsorLogo.trim(),
      description: sponsorDesc.trim(),
      website: sponsorWebsite.trim(),
      locationUrl: sponsorLocationUrl.trim(),
      contactName: sponsorContactName.trim(),
      contactEmail: sponsorContactEmail.trim(),
      contactPhone: sponsorContactPhone.trim(),
      category: sponsorCategory,
      displayOrder: Number(sponsorDisplayOrder) || 1,
      isActive: sponsorIsActive
    };

    const loadingToast = toast.loading(editingSponsorId ? 'Updating sponsor...' : 'Creating sponsor...');
    const method = editingSponsorId ? 'PUT' : 'POST';
    const url = editingSponsorId ? getApiUrl(`/api/admin/sponsors/${editingSponsorId}`) : getApiUrl('/api/admin/sponsors');

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success(`Sponsor ${editingSponsorId ? 'updated' : 'created'} successfully!`, { id: loadingToast });
          fetchSponsors();
          fetchDashboardData();
          resetSponsorForm();
        } else {
          toast.error(result.message || 'Operation failed', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error saving sponsor', { id: loadingToast }));
  };

  const handleToggleSponsor = (sponsor) => {
    const loadingToast = toast.loading(`Toggling status for ${sponsor.name}...`);
    fetch(getApiUrl(`/api/admin/sponsors/${sponsor.id}/toggle`), {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success(result.message, { id: loadingToast });
          setSponsors(sponsors.map(s => s.id === sponsor.id ? result.data : s));
          fetchDashboardData();
        } else {
          toast.error(result.message || 'Toggle failed', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error', { id: loadingToast }));
  };

  const handleDeleteSponsor = (id, name) => {
    if (!window.confirm(`Are you sure you want to delete sponsor "${name}"? This action cannot be undone.`)) return;
    const loadingToast = toast.loading('Deleting sponsor...');

    fetch(getApiUrl(`/api/admin/sponsors/${id}`), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success('Sponsor deleted successfully', { id: loadingToast });
          setSponsors(sponsors.filter(s => s.id !== id));
          fetchDashboardData();
          if (editingSponsorId === id) resetSponsorForm();
        } else {
          toast.error(result.message || 'Failed to delete sponsor', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error', { id: loadingToast }));
  };

  // ==================== COORDINATOR HANDLERS ====================
  const resetCoordForm = () => {
    setCoordName('');
    setCoordPhone('');
    setCoordWhatsapp('');
    setCoordEmail('');
    setCoordDept('CSE');
    setCoordYear('3rd Year');
    setCoordRole('Lead Coordinator');
    setCoordEvents([]);
    setCoordGame('');
    setCoordDisplayOrder(String(coordinators.length + 1));
    setCoordIsActive(true);
    setEditingCoordId(null);
    setIsCoordFormVisible(false);
  };

  const handleOpenCreateCoordForm = (preselectedEventId = null) => {
    resetCoordForm();
    if (preselectedEventId && typeof preselectedEventId === 'string') {
      setCoordEvents([preselectedEventId]);
      if (preselectedEventId.toLowerCase() === 'nontech-05') {
        setCoordGame('Free Fire');
      }
    }
    setIsCoordFormVisible(true);
  };

  const handleOpenEditCoordForm = (coord) => {
    setCoordName(coord.name || '');
    setCoordPhone(coord.phone || '');
    setCoordWhatsapp(coord.whatsapp || '');
    setCoordEmail(coord.email || '');
    setCoordDept(coord.department || 'CSE');
    setCoordYear(coord.year || '3rd Year');
    setCoordRole(coord.role || 'Lead Coordinator');
    const assigned = Array.isArray(coord.assignedEvents) ? [...coord.assignedEvents] : [];
    setCoordEvents(assigned);
    setCoordGame(coord.game || (assigned.includes('nontech-05') ? 'Free Fire' : ''));
    setCoordDisplayOrder(String(coord.displayOrder !== undefined ? coord.displayOrder : 1));
    setCoordIsActive(coord.isActive !== false);
    setEditingCoordId(coord.id);
    setIsCoordFormVisible(true);
  };

  const toggleEventSelection = (eventId) => {
    if (coordEvents.includes(eventId)) {
      const nextEvents = coordEvents.filter(e => e !== eventId);
      setCoordEvents(nextEvents);
      if (eventId === 'nontech-05' && !nextEvents.includes('nontech-05')) {
        setCoordGame('');
      }
    } else {
      const nextEvents = [...coordEvents, eventId];
      setCoordEvents(nextEvents);
      if (eventId === 'nontech-05' && !coordGame) {
        setCoordGame('Free Fire');
      }
    }
  };

  const handleSubmitCoord = (e) => {
    e.preventDefault();
    if (!coordName.trim()) return toast.error('Full name is required');
    if (!coordPhone.trim() || !/^[6-9]\d{9}$/.test(coordPhone.trim().replace(/\s+/g, ''))) {
      return toast.error('Please enter a valid 10-digit Indian phone number (e.g. 9876543210)');
    }
    if (coordEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coordEmail.trim())) {
      return toast.error('Please enter a valid email address');
    }
    if (coordEvents.length === 0) {
      return toast.error('Please assign this coordinator to at least one event');
    }
    if (coordEvents.includes('nontech-05') && !coordGame) {
      return toast.error('Please select the Game Track (Free Fire or BGMI) for Battle of Champions');
    }

    const payload = {
      name: coordName.trim(),
      phone: coordPhone.trim().replace(/\s+/g, ''),
      whatsapp: coordWhatsapp ? coordWhatsapp.trim().replace(/\s+/g, '') : coordPhone.trim().replace(/\s+/g, ''),
      email: coordEmail.trim(),
      department: coordDept.trim(),
      year: coordYear.trim(),
      role: coordRole,
      game: coordEvents.includes('nontech-05') ? coordGame : '',
      assignedEvents: coordEvents,
      displayOrder: Number(coordDisplayOrder) || 1,
      isActive: coordIsActive
    };

    const loadingToast = toast.loading(editingCoordId ? 'Updating coordinator...' : 'Creating coordinator...');
    const method = editingCoordId ? 'PUT' : 'POST';
    const url = editingCoordId ? getApiUrl(`/api/admin/coordinators/${editingCoordId}`) : getApiUrl('/api/admin/coordinators');

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success(`Coordinator ${editingCoordId ? 'updated' : 'created'} successfully!`, { id: loadingToast });
          fetchCoordinators();
          fetchDashboardData();
          resetCoordForm();
        } else {
          toast.error(result.message || 'Operation failed', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error saving coordinator', { id: loadingToast }));
  };

  const handleToggleCoord = (coord) => {
    const loadingToast = toast.loading(`Toggling status for ${coord.name}...`);
    fetch(getApiUrl(`/api/admin/coordinators/${coord.id}/toggle`), {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success(result.message, { id: loadingToast });
          setCoordinators(coordinators.map(c => c.id === coord.id ? result.data : c));
          fetchDashboardData();
        } else {
          toast.error(result.message || 'Toggle failed', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error', { id: loadingToast }));
  };

  const handleDeleteCoord = (id, name) => {
    if (!window.confirm(`Are you sure you want to delete coordinator "${name}"?`)) return;
    const loadingToast = toast.loading('Deleting coordinator...');

    fetch(getApiUrl(`/api/admin/coordinators/${id}`), {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          toast.success('Coordinator deleted successfully', { id: loadingToast });
          setCoordinators(coordinators.filter(c => c.id !== id));
          fetchDashboardData();
          if (editingCoordId === id) resetCoordForm();
        } else {
          toast.error(result.message || 'Failed to delete coordinator', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error', { id: loadingToast }));
  };

  // ==================== HOMEPAGE STUDENT COORDINATORS HANDLERS ====================
  const fetchHomepageTeams = () => {
    fetchAdminHomepageCoordinators(token)
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setHomepageTeams(result.data);
        }
      })
      .catch(console.error);
  };

  const resetHpTeamForm = () => {
    setHpTeamRole('');
    setHpTeamTag('TEAM');
    setHpTeamIcon('Users');
    setHpTeamTier('emerald');
    setHpTeamTierManuallySelected(false);
    setHpTeamDesc('');
    setHpTeamOrder(String(homepageTeams.length + 1));
    setHpTeamIsActive(true);
    setHpTeamMembers([]);
    setNewMemberName('');
    setBatchMembersText('');
    setIsBatchInputOpen(false);
    setEditingHpTeamId(null);
    setIsHpTeamModalOpen(false);
  };

  const openCreateHpTeamModal = () => {
    resetHpTeamForm();
    setHpTeamTier('emerald');
    setHpTeamTierManuallySelected(false);
    setHpTeamOrder(String(homepageTeams.length + 1));
    setIsHpTeamModalOpen(true);
  };

  const openEditHpTeamModal = (team) => {
    setEditingHpTeamId(team.id);
    setHpTeamRole(team.role || '');
    setHpTeamTag(team.tag || 'TEAM');
    setHpTeamIcon(team.iconName || 'Users');
    setHpTeamTier(team.tier || 'emerald');
    setHpTeamTierManuallySelected(true);
    setHpTeamDesc(team.desc || '');
    setHpTeamOrder(String(team.displayOrder ?? 1));
    setHpTeamIsActive(team.isActive !== false);

    const members = (team.members && team.members.length > 0)
      ? team.members.map(m => typeof m === 'string' ? { name: m } : { name: m.name || '' })
      : (team.names || []).map(name => ({ name }));
    setHpTeamMembers(members);

    setNewMemberName('');
    setBatchMembersText('');
    setIsBatchInputOpen(false);
    setIsHpTeamModalOpen(true);
  };

  const handleAddMemberToTeam = () => {
    if (!newMemberName.trim()) {
      toast.error('Please enter a member name');
      return;
    }
    const memberObj = {
      name: newMemberName.trim()
    };
    setHpTeamMembers([...hpTeamMembers, memberObj]);
    setNewMemberName('');
  };

  const handleBatchAddMembers = () => {
    if (!batchMembersText.trim()) return;
    const lines = batchMembersText
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (lines.length === 0) return;
    const newItems = lines.map(name => ({ name }));
    setHpTeamMembers([...hpTeamMembers, ...newItems]);
    setBatchMembersText('');
    setIsBatchInputOpen(false);
    toast.success(`Added ${newItems.length} members!`);
  };

  const handleRemoveMember = (idxToRemove) => {
    setHpTeamMembers(hpTeamMembers.filter((_, i) => i !== idxToRemove));
  };

  const handleMoveMember = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= hpTeamMembers.length) return;
    const updated = [...hpTeamMembers];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setHpTeamMembers(updated);
  };

  const handleSaveHpTeam = (e) => {
    if (e) e.preventDefault();
    if (!hpTeamRole.trim()) {
      toast.error('Team Title / Role is required (e.g., MAIN COORDINATOR TEAM)');
      return;
    }

    const cleanNames = hpTeamMembers
      .map(m => (typeof m === 'string' ? m : (m.name || '')).trim())
      .filter(n => n.length > 0);

    const payload = {
      role: hpTeamRole.trim(),
      tag: hpTeamTag.trim() || 'TEAM',
      iconName: hpTeamIcon || 'Users',
      tier: hpTeamTier || 'cyan',
      desc: hpTeamDesc.trim(),
      members: cleanNames.map(name => ({ name })),
      names: cleanNames,
      displayOrder: Number(hpTeamOrder) || 1,
      isActive: hpTeamIsActive
    };

    const loadingToast = toast.loading(editingHpTeamId ? 'Updating homepage team...' : 'Creating homepage team...');

    if (editingHpTeamId) {
      updateHomepageCoordinatorTeam(editingHpTeamId, payload, token)
        .then(result => {
          if (result.success) {
            toast.success('Homepage team updated successfully!', { id: loadingToast });
            setHomepageTeams(homepageTeams.map(t => t.id === editingHpTeamId ? result.data : t));
            resetHpTeamForm();
            fetchDashboardData();
          } else {
            toast.error(result.message || 'Failed to update team', { id: loadingToast });
          }
        })
        .catch(() => toast.error('Server error updating team', { id: loadingToast }));
    } else {
      createHomepageCoordinatorTeam(payload, token)
        .then(result => {
          if (result.success) {
            toast.success('Homepage team created successfully!', { id: loadingToast });
            setHomepageTeams([...homepageTeams, result.data]);
            resetHpTeamForm();
            fetchDashboardData();
          } else {
            toast.error(result.message || 'Failed to create team', { id: loadingToast });
          }
        })
        .catch(() => toast.error('Server error creating team', { id: loadingToast }));
    }
  };

  const handleToggleHpTeam = (team) => {
    const loadingToast = toast.loading(`Toggling status for "${team.role}"...`);
    toggleHomepageCoordinatorTeam(team.id, token)
      .then(result => {
        if (result.success) {
          toast.success(result.message, { id: loadingToast });
          setHomepageTeams(homepageTeams.map(t => t.id === team.id ? result.data : t));
          fetchDashboardData();
        } else {
          toast.error(result.message || 'Toggle failed', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error', { id: loadingToast }));
  };

  const handleDeleteHpTeam = (id, role) => {
    if (!window.confirm(`Are you sure you want to delete "${role}" from the homepage?`)) return;
    const loadingToast = toast.loading('Deleting team...');
    deleteHomepageCoordinatorTeam(id, token)
      .then(result => {
        if (result.success) {
          toast.success('Homepage team deleted successfully', { id: loadingToast });
          setHomepageTeams(homepageTeams.filter(t => t.id !== id));
          fetchDashboardData();
        } else {
          toast.error(result.message || 'Failed to delete team', { id: loadingToast });
        }
      })
      .catch(() => toast.error('Server error', { id: loadingToast }));
  };

  const renderHpCoordinatorIcon = (iconName, tier = 'emerald', size = 20) => {
    const t = String(tier).toLowerCase();
    const foundTheme = COORDINATOR_THEMES.find(ct => ct.id === t);
    const strokeColor = foundTheme ? foundTheme.primaryColor : '#39ff88';

    switch (iconName) {
      case 'Code':
      case 'Terminal':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        );
      case 'Rocket':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-2.5 5-2.5" />
            <path d="M12 15v5s3.03-.55 4.5-2c1.63-1.62 2.5-5 2.5-5" />
          </svg>
        );
      case 'Sparkles':
      case 'Star':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
          </svg>
        );
      case 'Shield':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        );
      case 'Users':
      default:
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
    }
  };

  // Helper for counting users in a role
  const getUserCountForRole = (rName) => {
    return (users || []).filter(u => String(u?.role || '').toLowerCase() === String(rName || '').toLowerCase()).length;
  };

  // Filtered lists
  const filteredUsers = (users || []).filter(u => {
    if (!u) return false;
    const q = (userSearch || '').toLowerCase().trim();
    if (!q) return true;
    const uName = (u.username || '').toLowerCase();
    const uRole = (u.role || '').toLowerCase();
    return uName.includes(q) || uRole.includes(q);
  });

  const filteredEventsList = (eventsList || []).filter(evt => {
    if (!evt) return false;
    const matchesCategory = eventFilter === 'all' || evt.category === eventFilter;
    const q = (eventSearch || '').toLowerCase().trim();
    const matchesSearch = !q || 
      (evt.name && String(evt.name).toLowerCase().includes(q)) ||
      (evt.alias && String(evt.alias).toLowerCase().includes(q)) ||
      (evt.venue && String(evt.venue).toLowerCase().includes(q)) ||
      (evt.timing && String(evt.timing).toLowerCase().includes(q)) ||
      (evt.fee && String(evt.fee).toLowerCase().includes(q)) ||
      (evt.id && String(evt.id).toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const filteredSponsors = (sponsors || []).filter(s => {
    if (!s) return false;
    const q = (sponsorSearch || '').toLowerCase().trim();
    const matchesSearch = !q || 
      (s.name && String(s.name).toLowerCase().includes(q)) ||
      (s.companyName && String(s.companyName).toLowerCase().includes(q)) ||
      (s.contactName && String(s.contactName).toLowerCase().includes(q)) ||
      (s.category && String(s.category).toLowerCase().includes(q));
    const matchesCategory = sponsorCategoryFilter === 'all' || s.category === sponsorCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredCoordinators = (coordinators || []).filter(c => {
    if (!c) return false;
    const q = (coordSearch || '').toLowerCase().trim();
    const matchesSearch = !q || 
      (c.name && String(c.name).toLowerCase().includes(q)) ||
      (c.phone && String(c.phone).toLowerCase().includes(q)) ||
      (c.email && String(c.email).toLowerCase().includes(q)) ||
      (c.department && String(c.department).toLowerCase().includes(q)) ||
      (c.role && String(c.role).toLowerCase().includes(q));
    
    const matchesEvent = coordEventFilter === 'all' || 
      (Array.isArray(c.assignedEvents) && c.assignedEvents.some(e => String(e).toLowerCase() === String(coordEventFilter).toLowerCase()));

    return matchesSearch && matchesEvent;
  });

  const filteredHpTeams = (homepageTeams || []).filter(team => {
    if (!team) return false;
    const q = (hpTeamSearch || '').toLowerCase().trim();
    return !q || 
      (team.role && String(team.role).toLowerCase().includes(q)) ||
      (team.tag && String(team.tag).toLowerCase().includes(q)) ||
      (team.desc && String(team.desc).toLowerCase().includes(q)) ||
      (Array.isArray(team.members) && team.members.some(m => {
        const mName = typeof m === 'string' ? m : (m && m.name);
        return mName && String(mName).toLowerCase().includes(q);
      })) ||
      (Array.isArray(team.names) && team.names.some(n => n && String(n).toLowerCase().includes(q)));
  });

  const displayAllocUsers = (allocUsersList && allocUsersList.length > 0)
    ? allocUsersList
    : (users && users.length > 0 ? users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        assignedEvents: Array.isArray(u.assignedEvents) ? u.assignedEvents : (Array.isArray(u.assigned_events) ? u.assigned_events : (u.eventId ? [u.eventId] : []))
      })) : []);

  const filteredAllocUsers = displayAllocUsers.filter(u => {
    if (!u) return false;
    const q = (allocUserSearch || '').toLowerCase().trim();
    if (!q) return true;
    const uName = (u.username || '').toLowerCase();
    const uRole = (u.role || '').toLowerCase();
    const evts = Array.isArray(u.assignedEvents) ? u.assignedEvents : (Array.isArray(u.assigned_events) ? u.assigned_events : (u.eventId ? [u.eventId] : []));
    const assigned = evts.join(' ').toLowerCase();
    return uName.includes(q) || uRole.includes(q) || assigned.includes(q);
  });

  const isUserManagementActive = activeTab === 'manage-users' || activeTab === 'manage-roles';

  // Dynamic Theme-Aware Styles
  const S = {
    container: { display: 'flex', height: '100vh', maxHeight: '100vh', overflow: 'hidden', background: isDark ? '#0b0f19' : '#f8fafc', color: isDark ? '#e2e8f0' : '#0f172a', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', transition: 'background 0.2s ease, color 0.2s ease' },
    loadingContainer: { display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: isDark ? '#0b0f19' : '#f8fafc' },
    spinner: { width: '40px', height: '40px', border: isDark ? '3px solid #1e293b' : '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    
    // Sidebar - Fixed & Sticky
    sidebar: { width: '280px', height: '100vh', position: 'sticky', top: 0, background: isDark ? '#111827' : '#ffffff', borderRight: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 20, transition: 'background 0.2s ease' },
    sidebarHeader: { padding: '1.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, borderBottom: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9' },
    logoCircle: { width: '42px', height: '42px', borderRadius: '12px', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    sidebarTitle: { margin: 0, fontSize: '1.15rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a', letterSpacing: '-0.02em' },
    sidebarSubtitle: { fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '600', letterSpacing: '0.04em' },
    
    // Nav
    navMenu: { flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' },
    navItem: { display: 'flex', alignItems: 'center', padding: '0.85rem 1rem', borderRadius: '10px', border: 'none', background: 'transparent', color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.92rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', width: '100%' },
    navItemActive: { background: isDark ? '#1e3a8a' : '#eff6ff', color: isDark ? '#93c5fd' : '#2563eb' },
    navIcon: { marginRight: '12px', fontSize: '1.1rem', flexShrink: 0 },
    
    // Dropdown
    dropdownGroup: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
    dropdownToggle: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', borderRadius: '10px', border: 'none', background: 'transparent', color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.92rem', fontWeight: '600', cursor: 'pointer', width: '100%', transition: 'all 0.2s ease' },
    dropdownToggleActive: { color: isDark ? '#f9fafb' : '#0f172a', background: isDark ? '#1f2937' : '#f8fafc' },
    dropdownToggleLeft: { display: 'flex', alignItems: 'center' },
    dropdownChevron: { color: isDark ? '#6b7280' : '#94a3b8', display: 'flex', alignItems: 'center' },
    submenu: { display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.5rem', marginTop: '0.2rem', marginBottom: '0.4rem' },
    subnavItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderRadius: '8px', border: 'none', background: 'transparent', color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.86rem', fontWeight: '500', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' },
    subnavItemActive: { background: isDark ? '#1e3a8a' : '#dbeafe', color: isDark ? '#93c5fd' : '#1d4ed8', fontWeight: '700' },
    subnavIcon: { marginRight: '10px', fontSize: '0.95rem' },
    badgeCount: { background: isDark ? '#374151' : '#e2e8f0', color: isDark ? '#e5e7eb' : '#475569', padding: '0.15rem 0.45rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700' },

    sidebarFooter: { padding: '1.25rem 1rem', flexShrink: 0, borderTop: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9' },
    logoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0.8rem', background: isDark ? '#451a1a' : '#fef2f2', color: '#ef4444', border: isDark ? '1px solid #7f1d1d' : '1px solid #fee2e2', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s ease' },
    
    // Main Layout - Constrained with Independent Content Scroll
    mainContent: { flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowX: 'hidden', overflowY: 'hidden' },
    topHeader: { background: isDark ? '#111827' : '#ffffff', minHeight: '85px', padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0, backdropFilter: 'blur(8px)' },
    pageTitle: { margin: 0, fontSize: '1.5rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a', letterSpacing: '-0.02em' },
    pageSubtitle: { margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '400' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
    themeToggleBtn: { background: isDark ? '#1f2937' : '#f1f5f9', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0', borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' },
    userProfile: { display: 'flex', alignItems: 'center' },
    avatar: { width: '42px', height: '42px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem', border: '2px solid #ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
    contentWrapper: { padding: '2.5rem', flex: 1, overflowY: 'auto' },

    // Views & Headers
    viewContainer: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    viewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
    viewDescription: { margin: 0, fontSize: '0.9rem', color: isDark ? '#9ca3af' : '#64748b', maxWidth: '650px' },
    searchBox: { flex: 1, minWidth: '260px' },
    searchInput: { width: '100%', padding: '0.75rem 1.25rem', borderRadius: '10px', border: isDark ? '1px solid #374151' : '1px solid #cbd5e1', background: isDark ? '#1f2937' : '#ffffff', fontSize: '0.9rem', outline: 'none', color: isDark ? '#f9fafb' : '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
    createBtn: { display: 'flex', alignItems: 'center', background: '#2563eb', color: '#ffffff', border: 'none', padding: '0.75rem 1.4rem', borderRadius: '10px', fontSize: '0.92rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.25)', transition: 'background 0.2s', whiteSpace: 'nowrap' },

    // Filter Buttons
    filterBtn: { padding: '0.55rem 1rem', borderRadius: '8px', border: isDark ? '1px solid #374151' : '1px solid #cbd5e1', background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' },
    filterBtnActive: { background: '#2563eb', color: '#ffffff', border: '1px solid #2563eb' },

    // Cards & Tables
    card: { background: isDark ? '#111827' : '#ffffff', borderRadius: '16px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)', overflow: 'hidden' },
    cardHeaderFlex: { padding: '1.25rem 1.75rem', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', background: isDark ? '#1a2234' : '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' },
    cardTitle: { margin: 0, fontSize: '1.05rem', fontWeight: '700', color: isDark ? '#f9fafb' : '#0f172a' },
    tableResponsive: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { background: isDark ? '#111827' : '#ffffff', padding: '1rem 1.75rem', textAlign: 'left', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' },
    tr: { borderBottom: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9' },
    td: { padding: '1.1rem 1.75rem', color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.9rem' },
    
    userCell: { display: 'flex', alignItems: 'center', gap: '10px' },
    userAvatarSm: { width: '32px', height: '32px', borderRadius: '8px', background: isDark ? '#312e81' : '#e0e7ff', color: isDark ? '#c7d2fe' : '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 },
    strongText: { fontWeight: '600', color: isDark ? '#f9fafb' : '#0f172a' },
    idBadge: { background: isDark ? '#1f2937' : '#f1f5f9', color: isDark ? '#9ca3af' : '#475569', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' },
    idBadgeMini: { background: isDark ? '#1e293b' : '#e2e8f0', color: isDark ? '#93c5fd' : '#1e40af', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', marginRight: '6px' },
    tableSubText: { fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b', marginTop: '3px' },
    venueText: { display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: isDark ? '#e2e8f0' : '#334155' },
    timeText: { display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: isDark ? '#e2e8f0' : '#334155' },
    feeHighlight: { fontWeight: '700', color: '#10b981', fontSize: '0.95rem' },

    badgeTech: { display: 'inline-flex', alignItems: 'center', background: isDark ? '#1e3a8a' : '#eff6ff', color: isDark ? '#93c5fd' : '#1d4ed8', border: isDark ? '1px solid #1e40af' : '1px solid #bfdbfe', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' },
    badgeNonTech: { display: 'inline-flex', alignItems: 'center', background: isDark ? '#831843' : '#fdf2f8', color: isDark ? '#fbcfe8' : '#be185d', border: isDark ? '1px solid #9d174d' : '1px solid #fbcfe8', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' },
    badgeOnline: { display: 'inline-flex', alignItems: 'center', gap: '5px', background: isDark ? '#1e3a8a' : '#eff6ff', color: isDark ? '#93c5fd' : '#1d4ed8', border: isDark ? '1px solid #1e40af' : '1px solid #bfdbfe', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' },
    badgeOffline: { display: 'inline-flex', alignItems: 'center', gap: '5px', background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#6ee7b7' : '#047857', border: isDark ? '1px solid #047857' : '1px solid #a7f3d0', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' },
    badgePaid: { display: 'inline-flex', alignItems: 'center', background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#a7f3d0' : '#047857', border: isDark ? '1px solid #047857' : '1px solid #a7f3d0', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' },
    badgePending: { display: 'inline-flex', alignItems: 'center', background: isDark ? '#78350f' : '#fef3c7', color: isDark ? '#fde68a' : '#92400e', border: isDark ? '1px solid #92400e' : '1px solid #fde68a', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' },
    actionBtnView: { background: isDark ? '#1e293b' : '#eff6ff', border: isDark ? '1px solid #3b82f6' : '1px solid #bfdbfe', color: isDark ? '#93c5fd' : '#1d4ed8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', padding: '0.4rem 0.7rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s' },
    
    roleBadge: { display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.03em' },
    roleBadgeSuper: { background: isDark ? '#78350f' : '#fef3c7', color: isDark ? '#fde68a' : '#92400e', border: isDark ? '1px solid #92400e' : '1px solid #fde68a' },
    roleBadgeAdmin: { background: isDark ? '#312e81' : '#e0e7ff', color: isDark ? '#c7d2fe' : '#3730a3', border: isDark ? '1px solid #4338ca' : '1px solid #c7d2fe' },
    roleBadgeDefault: { background: isDark ? '#1f2937' : '#f1f5f9', color: isDark ? '#9ca3af' : '#334155', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0' },
    
    userCountBadge: { background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#a7f3d0' : '#065f46', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' },
    systemBadge: { background: isDark ? '#1f2937' : '#f1f5f9', color: isDark ? '#9ca3af' : '#64748b', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' },
    customBadge: { background: isDark ? '#064e3b' : '#f0fdf4', color: isDark ? '#6ee7b7' : '#166534', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' },
    
    statusActive: { color: '#10b981', fontWeight: '600', fontSize: '0.85rem' },
    actionBtnEdit: { background: isDark ? '#1e3a8a' : '#eff6ff', border: isDark ? '1px solid #2563eb' : '1px solid #bfdbfe', color: isDark ? '#93c5fd' : '#2563eb', cursor: 'pointer', fontSize: '0.88rem', padding: '0.45rem 0.65rem', borderRadius: '6px', marginRight: '0.5rem', transition: 'all 0.15s' },
    actionBtnDelete: { background: isDark ? '#451a1a' : '#fef2f2', border: isDark ? '1px solid #7f1d1d' : '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', fontSize: '0.88rem', padding: '0.45rem 0.65rem', borderRadius: '6px', transition: 'all 0.15s' },
    emptyState: { padding: '3rem', textAlign: 'center', color: isDark ? '#6b7280' : '#94a3b8', fontSize: '0.9rem' },

    // Stats Grid for Dashboard
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
    statCard: { background: isDark ? '#111827' : '#ffffff', padding: '1.75rem', borderRadius: '16px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    statLabel: { color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
    statValue: { color: isDark ? '#f9fafb' : '#0f172a', fontSize: '2.2rem', fontWeight: '800' },
    dashboardView: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },

    // Overlay Modals
    modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' },
    modalCard: { background: isDark ? '#111827' : '#ffffff', width: '100%', maxWidth: '540px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' },
    modalHeader: { padding: '1.5rem 1.75rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9', background: isDark ? '#111827' : '#ffffff' },
    modalHeaderLeft: { display: 'flex', gap: '14px', alignItems: 'center' },
    modalIconBox: { width: '42px', height: '42px', borderRadius: '10px', background: isDark ? '#1e3a8a' : '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    modalIconBoxRole: { width: '42px', height: '42px', borderRadius: '10px', background: isDark ? '#064e3b' : '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    modalIconBoxEvent: { width: '42px', height: '42px', borderRadius: '10px', background: isDark ? '#312e81' : '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    modalIconBoxReg: { width: '42px', height: '42px', borderRadius: '10px', background: isDark ? '#1e3a8a' : '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    modalTitle: { margin: 0, fontSize: '1.15rem', fontWeight: '700', color: isDark ? '#f9fafb' : '#0f172a' },
    modalSubtitle: { margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#64748b' },
    modalCloseBtn: { background: isDark ? '#1f2937' : '#f8fafc', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s' },
    modalForm: { display: 'flex', flexDirection: 'column' },
    modalFormBody: { padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: isDark ? '#111827' : '#ffffff' },
    modalInputGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.85rem', fontWeight: '600', color: isDark ? '#cbd5e1' : '#334155' },
    input: { padding: '0.75rem 1rem', border: isDark ? '1px solid #374151' : '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.92rem', outline: 'none', background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#0f172a', width: '100%', boxSizing: 'border-box' },
    inputHelper: { fontSize: '0.75rem', color: isDark ? '#6b7280' : '#94a3b8', marginTop: '0.2rem' },
    select: { padding: '0.75rem 1rem', border: isDark ? '1px solid #374151' : '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.92rem', outline: 'none', background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#0f172a', width: '100%', boxSizing: 'border-box' },
    modalFooter: { padding: '1.25rem 1.75rem', borderTop: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9', background: isDark ? '#1a2234' : '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center' },
    primaryBtn: { padding: '0.75rem 1.5rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.92rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 5px rgba(37,99,235,0.25)' },
    cancelBtn: { padding: '0.75rem 1.2rem', background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#cbd5e1' : '#475569', border: isDark ? '1px solid #374151' : '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.92rem', fontWeight: '600', cursor: 'pointer' }
  };

  if (loading) {
    return (
      <div style={S.loadingContainer}>
        <div style={S.spinner}></div>
      </div>
    );
  }

  return (
    <div style={S.container} className="admin-layout-container">
      {/* ======================================================== */}
      {/* SIDEBAR                                                  */}
      {/* ======================================================== */}
      <aside style={S.sidebar} className={`admin-sidebar ${mobileSidebarOpen ? 'admin-sidebar-open' : ''}`}>
        <div style={S.sidebarHeader} className="admin-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={S.logoCircle}>
              <FaUserShield size={22} />
            </div>
            <div>
              <h2 style={S.sidebarTitle}>{isVerificationRole ? 'Verification Panel' : isLeadCoordinator ? 'Coordinator Panel' : 'Admin Panel'}</h2>
              <span style={S.sidebarSubtitle}>{isVerificationRole ? 'Eloquence 2026' : isLeadCoordinator ? 'Eloquence 2026 (View Only)' : 'Eloquence 2026'}</span>
            </div>
          </div>
          <button
            type="button"
            className="admin-mobile-menu-btn"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileSidebarOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>
        
        <nav style={S.navMenu} className={`admin-sidebar-nav ${mobileSidebarOpen ? 'open' : ''}`}>
          {/* Dashboard Tab */}
          <button 
            type="button"
            style={activeTab === 'dashboard' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
            onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FaChartBar style={S.navIcon} />
                <span>Dashboard</span>
              </div>
              {unverifiedRegistrations.length > 0 && (
                <span style={{
                  ...S.badgeCount,
                  background: isDark ? '#78350f' : '#fef3c7',
                  color: isDark ? '#fde68a' : '#b45309',
                  border: isDark ? '1px solid #92400e' : '1px solid #fde68a',
                  fontWeight: '800'
                }}>
                  {unverifiedRegistrations.length} NEW
                </span>
              )}
            </div>
          </button>

          {/* Registration Verification (UTR Audit) Tab */}
          <button 
            type="button"
            id="admin-nav-registration-verification-btn"
            style={activeTab === 'registration-verification' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
            onClick={(e) => { e.preventDefault(); setActiveTab('registration-verification'); setMobileSidebarOpen(false); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FaUserCheck style={S.navIcon} />
                <span>Registration Verification</span>
              </div>
              <span style={{
                ...S.badgeCount,
                background: pendingUtrCount > 0 ? (isDark ? '#78350f' : '#fef3c7') : (isDark ? '#1e293b' : '#f1f5f9'),
                color: pendingUtrCount > 0 ? (isDark ? '#fde68a' : '#b45309') : (isDark ? '#9ca3af' : '#64748b'),
                border: pendingUtrCount > 0 ? (isDark ? '1px solid #92400e' : '1px solid #fde68a') : 'none'
              }}>
                {pendingUtrCount > 0 ? `${pendingUtrCount} PENDING` : `${utrRegistrationsList.length}`}
              </span>
            </div>
          </button>

          {!isVerificationRole && (
            <>
              {/* Events Tab */}
              <button 
                type="button"
                id="admin-nav-events-btn"
                style={activeTab === 'events' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
                onClick={(e) => { e.preventDefault(); setActiveTab('events'); setMobileSidebarOpen(false); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FaCalendarAlt style={S.navIcon} />
                    <span>Events</span>
                  </div>
                  <span style={S.badgeCount}>{eventsList.length}</span>
                </div>
              </button>

              {/* User Management Dropdown Group (Superadmin & Admin only) */}
              {isAdminOrSuper && (
                <div style={S.dropdownGroup}>
                  <button 
                    style={isUserManagementActive ? { ...S.dropdownToggle, ...S.dropdownToggleActive } : S.dropdownToggle}
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  >
                    <div style={S.dropdownToggleLeft}>
                      <FaUsers style={S.navIcon} />
                      <span>User Management</span>
                    </div>
                    <span style={S.dropdownChevron}>
                      {isUserDropdownOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                    </span>
                  </button>

                  {/* Dropdown Submenu */}
                  {isUserDropdownOpen && (
                    <div style={S.submenu}>
                      <button 
                        style={activeTab === 'manage-users' ? { ...S.subnavItem, ...S.subnavItemActive } : S.subnavItem}
                        onClick={() => { setActiveTab('manage-users'); setMobileSidebarOpen(false); }}
                      >
                        <FaUserCheck style={S.subnavIcon} />
                        <span>Manage Users</span>
                        <span style={S.badgeCount}>{users.length}</span>
                      </button>

                      <button 
                        style={activeTab === 'manage-roles' ? { ...S.subnavItem, ...S.subnavItemActive } : S.subnavItem}
                        onClick={() => { setActiveTab('manage-roles'); setMobileSidebarOpen(false); }}
                      >
                        <FaShieldAlt style={S.subnavIcon} />
                        <span>Manage Roles</span>
                        <span style={S.badgeCount}>{roles.length}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sponsors Tab */}
              <button 
                type="button"
                style={activeTab === 'manage-sponsors' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
                onClick={(e) => { e.preventDefault(); setActiveTab('manage-sponsors'); setMobileSidebarOpen(false); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FaHandshake style={S.navIcon} />
                    <span>Sponsors</span>
                  </div>
                  <span style={S.badgeCount}>{sponsors.length}</span>
                </div>
              </button>

              {/* Members (Event Team & Coordinators) Tab */}
              <button 
                type="button"
                style={activeTab === 'manage-coordinators' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
                onClick={(e) => { e.preventDefault(); setActiveTab('manage-coordinators'); setMobileSidebarOpen(false); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FaUsers style={S.navIcon} />
                    <span>Members</span>
                  </div>
                  <span style={S.badgeCount}>{coordinators.length}</span>
                </div>
              </button>

              {/* Event Allocate Tab (Admin / Superadmin) */}
              {isAdminOrSuper && (
                <button 
                  type="button"
                  style={activeTab === 'allocate-events' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
                  onClick={(e) => { e.preventDefault(); setActiveTab('allocate-events'); setMobileSidebarOpen(false); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FaCalendarAlt style={S.navIcon} />
                      <span>Event Allocate</span>
                    </div>
                    <span style={{ ...S.badgeCount, background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#6ee7b7' : '#047857', fontWeight: '800' }}>
                      ALLOC
                    </span>
                  </div>
                </button>
              )}

              {/* Homepage Student-Coordinator Team Tab */}
              <button 
                type="button"
                style={activeTab === 'homepage-coordinators' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
                onClick={(e) => { e.preventDefault(); setActiveTab('homepage-coordinators'); setMobileSidebarOpen(false); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FaUsers style={S.navIcon} />
                    <span>Homepage Student-Coordinator Team</span>
                  </div>
                  <span style={S.badgeCount}>{homepageTeams.length}</span>
                </div>
              </button>

              {/* Registrations Tab */}
              <button 
                style={activeTab === 'registrations' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
                onClick={() => setActiveTab('registrations')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FaIdCard style={S.navIcon} />
                    <span>Registrations</span>
                  </div>
                  <span style={S.badgeCount}>{registrationsList.length}</span>
                </div>
              </button>

              {/* Search & Verify Participant Tab */}
              <button 
                type="button"
                style={activeTab === 'search-participant' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
                onClick={(e) => { e.preventDefault(); setActiveTab('search-participant'); setMobileSidebarOpen(false); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FaQrcode style={S.navIcon} />
                    <span>Search & Verify</span>
                  </div>
                  <span style={{ ...S.badgeCount, background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#6ee7b7' : '#047857' }}>
                    QR
                  </span>
                </div>
              </button>

              {/* Participant List Tab */}
              <button 
                type="button"
                style={activeTab === 'participant-list' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
                onClick={(e) => { e.preventDefault(); setActiveTab('participant-list'); setMobileSidebarOpen(false); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FaUsers style={S.navIcon} />
                    <span>Participant List</span>
                  </div>
                  <span style={S.badgeCount}>{registrationsList.length}</span>
                </div>
              </button>

              {/* Close RG Tab (Superadmin & Admin only) */}
              {isAdminOrSuper && (
                <button 
                  type="button"
                  style={activeTab === 'close-rg' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
                  onClick={(e) => { e.preventDefault(); setActiveTab('close-rg'); setMobileSidebarOpen(false); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <FaLock style={{ ...S.navIcon, color: registrationSettings.isRegistrationClosed ? '#ef4444' : '#10b981' }} />
                      <span style={{ fontWeight: '600' }}>Close RG</span>
                    </div>
                    <span style={{
                      ...S.badgeCount,
                      background: registrationSettings.isRegistrationClosed 
                        ? (isDark ? '#451a1a' : '#fef2f2') 
                        : (isDark ? '#064e3b' : '#ecfdf5'),
                      color: registrationSettings.isRegistrationClosed ? '#ef4444' : '#10b981',
                      border: registrationSettings.isRegistrationClosed 
                        ? (isDark ? '1px solid #7f1d1d' : '1px solid #fee2e2') 
                        : (isDark ? '1px solid #05966940' : '1px solid #bbf7d0'),
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      letterSpacing: '0.04em'
                    }}>
                      {registrationSettings.isRegistrationClosed ? 'CLOSED' : 'OPEN'}
                    </span>
                  </div>
                </button>
              )}
            </>
          )}
        </nav>

        <div style={S.sidebarFooter} className="admin-sidebar-footer">
          <button onClick={onLogout} style={S.logoutBtn}>
            <FaSignOutAlt style={S.navIcon} /> Log Out
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN CONTENT                                             */}
      {/* ======================================================== */}
      <main style={S.mainContent} className="admin-main-content">
        <header style={S.topHeader} className="admin-top-header">
          <div>
            <h1 style={S.pageTitle} className="admin-page-title">
              {activeTab === 'dashboard' && 'Overview Dashboard'}
              {activeTab === 'events' && 'Events Management'}
              {activeTab === 'manage-users' && 'User Management'}
              {activeTab === 'manage-roles' && 'Role Management'}
              {activeTab === 'manage-sponsors' && 'Sponsor Management'}
              {activeTab === 'manage-coordinators' && 'Event Members & Coordinators'}
              {activeTab === 'allocate-events' && 'Event Coordinator Allocation'}
              {activeTab === 'homepage-coordinators' && 'Homepage Student-Coordinator Team'}
              {activeTab === 'registrations' && 'Participant Registrations & Verification'}
              {activeTab === 'registration-verification' && 'Registration Verification'}
              {activeTab === 'search-participant' && 'Search & Verify Participant (QR Check-in)'}
              {activeTab === 'participant-list' && 'Event-Wise Participant & Team List'}
              {activeTab === 'close-rg' && 'Close RG — Registration Access Control'}
            </h1>
            <p style={S.pageSubtitle}>
              {activeTab === 'dashboard' && 'Live event analytics, registrations, and entity metrics.'}
              {activeTab === 'events' && (isLeadCoordinator ? 'Browse symposium event details, schedules, venues, and competition rules.' : 'Edit event details, venues, schedules, and entry fees in real-time.')}
              {activeTab === 'manage-users' && 'Create, edit, assign roles, and remove system user accounts.'}
              {activeTab === 'manage-roles' && 'Configure custom access roles, permissions, and security hierarchy.'}
              {activeTab === 'manage-sponsors' && (isLeadCoordinator ? 'View event partners, sponsorship categories, and contact information.' : 'Manage event partners, categories, logos, contact info, and public visibility.')}
              {activeTab === 'manage-coordinators' && (isLeadCoordinator ? 'View student coordinators and sub-coordinators allocated across symposium events.' : 'Allocate Lead Coordinators, Coordinators, and Sub-Coordinators with phone numbers across all symposium events.')}
              {activeTab === 'allocate-events' && 'Allocate specific events to coordinator accounts. Coordinators can only see and manage their allocated event(s).'}
              {activeTab === 'homepage-coordinators' && (isLeadCoordinator ? 'View student coordinator teams displayed on the symposium homepage marquee.' : 'Manage student coordinator teams (Main Coordinator Team, Website Coordinator Team, etc.) displayed dynamically on the homepage marquee.')}
              {activeTab === 'registrations' && (isLeadCoordinator ? 'View all registered participants, verify ticket codes, and audit payment status.' : 'View and manage live online portal and offline on-site desk participant registrations with payment and ticket audit.')}
              {activeTab === 'registration-verification' && 'Audit UPI UTR payment references, verify transactions, flag disputes, or delete entries.'}
              {activeTab === 'search-participant' && 'Search by ticket code, name, phone, email, college or scan participant ticket QR code for live on-site verification & admission.'}
              {activeTab === 'participant-list' && (isLeadCoordinator ? 'Filter participants by event, view team names, inspect members, and export PDF sheets.' : 'Filter participants by event, view team names, export PDF sheets, and dispatch lists to Event Coordinators.')}
              {activeTab === 'close-rg' && 'Symposium-wide registration toggle. Instantly lock or open registrations across all events.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={toggleTheme}
              style={S.themeToggleBtn}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <FaSun size={17} style={{ color: '#fbbf24' }} /> : <FaMoon size={16} style={{ color: '#6366f1' }} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '1.15rem',
                border: '2px solid #ffffff',
                boxShadow: '0 3px 10px rgba(37, 99, 235, 0.35)',
                userSelect: 'none',
                flexShrink: 0
              }}>
                {(user?.username || 'Admin').charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '700', fontSize: '0.88rem', color: isDark ? '#f8fafc' : '#0f172a', lineHeight: '1.2' }}>
                  {user?.username || 'Admin'}
                </span>
                <span style={{ fontSize: '0.7rem', color: isDark ? '#93c5fd' : '#2563eb', fontWeight: '700', marginTop: '1px', textTransform: 'uppercase' }}>
                  {user?.role || (isLeadCoordinator ? 'Lead Coordinator' : 'Admin')} {isLeadCoordinator ? '(View Only)' : ''}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="admin-mobile-logout"
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                padding: '0.45rem 0.75rem',
                background: isDark ? '#451a1a' : '#fef2f2',
                color: '#ef4444',
                border: isDark ? '1px solid #7f1d1d' : '1px solid #fee2e2',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              title="Log Out"
            >
              <FaSignOutAlt />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        <div style={S.contentWrapper} className="admin-content-wrapper">
          {/* ======================================================== */}
          {/* 1. DASHBOARD VIEW                                        */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div style={S.dashboardView}>
              <div style={S.statsGrid} className="admin-stats-grid">
                {/* Total Registrations Card */}
                <div 
                  style={{ ...S.statCard, cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => {
                    if (isVerificationRole) {
                      setActiveTab('registration-verification');
                    } else {
                      setRegModeFilter('all');
                      setActiveTab('registrations');
                    }
                  }}
                  title="Click to view registrations"
                >
                  <div style={S.statLabel}>Total Registrations</div>
                  <div style={S.statValue}>{registrationsList.length || data?.stats?.totalRegistrations || 0}</div>
                  <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '700' }}>
                    ₹{totalRevenue || data?.stats?.revenue || 0} Total Revenue
                  </div>
                </div>

                {/* Online Registrations Card */}
                <div 
                  style={{ ...S.statCard, cursor: 'pointer', borderLeft: isDark ? '4px solid #3b82f6' : '4px solid #2563eb', transition: 'all 0.2s ease' }}
                  onClick={() => {
                    if (isVerificationRole) {
                      setActiveTab('registration-verification');
                    } else {
                      setRegModeFilter('online');
                      setActiveTab('registrations');
                    }
                  }}
                  title="Click to view online registrations"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={S.statLabel}>Online Registrations</div>
                    <FaGlobe size={14} style={{ color: '#3b82f6' }} />
                  </div>
                  <div style={{ ...S.statValue, color: isDark ? '#93c5fd' : '#1d4ed8' }}>
                    {onlineRegs.length || data?.stats?.onlineRegistrations || 0}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: isDark ? '#60a5fa' : '#2563eb', fontWeight: '700' }}>
                    ₹{onlineRevenue || data?.stats?.onlineRevenue || 0} Online Collection
                  </div>
                </div>

                {/* Offline On-Site Desk Registrations Card */}
                <div 
                  style={{ ...S.statCard, cursor: 'pointer', borderLeft: isDark ? '4px solid #10b981' : '4px solid #059669', transition: 'all 0.2s ease' }}
                  onClick={() => {
                    if (isVerificationRole) {
                      setActiveTab('registration-verification');
                    } else {
                      setRegModeFilter('offline');
                      setActiveTab('registrations');
                    }
                  }}
                  title="Click to view offline desk registrations"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={S.statLabel}>Offline Desk Registrations</div>
                    <FaCashRegister size={14} style={{ color: '#10b981' }} />
                  </div>
                  <div style={{ ...S.statValue, color: isDark ? '#6ee7b7' : '#047857' }}>
                    {offlineRegs.length || data?.stats?.offlineRegistrations || 0}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: isDark ? '#34d399' : '#059669', fontWeight: '700' }}>
                    ₹{offlineRevenue || data?.stats?.offlineRevenue || 0} Desk Collection
                  </div>
                </div>

                {/* Active Events */}
                <div style={S.statCard}>
                  <div style={S.statLabel}>Active Events</div>
                  <div style={S.statValue}>{eventsList.length}</div>
                  <div style={{ fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                    6 Tech • 6 Non-Tech
                  </div>
                </div>

                {/* Sponsors */}
                <div style={S.statCard}>
                  <div style={S.statLabel}>Sponsors</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={S.statValue}>{data?.stats?.totalSponsors || sponsors.length}</span>
                    <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '700' }}>
                      ({data?.stats?.activeSponsors || sponsors.filter(s => s.isActive !== false).length} Active)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                    Symposium Partners
                  </div>
                </div>

                {/* Student Coordinators */}
                <div style={S.statCard}>
                  <div style={S.statLabel}>Student Coordinators</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={S.statValue}>{data?.stats?.totalCoordinators || coordinators.length}</span>
                    <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '700' }}>
                      ({data?.stats?.activeCoordinators || coordinators.filter(c => c.isActive !== false).length} Active)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                    Assigned Across Events
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* EVENT REGISTRATION PIE CHARTS (TECHNICAL & NON-TECHNICAL) */}
              {/* ======================================================== */}
              <EventRegistrationCharts
                registrationsList={registrationsList}
                eventsList={eventsList}
                isDark={isDark}
                onSelectEvent={(eventId, category) => {
                  if (isVerificationRole) {
                    setActiveTab('registration-verification');
                  } else {
                    setRegEventFilter(eventId);
                    if (category) setRegCategoryFilter(category);
                    setActiveTab('registrations');
                  }
                }}
              />

              {/* ======================================================== */}
              {/* NEW REGISTRATION NOTIFICATIONS (PENDING VERIFICATION)     */}
              {/* ======================================================== */}
              <div style={{
                ...S.card,
                border: unverifiedRegistrations.length > 0
                  ? (isDark ? '1.5px solid #f59e0b80' : '1.5px solid #fde68a')
                  : S.card.border,
                boxShadow: unverifiedRegistrations.length > 0
                  ? (isDark ? '0 8px 30px rgba(245, 158, 11, 0.09)' : '0 6px 24px rgba(245, 158, 11, 0.12)')
                  : S.card.boxShadow,
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  ...S.cardHeaderFlex,
                  padding: '1.25rem 1.75rem',
                  background: unverifiedRegistrations.length > 0
                    ? (isDark ? 'linear-gradient(90deg, #1e2538 0%, #171b26 100%)' : 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)')
                    : S.cardHeaderFlex.background
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: unverifiedRegistrations.length > 0
                        ? (isDark ? '#78350f' : '#fef3c7')
                        : (isDark ? '#064e3b' : '#ecfdf5'),
                      color: unverifiedRegistrations.length > 0 ? '#f59e0b' : '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.15rem',
                      boxShadow: unverifiedRegistrations.length > 0 ? '0 0 14px rgba(245, 158, 11, 0.4)' : 'none'
                    }}>
                      {unverifiedRegistrations.length > 0 ? <FaBell /> : <FaCheckCircle />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ ...S.cardTitle, margin: 0, fontSize: '1.1rem' }}>New Registration Notifications</h3>
                        <span style={{
                          padding: '0.2rem 0.65rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          letterSpacing: '0.04em',
                          background: unverifiedRegistrations.length > 0
                            ? (isDark ? '#78350f' : '#fef3c7')
                            : (isDark ? '#064e3b' : '#ecfdf5'),
                          color: unverifiedRegistrations.length > 0
                            ? (isDark ? '#fde68a' : '#b45309')
                            : (isDark ? '#6ee7b7' : '#047857'),
                          border: unverifiedRegistrations.length > 0
                            ? (isDark ? '1px solid #92400e' : '1px solid #fde68a')
                            : (isDark ? '1px solid #059669' : '1px solid #a7f3d0')
                        }}>
                          {unverifiedRegistrations.length > 0
                            ? `${unverifiedRegistrations.length} PENDING UNVERIFIED`
                            : 'ALL VERIFIED'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#64748b', marginTop: '2px', display: 'block' }}>
                        {unverifiedRegistrations.length > 0
                          ? 'Unchecked new registrations awaiting payment verification. Once verified, records automatically clear from this notification list.'
                          : 'Notification queue is clear. New incoming registrations will appear here in real-time.'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('registration-verification')}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                      }}
                    >
                      <FaUserCheck size={13} />
                      <span>Open Full Verification ({unverifiedRegistrations.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { fetchRegistrations(); fetchDashboardData(); }}
                      style={{
                        background: isDark ? '#1f2937' : '#ffffff',
                        border: isDark ? '1px solid #374151' : '1px solid #cbd5e1',
                        color: isDark ? '#cbd5e1' : '#475569',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      title="Refresh Registration Queue"
                    >
                      <FaSyncAlt size={11} />
                    </button>
                  </div>
                </div>

                {/* Unverified List or Empty State */}
                {unverifiedRegistrations.length > 0 ? (
                  <div style={S.tableResponsive}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Ticket Code</th>
                          <th style={S.th}>Participant & College</th>
                          <th style={S.th}>Event Enrolled</th>
                          <th style={S.th}>Payment & UTR / Mode</th>
                          <th style={S.th}>Amount</th>
                          <th style={S.th}>Registration Time</th>
                          <th style={{ ...S.th, textAlign: 'center' }}>Quick Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unverifiedRegistrations.slice(0, 8).map((reg) => {
                          const isOnline = isOnlineRecord(reg);
                          const ticketId = reg.ticket_code || reg.registrationId || reg.id;
                          const pName = reg.full_name || reg.fullName || reg.name || 'Anonymous';
                          const evtName = getEventName(reg) || reg.event || 'General';
                          const feeAmt = getFee(reg) || reg.fee || 0;
                          const utr = reg.upi_utr || reg.upiUtr || reg.transaction_id || reg.transactionId || reg.razorpay_payment_id || reg.razorpayPaymentId || '';
                          const dateText = reg.created_at ? new Date(reg.created_at).toLocaleDateString('en-IN') : (reg.createdAtFormatted || reg.date || 'Recent');
                          const timeText = reg.created_at ? new Date(reg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
                          const isVerifying = isQuickVerifyingId === (reg.id || reg.ticket_code || reg.registrationId);

                          return (
                            <tr key={ticketId} style={{ ...S.tr, background: isDark ? 'rgba(245, 158, 11, 0.03)' : 'rgba(254, 243, 199, 0.2)' }}>
                              <td style={S.td}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span
                                    style={{ ...S.idBadge, fontFamily: 'monospace', fontWeight: '800', cursor: 'pointer', color: '#2563eb' }}
                                    title="Click to copy Ticket Code"
                                    onClick={() => {
                                      navigator.clipboard.writeText(ticketId);
                                      toast.success(`Copied #${ticketId}`);
                                    }}
                                  >
                                    #{ticketId}
                                  </span>
                                </div>
                              </td>

                              <td style={S.td}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={S.strongText}>{pName}</span>
                                  <span style={S.tableSubText}>{reg.college || 'College not specified'}</span>
                                  <span style={{ fontSize: '0.74rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                                    {reg.phone || reg.email || ''}
                                  </span>
                                </div>
                              </td>

                              <td style={S.td}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  <span style={{ fontWeight: '700', color: isDark ? '#f9fafb' : '#0f172a' }}>{evtName}</span>
                                  <span style={isOnline ? S.badgeOnline : S.badgeOffline}>
                                    {isOnline ? <FaGlobe size={9} /> : <FaCashRegister size={9} />}
                                    <span>{isOnline ? 'Online' : 'Offline Desk'}</span>
                                  </span>
                                </div>
                              </td>

                              <td style={S.td}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                                  {utr ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span style={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.76rem',
                                        fontWeight: '800',
                                        background: isDark ? '#78350f' : '#fef3c7',
                                        color: isDark ? '#fde68a' : '#92400e',
                                        padding: '0.15rem 0.45rem',
                                        borderRadius: '4px',
                                        border: isDark ? '1px solid #92400e' : '1px solid #fde68a'
                                      }}>
                                        UTR: {utr}
                                      </span>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b', fontStyle: 'italic' }}>
                                      {reg.payment_method || reg.paymentMethod || 'Cash / Desk'}
                                    </span>
                                  )}
                                  <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: '800',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    background: isDark ? '#78350f' : '#fef3c7',
                                    color: isDark ? '#fde68a' : '#b45309'
                                  }}>
                                    UNVERIFIED
                                  </span>
                                </div>
                              </td>

                              <td style={S.td}>
                                <span style={{ fontWeight: '800', color: '#10b981', fontSize: '1rem' }}>₹{feeAmt}</span>
                              </td>

                              <td style={S.td}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '0.82rem', fontWeight: '600', color: isDark ? '#e2e8f0' : '#334155' }}>{dateText}</span>
                                  {timeText && (
                                    <span style={{ fontSize: '0.74rem', color: isDark ? '#9ca3af' : '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <FaClock size={9} /> {timeText}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td style={{ ...S.td, textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    disabled={isVerifying}
                                    onClick={() => handleQuickVerifyRegistration(reg)}
                                    style={{
                                      background: getRegScreenshot(reg)
                                        ? '#059669'
                                        : (Number(reg.totalAmount || reg.totalFee || reg.total_fee || 0) > 0 ? (isDark ? '#374151' : '#cbd5e1') : '#059669'),
                                      color: (getRegScreenshot(reg) || Number(reg.totalAmount || reg.totalFee || reg.total_fee || 0) === 0)
                                        ? '#ffffff'
                                        : (isDark ? '#9ca3af' : '#475569'),
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '0.45rem 0.85rem',
                                      fontSize: '0.82rem',
                                      fontWeight: '700',
                                      cursor: isVerifying ? 'not-allowed' : 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      boxShadow: '0 2px 6px rgba(5,150,105,0.3)',
                                      transition: 'all 0.15s ease'
                                    }}
                                    title={
                                      getRegScreenshot(reg)
                                        ? 'View payment screenshot & verify participant'
                                        : (Number(reg.totalAmount || reg.totalFee || reg.total_fee || 0) > 0 ? 'Cannot verify: Screenshot proof missing' : 'Confirm registration')
                                    }
                                  >
                                    {getRegScreenshot(reg) ? (
                                      <>
                                        <FaImage size={12} />
                                        <span>View &amp; Verify</span>
                                      </>
                                    ) : (
                                      <>
                                        <FaCheckCircle size={12} />
                                        <span>{isVerifying ? 'Verifying...' : 'Verify Now'}</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedRegDetails(reg);
                                      setIsRegDetailsModalOpen(true);
                                    }}
                                    style={S.actionBtnView}
                                    title="Inspect participant details"
                                  >
                                    <FaInfoCircle size={11} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {unverifiedRegistrations.length > 8 && (
                      <div style={{ padding: '0.85rem 1.75rem', textAlign: 'center', borderTop: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9' }}>
                        <button
                          onClick={() => setActiveTab('registration-verification')}
                          style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '0.86rem', cursor: 'pointer' }}
                        >
                          View all {unverifiedRegistrations.length} unverified notifications in Registration Verification →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    padding: '2.5rem 2rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.65rem'
                  }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
                    }}>
                      <FaCheckCircle size={30} />
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>
                      All Registrations Verified!
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: isDark ? '#9ca3af' : '#64748b', maxWidth: '480px' }}>
                      There are currently no pending or unverified registrations. When a participant registers, their record will immediately show here for quick verification.
                    </p>
                  </div>
                )}
              </div>

              <div style={S.card}>
                <div style={{ ...S.cardHeaderFlex, padding: '1.25rem 1.75rem' }}>
                  <h3 style={S.cardTitle}>Recent Registrations</h3>
                  <button 
                    onClick={() => {
                      if (isVerificationRole) {
                        setActiveTab('registration-verification');
                      } else {
                        setRegModeFilter('all');
                        setActiveTab('registrations');
                      }
                    }}
                    style={{ 
                      background: isDark ? '#1e293b' : '#eff6ff', 
                      border: isDark ? '1px solid #374151' : '1px solid #bfdbfe', 
                      color: isDark ? '#93c5fd' : '#2563eb', 
                      padding: '0.45rem 0.9rem', 
                      borderRadius: '8px', 
                      fontWeight: '700', 
                      fontSize: '0.85rem', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{isVerificationRole ? 'Open Registration Verification' : `View All Registrations (${registrationsList.length})`}</span>
                    <FaArrowRight size={11} />
                  </button>
                </div>
                <div style={S.tableResponsive}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>ID</th>
                        <th style={S.th}>Participant Name</th>
                        <th style={S.th}>Event Enrolled</th>
                        <th style={S.th}>Registration Mode</th>
                        <th style={S.th}>Amount</th>
                        <th style={S.th}>Date</th>
                        <th style={S.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(registrationsList.length > 0 ? [...registrationsList].reverse().slice(0, 6) : (data?.recentRegistrations || [])).map((reg) => {
                        const isOnline = isOnlineRecord(reg);
                        const ticketId = reg.ticket_code || reg.registrationId || reg.id;
                        const pName = reg.full_name || reg.fullName || reg.name || 'Anonymous';
                        const evtName = getEventName(reg) || reg.event || 'General';
                        const feeAmt = getFee(reg) || reg.fee || 0;
                        const dateText = reg.created_at ? new Date(reg.created_at).toLocaleDateString('en-IN') : (reg.createdAtFormatted || reg.date || 'Recent');

                        return (
                          <tr key={ticketId} style={S.tr}>
                            <td style={S.td}><span style={S.idBadge}>#{ticketId}</span></td>
                            <td style={S.td}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={S.strongText}>{pName}</span>
                                {reg.college && <span style={S.tableSubText}>{reg.college}</span>}
                              </div>
                            </td>
                            <td style={S.td}>
                              <span style={{ fontWeight: '600', color: isDark ? '#e2e8f0' : '#1e293b' }}>{evtName}</span>
                            </td>
                            <td style={S.td}>
                              <span style={isOnline ? S.badgeOnline : S.badgeOffline}>
                                {isOnline ? <FaGlobe size={10} /> : <FaCashRegister size={10} />}
                                {isOnline ? 'Online' : 'Offline Desk'}
                              </span>
                            </td>
                            <td style={S.td}>
                              <span style={{ fontWeight: '700', color: '#10b981' }}>₹{feeAmt}</span>
                            </td>
                            <td style={S.td}>{dateText}</td>
                            <td style={S.td}>
                              <button
                                onClick={() => {
                                  setSelectedRegDetails(reg);
                                  setIsRegDetailsModalOpen(true);
                                }}
                                style={S.actionBtnView}
                                title="View full registration details"
                              >
                                <FaInfoCircle size={11} />
                                <span>Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {!registrationsList.length && !data?.recentRegistrations?.length && (
                        <tr><td colSpan="7" style={S.emptyState}>No recent registrations found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. EVENTS MANAGEMENT VIEW                                */}
          {/* ======================================================== */}
          {activeTab === 'events' && (
            <div style={S.viewContainer}>
              <div style={S.viewHeader}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '650px', flexWrap: 'wrap' }}>
                  <div style={S.searchBox}>
                    <input 
                      type="text" 
                      placeholder="Search events by name, venue, timing, or fee..." 
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      style={S.searchInput}
                    />
                  </div>
                  <div style={S.filterGroup}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setEventFilter('all'); }}
                      style={eventFilter === 'all' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      All ({eventsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setEventFilter('technical'); }}
                      style={eventFilter === 'technical' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaBolt size={11} /> Technical ({eventsList.filter(e => e.category === 'technical').length})
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setEventFilter('non-technical'); }}
                      style={eventFilter === 'non-technical' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaGamepad size={12} /> Non-Tech ({eventsList.filter(e => e.category === 'non-technical').length})
                    </button>
                  </div>
                </div>
                {!isLeadCoordinator && (
                  <button onClick={handleOpenCreateEventModal} style={S.createBtn}>
                    <FaPlus style={{ marginRight: '8px' }} /> Add New Event
                  </button>
                )}
              </div>

              {/* Venue Photos Management Section */}
              <div style={{ ...S.card, marginBottom: '1.25rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '0.85rem' }}>
                  <div>
                    <h3 style={{ ...S.cardTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaBuilding style={{ color: '#3b82f6' }} /> Venue Photos Management
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Upload individual photos for each symposium venue. Each venue on the event rules page will exclusively display its own photo.
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '12px'
                }}>
                  {Array.from(new Set(eventsList.map(e => e.venue).filter(Boolean))).map((venueName) => {
                    const venueEvents = eventsList.filter(e => e.venue === venueName);
                    const photo = venueEvents.find(e => e.venueImage)?.venueImage;
                    const primaryEvent = venueEvents[0];

                    return (
                      <div
                        key={venueName}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          background: isDark ? '#1f2937' : '#f8fafc',
                          border: isDark ? '1px solid #374151' : '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{
                          width: '58px',
                          height: '44px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: isDark ? '#111827' : '#e2e8f0',
                          border: photo ? '1px solid #3b82f6' : '1px dashed #94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {photo ? (
                            <img src={photo} alt={venueName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <FaCamera size={14} color="#94a3b8" />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            color: isDark ? '#f3f4f6' : '#1e293b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {venueName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                            {photo ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaCheck style={{ color: '#10b981' }} /> Photo uploaded</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaExclamationTriangle style={{ color: '#f59e0b' }} /> No photo set</span>} &bull; {venueEvents.length} event{venueEvents.length > 1 ? 's' : ''}
                          </div>
                        </div>

                        {!isLeadCoordinator && primaryEvent && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditEventModal(primaryEvent)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              borderRadius: '6px',
                              background: photo ? (isDark ? '#374151' : '#e2e8f0') : (isDark ? '#1e3a8a' : '#eff6ff'),
                              color: photo ? (isDark ? '#e5e7eb' : '#334155') : (isDark ? '#93c5fd' : '#1d4ed8'),
                              border: 'none',
                              fontWeight: '600',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            title={`Upload or change photo for ${venueName}`}
                          >
                            {photo ? 'Edit' : '+ Add'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={S.card}>
                <div style={S.cardHeaderFlex}>
                  <h3 style={S.cardTitle}>Symposium Events ({filteredEventsList.length})</h3>
                  <span style={{ fontSize: '0.85rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                    {isLeadCoordinator 
                      ? 'Viewing symposium events, category breakdown, fees, venues, schedules, and competition rules.' 
                      : 'Edits made here synchronize directly with the live events and registration pages.'}
                  </span>
                </div>
                <div style={S.tableResponsive}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Poster</th>
                        <th style={S.th}>Event Name</th>
                        <th style={S.th}>Category</th>
                        <th style={S.th}>Venue</th>
                        <th style={S.th}>Schedule</th>
                        <th style={S.th}>Fee & Size</th>
                        <th style={{ ...S.th, textAlign: isLeadCoordinator ? 'center' : 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEventsList.map(evt => {
                        const eventBannerSrc = getEventBanner(evt);
                        return (
                        <tr key={evt.id} style={S.tr}>
                          <td style={S.td}>
                            <div style={{
                              width: '56px',
                              height: '42px',
                              borderRadius: '8px',
                              background: isDark ? '#1f2937' : '#f1f5f9',
                              border: isDark ? '1px solid #374151' : '1px solid #cbd5e1',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {eventBannerSrc ? (
                                <img src={eventBannerSrc} alt={evt.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <FaImage color="#94a3b8" size={18} />
                              )}
                            </div>
                          </td>
                          <td style={S.td}>
                            <div>
                              <span style={S.strongText}>{evt.name}</span>
                              <div style={S.tableSubText}>
                                <span style={S.idBadgeMini}>{evt.id.toUpperCase()}</span> {evt.subtitle || evt.alias}
                                <span 
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                                    color: isDark ? '#93c5fd' : '#2563eb',
                                    border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #bfdbfe',
                                    marginLeft: '6px',
                                    cursor: 'pointer'
                                  }}
                                  onClick={(e) => { e.stopPropagation(); handleOpenEditEventModal(evt); }}
                                  title={isLeadCoordinator ? "Click to view rules" : "Click to view and edit rules"}
                                >
                                  <FaListOl size={8} /> {((Array.isArray(evt.rules) && evt.rules.length) || rulesData[evt.id]?.rules?.length || 0)} Rules
                                </span>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '0.65rem',
                                    fontWeight: '600',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: isDark ? 'rgba(14, 165, 233, 0.15)' : '#f0f9ff',
                                    color: isDark ? '#38bdf8' : '#0284c7',
                                    border: isDark ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid #bae6fd',
                                    marginLeft: '4px',
                                    cursor: 'pointer'
                                  }}
                                  onClick={(e) => { e.stopPropagation(); handleOpenEditEventModal(evt); }}
                                  title={isLeadCoordinator ? "Click to view rounds" : "Click to view and edit rounds"}
                                >
                                  <FaLayerGroup size={8} /> {((Array.isArray(evt.rounds) && evt.rounds.length) || rulesData[evt.id]?.rounds?.length || 0)} Rounds
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={S.td}>
                            <span style={evt.category === 'technical' ? S.badgeTech : S.badgeNonTech}>
                              {evt.category === 'technical' ? (
                                <><FaBolt style={{ marginRight: '4px' }} /> Technical</>
                              ) : (
                                <><FaGamepad style={{ marginRight: '4px' }} /> Non-Tech</>
                              )}
                            </span>
                          </td>
                          <td style={S.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {evt.venueImage ? (
                                <img
                                  src={evt.venueImage}
                                  alt={evt.venue}
                                  style={{
                                    width: '32px',
                                    height: '24px',
                                    borderRadius: '4px',
                                    objectFit: 'cover',
                                    border: isDark ? '1px solid #374151' : '1px solid #cbd5e1',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleOpenEditEventModal(evt)}
                                  title="Venue photo attached - click to edit"
                                />
                              ) : null}
                              <span style={S.venueText}>
                                <FaBuilding style={{ color: '#64748b', marginRight: '6px', fontSize: '0.85rem' }} />
                                {evt.venue}
                              </span>
                            </div>
                          </td>
                          <td style={S.td}>
                            <span style={S.timeText}>
                              <FaClock style={{ color: '#64748b', marginRight: '6px', fontSize: '0.85rem' }} />
                              {evt.timing}
                            </span>
                          </td>
                          <td style={S.td}>
                            <div>
                              <span style={S.feeHighlight}>{evt.fee}</span>
                              {evt.teamSize && <div style={S.tableSubText}>{evt.teamSize}</div>}
                            </div>
                          </td>
                          <td style={{ ...S.td, textAlign: isLeadCoordinator ? 'center' : 'right', whiteSpace: 'nowrap' }}>
                            {isLeadCoordinator ? (
                              <button
                                onClick={() => handleOpenEditEventModal(evt)}
                                style={S.actionBtnView}
                                title="View Event Details & Rules"
                              >
                                <FaInfoCircle style={{ marginRight: '4px' }} /> Details
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenEditEventModal(evt)}
                                  style={S.actionBtnEdit}
                                  title="Edit Event Details & Poster"
                                >
                                  <FaEdit style={{ marginRight: '4px' }} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(evt.id, evt.name)}
                                  style={S.actionBtnDelete}
                                  title="Delete Event"
                                >
                                  <FaTrash style={{ marginRight: '4px' }} /> Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                      {!filteredEventsList.length && (
                        <tr>
                          <td colSpan="7" style={S.emptyState}>
                            No events match the search criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. MANAGE USERS VIEW                                     */}
          {/* ======================================================== */}
          {activeTab === 'manage-users' && (
            <div style={S.viewContainer}>
              <div style={S.viewHeader}>
                <div style={S.searchBox}>
                  <input 
                    type="text" 
                    placeholder="Search users by username or role..." 
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={S.searchInput}
                  />
                </div>
                <button onClick={handleOpenCreateUserForm} style={S.createBtn}>
                  <FaPlus style={{ marginRight: '8px' }} /> Create New User
                </button>
              </div>

              <div style={S.card}>
                <div style={S.cardHeaderFlex}>
                  <h3 style={S.cardTitle}>System Users ({filteredUsers.length})</h3>
                </div>
                <div style={S.tableResponsive}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Username</th>
                        <th style={S.th}>Role</th>
                        <th style={S.th}>Status</th>
                        <th style={{ ...S.th, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} style={S.tr}>
                          <td style={S.td}>
                            <div style={S.userCell}>
                              <div style={S.userAvatarSm}>{String(user?.username || 'U').charAt(0).toUpperCase()}</div>
                              <span style={S.strongText}>{user?.username}</span>
                            </div>
                          </td>
                          <td style={S.td}>
                            <span style={{
                              ...S.roleBadge,
                              ...(user.role === 'superadmin' ? S.roleBadgeSuper : user.role === 'admin' ? S.roleBadgeAdmin : S.roleBadgeDefault)
                            }}>
                              {user.role}
                            </span>
                          </td>
                          <td style={S.td}><span style={S.statusActive}>● Active</span></td>
                          <td style={{ ...S.td, textAlign: 'right' }}>
                            <button onClick={() => handleOpenEditUserForm(user)} style={S.actionBtnEdit} title="Edit User">
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDeleteUser(user.id, user.username)} style={S.actionBtnDelete} title="Delete User">
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!filteredUsers.length && (
                        <tr><td colSpan="4" style={S.emptyState}>No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. MANAGE ROLES VIEW                                     */}
          {/* ======================================================== */}
          {activeTab === 'manage-roles' && (
            <div style={S.viewContainer}>
              <div style={S.viewHeader}>
                <p style={S.viewDescription}>
                  Manage platform security levels. Roles determine access permissions and capabilities across the administrative surface.
                </p>
                <button onClick={handleOpenCreateRoleForm} style={S.createBtn}>
                  <FaPlus style={{ marginRight: '8px' }} /> Create New Role
                </button>
              </div>

              <div style={S.card}>
                <div style={S.cardHeaderFlex}>
                  <h3 style={S.cardTitle}>System Roles ({roles.length})</h3>
                </div>
                <div style={S.tableResponsive}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Role Name</th>
                        <th style={S.th}>Assigned Users</th>
                        <th style={S.th}>Type</th>
                        <th style={{ ...S.th, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map(r => {
                        const count = getUserCountForRole(r.name);
                        const isSystem = r.name === 'superadmin' || r.name === 'admin';
                        return (
                          <tr key={r.id} style={S.tr}>
                            <td style={S.td}>
                              <div style={S.userCell}>
                                <div style={{ ...S.userAvatarSm, background: isDark ? '#064e3b' : '#ecfdf5', color: '#059669' }}>
                                  <FaShieldAlt size={14} />
                                </div>
                                <span style={S.strongText}>{r.name}</span>
                              </div>
                            </td>
                            <td style={S.td}>
                              <span style={S.userCountBadge}>{count} user{count !== 1 ? 's' : ''}</span>
                            </td>
                            <td style={S.td}>
                              <span style={isSystem ? S.systemBadge : S.customBadge}>
                                {isSystem ? 'System Default' : 'Custom Role'}
                              </span>
                            </td>
                            <td style={{ ...S.td, textAlign: 'right' }}>
                              {!isSystem && (
                                <>
                                  <button onClick={() => handleOpenEditRoleForm(r)} style={S.actionBtnEdit} title="Edit Role">
                                    <FaEdit />
                                  </button>
                                  <button onClick={() => handleDeleteRole(r.id, r.name)} style={S.actionBtnDelete} title="Delete Role">
                                    <FaTrash />
                                  </button>
                                </>
                              )}
                              {isSystem && (
                                <span style={{ fontSize: '0.8rem', color: isDark ? '#6b7280' : '#94a3b8', fontStyle: 'italic' }}>Protected</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 5. MANAGE SPONSORS VIEW                                  */}
          {/* ======================================================== */}
          {activeTab === 'manage-sponsors' && (
            <div style={S.viewContainer}>
              <div style={S.viewHeader}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px', flexWrap: 'wrap' }}>
                  <div style={S.searchBox}>
                    <input 
                      type="text" 
                      placeholder="Search sponsors by name, company, contact..." 
                      value={sponsorSearch}
                      onChange={(e) => setSponsorSearch(e.target.value)}
                      style={S.searchInput}
                    />
                  </div>
                  <select 
                    value={sponsorCategoryFilter} 
                    onChange={(e) => setSponsorCategoryFilter(e.target.value)}
                    style={{ ...S.select, width: 'auto', padding: '0.65rem 1rem' }}
                  >
                    <option value="all">All Levels</option>
                    <option value="Elite">Elite</option>
                    <option value="Premium">Premium</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
                {!isLeadCoordinator && (
                  <button onClick={handleOpenCreateSponsorForm} style={S.createBtn}>
                    <FaPlus style={{ marginRight: '8px' }} /> Add New Sponsor
                  </button>
                )}
              </div>

              <div style={S.card}>
                <div style={S.cardHeaderFlex}>
                  <h3 style={S.cardTitle}>Event Sponsors ({filteredSponsors.length})</h3>
                  <span style={{ fontSize: '0.85rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                    {isLeadCoordinator 
                      ? 'Symposium partners and sponsors registered for Eloquence 2026.'
                      : 'Active sponsors appear on the public website marquee sorted by display order.'}
                  </span>
                </div>
                <div style={S.tableResponsive}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Sponsor</th>
                        <th style={S.th}>Level</th>
                        <th style={S.th}>Contact</th>
                        <th style={S.th}>Status</th>
                        <th style={{ ...S.th, textAlign: 'center' }}>Display Order</th>
                        <th style={{ ...S.th, textAlign: isLeadCoordinator ? 'center' : 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSponsors.map(sponsor => (
                        <tr key={sponsor.id} style={S.tr}>
                          <td style={S.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: isDark ? '#1f2937' : '#f8fafc',
                                border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0
                              }}>
                                {sponsor.logo ? (
                                  <img src={sponsor.logo} alt={sponsor.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                  <span style={{ fontWeight: '800', color: '#2563eb', fontSize: '0.85rem' }}>
                                    {sponsor.name.slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div style={S.strongText}>{sponsor.name}</div>
                                {sponsor.companyName && (
                                  <div style={{ fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b' }}>{sponsor.companyName}</div>
                                )}
                                {sponsor.website && (
                                  <a 
                                    href={sponsor.website} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                                  >
                                    <FaGlobe size={10} /> {sponsor.website.replace(/^https?:\/\//, '')}
                                  </a>
                                )}
                                {sponsor.locationUrl && (
                                  <a 
                                    href={sponsor.locationUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    style={{ fontSize: '0.75rem', color: '#10b981', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                                  >
                                    <FaMapMarkerAlt size={10} /> Location Map
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={S.td}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              background: 
                                sponsor.category === 'Elite' || sponsor.category === 'Title Sponsor' ? (isDark ? '#78350f' : '#fef3c7') :
                                sponsor.category === 'Premium' || sponsor.category === 'Gold Sponsor' || sponsor.category === 'Silver Sponsor' ? (isDark ? '#1e293b' : '#f1f5f9') :
                                (isDark ? '#064e3b' : '#ecfdf5'),
                              color: 
                                sponsor.category === 'Elite' || sponsor.category === 'Title Sponsor' ? (isDark ? '#fde68a' : '#92400e') :
                                sponsor.category === 'Premium' || sponsor.category === 'Gold Sponsor' || sponsor.category === 'Silver Sponsor' ? (isDark ? '#cbd5e1' : '#334155') :
                                (isDark ? '#a7f3d0' : '#065f46'),
                              border: '1px solid rgba(0,0,0,0.06)'
                            }}>
                              {sponsor.category}
                            </span>
                          </td>
                          <td style={S.td}>
                            <div style={{ fontSize: '0.85rem' }}>
                              {sponsor.contactName && <div style={{ fontWeight: '600', color: isDark ? '#f9fafb' : '#0f172a' }}>{sponsor.contactName}</div>}
                              {sponsor.contactPhone && (
                                <div style={{ color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <FaPhone size={10} /> {sponsor.contactPhone}
                                </div>
                              )}
                              {sponsor.contactEmail && (
                                <div style={{ color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <FaEnvelope size={10} /> {sponsor.contactEmail}
                                </div>
                              )}
                              {!sponsor.contactName && !sponsor.contactPhone && !sponsor.contactEmail && (
                                <span style={{ color: isDark ? '#6b7280' : '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>None provided</span>
                              )}
                            </div>
                          </td>
                          <td style={S.td}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.82rem',
                              fontWeight: '700',
                              color: sponsor.isActive !== false ? '#10b981' : '#dc2626'
                            }}>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: sponsor.isActive !== false ? '#10b981' : '#ef4444'
                              }}></span>
                              {sponsor.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ ...S.td, textAlign: 'center' }}>
                            <span style={S.idBadge}>{sponsor.displayOrder || 1}</span>
                          </td>
                          <td style={{ ...S.td, textAlign: isLeadCoordinator ? 'center' : 'right', whiteSpace: 'nowrap' }}>
                            {isLeadCoordinator ? (
                              <button 
                                onClick={() => handleOpenEditSponsorForm(sponsor)} 
                                style={S.actionBtnView} 
                                title="View Sponsor Details"
                              >
                                <FaInfoCircle style={{ marginRight: '4px' }} /> Details
                              </button>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleToggleSponsor(sponsor)} 
                                  style={{ 
                                    background: sponsor.isActive !== false ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#451a1a' : '#fef2f2'),
                                    border: '1px solid ' + (sponsor.isActive !== false ? (isDark ? '#047857' : '#a7f3d0') : (isDark ? '#991b1b' : '#fecaca')),
                                    color: sponsor.isActive !== false ? '#10b981' : '#dc2626',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: '6px',
                                    marginRight: '0.5rem'
                                  }}
                                  title={sponsor.isActive !== false ? 'Deactivate Sponsor' : 'Activate Sponsor'}
                                >
                                  {sponsor.isActive !== false ? <FaToggleOn size={16} /> : <FaToggleOff size={16} />}
                                </button>
                                <button onClick={() => handleOpenEditSponsorForm(sponsor)} style={S.actionBtnEdit} title="Edit Sponsor">
                                  <FaEdit />
                                </button>
                                <button onClick={() => handleDeleteSponsor(sponsor.id, sponsor.name)} style={S.actionBtnDelete} title="Delete Sponsor">
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!filteredSponsors.length && (
                        <tr><td colSpan={6} style={S.emptyState}>No sponsors found matching your criteria.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. MANAGE STUDENT COORDINATORS VIEW                      */}
          {/* ======================================================== */}
          {activeTab === 'manage-coordinators' && (
            <div style={S.viewContainer}>
              {/* Header Controls & View Switcher */}
              <div style={{ ...S.viewHeader, flexWrap: 'wrap', gap: '1rem' }}>
                {/* View Mode Toggle: Events View vs All Table */}
                <div style={{ display: 'flex', gap: '8px', background: isDark ? '#1f2937' : '#f1f5f9', padding: '4px', borderRadius: '10px', border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}` }}>
                  <button
                    type="button"
                    onClick={() => setMemberViewTab('events')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.55rem 1.1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      border: 'none',
                      cursor: 'pointer',
                      background: memberViewTab === 'events' ? '#2563eb' : 'transparent',
                      color: memberViewTab === 'events' ? '#ffffff' : (isDark ? '#cbd5e1' : '#64748b'),
                      boxShadow: memberViewTab === 'events' ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaThLarge size={13} /> By Event View ({eventsList.length} Events)
                  </button>

                  <button
                    type="button"
                    onClick={() => setMemberViewTab('table')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.55rem 1.1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      border: 'none',
                      cursor: 'pointer',
                      background: memberViewTab === 'table' ? '#2563eb' : 'transparent',
                      color: memberViewTab === 'table' ? '#ffffff' : (isDark ? '#cbd5e1' : '#64748b'),
                      boxShadow: memberViewTab === 'table' ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FaTable size={13} /> All Members Table ({coordinators.length})
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '650px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                  <div style={S.searchBox}>
                    <input 
                      type="text" 
                      placeholder="Search member, phone, event, role..." 
                      value={coordSearch}
                      onChange={(e) => setCoordSearch(e.target.value)}
                      style={S.searchInput}
                    />
                  </div>
                  <select 
                    value={coordEventFilter} 
                    onChange={(e) => setCoordEventFilter(e.target.value)}
                    style={{ ...S.select, width: 'auto', padding: '0.65rem 1rem' }}
                  >
                    <option value="all">All Events ({eventsList.length})</option>
                    {eventsList.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.category === 'technical' ? '[TECH]' : '[NON-TECH]'} {ev.name}
                      </option>
                    ))}
                  </select>
                </div>

                {!isLeadCoordinator && (
                  <button onClick={() => handleOpenCreateCoordForm()} style={S.createBtn}>
                    <FaPlus style={{ marginRight: '8px' }} /> Add Member / Coordinator
                  </button>
                )}
              </div>

              {/* Quick Metric Stats Banner */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDark ? '#1e3a8a' : '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaCalendarAlt size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '700' }}>TOTAL EVENTS</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>{eventsList.length}</div>
                  </div>
                </div>

                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDark ? '#064e3b' : '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaUsers size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '700' }}>TOTAL MEMBERS</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>{coordinators.length}</div>
                  </div>
                </div>

                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDark ? '#312e81' : '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaCrown size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '700' }}>LEAD COORDINATORS</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>
                      {coordinators.filter(c => (c.role || '').toLowerCase().includes('lead')).length}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDark ? '#581c87' : '#f5f3ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaShieldAlt size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '700' }}>SUB-COORDINATORS</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>
                      {coordinators.filter(c => (c.role || '').toLowerCase().includes('sub')).length}
                    </div>
                  </div>
                </div>
              </div>

              {/* ──────────────────────────────────────────────────────── */}
              {/* VIEW 1: BY EVENT VIEW (All Events Roster Cards)          */}
              {/* ──────────────────────────────────────────────────────── */}
              {memberViewTab === 'events' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
                  {eventsList
                    .filter(ev => coordEventFilter === 'all' || ev?.id === coordEventFilter)
                    .filter(ev => {
                      if (!coordSearch.trim()) return true;
                      const q = (coordSearch || '').toLowerCase().trim();
                      const matchEvent = String(ev?.name || '').toLowerCase().includes(q) || String(ev?.id || '').toLowerCase().includes(q);
                      const matchMember = (coordinators || []).some(c => 
                        Array.isArray(c?.assignedEvents) && 
                        c.assignedEvents.some(e => String(e || '').toLowerCase() === String(ev?.id || '').toLowerCase()) && 
                        (String(c?.name || '').toLowerCase().includes(q) || String(c?.phone || '').includes(q) || String(c?.role || '').toLowerCase().includes(q))
                      );
                      return matchEvent || matchMember;
                    })
                    .map(ev => {
                      const eventMembers = (coordinators || []).filter(c => Array.isArray(c?.assignedEvents) && c.assignedEvents.some(e => String(e || '').toLowerCase() === String(ev?.id || '').toLowerCase()));
                      const isTech = ev?.category === 'technical';
                      const leads = eventMembers.filter(c => String(c?.role || '').toLowerCase().includes('lead'));
                      const coords = eventMembers.filter(c => !String(c?.role || '').toLowerCase().includes('lead') && !String(c?.role || '').toLowerCase().includes('sub'));
                      const subs = eventMembers.filter(c => String(c?.role || '').toLowerCase().includes('sub'));

                      return (
                        <div 
                          key={ev.id}
                          style={{
                            background: isDark ? '#111827' : '#ffffff',
                            border: `1px solid ${isDark ? (isTech ? 'rgba(37,99,235,0.3)' : 'rgba(219,39,119,0.3)') : (isTech ? '#bfdbfe' : '#fbcfe8')}`,
                            borderRadius: '16px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div>
                            {/* Card Top Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                              <div>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  fontWeight: '800',
                                  background: isTech ? (isDark ? '#1e3a8a' : '#eff6ff') : (isDark ? '#831843' : '#fdf2f8'),
                                  color: isTech ? (isDark ? '#bfdbfe' : '#1d4ed8') : (isDark ? '#fbcfe8' : '#be185d'),
                                  marginBottom: '4px'
                                }}>
                                  {isTech ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaBolt /> TECHNICAL</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaPalette /> NON-TECHNICAL</span>} • {ev.id.toUpperCase()}
                                </span>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>
                                  {ev.name}
                                </h3>
                              </div>

                              <span style={{
                                padding: '0.25rem 0.65rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                background: eventMembers.length > 0 ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#451a1a' : '#fef2f2'),
                                color: eventMembers.length > 0 ? '#10b981' : '#ef4444'
                              }}>
                                {eventMembers.length} {eventMembers.length === 1 ? 'Member' : 'Members'}
                              </span>
                            </div>

                            {/* Summary Pills */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '4px', background: isDark ? '#1f2937' : '#f1f5f9', color: isDark ? '#9ca3af' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <FaCrown style={{ color: '#eab308' }} /> Leads: {leads.length}
                              </span>
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '4px', background: isDark ? '#1f2937' : '#f1f5f9', color: isDark ? '#9ca3af' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <FaBolt style={{ color: '#3b82f6' }} /> Coords: {coords.length}
                              </span>
                              <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '4px', background: isDark ? '#1f2937' : '#f1f5f9', color: isDark ? '#9ca3af' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <FaShieldAlt style={{ color: '#a855f7' }} /> Sub-Coords: {subs.length}
                              </span>
                              {ev.id === 'nontech-05' && (
                                <>
                                  <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '4px', background: isDark ? 'rgba(234, 88, 12, 0.2)' : '#ffedd5', color: isDark ? '#fdba74' : '#c2410c', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <FaFire style={{ color: '#ea580c' }} /> FF: {eventMembers.filter(c => (c.game || '').toLowerCase().includes('fire') || (c.game || '').toLowerCase().includes('both')).length}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '4px', background: isDark ? 'rgba(6, 182, 212, 0.2)' : '#cffafe', color: isDark ? '#67e8f9' : '#0891b2', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <FaCrosshairs style={{ color: '#0891b2' }} /> BGMI: {eventMembers.filter(c => (c.game || '').toLowerCase().includes('bgmi') || (c.game || '').toLowerCase().includes('both')).length}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Allocated Members List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                              {eventMembers.map(coord => {
                                const isLead = (coord.role || '').toLowerCase().includes('lead');
                                const isSub = (coord.role || '').toLowerCase().includes('sub');
                                const roleBadgeBg = isLead 
                                  ? (isDark ? '#1e3a8a' : '#dbeafe') 
                                  : isSub 
                                  ? (isDark ? '#581c87' : '#f5f3ff') 
                                  : (isDark ? '#064e3b' : '#f0fdf4');
                                const roleBadgeColor = isLead 
                                  ? (isDark ? '#bfdbfe' : '#1e40af') 
                                  : isSub 
                                  ? (isDark ? '#e9d5ff' : '#7e22ce') 
                                  : (isDark ? '#a7f3d0' : '#166534');

                                return (
                                  <div 
                                    key={coord.id}
                                    style={{
                                      background: isDark ? '#1f2937' : '#f8fafc',
                                      border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}`,
                                      borderRadius: '10px',
                                      padding: '0.75rem',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                      <div style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '8px',
                                        background: roleBadgeBg,
                                        color: roleBadgeColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '800',
                                        fontSize: '0.85rem',
                                        flexShrink: 0
                                      }}>
                                        {String(coord?.name || 'C').charAt(0).toUpperCase()}
                                      </div>

                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                          <span style={{ fontWeight: '800', fontSize: '0.88rem', color: isDark ? '#f9fafb' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {coord.name}
                                          </span>
                                          <span style={{
                                            fontSize: '0.68rem',
                                            fontWeight: '800',
                                            padding: '0.1rem 0.45rem',
                                            borderRadius: '999px',
                                            background: roleBadgeBg,
                                            color: roleBadgeColor
                                          }}>
                                            {isLead ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaCrown /> Lead</span> : isSub ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaShieldAlt /> Sub-Coord</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaBolt /> Coord</span>}
                                          </span>

                                          {/* Battle of Champions Game Track Badge */}
                                          {coord.game && (
                                            <span style={{
                                              fontSize: '0.68rem',
                                              fontWeight: '800',
                                              padding: '0.1rem 0.5rem',
                                              borderRadius: '999px',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '3px',
                                              background: (coord.game || '').toLowerCase().includes('fire')
                                                ? (isDark ? 'rgba(234, 88, 12, 0.25)' : '#ffedd5')
                                                : (coord.game || '').toLowerCase().includes('bgmi')
                                                ? (isDark ? 'rgba(6, 182, 212, 0.25)' : '#cffafe')
                                                : (isDark ? 'rgba(124, 58, 237, 0.25)' : '#ede9fe'),
                                              color: (coord.game || '').toLowerCase().includes('fire')
                                                ? (isDark ? '#fdba74' : '#c2410c')
                                                : (coord.game || '').toLowerCase().includes('bgmi')
                                                ? (isDark ? '#67e8f9' : '#0891b2')
                                                : (isDark ? '#d8b4fe' : '#6d28d9'),
                                              border: `1px solid ${
                                                (coord.game || '').toLowerCase().includes('fire')
                                                  ? 'rgba(234, 88, 12, 0.4)'
                                                  : (coord.game || '').toLowerCase().includes('bgmi')
                                                  ? 'rgba(6, 182, 212, 0.4)'
                                                  : 'rgba(124, 58, 237, 0.4)'
                                              }`
                                            }}>
                                              {(coord.game || '').toLowerCase().includes('fire') && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaFire style={{ color: '#ea580c' }} /> Free Fire</span>
                                              )}
                                              {(coord.game || '').toLowerCase().includes('bgmi') && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaCrosshairs style={{ color: '#0891b2' }} /> BGMI</span>
                                              )}
                                              {!(coord.game || '').toLowerCase().includes('fire') && !(coord.game || '').toLowerCase().includes('bgmi') && (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaGamepad /> {coord.game}</span>
                                              )}
                                            </span>
                                          )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '0.78rem' }}>
                                          {coord.phone && (
                                            <a 
                                              href={`tel:${coord.phone}`} 
                                              style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb', textDecoration: 'none', fontWeight: '700' }}
                                              title={`Call ${coord.name}`}
                                            >
                                              <FaPhoneAlt size={10} /> {coord.phone}
                                            </a>
                                          )}
                                          {coord.whatsapp && (
                                            <a 
                                              href={`https://wa.me/${coord.whatsapp.replace(/[^0-9]/g, '')}`} 
                                              target="_blank" 
                                              rel="noreferrer" 
                                              style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#10b981', textDecoration: 'none', fontWeight: '700' }}
                                              title="WhatsApp"
                                            >
                                              <FaWhatsapp size={11} /> WA
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Buttons for Member */}
                                    {!isLeadCoordinator && (
                                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                        <button 
                                          onClick={() => handleToggleCoord(coord)} 
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: coord.isActive !== false ? '#10b981' : '#ef4444',
                                            padding: '4px'
                                          }}
                                          title={coord.isActive !== false ? 'Active (Click to Deactivate)' : 'Inactive (Click to Activate)'}
                                        >
                                          {coord.isActive !== false ? <FaToggleOn size={16} /> : <FaToggleOff size={16} />}
                                        </button>
                                        <button 
                                          onClick={() => handleOpenEditCoordForm(coord)} 
                                          style={{
                                            background: isDark ? '#374151' : '#e2e8f0',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '0.35rem',
                                            cursor: 'pointer',
                                            color: isDark ? '#f9fafb' : '#334155'
                                          }}
                                          title="Edit Member"
                                        >
                                          <FaEdit size={12} />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteCoord(coord.id, coord.name)} 
                                          style={{
                                            background: isDark ? '#451a1a' : '#fee2e2',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '0.35rem',
                                            cursor: 'pointer',
                                            color: '#ef4444'
                                          }}
                                          title="Delete Member"
                                        >
                                          <FaTrash size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {eventMembers.length === 0 && (
                                <div style={{
                                  padding: '1.25rem 1rem',
                                  textAlign: 'center',
                                  borderRadius: '10px',
                                  background: isDark ? '#1f2937' : '#f8fafc',
                                  border: `1px dashed ${isDark ? '#374151' : '#cbd5e1'}`
                                }}>
                                  <div style={{ fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b', marginBottom: '8px' }}>
                                    No coordinators or sub-coordinators allocated yet.
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Add Member Button directly on Event Card */}
                          {!isLeadCoordinator && (
                            <button
                              onClick={() => handleOpenCreateCoordForm(ev.id)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '0.6rem',
                                borderRadius: '8px',
                                background: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid rgba(37, 99, 235, 0.3)',
                                fontWeight: '700',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <FaPlus size={11} /> Allocate Member to {ev.name}
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* VIEW 2: ALL MEMBERS DIRECTORY TABLE VIEW                 */}
              {/* ──────────────────────────────────────────────────────── */}
              {memberViewTab === 'table' && (
                <div style={S.card}>
                  <div style={S.cardHeaderFlex}>
                    <div>
                      <h3 style={S.cardTitle}>Coordinators & Sub-Coordinators Directory ({filteredCoordinators.length})</h3>
                      <span style={{ fontSize: '0.85rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                        {isLeadCoordinator 
                          ? 'Student coordinators and sub-coordinators assigned across symposium events.'
                          : 'Members allocated here dynamically appear in event coordinators portal and registration workflows.'}
                      </span>
                    </div>
                  </div>

                  <div style={S.tableResponsive}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Member Name</th>
                          <th style={S.th}>Contact Phone & WA</th>
                          <th style={S.th}>Role</th>
                          <th style={S.th}>Assigned Events</th>
                          <th style={S.th}>Status</th>
                          <th style={{ ...S.th, textAlign: isLeadCoordinator ? 'center' : 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCoordinators.map(coord => {
                          const isLead = (coord.role || '').toLowerCase().includes('lead');
                          const isSub = (coord.role || '').toLowerCase().includes('sub');
                          const roleBg = isLead ? (isDark ? '#1e3a8a' : '#dbeafe') : isSub ? (isDark ? '#581c87' : '#f5f3ff') : (isDark ? '#064e3b' : '#f0fdf4');
                          const roleColor = isLead ? (isDark ? '#bfdbfe' : '#1e40af') : isSub ? (isDark ? '#e9d5ff' : '#7e22ce') : (isDark ? '#a7f3d0' : '#166534');

                          return (
                            <tr key={coord.id} style={S.tr}>
                              <td style={S.td}>
                                <div style={S.userCell}>
                                  <div style={{ ...S.userAvatarSm, background: roleBg, color: roleColor }}>
                                    {String(coord?.name || 'C').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span style={S.strongText}>{coord?.name}</span>
                                    <div style={{ fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                                      {coord?.department || 'CSE'} • {coord?.year || '3rd Year'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={S.td}>
                                <div style={{ fontSize: '0.85rem' }}>
                                  <div style={{ fontWeight: '700', color: isDark ? '#f9fafb' : '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FaPhoneAlt size={11} color="#2563eb" />
                                    <a href={`tel:${coord?.phone || ''}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                      {coord?.phone || 'N/A'}
                                    </a>
                                  </div>
                                  {coord?.whatsapp && (
                                    <div style={{ color: '#10b981', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: '600' }}>
                                      <FaWhatsapp size={11} />
                                      <a href={`https://wa.me/${String(coord.whatsapp).replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                        WhatsApp: {coord.whatsapp}
                                      </a>
                                    </div>
                                  )}
                                  {coord?.email && (
                                    <div style={{ color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                      <FaEnvelope size={10} /> {coord.email}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={S.td}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '800',
                                  background: roleBg,
                                  color: roleColor,
                                  border: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                  {isLead && <FaCrown size={10} />}
                                  {isSub && <FaShieldAlt size={10} />}
                                  {!isLead && !isSub && <FaBolt size={10} />}
                                  {coord?.role || 'Coordinator'}
                                </span>
                              </td>
                              <td style={S.td}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '300px' }}>
                                  {Array.isArray(coord.assignedEvents) && coord.assignedEvents.map(eventId => {
                                    const ev = (eventsList || []).find(e => String(e?.id || '').toLowerCase() === String(eventId || '').toLowerCase());
                                    const isBoC = String(eventId).toLowerCase() === 'nontech-05';
                                    return (
                                      <span key={eventId} style={{
                                        background: ev?.category === 'technical' ? (isDark ? '#1e3a8a' : '#eff6ff') : (isDark ? '#831843' : '#fdf2f8'),
                                        color: ev?.category === 'technical' ? (isDark ? '#bfdbfe' : '#1d4ed8') : (isDark ? '#fbcfe8' : '#be185d'),
                                        border: '1px solid ' + (ev?.category === 'technical' ? (isDark ? '#1e40af' : '#bfdbfe') : (isDark ? '#9d174d' : '#fbcfe8')),
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '6px',
                                        fontSize: '0.72rem',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}>
                                        <span>{ev ? ev.name : eventId}</span>
                                        {isBoC && coord.game && (
                                          <span style={{
                                            padding: '0.05rem 0.35rem',
                                            borderRadius: '4px',
                                            fontSize: '0.65rem',
                                            fontWeight: '800',
                                            background: (coord.game || '').toLowerCase().includes('fire') ? '#ea580c' : (coord.game || '').toLowerCase().includes('bgmi') ? '#0891b2' : '#7c3aed',
                                            color: '#ffffff'
                                          }}>
                                            {(coord.game || '').toLowerCase().includes('fire') ? (
                                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaFire size={9} /> FF</span>
                                            ) : (coord.game || '').toLowerCase().includes('bgmi') ? (
                                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaCrosshairs size={9} /> BGMI</span>
                                            ) : (
                                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><FaGamepad size={9} /> {coord.game}</span>
                                            )}
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                                  {(!coord.assignedEvents || coord.assignedEvents.length === 0) && (
                                    <span style={{ color: '#ef4444', fontSize: '0.78rem', fontStyle: 'italic' }}>No event assigned</span>
                                  )}
                                </div>
                              </td>
                              <td style={S.td}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '0.82rem',
                                  fontWeight: '700',
                                  color: coord.isActive !== false ? '#10b981' : '#dc2626'
                                }}>
                                  <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: coord.isActive !== false ? '#10b981' : '#ef4444'
                                  }}></span>
                                  {coord.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td style={{ ...S.td, textAlign: isLeadCoordinator ? 'center' : 'right', whiteSpace: 'nowrap' }}>
                                {isLeadCoordinator ? (
                                  <button 
                                    onClick={() => handleOpenEditCoordForm(coord)} 
                                    style={S.actionBtnView} 
                                    title="View Coordinator Details"
                                  >
                                    <FaInfoCircle style={{ marginRight: '4px' }} /> Details
                                  </button>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => handleToggleCoord(coord)} 
                                      style={{ 
                                        background: coord.isActive !== false ? (isDark ? '#064e3b' : '#ecfdf5') : (isDark ? '#451a1a' : '#fef2f2'),
                                        border: '1px solid ' + (coord.isActive !== false ? (isDark ? '#047857' : '#a7f3d0') : (isDark ? '#991b1b' : '#fecaca')),
                                        color: coord.isActive !== false ? '#10b981' : '#dc2626',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        padding: '0.45rem 0.65rem',
                                        borderRadius: '6px',
                                        marginRight: '0.5rem'
                                      }}
                                      title={coord.isActive !== false ? 'Deactivate Coordinator' : 'Activate Coordinator'}
                                    >
                                      {coord.isActive !== false ? <FaToggleOn size={16} /> : <FaToggleOff size={16} />}
                                    </button>
                                    <button onClick={() => handleOpenEditCoordForm(coord)} style={S.actionBtnEdit} title="Edit Coordinator">
                                      <FaEdit />
                                    </button>
                                    <button onClick={() => handleDeleteCoord(coord.id, coord.name)} style={S.actionBtnDelete} title="Delete Coordinator">
                                      <FaTrash />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {!filteredCoordinators.length && (
                          <tr><td colSpan={6} style={S.emptyState}>No coordinators or sub-coordinators found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* EVENT ALLOCATE (COORDINATOR ALLOCATION MANAGEMENT)        */}
          {/* ======================================================== */}
          {activeTab === 'allocate-events' && isAdminOrSuper && (
            <div style={S.viewContainer}>
              {/* Metrics Overview Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.2rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}>
                    <FaUsers />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Coordinator Logins
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a', marginTop: '2px' }}>
                      {displayAllocUsers.length}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.2rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}>
                    <FaCheckCircle />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Allocated Accounts
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>
                      {displayAllocUsers.filter(u => (Array.isArray(u.assignedEvents) && u.assignedEvents.length > 0) || u.eventId).length}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.2rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: isDark ? 'rgba(217, 70, 239, 0.15)' : '#fdf2f8',
                    color: '#d946ef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}>
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Symposium Events
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a', marginTop: '2px' }}>
                      {eventsList.length}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.2rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fefce8',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}>
                    <FaShieldAlt />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Access Policy
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                      Scoped to Assigned
                    </div>
                  </div>
                </div>
              </div>

              {/* Action & Search Bar */}
              <div style={{
                background: isDark ? '#111827' : '#ffffff',
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ flex: 1, minWidth: '260px', maxWidth: '420px', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search coordinator username, role, or allocated event..."
                    value={allocUserSearch}
                    onChange={(e) => setAllocUserSearch(e.target.value)}
                    style={{
                      ...S.searchInput,
                      width: '100%',
                      paddingLeft: '2.5rem'
                    }}
                  />
                  <FaSearch style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: isDark ? '#6b7280' : '#94a3b8',
                    fontSize: '0.9rem'
                  }} />
                  {allocUserSearch && (
                    <button
                      onClick={() => setAllocUserSearch('')}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: isDark ? '#9ca3af' : '#64748b',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={() => { fetchAllocations(); fetchUsers(); }}
                    style={{
                      ...S.filterBtn,
                      padding: '0.55rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Reload allocations"
                  >
                    <FaSyncAlt size={12} />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={() => {
                      setNewCoordUsername('');
                      setNewCoordPassword('');
                      setNewCoordAllocEvents(['tech-01']);
                      setIsCreateCoordLoginModalOpen(true);
                    }}
                    style={{
                      ...S.primaryBtn,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                      fontWeight: '700'
                    }}
                  >
                    <FaPlus />
                    <span>New Coordinator Account</span>
                  </button>
                </div>
              </div>

              {/* Allocations Table */}
              <div style={S.card}>
                <div style={S.cardHeaderFlex}>
                  <div>
                    <h3 style={S.cardTitle}>Coordinator Event Allocation Matrix</h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                      When a coordinator logs in, their portal will strictly display ONLY the events allocated below.
                    </p>
                  </div>
                </div>

                <div style={S.tableResponsive}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Coordinator Account</th>
                        <th style={S.th}>Role</th>
                        <th style={S.th}>Allocated Event(s)</th>
                        <th style={S.th}>Status</th>
                        <th style={{ ...S.th, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllocUsers.map(userItem => {
                        let assigned = Array.isArray(userItem.assignedEvents) && userItem.assignedEvents.length > 0 
                          ? userItem.assignedEvents 
                          : (Array.isArray(userItem.assigned_events) && userItem.assigned_events.length > 0 
                              ? userItem.assigned_events 
                              : (userItem.eventId ? [userItem.eventId] : []));

                        if (typeof assigned === 'string') {
                          try { assigned = JSON.parse(assigned); } catch (_) { assigned = [assigned]; }
                        }
                        if (!Array.isArray(assigned)) assigned = [];

                        if (assigned.length === 0 && userItem?.username) {
                          const uName = String(userItem.username || '').toLowerCase().trim();
                          const matchedCoord = (coordinators || []).find(c => {
                            const cName = String(c.name || '').toLowerCase().trim();
                            return cName === uName || (uName.length >= 3 && (cName.includes(uName) || uName.includes(cName.split(' ')[0])));
                          });
                          if (matchedCoord) {
                            let cEvts = matchedCoord.assignedEvents || matchedCoord.assigned_events;
                            if (typeof cEvts === 'string') {
                              try { cEvts = JSON.parse(cEvts); } catch (_) { cEvts = [cEvts]; }
                            }
                            if (Array.isArray(cEvts) && cEvts.length > 0) {
                              assigned = cEvts;
                            }
                          }
                        }

                        const isAllocated = assigned.length > 0;

                        return (
                          <tr key={userItem.id || userItem.username} style={S.tr}>
                            <td style={S.td}>
                              <div style={S.userCell}>
                                <div style={{
                                  ...S.userAvatarSm,
                                  background: isDark ? 'rgba(57, 255, 136, 0.15)' : '#ecfdf5',
                                  color: isDark ? '#39FF88' : '#047857',
                                  border: '1px solid rgba(57, 255, 136, 0.3)'
                                }}>
                                  {(userItem.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={S.strongText}>{userItem.username}</div>
                                  <div style={S.tableSubText}>ID: #{userItem.id}</div>
                                  {/* Mobile & Compact Allocated Event Pills */}
                                  {isAllocated && (
                                    <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                      {assigned.map(evtId => {
                                        const evtObj = eventsList.find(e => e.id === evtId);
                                        const isTech = String(evtId).toLowerCase().startsWith('tech');
                                        return (
                                          <span
                                            key={evtId}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              background: isDark 
                                                ? (isTech ? 'rgba(56, 189, 248, 0.18)' : 'rgba(236, 72, 153, 0.18)') 
                                                : (isTech ? '#eff6ff' : '#fdf2f8'),
                                              color: isDark 
                                                ? (isTech ? '#38bdf8' : '#f472b6') 
                                                : (isTech ? '#0284c7' : '#db2777'),
                                              border: isDark 
                                                ? (isTech ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(236, 72, 153, 0.35)') 
                                                : (isTech ? '1px solid #bae6fd' : '1px solid #fbcfe8'),
                                              padding: '0.12rem 0.45rem',
                                              borderRadius: '6px',
                                              fontSize: '0.72rem',
                                              fontWeight: '700'
                                            }}
                                          >
                                            <span style={{ fontSize: '0.62rem', opacity: 0.8, textTransform: 'uppercase' }}>{evtId}</span>
                                            <span>• {evtObj ? evtObj.name : evtId}</span>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td style={S.td}>
                              <span style={{
                                ...S.roleBadge,
                                background: isDark ? '#1e293b' : '#f1f5f9',
                                color: isDark ? '#93c5fd' : '#1e40af',
                                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1'
                              }}>
                                {userItem.role}
                              </span>
                            </td>

                            <td style={S.td}>
                              {isAllocated ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {assigned.map(evtId => {
                                    const evtObj = eventsList.find(e => e.id === evtId);
                                    const isTech = String(evtId).toLowerCase().startsWith('tech');
                                    return (
                                      <span
                                        key={evtId}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          background: isDark 
                                            ? (isTech ? 'rgba(56, 189, 248, 0.15)' : 'rgba(236, 72, 153, 0.15)') 
                                            : (isTech ? '#eff6ff' : '#fdf2f8'),
                                          color: isDark 
                                            ? (isTech ? '#38bdf8' : '#f472b6') 
                                            : (isTech ? '#0284c7' : '#db2777'),
                                          border: isDark 
                                            ? (isTech ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(236, 72, 153, 0.3)') 
                                            : (isTech ? '1px solid #bae6fd' : '1px solid #fbcfe8'),
                                          padding: '0.25rem 0.65rem',
                                          borderRadius: '8px',
                                          fontSize: '0.8rem',
                                          fontWeight: '700'
                                        }}
                                      >
                                        <span style={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'uppercase' }}>
                                          {evtId}
                                        </span>
                                        <span>• {evtObj ? evtObj.name : evtId}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <FaExclamationTriangle size={12} /> No Events Allocated (Cannot view events)
                                </span>
                              )}
                            </td>

                            <td style={S.td}>
                              {isAllocated ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                                  color: '#10b981',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '800'
                                }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                                  {assigned.length} {assigned.length === 1 ? 'Event' : 'Events'} Active
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                                  color: '#ef4444',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '800'
                                }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                                  Unassigned
                                </span>
                              )}
                            </td>

                            <td style={{ ...S.td, textAlign: 'right' }}>
                              <button
                                onClick={() => handleOpenAllocModal(userItem)}
                                style={{
                                  ...S.primaryBtn,
                                  background: isDark ? '#1e3a8a' : '#2563eb',
                                  padding: '0.45rem 0.9rem',
                                  fontSize: '0.82rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  borderRadius: '8px'
                                }}
                                title={`Allocate events to ${userItem.username}`}
                              >
                                <FaCalendarAlt size={12} />
                                <span>{isAllocated ? 'Edit Allocation' : 'Allocate Event'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredAllocUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} style={S.emptyState}>
                            No coordinator accounts found. Click "New Coordinator Account" to create one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* HOMEPAGE STUDENT-COORDINATOR TEAMS VIEW                  */}
          {/* ======================================================== */}
          {activeTab === 'homepage-coordinators' && (
            <div style={S.viewContainer}>
              {/* Metrics Overview Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.2rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}>
                    <FaUsers />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Total Teams
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a', marginTop: '2px' }}>
                      {homepageTeams.length}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.2rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}>
                    <FaCheckCircle />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Active on Homepage
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981', marginTop: '2px' }}>
                      {homepageTeams.filter(t => t.isActive !== false).length}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.2rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: isDark ? 'rgba(217, 70, 239, 0.15)' : '#fdf2f8',
                    color: '#d946ef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}>
                    <FaUserPlus />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Listed Members
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a', marginTop: '2px' }}>
                      {homepageTeams.reduce((sum, t) => sum + ((t.members && t.members.length) || (t.names && t.names.length) || 0), 0)}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.2rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: isDark ? 'rgba(245, 228, 184, 0.15)' : '#fefce8',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}>
                    <FaStar />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Marquee Status
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a', marginTop: '2px' }}>
                      Auto-Looping
                    </div>
                  </div>
                </div>
              </div>

              {/* Header & Filter Controls Card */}
              <div style={{
                background: isDark ? '#111827' : '#ffffff',
                padding: '1.25rem 1.5rem',
                borderRadius: '16px',
                border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  {/* Search Bar */}
                  <div style={{ flex: 1, minWidth: '260px', maxWidth: '420px', position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search teams, members, tags, or description..."
                      value={hpTeamSearch}
                      onChange={(e) => setHpTeamSearch(e.target.value)}
                      style={{
                        ...S.searchInput,
                        width: '100%',
                        paddingLeft: '2.5rem'
                      }}
                    />
                    <FaSearch style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: isDark ? '#6b7280' : '#94a3b8',
                      fontSize: '0.9rem'
                    }} />
                    {hpTeamSearch && (
                      <button
                        onClick={() => setHpTeamSearch('')}
                        style={{
                          position: 'absolute',
                          right: '0.75rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: isDark ? '#9ca3af' : '#64748b',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div>

                  {/* Add New Team Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      onClick={fetchHomepageTeams}
                      style={{
                        ...S.filterBtn,
                        padding: '0.55rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="Reload homepage teams"
                    >
                      <FaSyncAlt size={12} />
                      <span>Refresh</span>
                    </button>

                    {!isLeadCoordinator && (
                      <button
                        onClick={openCreateHpTeamModal}
                        style={{
                          ...S.primaryBtn,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '0.65rem 1.25rem',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                          fontWeight: '700'
                        }}
                      >
                        <FaPlus />
                        <span>Add Homepage Team</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Homepage Teams Grid */}
              {filteredHpTeams.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {filteredHpTeams.map((team) => {
                    const tier = team.tier || 'emerald';
                    const tierTheme = COORDINATOR_THEMES.find(ct => ct.id === tier) || COORDINATOR_THEMES[0];
                    const tierBorderColor = tierTheme.primaryColor;
                    const tierBgTint = `${tierTheme.primaryColor}0d`;
                    const tierBadgeText = tierTheme.primaryColor;

                    const rawMembers = (team.members && team.members.length > 0)
                      ? team.members
                      : (team.names || []).map(name => ({ name, role: '', glow: false }));

                    const members = rawMembers.filter(m => {
                      if (!m) return false;
                      if (typeof m === 'string') return m.trim().length > 0;
                      return m.name && m.name.trim().length > 0;
                    });

                    return (
                      <div
                        key={team.id}
                        style={{
                          background: isDark ? '#111827' : '#ffffff',
                          border: isDark ? `1px solid ${tierBorderColor}40` : `1px solid ${tierBorderColor}60`,
                          boxShadow: isDark
                            ? `0 6px 24px rgba(0, 0, 0, 0.5), inset 0 0 16px ${tierBgTint}`
                            : '0 4px 20px rgba(0, 0, 0, 0.06)',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          position: 'relative'
                        }}
                      >
                        {/* Top Accent Stripe */}
                        <div style={{
                          height: '4px',
                          width: '100%',
                          background: `linear-gradient(90deg, ${tierBorderColor}, transparent)`
                        }} />

                        <div style={{ padding: '1.4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          {/* Top Badges & Status Row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                background: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
                                color: isDark ? '#93c5fd' : '#2563eb',
                                border: '1px solid rgba(37, 99, 235, 0.3)'
                              }}>
                                {team.tag || 'TEAM'}
                              </span>
                              <span style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                background: tierTheme.badgeBg,
                                color: tierTheme.badgeText,
                                border: `1px solid ${tierTheme.badgeBorder}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: tierTheme.primaryColor }} />
                                {tierTheme.name}
                              </span>
                            </div>

                            {/* Active Status Badge */}
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              background: team.isActive !== false
                                ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5')
                                : (isDark ? 'rgba(107, 114, 128, 0.15)' : '#f3f4f6'),
                              color: team.isActive !== false ? '#10b981' : (isDark ? '#9ca3af' : '#6b7280'),
                              border: team.isActive !== false
                                ? '1px solid rgba(16, 185, 129, 0.3)'
                                : '1px solid rgba(107, 114, 128, 0.3)'
                            }}>
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: team.isActive !== false ? '#10b981' : '#9ca3af'
                              }} />
                              {team.isActive !== false ? 'Live' : 'Hidden'}
                            </span>
                          </div>

                          {/* Team Role Title & Icon */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '0.75rem' }}>
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              background: isDark ? '#1a2234' : '#f8fafc',
                              border: `1.5px solid ${tierBorderColor}60`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {renderHpCoordinatorIcon(team.iconName, tier, 22)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <h3 style={{
                                margin: 0,
                                fontSize: '1.15rem',
                                fontWeight: '800',
                                color: isDark ? '#f9fafb' : '#0f172a',
                                letterSpacing: '-0.01em',
                                lineHeight: '1.3'
                              }}>
                                {team.role}
                              </h3>
                              <span style={{
                                fontSize: '0.75rem',
                                color: isDark ? '#9ca3af' : '#64748b',
                                fontWeight: '600'
                              }}>
                                Order: #{team.displayOrder ?? 1}
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          <p style={{
                            margin: '0 0 1.15rem 0',
                            fontSize: '0.85rem',
                            color: isDark ? '#cbd5e1' : '#475569',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {team.desc || 'No description specified for this team.'}
                          </p>

                          {/* Members Section */}
                          <div style={{
                            background: isDark ? '#0b0f19' : '#f8fafc',
                            border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '0.85rem 1rem',
                            marginBottom: '1.25rem',
                            flex: 1
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.65rem'
                            }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: isDark ? '#9ca3af' : '#64748b'
                              }}>
                                Team Members ({members.length})
                              </span>
                            </div>

                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              maxHeight: '140px',
                              overflowY: 'auto'
                            }}>
                              {members.length > 0 ? (
                                members.map((member, mIdx) => {
                                  const nameStr = typeof member === 'string' ? member : (member?.name || '');
                                  return (
                                    <span
                                      key={mIdx}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '6px',
                                        fontSize: '0.78rem',
                                        fontWeight: '600',
                                        background: isDark ? '#1f2937' : '#ffffff',
                                        color: isDark ? '#e2e8f0' : '#334155',
                                        border: isDark ? '1px solid #374151' : '1px solid #cbd5e1'
                                      }}
                                    >
                                      <span style={{ fontSize: '0.45rem', color: isDark ? '#60a5fa' : '#2563eb' }}><FaCircle /></span>
                                      <span>{nameStr}</span>
                                    </span>
                                  );
                                })
                              ) : (
                                <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: isDark ? '#6b7280' : '#94a3b8' }}>
                                  No members assigned yet.
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Footer Action Buttons */}
                          <div style={{
                            display: 'flex',
                            justifyContent: isLeadCoordinator ? 'flex-end' : 'space-between',
                            alignItems: 'center',
                            paddingTop: '0.75rem',
                            borderTop: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9',
                            marginTop: 'auto'
                          }}>
                            {!isLeadCoordinator ? (
                              <>
                                {/* Toggle Live Switch */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleHpTeam(team)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: team.isActive !== false ? '#10b981' : (isDark ? '#6b7280' : '#94a3b8'),
                                    fontSize: '0.82rem',
                                    fontWeight: '700',
                                    padding: '4px'
                                  }}
                                  title={team.isActive !== false ? 'Hide from homepage' : 'Show on homepage'}
                                >
                                  {team.isActive !== false ? (
                                    <FaToggleOn size={22} color="#10b981" />
                                  ) : (
                                    <FaToggleOff size={22} color="#6b7280" />
                                  )}
                                  <span>{team.isActive !== false ? 'Active' : 'Inactive'}</span>
                                </button>

                                {/* Edit & Delete Action Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    onClick={() => openEditHpTeamModal(team)}
                                    style={{
                                      ...S.actionBtnEdit,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '0.45rem 0.85rem'
                                    }}
                                    title="Edit this team"
                                  >
                                    <FaEdit size={13} />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteHpTeam(team.id, team.role)}
                                    style={{
                                      ...S.actionBtnDelete,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '0.45rem 0.85rem'
                                    }}
                                    title="Delete this team"
                                  >
                                    <FaTrash size={13} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            ) : (
                              <button
                                onClick={() => openEditHpTeamModal(team)}
                                style={S.actionBtnView}
                                title="View Team Details"
                              >
                                <FaInfoCircle style={{ marginRight: '4px' }} /> Details
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  background: isDark ? '#111827' : '#ffffff',
                  border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '3.5rem 2rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: isDark ? '#1f2937' : '#f1f5f9',
                    color: isDark ? '#9ca3af' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    marginBottom: '1rem'
                  }}>
                    <FaUsers />
                  </div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>
                    No Homepage Coordinator Teams Found
                  </h3>
                  <p style={{ margin: '0 0 1.5rem 0', color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.9rem', maxWidth: '420px' }}>
                    {hpTeamSearch || hpTeamTierFilter !== 'all'
                      ? 'No teams match your search or tier filter. Try clearing the filter.'
                      : 'You haven’t created any homepage teams yet. Add your first team to display it on the live marquee!'}
                  </p>
                  {(hpTeamSearch || hpTeamTierFilter !== 'all') ? (
                    <button
                      onClick={() => { setHpTeamSearch(''); setHpTeamTierFilter('all'); }}
                      style={{ ...S.secondaryBtn, padding: '0.65rem 1.25rem' }}
                    >
                      Clear Filters
                    </button>
                  ) : (
                    <button
                      onClick={openCreateHpTeamModal}
                      style={{ ...S.primaryBtn, padding: '0.65rem 1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <FaPlus />
                      <span>Create First Team</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PARTICIPANT REGISTRATIONS VIEW                            */}
          {/* ======================================================== */}
          {activeTab === 'registrations' && (
            <div style={S.viewContainer}>
              {/* Header Filter & Action Controls Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: isDark ? '#111827' : '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '16px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  {/* Mode Filter Tabs: All | Online | Offline Desk */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setRegModeFilter('all')}
                      style={regModeFilter === 'all' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaClipboardList size={12} />
                      <span>All Registrations ({registrationsList.length})</span>
                    </button>
                    <button
                      onClick={() => setRegModeFilter('online')}
                      style={regModeFilter === 'online' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaGlobe size={12} />
                      <span>Online ({onlineRegs.length})</span>
                    </button>
                    <button
                      onClick={() => setRegModeFilter('offline')}
                      style={regModeFilter === 'offline' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaCashRegister size={12} />
                      <span>Offline Desk ({offlineRegs.length})</span>
                    </button>
                  </div>

                  {/* Category Filter Pills & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setRegCategoryFilter('all')}
                        style={regCategoryFilter === 'all' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setRegCategoryFilter('technical')}
                        style={regCategoryFilter === 'technical' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                      >
                        <FaBolt size={10} />
                        <span>Tech ({techRegs.length})</span>
                      </button>
                      <button
                        onClick={() => setRegCategoryFilter('non-technical')}
                        style={regCategoryFilter === 'non-technical' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                      >
                        <FaGamepad size={10} />
                        <span>Non-Tech ({nonTechRegs.length})</span>
                      </button>
                    </div>

                    <button
                      onClick={handleExportCSV}
                      style={{ ...S.filterBtn, background: isDark ? '#1e293b' : '#f0fdf4', color: '#16a34a', borderColor: '#86efac' }}
                      title="Export filtered registrations to CSV"
                    >
                      <FaDownload size={11} />
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={handleExportRegistrationsPDF}
                      style={{ ...S.filterBtn, background: isDark ? '#1e293b' : '#fef2f2', color: isDark ? '#f87171' : '#dc2626', borderColor: isDark ? '#991b1b' : '#fca5a5' }}
                      title="Export filtered registrations to PDF document"
                    >
                      <FaFilePdf size={11} />
                      <span>Export PDF</span>
                    </button>

                    {!isLeadCoordinator && (
                      <button
                        onClick={() => setIsOnSiteRegisterModalOpen(true)}
                        style={{ ...S.createBtn, padding: '0.55rem 1.1rem', fontSize: '0.86rem' }}
                        title="Register walk-in participant at on-site desk"
                      >
                        <FaUserPlus style={{ marginRight: '6px' }} />
                        <span>On-Site Desk Entry</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        fetchRegistrations();
                        fetchDashboardData();
                        toast.success('Registrations refreshed');
                      }}
                      style={{ ...S.filterBtn, padding: '0.55rem 0.75rem' }}
                      title="Refresh registration data"
                    >
                      <FaSyncAlt size={12} />
                    </button>
                  </div>
                </div>

                {/* Dropdown Filters & Search Box */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Filter by Event</label>
                    <select
                      value={regEventFilter}
                      onChange={(e) => setRegEventFilter(e.target.value)}
                      style={S.select}
                    >
                      <option value="all">-- All Symposium Events ({eventsList.length}) --</option>
                      {eventsList.map(evt => (
                        <option key={evt.id} value={evt.id}>
                          [{evt.category.toUpperCase()}] {evt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ ...S.modalInputGroup, gridColumn: 'span 2' }}>
                    <label style={S.label}>Live Search Participant / Ticket</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <FaSearch style={{ position: 'absolute', left: '14px', color: isDark ? '#6b7280' : '#94a3b8' }} />
                      <input
                        type="text"
                        placeholder="Search participant name, ticket code (#ELQ...), phone, email, college, team..."
                        value={regSearchQuery}
                        onChange={(e) => setRegSearchQuery(e.target.value)}
                        style={{ ...S.searchInput, paddingLeft: '2.5rem' }}
                      />
                      {regSearchQuery && (
                        <button
                          onClick={() => setRegSearchQuery('')}
                          style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: isDark ? '#9ca3af' : '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards for Registration Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div style={S.statCard}>
                  <div style={S.statLabel}>Active Filtered Results</div>
                  <div style={S.statValue}>{filteredRegistrations.length}</div>
                  <div style={{ fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                    of {registrationsList.length} total participants
                  </div>
                </div>

                <div style={{ ...S.statCard, borderLeft: isDark ? '4px solid #3b82f6' : '4px solid #2563eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={S.statLabel}>Online Portal</div>
                    <FaGlobe size={13} style={{ color: '#3b82f6' }} />
                  </div>
                  <div style={{ ...S.statValue, color: isDark ? '#93c5fd' : '#1d4ed8' }}>
                    {onlineRegs.length}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: isDark ? '#60a5fa' : '#2563eb', fontWeight: '700' }}>
                    ₹{onlineRevenue} Revenue
                  </div>
                </div>

                <div style={{ ...S.statCard, borderLeft: isDark ? '4px solid #10b981' : '4px solid #059669' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={S.statLabel}>Offline Desk</div>
                    <FaCashRegister size={13} style={{ color: '#10b981' }} />
                  </div>
                  <div style={{ ...S.statValue, color: isDark ? '#6ee7b7' : '#047857' }}>
                    {offlineRegs.length}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: isDark ? '#34d399' : '#059669', fontWeight: '700' }}>
                    ₹{offlineRevenue} Revenue
                  </div>
                </div>

                <div style={S.statCard}>
                  <div style={S.statLabel}>Category Breakdown</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: isDark ? '#93c5fd' : '#2563eb', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FaBolt /> Technical:</span>
                      <span style={{ fontWeight: '700' }}>{techRegs.length} (₹{techRevenue})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: isDark ? '#f472b6' : '#db2777', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FaGamepad /> Non-Technical:</span>
                      <span style={{ fontWeight: '700' }}>{nonTechRegs.length} (₹{nonTechRevenue})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Registrations Data Table */}
              <div style={S.card}>
                <div style={S.cardHeaderFlex}>
                  <div>
                    <h3 style={S.cardTitle}>
                      {regModeFilter === 'all' && 'All Participant Registrations'}
                      {regModeFilter === 'online' && 'Online Web Portal Registrations'}
                      {regModeFilter === 'offline' && 'Offline On-Site Desk Registrations'}
                    </h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Showing {filteredRegistrations.length} registration records matching filters
                    </p>
                  </div>
                  <span style={S.badgeCount}>{filteredRegistrations.length} Records</span>
                </div>

                <div style={{ ...S.tableResponsive, WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ ...S.table, minWidth: '1060px' }}>
                    <thead>
                      <tr>
                        <th style={S.th}>Ticket / ID</th>
                        <th style={S.th}>Participant & College</th>
                        <th style={S.th}>Contact Info</th>
                        <th style={S.th}>Event Enrolled</th>
                        <th style={S.th}>Mode</th>
                        <th style={S.th}>Fee & Status</th>
                        <th style={{ ...S.th, whiteSpace: 'nowrap', minWidth: '135px' }}>Date & Time</th>
                        <th style={{ ...S.th, textAlign: 'center', minWidth: '250px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegistrations.map((reg) => {
                        const isOnline = isOnlineRecord(reg);
                        const ticketId = reg.ticket_code || reg.registrationId || reg.id;
                        const pName = reg.full_name || reg.fullName || 'Anonymous';
                        const evtName = getEventName(reg);
                        const category = getEventCategory(reg);
                        const isTech = category === 'technical';
                        const feeAmt = getFee(reg);
                        const members = getTeamMembers(reg);
                        const isTeam = Boolean(members.length > 0 || reg.team_name || reg.teamName || reg.isTeam || reg.is_team);
                        
                        // Parse both Date and Time cleanly
                        const rawTimestamp = reg.created_at || reg.createdAt;
                        let datePart = '';
                        let timePart = '';

                        if (rawTimestamp) {
                          try {
                            const d = new Date(rawTimestamp);
                            if (!isNaN(d.getTime())) {
                              datePart = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                              timePart = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                            }
                          } catch (e) {}
                        }

                        if (!datePart && (reg.timestamp || reg.createdAtFormatted)) {
                          const str = reg.timestamp || reg.createdAtFormatted;
                          if (str.includes(',')) {
                            const [d, ...rest] = str.split(',');
                            datePart = d.trim();
                            timePart = rest.join(',').trim();
                          } else {
                            datePart = str;
                          }
                        }

                        return (
                          <tr key={ticketId} style={S.tr}>
                            {/* Ticket Code */}
                            <td style={S.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ ...S.idBadge, cursor: 'pointer', fontFamily: 'monospace', fontWeight: '700' }}
                                  title="Click to copy ticket code"
                                  onClick={() => {
                                    navigator.clipboard.writeText(ticketId);
                                    toast.success(`Copied ticket #${ticketId}`);
                                  }}
                                >
                                  #{ticketId}
                                </span>
                              </div>
                            </td>

                            {/* Participant & College */}
                            <td style={S.td}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={S.strongText}>{pName}</span>
                                <span style={S.tableSubText}>{reg.college || 'College not specified'}</span>
                                <span style={{ fontSize: '0.72rem', color: isDark ? '#6b7280' : '#94a3b8' }}>
                                  {reg.department ? `${reg.department} • ` : ''}{reg.year || ''}
                                </span>
                                {isTeam && (
                                  <span style={{ fontSize: '0.72rem', color: isDark ? '#93c5fd' : '#2563eb', fontWeight: '600', marginTop: '2px' }}>
                                    Team: {reg.team_name || reg.teamName || 'Team Event'} ({members.length + 1} members)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Contact Info */}
                            <td style={S.td}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '0.85rem', color: isDark ? '#e2e8f0' : '#0f172a', fontWeight: '500' }}>
                                  {reg.phone || 'No phone'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                                  {reg.email || 'No email'}
                                </span>
                              </div>
                            </td>

                            {/* Event Enrolled */}
                            <td style={S.td}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: '600', color: isDark ? '#f1f5f9' : '#1e293b' }}>
                                  {evtName}
                                </span>
                                <span style={isTech ? S.badgeTech : S.badgeNonTech}>
                                  {isTech ? <FaBolt size={9} style={{ marginRight: '4px' }} /> : <FaGamepad size={9} style={{ marginRight: '4px' }} />}
                                  {isTech ? 'Tech' : 'Non-Tech'}
                                </span>
                              </div>
                            </td>

                            {/* Registration Mode */}
                            <td style={S.td}>
                              <span style={isOnline ? S.badgeOnline : S.badgeOffline}>
                                {isOnline ? <FaGlobe size={11} /> : <FaCashRegister size={11} />}
                                <span>{isOnline ? 'Online' : 'Offline Desk'}</span>
                              </span>
                            </td>

                            {/* Fee & Payment Status */}
                            <td style={S.td}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: '700', color: '#10b981', fontSize: '0.95rem' }}>
                                  ₹{feeAmt}
                                </span>
                                <span style={S.badgePaid}>
                                  <FaCheck size={8} style={{ marginRight: '3px' }} />
                                  <span>{reg.payment_status || reg.paymentStatus || 'CONFIRMED'}</span>
                                </span>
                              </div>
                            </td>

                            {/* Date & Time */}
                            <td style={{ ...S.td, whiteSpace: 'nowrap', minWidth: '135px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <span style={{ fontSize: '0.85rem', color: isDark ? '#cbd5e1' : '#1e293b', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                  {datePart || 'N/A'}
                                </span>
                                {timePart && (
                                  <span style={{ fontSize: '0.74rem', color: isDark ? '#9ca3af' : '#64748b', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FaClock size={10} style={{ opacity: 0.8 }} />
                                    <span>{timePart}</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td style={{ ...S.td, textAlign: 'center', whiteSpace: 'nowrap', minWidth: '250px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                                {getRegScreenshot(reg) && (
                                  <button
                                    onClick={() => setViewerScreenshotReg(reg)}
                                    style={{
                                      ...S.actionBtnView,
                                      background: isDark ? 'rgba(2, 132, 199, 0.15)' : '#eff6ff',
                                      color: '#0284c7',
                                      borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : '#bfdbfe'
                                    }}
                                    title="View payment screenshot"
                                  >
                                    <FaImage size={11} />
                                    <span>Proof</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedRegDetails(reg);
                                    setIsRegDetailsModalOpen(true);
                                  }}
                                  style={S.actionBtnView}
                                  title="View complete participant details"
                                >
                                  <FaInfoCircle size={11} />
                                  <span>Details</span>
                                </button>
                                {!isLeadCoordinator && (
                                  <button
                                    onClick={() => {
                                      setEditingReg(reg);
                                      setIsEditRegModalOpen(true);
                                    }}
                                    style={{
                                      ...S.actionBtnView,
                                      background: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
                                      color: isDark ? '#60a5fa' : '#2563eb',
                                      borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#bfdbfe'
                                    }}
                                    title="Edit registration & participant details"
                                  >
                                    <FaEdit size={11} />
                                    <span>Edit</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handlePrintTicket(reg)}
                                  style={{ ...S.actionBtnView, background: isDark ? '#1e293b' : '#f8fafc', color: isDark ? '#cbd5e1' : '#475569', borderColor: isDark ? '#374151' : '#cbd5e1' }}
                                  title="Print Ticket / Receipt"
                                >
                                  <FaPrint size={11} />
                                </button>
                                {!isLeadCoordinator && (
                                  <button
                                    onClick={() => handleDeleteRegistration(reg)}
                                    disabled={isDeletingRegId === ticketId}
                                    style={S.actionBtnDelete}
                                    title="Delete Registration"
                                  >
                                    <FaTrash size={11} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {!filteredRegistrations.length && (
                        <tr>
                          <td colSpan="8" style={S.emptyState}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                              <FaIdCard size={36} style={{ opacity: 0.4 }} />
                              <span style={{ fontSize: '1rem', fontWeight: '600' }}>No participant registrations found.</span>
                              <span style={{ fontSize: '0.85rem', color: isDark ? '#6b7280' : '#94a3b8' }}>
                                Try adjusting your search query, mode filter, or event selection.
                              </span>
                              {(regSearchQuery || regModeFilter !== 'all' || regCategoryFilter !== 'all' || regEventFilter !== 'all') && (
                                <button
                                  onClick={() => {
                                    setRegSearchQuery('');
                                    setRegModeFilter('all');
                                    setRegCategoryFilter('all');
                                    setRegEventFilter('all');
                                  }}
                                  style={{ ...S.filterBtn, marginTop: '0.5rem' }}
                                >
                                  Reset All Filters
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* REGISTRATION VERIFICATION (UTR AUDIT & CONTROLS)         */}
          {/* ======================================================== */}
          {activeTab === 'registration-verification' && (
            <RegistrationVerification
              registrationsList={registrationsList}
              token={token}
              user={user}
              isDark={isDark}
              onRefresh={() => {
                fetchRegistrations();
                fetchDashboardData();
              }}
              eventsList={eventsList}
            />
          )}

          {/* ======================================================== */}
          {/* SEARCH & VERIFY PARTICIPANT VIEW (QR SCAN & ADMISSION)    */}
          {/* ======================================================== */}
          {activeTab === 'search-participant' && (
            <ParticipantVerifier 
              token={token}
              user={user}
              isDark={isDark}
              registrations={registrationsList}
              events={eventsList}
              onRefreshRegistrations={fetchRegistrations}
              onPrintTicket={handlePrintTicket}
            />
          )}

          {/* ======================================================== */}
          {/* PARTICIPANT LIST VIEW & EVENT CARDS                       */}
          {/* ======================================================== */}
          {activeTab === 'participant-list' && (
            <div style={S.viewContainer}>
              {/* Event Filter & View Mode Header */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: isDark ? '#111827' : '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '16px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setViewMode('cards'); }}
                      style={viewMode === 'cards' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaThLarge size={12} /> Event Cards View
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setViewMode('table'); }}
                      style={viewMode === 'table' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaTable size={12} /> Detailed Table View
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setPartCategoryFilter('all'); }}
                      style={partCategoryFilter === 'all' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      All ({eventsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setPartCategoryFilter('technical'); }}
                      style={partCategoryFilter === 'technical' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaBolt size={11} /> Tech ({eventsList.filter(e => e.category === 'technical').length})
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setPartCategoryFilter('non-technical'); }}
                      style={partCategoryFilter === 'non-technical' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaGamepad size={11} /> Non-Tech ({eventsList.filter(e => e.category === 'non-technical').length})
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Select Event</label>
                    <select
                      value={partEventFilter}
                      onChange={(e) => setPartEventFilter(e.target.value)}
                      style={S.select}
                    >
                      <option value="all">-- All Symposium Events ({eventsList.length}) --</option>
                      {eventsList.map(evt => {
                        const isEsports = isEsportsEvent(evt);
                        if (isEsports) {
                          const allBoC = registrationsList.filter(r => (r.event_id || r.eventId) === evt.id);
                          const ffBoC = allBoC.filter(r => getRegEsportsGame(r) === 'FREE FIRE');
                          const bgmiBoC = allBoC.filter(r => getRegEsportsGame(r) === 'BGMI');
                          return (
                            <optgroup key={evt.id} label={`[${evt.category.toUpperCase()}] ${evt.name} (Esports Gaming)`}>
                              <option value={evt.id}>{evt.name} — All Tracks ({allBoC.length})</option>
                              <option value={`${evt.id}::FREE FIRE`}>🔥 Free Fire Only ({ffBoC.length})</option>
                              <option value={`${evt.id}::BGMI`}>🎯 BGMI Only ({bgmiBoC.length})</option>
                            </optgroup>
                          );
                        }
                        return (
                          <option key={evt.id} value={evt.id}>
                            [{evt.category.toUpperCase()}] {evt.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div style={{ ...S.modalInputGroup, gridColumn: 'span 2' }}>
                    <label style={S.label}>Search Participants / Teams</label>
                    <input
                      type="text"
                      placeholder="Search participant name, team name, team member, phone, ticket..."
                      value={partSearch}
                      onChange={(e) => setPartSearch(e.target.value)}
                      style={S.searchInput}
                    />
                  </div>
                </div>
              </div>

              {/* ================= EVENT CARDS VIEW ================= */}
              {viewMode === 'cards' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                  {eventsList
                    .filter(evt => {
                      if (partEventFilter === 'all') return true;
                      if (partEventFilter.startsWith('nontech-05::')) return evt.id === 'nontech-05';
                      return evt.id === partEventFilter;
                    })
                    .filter(evt => partCategoryFilter === 'all' || evt.category === partCategoryFilter)
                    .map(evt => {
                      const evtRegs = registrationsList.filter(r => (r.event_id || r.eventId) === evt.id);
                      const isTech = evt.category === 'technical';
                      const isEsports = isEsportsEvent(evt);
                      const teamsCount = evtRegs.filter(r => getTeamMembers(r).length > 0 || r.team_name || r.teamName).length;
                      const ffRegs = isEsports ? evtRegs.filter(r => getRegEsportsGame(r) === 'FREE FIRE') : [];
                      const bgmiRegs = isEsports ? evtRegs.filter(r => getRegEsportsGame(r) === 'BGMI') : [];

                      // Determine active game filter for this card
                      let cardGameFilter = bocGameFilter;
                      if (partEventFilter === 'nontech-05::FREE FIRE') cardGameFilter = 'FREE FIRE';
                      else if (partEventFilter === 'nontech-05::BGMI') cardGameFilter = 'BGMI';

                      const displayedCardRegs = isEsports && cardGameFilter !== 'all'
                        ? evtRegs.filter(r => getRegEsportsGame(r) === cardGameFilter)
                        : evtRegs;

                      return (
                        <div key={evt.id} style={{ ...S.card, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={S.cardHeaderFlex}>
                              <div>
                                <h3 style={S.cardTitle}>{evt.name}</h3>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                                  <span style={isTech ? S.badgeTech : S.badgeNonTech}>
                                    {isTech ? 'Technical Event' : 'Non-Technical Event'}
                                  </span>
                                  {isEsports && (
                                    <span style={{
                                      background: 'linear-gradient(135deg, #ea580c 0%, #0891b2 100%)',
                                      color: '#ffffff',
                                      padding: '0.15rem 0.5rem',
                                      borderRadius: '6px',
                                      fontSize: '0.7rem',
                                      fontWeight: '800',
                                      letterSpacing: '0.04em'
                                    }}>
                                      ESPORTS ARENA
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span style={S.idBadge}>
                                {evt.fee || `₹${evt.feePerHead || 50}`}
                              </span>
                            </div>

                            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {/* Responsive Event Stats Summary Grid */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: isEsports ? 'repeat(auto-fit, minmax(70px, 1fr))' : 'repeat(3, 1fr)',
                                gap: '0.5rem',
                                background: isDark ? '#1f2937' : '#f8fafc',
                                padding: '0.75rem 0.85rem',
                                borderRadius: '10px',
                                border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <span style={{ fontSize: '0.68rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Total</span>
                                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>{evtRegs.length}</div>
                                </div>
                                {isEsports ? (
                                  <>
                                    <div>
                                      <span style={{ fontSize: '0.68rem', color: '#f97316', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>🔥 FF</span>
                                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f97316' }}>{ffRegs.length}</div>
                                    </div>
                                    <div>
                                      <span style={{ fontSize: '0.68rem', color: '#06b6d4', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>🎯 BGMI</span>
                                      <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#06b6d4' }}>{bgmiRegs.length}</div>
                                    </div>
                                  </>
                                ) : (
                                  <div>
                                    <span style={{ fontSize: '0.68rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Teams</span>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>{teamsCount}</div>
                                  </div>
                                )}
                                <div>
                                  <span style={{ fontSize: '0.68rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Venue</span>
                                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: isDark ? '#93c5fd' : '#2563eb', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.venue || 'Main Lab'}</div>
                                </div>
                              </div>

                              {/* Dedicated Esports Track Selector for Battle of Champions */}
                              {isEsports && (
                                <div style={{ display: 'flex', gap: '6px', background: isDark ? '#111827' : '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setBocGameFilter('all')}
                                    style={{
                                      flex: 1,
                                      padding: '0.35rem 0.5rem',
                                      fontSize: '0.72rem',
                                      fontWeight: '700',
                                      borderRadius: '6px',
                                      border: 'none',
                                      cursor: 'pointer',
                                      background: cardGameFilter === 'all' ? (isDark ? '#374151' : '#ffffff') : 'transparent',
                                      color: cardGameFilter === 'all' ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#9ca3af' : '#64748b'),
                                      boxShadow: cardGameFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                  >
                                    All ({evtRegs.length})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setBocGameFilter('FREE FIRE')}
                                    style={{
                                      flex: 1,
                                      padding: '0.35rem 0.5rem',
                                      fontSize: '0.72rem',
                                      fontWeight: '700',
                                      borderRadius: '6px',
                                      border: 'none',
                                      cursor: 'pointer',
                                      background: cardGameFilter === 'FREE FIRE' ? '#ea580c' : 'transparent',
                                      color: cardGameFilter === 'FREE FIRE' ? '#ffffff' : '#f97316',
                                      boxShadow: cardGameFilter === 'FREE FIRE' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                                    }}
                                  >
                                    🔥 Free Fire ({ffRegs.length})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setBocGameFilter('BGMI')}
                                    style={{
                                      flex: 1,
                                      padding: '0.35rem 0.5rem',
                                      fontSize: '0.72rem',
                                      fontWeight: '700',
                                      borderRadius: '6px',
                                      border: 'none',
                                      cursor: 'pointer',
                                      background: cardGameFilter === 'BGMI' ? '#0891b2' : 'transparent',
                                      color: cardGameFilter === 'BGMI' ? '#ffffff' : '#06b6d4',
                                      boxShadow: cardGameFilter === 'BGMI' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                                    }}
                                  >
                                    🎯 BGMI ({bgmiRegs.length})
                                  </button>
                                </div>
                              )}

                              {/* Participant & Team Member Preview */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isDark ? '#cbd5e1' : '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {isEsports 
                                      ? `${cardGameFilter === 'all' ? 'Esports Squads' : (cardGameFilter === 'BGMI' ? '🎯 BGMI Squads' : '🔥 Free Fire Squads')} (${displayedCardRegs.length})` 
                                      : `Participants & Team Members (${evtRegs.length})`}
                                  </span>
                                </div>

                                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {displayedCardRegs.map((reg, idx) => {
                                    const members = getTeamMembers(reg);
                                    const teamName = reg.team_name || reg.teamName;
                                    const game = isEsports ? getRegEsportsGame(reg) : null;

                                    return (
                                      <div key={idx} style={{ background: isDark ? '#1f2937' : '#f1f5f9', padding: '0.65rem 0.85rem', borderRadius: '8px', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontWeight: '700', fontSize: '0.88rem', color: isDark ? '#f9fafb' : '#0f172a' }}>
                                              {reg.full_name || reg.fullName || 'Participant'}
                                            </span>
                                            {isEsports && (
                                              <span style={{
                                                background: game === 'BGMI' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                                                color: game === 'BGMI' ? '#06b6d4' : '#f97316',
                                                border: `1px solid ${game === 'BGMI' ? 'rgba(6, 182, 212, 0.35)' : 'rgba(249, 115, 22, 0.35)'}`,
                                                padding: '0.1rem 0.45rem',
                                                borderRadius: '999px',
                                                fontSize: '0.65rem',
                                                fontWeight: '800'
                                              }}>
                                                {game === 'BGMI' ? '🎯 BGMI' : '🔥 FREE FIRE'}
                                              </span>
                                            )}
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {teamName && (
                                              <span style={{ background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#6ee7b7' : '#047857', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>
                                                {teamName}
                                              </span>
                                            )}
                                            {reg.phone && (
                                              <button
                                                type="button"
                                                title={`Message Captain on WhatsApp (${reg.phone})`}
                                                onClick={() => handleShareSquadWhatsApp(reg, evt)}
                                                style={{
                                                  background: '#22c55e',
                                                  color: '#ffffff',
                                                  border: 'none',
                                                  borderRadius: '5px',
                                                  padding: '0.15rem 0.45rem',
                                                  fontSize: '0.68rem',
                                                  cursor: 'pointer',
                                                  display: 'inline-flex',
                                                  alignItems: 'center',
                                                  gap: '3px',
                                                  fontWeight: '700'
                                                }}
                                              >
                                                <FaWhatsapp size={10} /> WA
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        <div style={{ fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b', marginTop: '3px' }}>
                                          {reg.college} • {reg.department}
                                        </div>

                                        {members.length > 0 && (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                            <span style={{ fontSize: '0.72rem', color: isDark ? '#93c5fd' : '#1d4ed8', fontWeight: '700' }}>
                                              Squad ({members.length + 1}):
                                            </span>
                                            {members.map((m, i) => (
                                              <span key={i} style={{ background: isDark ? '#374151' : '#cbd5e1', color: isDark ? '#f9fafb' : '#0f172a', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                                                {m}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {displayedCardRegs.length === 0 && (
                                    <div style={{ color: isDark ? '#6b7280' : '#94a3b8', fontSize: '0.82rem', padding: '0.75rem', textAlign: 'center' }}>
                                      No participants registered yet for this selection.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: Export PDF, WhatsApp Roster, Copy & Send */}
                          <div style={{ padding: '0.85rem 1.25rem', borderTop: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', background: isDark ? '#1a2234' : '#f8fafc', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleExportPDF(evt, isEsports ? cardGameFilter : 'ALL')}
                              style={{ ...S.filterBtn, flex: 1, minWidth: '105px', justifyContent: 'center', background: isDark ? '#1e3a8a' : '#eff6ff', color: isDark ? '#93c5fd' : '#1d4ed8', borderColor: isDark ? '#1e40af' : '#bfdbfe', fontSize: '0.78rem', padding: '0.5rem 0.6rem' }}
                            >
                              <FaFilePdf size={12} /> {isEsports && cardGameFilter !== 'all' ? `Export ${cardGameFilter}` : 'Export PDF'}
                            </button>
                            {isEsports && (
                              <>
                                <button
                                  onClick={() => handleShareRosterWhatsApp(evt, cardGameFilter)}
                                  title="Share Tournament Roster Sheet via WhatsApp"
                                  style={{ ...S.filterBtn, flex: 1, minWidth: '105px', justifyContent: 'center', background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.3)', fontSize: '0.78rem', padding: '0.5rem 0.6rem' }}
                                >
                                  <FaWhatsapp size={12} /> WhatsApp
                                </button>
                                <button
                                  onClick={() => handleCopyRosterToClipboard(evt, cardGameFilter)}
                                  title="Copy formatted squad sheet to clipboard"
                                  style={{ ...S.filterBtn, flex: 1, minWidth: '85px', justifyContent: 'center', background: isDark ? '#374151' : '#f1f5f9', color: isDark ? '#e2e8f0' : '#334155', fontSize: '0.78rem', padding: '0.5rem 0.6rem' }}
                                >
                                  <FaCopy size={11} /> Copy
                                </button>
                              </>
                            )}
                            {!isLeadCoordinator && (
                              <button
                                onClick={() => handleOpenSendModal(evt)}
                                style={{ ...S.primaryBtn, flex: 1, minWidth: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                              >
                                <FaPaperPlane size={11} /> Send
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* ================= DETAILED TABLE VIEW ================= */}
              {viewMode === 'table' && (
                <div style={S.card}>
                  <div style={S.cardHeaderFlex}>
                    <h3 style={S.cardTitle}>
                      Participant & Team List ({participantFilteredRegs.length})
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Showing participants for {partEventFilter === 'all' ? 'All Events' : (partEventFilter.includes('::') ? `${partEventFilter.replace('nontech-05::', 'Battle of Champions — ')}` : (eventsList.find(e => e.id === partEventFilter)?.name || partEventFilter))}.
                    </span>
                  </div>

                  <div style={S.tableResponsive}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Ticket</th>
                          <th style={S.th}>Event & Track</th>
                          <th style={S.th}>Team Name</th>
                          <th style={S.th}>Lead Participant</th>
                          <th style={S.th}>Team Members</th>
                          <th style={S.th}>College & Dept</th>
                          <th style={S.th}>Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participantFilteredRegs.map((reg, i) => {
                          const ticketCode = reg.ticket_code || reg.registrationId || reg.id || `#${i + 1}`;
                          const name = reg.full_name || reg.fullName || 'Anonymous';
                          const evt = eventsList.find(e => e.id === (reg.event_id || reg.eventId));
                          const evtName = reg.eventName || evt?.name || reg.event_id || 'Event';
                          const members = getTeamMembers(reg);
                          const teamName = reg.team_name || reg.teamName || (members.length > 0 ? 'Team' : '-');
                          const isTech = getEventCategory(reg) === 'technical';
                          const isEsports = isEsportsEvent(evt || { id: reg.event_id || reg.eventId, name: evtName });
                          const esportsGame = isEsports ? getRegEsportsGame(reg) : null;

                          return (
                            <tr key={i} style={S.tr}>
                              <td style={S.td}><span style={S.idBadge}>{ticketCode}</span></td>
                              <td style={S.td}>
                                <div>
                                  <span style={S.strongText}>{evtName}</span>
                                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                    <span style={isTech ? S.badgeTech : S.badgeNonTech}>
                                      {isTech ? 'Tech' : 'Non-Tech'}
                                    </span>
                                    {isEsports && (
                                      <span style={{
                                        background: esportsGame === 'BGMI' ? '#0891b2' : '#ea580c',
                                        color: '#ffffff',
                                        padding: '0.12rem 0.45rem',
                                        borderRadius: '4px',
                                        fontWeight: '800',
                                        fontSize: '0.7rem'
                                      }}>
                                        {esportsGame === 'BGMI' ? '🎯 BGMI' : '🔥 FREE FIRE'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={S.td}>
                                {teamName !== '-' ? (
                                  <span style={{
                                    background: isDark ? '#064e3b' : '#ecfdf5',
                                    color: isDark ? '#6ee7b7' : '#047857',
                                    padding: '0.25rem 0.65rem',
                                    borderRadius: '8px',
                                    fontWeight: '700',
                                    fontSize: '0.85rem'
                                  }}>
                                    {teamName}
                                  </span>
                                ) : (
                                  <span style={{ color: isDark ? '#6b7280' : '#94a3b8', fontSize: '0.85rem' }}>Individual</span>
                                )}
                              </td>
                              <td style={S.td}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={S.strongText}>{name}</span>
                                    {reg.phone && (
                                      <button
                                        type="button"
                                        title={`Chat with ${name} on WhatsApp`}
                                        onClick={() => handleShareSquadWhatsApp(reg, evt || { name: evtName, id: reg.event_id })}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: '#22c55e',
                                          cursor: 'pointer',
                                          padding: '2px',
                                          display: 'inline-flex',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <FaWhatsapp size={14} />
                                      </button>
                                    )}
                                  </div>
                                  <div style={S.tableSubText}>{reg.phone} • {reg.email}</div>
                                </div>
                              </td>
                              <td style={S.td}>
                                {members.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '0.78rem', color: isDark ? '#93c5fd' : '#1d4ed8', fontWeight: '700' }}>
                                      {members.length + 1} Members Total
                                    </span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                      <span style={{ background: isDark ? '#1f2937' : '#f1f5f9', color: isDark ? '#e2e8f0' : '#334155', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                                        1. {name} (Lead)
                                      </span>
                                      {members.map((m, idx) => (
                                        <span key={idx} style={{ background: isDark ? '#374151' : '#e2e8f0', color: isDark ? '#f9fafb' : '#0f172a', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                                          {idx + 2}. {m}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: isDark ? '#6b7280' : '#94a3b8' }}>N/A (Individual)</span>
                                )}
                              </td>
                              <td style={S.td}>
                                <div>
                                  {reg.college || 'CAHCET'}
                                  <div style={S.tableSubText}>{reg.department} ({reg.year})</div>
                                </div>
                              </td>
                              <td style={S.td}><span style={S.feeHighlight}>₹{getFee(reg)}</span></td>
                            </tr>
                          );
                        })}
                        {participantFilteredRegs.length === 0 && (
                          <tr><td colSpan="7" style={S.emptyState}>No participant records match the selected event and search query.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ================= SENT DETAILS / DISPATCHED LISTS HISTORY (ADMIN ONLY) ================= */}
              <div style={{ ...S.card, marginTop: '2rem' }}>
                <div style={S.cardHeaderFlex}>
                  <div>
                    <h3 style={S.cardTitle}>
                      {isLeadCoordinator 
                        ? `Dispatched Participant Lists History (${dispatchesList.length})` 
                        : `Sent Details & Dispatched Participant Lists (${dispatchesList.length})`}
                    </h3>
                    <span style={{ fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                      {isLeadCoordinator 
                        ? 'Log of participant lists dispatched to symposium event coordinators.' 
                        : 'History of event participant lists dispatched to Event Coordinators. Admin can edit assignments or delete/revoke lists.'}
                    </span>
                  </div>
                  <span style={S.idBadge}>
                    {isLeadCoordinator ? 'Dispatched Records' : 'Admin Control'}
                  </span>
                </div>

                <div style={S.tableResponsive}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>#</th>
                        <th style={S.th}>Event Name</th>
                        <th style={S.th}>Assigned Event Coordinator</th>
                        <th style={S.th}>Participants Count</th>
                        <th style={S.th}>Dispatched Date & Time</th>
                        <th style={S.th}>Status</th>
                        {!isLeadCoordinator && <th style={{ ...S.th, textAlign: 'right' }}>Admin Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchesList.map((d, index) => {
                        const evtRegs = registrationsList.filter(r => (r.event_id || r.eventId) === d.eventId);
                        const formattedDate = new Date(d.sentAt || Date.now()).toLocaleString();

                        return (
                          <tr key={d.id || index} style={S.tr}>
                            <td style={S.td}><span style={S.idBadge}>#{index + 1}</span></td>
                            <td style={S.td}>
                              <span style={S.strongText}>{d.eventName}</span>
                              <div style={S.tableSubText}>ID: {d.eventId}</div>
                            </td>
                            <td style={S.td}>
                              <span style={{
                                background: isDark ? '#1e3a8a' : '#eff6ff',
                                color: isDark ? '#93c5fd' : '#1d4ed8',
                                border: isDark ? '1px solid #1e40af' : '1px solid #bfdbfe',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '8px',
                                fontWeight: '700',
                                fontSize: '0.85rem'
                              }}>
                                {d.coordinatorName}
                              </span>
                            </td>
                            <td style={S.td}>
                              <span style={{ fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>
                                {evtRegs.length} Participants
                              </span>
                            </td>
                            <td style={S.td}>
                              <span style={{ fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                                {formattedDate}
                              </span>
                            </td>
                            <td style={S.td}>
                              <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></span>
                                Dispatched
                              </span>
                            </td>
                            {!isLeadCoordinator && (
                              <td style={{ ...S.td, textAlign: 'right' }}>
                                <button
                                  onClick={() => handleOpenEditDispatchModal(d)}
                                  style={S.actionBtnEdit}
                                  title="Edit / Re-assign Coordinator"
                                >
                                  <FaEdit size={13} /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteDispatch(d.id, d.eventName, d.coordinatorName)}
                                  style={S.actionBtnDelete}
                                  title="Delete & Revoke List"
                                >
                                  <FaTrash size={13} /> Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {dispatchesList.length === 0 && (
                        <tr>
                          <td colSpan={isLeadCoordinator ? 6 : 7} style={S.emptyState}>
                            No dispatched participant lists found yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 11. CLOSE RG (REGISTRATION ACCESS CONTROL)               */}
          {/* ======================================================== */}
          {activeTab === 'close-rg' && isAdminOrSuper && (
            <div style={S.dashboardView}>
              {/* Hero Status Card */}
              <div style={{
                ...S.card,
                background: registrationSettings.isRegistrationClosed
                  ? (isDark ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.25) 0%, rgba(69, 26, 26, 0.4) 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)')
                  : (isDark ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.25) 0%, rgba(6, 95, 70, 0.4) 100%)' : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'),
                border: registrationSettings.isRegistrationClosed
                  ? (isDark ? '2px solid #ef4444' : '2px solid #f87171')
                  : (isDark ? '2px solid #10b981' : '2px solid #34d399'),
                boxShadow: registrationSettings.isRegistrationClosed
                  ? (isDark ? '0 10px 30px rgba(239, 68, 68, 0.15)' : '0 10px 25px rgba(239, 68, 68, 0.1)')
                  : (isDark ? '0 10px 30px rgba(16, 185, 129, 0.15)' : '0 10px 25px rgba(16, 185, 129, 0.1)'),
                marginBottom: '1.75rem',
                padding: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: registrationSettings.isRegistrationClosed ? '#ef4444' : '#10b981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: registrationSettings.isRegistrationClosed ? '0 4px 14px rgba(239, 68, 68, 0.4)' : '0 4px 14px rgba(16, 185, 129, 0.4)',
                      flexShrink: 0
                    }}>
                      {registrationSettings.isRegistrationClosed ? <FaLock size={26} /> : <FaUnlock size={26} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                        <span style={{
                          background: registrationSettings.isRegistrationClosed ? '#7f1d1d' : '#064e3b',
                          color: registrationSettings.isRegistrationClosed ? '#fca5a5' : '#6ee7b7',
                          padding: '0.3rem 0.8rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase'
                        }}>
                          {registrationSettings.isRegistrationClosed ? '● REGISTRATIONS OFFICIALLY CLOSED' : '● REGISTRATIONS LIVE & ACCEPTING'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                          Mode: All 12 Events
                        </span>
                      </div>
                      <h2 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.65rem',
                        fontWeight: '800',
                        color: isDark ? '#f9fafb' : '#0f172a',
                        letterSpacing: '-0.02em'
                      }}>
                        {registrationSettings.isRegistrationClosed 
                          ? 'Public Registration Portal is Locked' 
                          : 'Public Registration Portal is Active'}
                      </h2>
                      <p style={{
                        margin: 0,
                        fontSize: '0.92rem',
                        color: isDark ? '#cbd5e1' : '#334155',
                        lineHeight: 1.5,
                        maxWidth: '680px'
                      }}>
                        {registrationSettings.isRegistrationClosed
                          ? 'All new registrations, form submissions, and online payments are blocked. Visitors visiting the registration portal are shown the official closing notice.'
                          : 'All 12 technical and non-technical competition forms are open. Participants can submit registrations and complete payments normally.'}
                      </p>
                      {registrationSettings.isRegistrationClosed && registrationSettings.closedAt && (
                        <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaClock size={12} />
                          <span>
                            Closed on {new Date(registrationSettings.closedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            {registrationSettings.closedBy ? ` by ${registrationSettings.closedBy}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Toggle Button */}
                  <div>
                    {registrationSettings.isRegistrationClosed ? (
                      <button
                        type="button"
                        onClick={() => handleOpenCloseRgModal('open')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '0.9rem 1.8rem',
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '0.98rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(5, 150, 105, 0.4)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <FaUnlock size={16} />
                        <span>Re-Open Registrations</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenCloseRgModal('close')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '0.9rem 1.8rem',
                          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '0.98rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <FaLock size={16} />
                        <span>Close All Registrations (Close RG)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
                <div style={S.statCard}>
                  <div style={S.statLabel}>Total Participants Registered</div>
                  <div style={S.statValue}>{registrationsList.length}</div>
                  <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: '600' }}>
                    Across all symposium events
                  </div>
                </div>
                <div style={S.statCard}>
                  <div style={S.statLabel}>Confirmed / Paid Admissions</div>
                  <div style={{ ...S.statValue, color: '#059669' }}>
                    {registrationsList.filter(r => (r.payment_status || r.paymentStatus || '').toLowerCase() === 'paid').length}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                    Verified with valid ticket codes
                  </div>
                </div>
                <div style={S.statCard}>
                  <div style={S.statLabel}>Competition Events Covered</div>
                  <div style={S.statValue}>12</div>
                  <div style={{ fontSize: '0.82rem', color: isDark ? '#93c5fd' : '#2563eb' }}>
                    6 Technical • 6 Non-Technical
                  </div>
                </div>
              </div>

              {/* Public Announcement Notice Editor */}
              <div style={S.card}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={S.cardTitle}>Homepage &amp; Registration Portal Announcement Settings</h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                    Configure the red scrolling marquee ticker and the on-spot registration subtitle shown on the homepage and registration portal when registrations are closed.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Field 1: Red Capsule Marquee Ticker */}
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>
                      1. Red Capsule Marquee Ticker Text (Scrolling Marquee) *
                    </label>
                    <input
                      type="text"
                      value={customClosedReason}
                      onChange={(e) => setCustomClosedReason(e.target.value)}
                      placeholder="e.g. ONLINE REGISTRATIONS ARE CLOSED"
                      style={{
                        ...S.input,
                        fontWeight: '700',
                        fontSize: '0.95rem'
                      }}
                    />
                    <span style={S.inputHelper}>
                      This text scrolls continuously inside the prominent red capsule ticker on the homepage hero banner.
                    </span>
                  </div>

                  {/* Field 2: Spot Registration Subtitle */}
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>
                      2. On-Spot / Desk Registration Subtitle Text (Down) *
                    </label>
                    <input
                      type="text"
                      value={customOnSpotNotice}
                      onChange={(e) => setCustomOnSpotNotice(e.target.value)}
                      placeholder="e.g. ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM"
                      style={{
                        ...S.input,
                        fontWeight: '700',
                        fontSize: '0.95rem'
                      }}
                    />
                    <span style={S.inputHelper}>
                      Displayed directly below the red marquee ticker in bold uppercase typography.
                    </span>
                  </div>

                  {/* Live Theme Preview */}
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    background: isDark ? '#0a0e17' : '#111827',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      letterSpacing: '0.15em',
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      alignSelf: 'flex-start'
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <FaBolt style={{ color: '#eab308' }} /> Live Homepage Hero Preview (When Closed):
                      </span>
                    </div>

                    {/* Red Marquee Capsule Pill Preview */}
                    <div className="hero-closed-marquee-pill" style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
                      <div className="hero-marquee-track">
                        <span className="marquee-text-block">
                          {(customClosedReason || 'ONLINE REGISTRATIONS ARE CLOSED').toUpperCase()} &nbsp;&bull;&nbsp;&nbsp; {(customClosedReason || 'ONLINE REGISTRATIONS ARE CLOSED').toUpperCase()} &nbsp;&bull;&nbsp;&nbsp; {(customClosedReason || 'ONLINE REGISTRATIONS ARE CLOSED').toUpperCase()} &nbsp;&bull;&nbsp;&nbsp;
                        </span>
                        <span className="marquee-text-block" aria-hidden="true">
                          {(customClosedReason || 'ONLINE REGISTRATIONS ARE CLOSED').toUpperCase()} &nbsp;&bull;&nbsp;&nbsp; {(customClosedReason || 'ONLINE REGISTRATIONS ARE CLOSED').toUpperCase()} &nbsp;&bull;&nbsp;&nbsp; {(customClosedReason || 'ONLINE REGISTRATIONS ARE CLOSED').toUpperCase()} &nbsp;&bull;&nbsp;&nbsp;
                        </span>
                      </div>
                    </div>

                    {/* Subtitle Preview */}
                    <p className="hero-closed-spot-subtitle" style={{ margin: 0, textAlign: 'center' }}>
                      {(customOnSpotNotice || 'ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM').toUpperCase()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleSaveCustomReason}
                      disabled={isSavingCustomReason}
                      style={{
                        ...S.primaryBtn,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.85rem 1.6rem',
                        fontSize: '0.92rem'
                      }}
                    >
                      {isSavingCustomReason ? <FaSpinner className="fa-spin" /> : <FaCheck />}
                      <span>Save Announcement Texts</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ==================== EDIT DISPATCH MODAL ==================== */}
      {isEditDispatchModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: isDark ? '#111827' : '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>
                  Re-assign Dispatched List
                </h3>
                <span style={{ fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                  Update assigned Event Coordinator
                </span>
              </div>
              <button
                onClick={() => setIsEditDispatchModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: isDark ? '#9ca3af' : '#64748b', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSaveDispatchEdit} style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={S.modalInputGroup}>
                <label style={S.label}>Assigned Event Coordinator Name *</label>
                {coordinators.length > 0 ? (
                  <select
                    value={editCoordNameInput}
                    onChange={(e) => setEditCoordNameInput(e.target.value)}
                    style={S.select}
                  >
                    {coordinators.map((c, i) => (
                      <option key={c.id || i} value={c.name}>
                        {c.name} {c.assignedEvents?.length ? `(${c.assignedEvents.join(', ')})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editCoordNameInput}
                    onChange={(e) => setEditCoordNameInput(e.target.value)}
                    style={S.input}
                    required
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditDispatchModalOpen(false)}
                  style={{ ...S.filterBtn, flex: 1, justifyContent: 'center', padding: '0.75rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...S.primaryBtn, flex: 1, justifyContent: 'center', padding: '0.75rem' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== SEND TO EVENT COORDINATOR MODAL ==================== */}
      {isSendModalOpen && sendTargetEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: isDark ? '#111827' : '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>
                  Send Participant List
                </h3>
                <span style={{ fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                  Event: <strong>{sendTargetEvent.name}</strong>
                </span>
              </div>
              <button
                onClick={() => setIsSendModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: isDark ? '#9ca3af' : '#64748b', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Esports Division Scope Selector (for Battle of Champions) */}
              {isEsportsEvent(sendTargetEvent) && (
                <div style={{ background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc', padding: '1rem', borderRadius: '12px', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0' }}>
                  <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                    <FaGamepad size={13} style={{ color: '#ea580c' }} /> Select Esports Tournament Division to Dispatch *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {[
                      { id: 'ALL', label: 'All Tracks', count: registrationsList.filter(r => (r.event_id || r.eventId) === sendTargetEvent.id).length, bg: '#3b82f6', icon: null },
                      { id: 'FREE FIRE', label: '🔥 Free Fire', count: registrationsList.filter(r => (r.event_id || r.eventId) === sendTargetEvent.id && getRegEsportsGame(r) === 'FREE FIRE').length, bg: '#ea580c', icon: null },
                      { id: 'BGMI', label: '🎯 BGMI', count: registrationsList.filter(r => (r.event_id || r.eventId) === sendTargetEvent.id && getRegEsportsGame(r) === 'BGMI').length, bg: '#0891b2', icon: null }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSendGameScope(tab.id)}
                        style={{
                          padding: '0.55rem 0.5rem',
                          borderRadius: '8px',
                          border: sendGameScope === tab.id ? `2px solid ${tab.bg}` : (isDark ? '1px solid #374151' : '1px solid #cbd5e1'),
                          background: sendGameScope === tab.id ? (isDark ? '#1e293b' : '#eff6ff') : (isDark ? '#111827' : '#ffffff'),
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: sendGameScope === tab.id ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#9ca3af' : '#64748b') }}>
                          {tab.label}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '800', color: tab.bg, marginTop: '2px' }}>
                          {tab.count} squads
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* 1-Click WhatsApp & Clipboard Sharing Tools */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: isDark ? '1px solid #374151' : '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => handleShareRosterWhatsApp(sendTargetEvent, sendGameScope, (coordinators.find(c => c.name === selectedCoordName)?.phone || ''))}
                      style={{
                        flex: 1,
                        background: '#22c55e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <FaWhatsapp size={13} /> Share on WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyRosterToClipboard(sendTargetEvent, sendGameScope)}
                      style={{
                        flex: 1,
                        background: isDark ? '#374151' : '#f1f5f9',
                        color: isDark ? '#f9fafb' : '#0f172a',
                        border: isDark ? '1px solid #4b5563' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <FaCopy size={12} /> Copy Roster Text
                    </button>
                  </div>
                </div>
              )}

              <div style={S.modalInputGroup}>
                <label style={S.label}>Select Event Coordinator Login / Recipient *</label>
                <select
                  value={selectedCoordUsername || selectedCoordName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCoordUsername(val);
                    // Match person name if exists
                    const matchedCoord = coordinators.find(c => c.name === val || c.id === val);
                    const matchedUser = users.find(u => u.username === val);
                    setSelectedCoordName(matchedCoord?.name || matchedUser?.username || val);
                  }}
                  style={S.select}
                >
                  <optgroup label="Allocated Coordinator Logins (Direct Dashboard Delivery)">
                    {(users || [])
                      .filter(u => {
                        const uEvents = u?.assignedEvents || (u?.eventId ? [u.eventId] : []);
                        return Array.isArray(uEvents) && uEvents.some(e => String(e || '').toLowerCase() === String(sendTargetEvent?.id || '').toLowerCase());
                      })
                      .map(u => (
                        <option key={`alloc-u-${u.id}`} value={u.username}>
                          @{u.username} ({u.role || 'Coordinator Login'}) — Allocated to this Event
                        </option>
                      ))}
                    {users && users.length > 0 && users.filter(u => {
                      const uEvents = u?.assignedEvents || (u?.eventId ? [u.eventId] : []);
                      return !Array.isArray(uEvents) || !uEvents.some(e => String(e || '').toLowerCase() === String(sendTargetEvent?.id || '').toLowerCase());
                    }).map(u => (
                      <option key={`other-u-${u.id}`} value={u.username}>
                        @{u.username} ({u.role})
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Assigned Event Coordinators Team">
                    {(coordinators || [])
                      .filter(c => Array.isArray(c?.assignedEvents) && c.assignedEvents.some(e => String(e || '').toLowerCase() === String(sendTargetEvent?.id || '').toLowerCase()))
                      .map(c => {
                        const gameTag = c.game ? ` [Track: ${c.game}]` : '';
                        return (
                          <option key={`alloc-c-${c.id}`} value={c.name}>
                            [Assigned] {c.name} ({c.role || 'Lead Coordinator'}${gameTag})
                          </option>
                        );
                      })}
                    {(coordinators || [])
                      .filter(c => !Array.isArray(c?.assignedEvents) || !c.assignedEvents.some(e => String(e || '').toLowerCase() === String(sendTargetEvent?.id || '').toLowerCase()))
                      .map(c => (
                        <option key={`other-c-${c.id}`} value={c.name}>
                          {c.name} {c.assignedEvents?.length ? `(${c.assignedEvents.join(', ')})` : ''} {c.game ? `[${c.game}]` : ''}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div style={{ background: isDark ? '#1f2937' : '#f8fafc', padding: '1rem', borderRadius: '10px', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.82rem', color: isDark ? '#cbd5e1' : '#475569', fontWeight: '600' }}>
                  Summary to Dispatch:
                </span>
                <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0, fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                  <li>Event: <strong>{sendTargetEvent.name}</strong> ({sendTargetEvent.category.toUpperCase()})</li>
                  {isEsportsEvent(sendTargetEvent) && (
                    <li>
                      Esports Division: <strong style={{ color: sendGameScope === 'FREE FIRE' ? '#ea580c' : (sendGameScope === 'BGMI' ? '#0891b2' : '#3b82f6') }}>
                        {sendGameScope === 'ALL' ? 'All Divisions (Free Fire + BGMI)' : `${sendGameScope} Only`}
                      </strong>
                    </li>
                  )}
                  <li>
                    Total Entries to Send: <strong>
                      {isEsportsEvent(sendTargetEvent) && sendGameScope !== 'ALL'
                        ? registrationsList.filter(r => (r.event_id || r.eventId) === sendTargetEvent.id && getRegEsportsGame(r) === sendGameScope).length
                        : registrationsList.filter(r => (r.event_id || r.eventId) === sendTargetEvent.id).length}
                    </strong>
                  </li>
                  <li>Target Recipient: <strong>{selectedCoordName || selectedCoordUsername || 'Coordinator'}</strong></li>
                  <li>Includes complete squad rosters, ticket IDs, and captain contact numbers.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsSendModalOpen(false)}
                  style={{ ...S.filterBtn, flex: 1, justifyContent: 'center', padding: '0.75rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSendingList}
                  onClick={handleConfirmSendList}
                  style={{
                    ...S.primaryBtn,
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '0.75rem',
                    background: isEsportsEvent(sendTargetEvent) && sendGameScope === 'FREE FIRE' 
                      ? '#ea580c' 
                      : (isEsportsEvent(sendTargetEvent) && sendGameScope === 'BGMI' ? '#0891b2' : S.primaryBtn.background)
                  }}
                >
                  <FaPaperPlane size={12} /> {isSendingList ? 'Sending...' : (isEsportsEvent(sendTargetEvent) && sendGameScope !== 'ALL' ? `Confirm & Send ${sendGameScope}` : 'Confirm & Send List')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT EVENT                               */}
      {/* ======================================================== */}
      {isEventEditModalOpen && (
        <div style={S.modalBackdrop} onClick={resetEventEditModal}>
          <div style={{ ...S.modalCard, maxWidth: '740px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalHeaderLeft}>
                <div style={S.modalIconBoxEvent}>
                  <FaCalendarAlt size={18} />
                </div>
                <div>
                  <h3 style={S.modalTitle}>
                    {isLeadCoordinator 
                      ? `Event Details: ${editingEvent ? (editingEvent.name || editingEvent.id.toUpperCase()) : 'Event'}` 
                      : (editingEvent ? `Edit Event: ${editingEvent.name || editingEvent.id.toUpperCase()}` : 'Add New Symposium Event')}
                  </h3>
                  <p style={S.modalSubtitle}>
                    {isLeadCoordinator 
                      ? 'Viewing event specifications, category, venue, schedule, entry fees, and competition rules.' 
                      : 'Updates made here synchronize directly with the live events and registration pages.'}
                  </p>
                </div>
              </div>
              <button onClick={resetEventEditModal} style={S.modalCloseBtn} title="Close (Esc)">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={isLeadCoordinator ? (e) => { e.preventDefault(); resetEventEditModal(); } : handleSubmitEventEdit} style={S.modalForm}>
              <div style={S.modalFormBody}>
                {/* Event Poster / Picture Upload & Presets */}
                <div style={S.modalInputGroup}>
                  <label style={S.label}>Event Poster / Picture</label>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '100px',
                      height: '75px',
                      borderRadius: '10px',
                      background: isDark ? '#1f2937' : '#f8fafc',
                      border: isDark ? '2px dashed #4b5563' : '2px dashed #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {(eventImagePreview || (editingEvent && getEventBanner(editingEvent))) ? (
                        <img 
                          src={eventImagePreview || getEventBanner(editingEvent)} 
                          alt="Event Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <FaImage color="#94a3b8" size={26} />
                      )}
                    </div>
                    {!isLeadCoordinator && (
                      <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input 
                          type="file" 
                          ref={eventFileInputRef} 
                          onChange={handleEventImageFileSelect} 
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          style={{ display: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            type="button" 
                            onClick={() => eventFileInputRef.current?.click()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '0.55rem 1rem',
                              background: isDark ? '#312e81' : '#eff6ff',
                              border: isDark ? '1px solid #4338ca' : '1px solid #bfdbfe',
                              color: isDark ? '#c7d2fe' : '#2563eb',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                            disabled={isUploadingEventImage}
                          >
                            <FaUpload size={12} /> {isUploadingEventImage ? 'Uploading Picture...' : 'Upload Custom Picture'}
                          </button>
                          {eventImagePreview && (
                            <button 
                              type="button" 
                              onClick={() => { setEventImage(''); setEventImagePreview(''); }}
                              style={{
                                padding: '0.55rem 0.85rem',
                                background: isDark ? '#1f2937' : '#f8fafc',
                                border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
                                color: isDark ? '#9ca3af' : '#64748b',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              Reset to Default
                            </button>
                          )}
                        </div>
                        
                        {/* Quick preset selector for existing artwork */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '500' }}>
                            Or pick existing poster:
                          </span>
                          <select
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val && defaultEventImages[val]) {
                                setEventImage(defaultEventImages[val]);
                                setEventImagePreview(defaultEventImages[val]);
                              }
                            }}
                            defaultValue=""
                            style={{
                              ...S.select,
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.8rem',
                              width: 'auto',
                              maxWidth: '240px'
                            }}
                          >
                            <option value="" disabled>Choose existing artwork...</option>
                            {EXISTING_POSTER_PRESETS.map((p) => (
                              <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                          </select>
                        </div>

                        <span style={S.inputHelper}>Upload new artwork (PNG, JPG, WEBP max 5MB) or select from existing event posters.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Event Name *</label>
                    <input 
                      type="text" 
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      style={S.input}
                      placeholder="e.g. PPT PRESENTATION"
                      required 
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                      autoFocus={!isLeadCoordinator}
                    />
                  </div>

                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Category *</label>
                    <select 
                      value={eventCategory} 
                      onChange={(e) => setEventCategory(e.target.value)}
                      style={S.select}
                      disabled={isLeadCoordinator}
                      required
                    >
                      <option value="technical">Technical</option>
                      <option value="non-technical">Non-Technical</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Tagline / Subtitle</label>
                    <input 
                      type="text" 
                      value={eventSubtitle}
                      onChange={(e) => setEventSubtitle(e.target.value)}
                      style={S.input}
                      placeholder="e.g. PowerPoint & Idea Pitch Deck"
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                    />
                  </div>

                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Event Tag / Badge</label>
                    <input 
                      type="text" 
                      value={eventTag}
                      onChange={(e) => setEventTag(e.target.value)}
                      style={S.input}
                      placeholder="e.g. Technical Presentation"
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Venue *</label>
                    <input 
                      type="text" 
                      value={eventVenue}
                      onChange={(e) => setEventVenue(e.target.value)}
                      style={S.input}
                      placeholder="e.g. CSE Seminar Hall / Drawing Hall"
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                      required 
                    />
                  </div>

                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Time / Schedule *</label>
                    <input 
                      type="text" 
                      value={eventTiming}
                      onChange={(e) => setEventTiming(e.target.value)}
                      style={S.input}
                      placeholder="e.g. 10:00 AM – 01:00 PM"
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                      required 
                    />
                  </div>
                </div>

                {/* Dedicated Venue Photo Section */}
                <div style={{
                  ...S.modalInputGroup,
                  background: isDark ? 'rgba(31, 41, 55, 0.4)' : '#f8fafc',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
                  marginTop: '0.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                    <label style={{ ...S.label, margin: 0, display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <FaImage color={isDark ? '#38bdf8' : '#0284c7'} /> Venue Photo / Image
                    </label>
                    <span style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Displayed on participant Event Rules popup
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '120px',
                      height: '80px',
                      borderRadius: '8px',
                      background: isDark ? '#111827' : '#ffffff',
                      border: isDark ? '2px dashed #4b5563' : '2px dashed #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {eventVenueImagePreview ? (
                        <img 
                          src={eventVenueImagePreview} 
                          alt="Venue Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '0.25rem' }}>
                          <FaBuilding color="#94a3b8" size={20} />
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '3px' }}>No photo set</div>
                        </div>
                      )}
                    </div>

                    {!isLeadCoordinator && (
                      <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input 
                          type="file" 
                          ref={venueFileInputRef} 
                          onChange={handleVenueImageFileSelect} 
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          style={{ display: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            type="button" 
                            onClick={() => venueFileInputRef.current?.click()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '0.55rem 0.95rem',
                              background: isDark ? '#064e3b' : '#ecfdf5',
                              border: isDark ? '1px solid #059669' : '1px solid #a7f3d0',
                              color: isDark ? '#6ee7b7' : '#059669',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                            disabled={isUploadingVenueImage}
                          >
                            <FaUpload size={12} /> {isUploadingVenueImage ? 'Uploading...' : 'Upload Venue Photo'}
                          </button>
                          {eventVenueImagePreview && (
                            <button 
                              type="button" 
                              onClick={() => { setEventVenueImage(''); setEventVenueImagePreview(''); }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '0.55rem 0.85rem',
                                background: isDark ? '#1f2937' : '#f8fafc',
                                border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
                                color: isDark ? '#ef4444' : '#dc2626',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              <FaTrash size={11} /> Remove Photo
                            </button>
                          )}
                        </div>
                        <input 
                          type="text" 
                          placeholder="Or paste image URL (https://...)" 
                          value={eventVenueImage.startsWith('data:') ? '' : eventVenueImage}
                          onChange={(e) => {
                            setEventVenueImage(e.target.value);
                            setEventVenueImagePreview(e.target.value);
                          }}
                          style={{
                            ...S.input,
                            padding: '0.45rem 0.65rem',
                            fontSize: '0.82rem'
                          }}
                        />
                        <span style={S.inputHelper}>
                          Upload a photo of the room, lab, or arena for this venue. Each venue on the event rules page will display only its own photo.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Registration Fee *</label>
                    <input 
                      type="text" 
                      value={eventFee}
                      onChange={(e) => setEventFee(e.target.value)}
                      style={S.input}
                      placeholder="e.g. ₹100 per head"
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                      required 
                    />
                  </div>

                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Team Size / Format</label>
                    <input 
                      type="text" 
                      value={eventTeamSize}
                      onChange={(e) => setEventTeamSize(e.target.value)}
                      style={S.input}
                      placeholder="e.g. Max of 3 members"
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                    />
                  </div>
                </div>

                <div style={S.modalInputGroup}>
                  <label style={S.label}>Description</label>
                  <textarea 
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    style={{ ...S.input, resize: 'vertical' }}
                    rows={3}
                    placeholder="Brief description of the event, objective, and format..."
                    disabled={isLeadCoordinator}
                    readOnly={isLeadCoordinator}
                  />
                </div>

                {/* Event Rules & Regulations Management */}
                <div style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(31, 41, 55, 0.45)' : 'rgba(248, 250, 252, 0.95)',
                  border: isDark ? '1px solid #374151' : '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaListOl style={{ color: isDark ? '#93c5fd' : '#2563eb' }} />
                      <label style={{ ...S.label, margin: 0, fontSize: '0.92rem', fontWeight: '700' }}>
                        Competition Rules & Guidelines
                      </label>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: isDark ? '#1e3a8a' : '#dbeafe',
                        color: isDark ? '#93c5fd' : '#1d4ed8',
                        fontWeight: '700'
                      }}>
                        {rulesInputMode === 'bulk' 
                          ? `${parseBulkRules(bulkRulesText).length} Rules` 
                          : `${eventRules.filter(r => r.trim()).length} Rules`}
                      </span>
                    </div>

                    {!isLeadCoordinator && (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (rulesInputMode === 'list') {
                              setBulkRulesText(eventRules.filter(r => r.trim()).join('\n'));
                              setRulesInputMode('bulk');
                            } else {
                              const parsed = parseBulkRules(bulkRulesText);
                              setEventRules(parsed.length > 0 ? parsed : ['']);
                              setRulesInputMode('list');
                            }
                          }}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            borderRadius: '6px',
                            background: isDark ? '#374151' : '#f1f5f9',
                            color: isDark ? '#e5e7eb' : '#475569',
                            border: isDark ? '1px solid #4b5563' : '1px solid #cbd5e1',
                            cursor: 'pointer'
                          }}
                        >
                          {rulesInputMode === 'list' ? 'Switch to Bulk Paste' : 'Switch to List View'}
                        </button>

                        {rulesInputMode === 'list' && (
                          <button
                            type="button"
                            onClick={handleAddRule}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              borderRadius: '6px',
                              background: isDark ? '#1e40af' : '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <FaPlus size={10} /> Add Rule
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <p style={{ ...S.inputHelper, marginBottom: '0.75rem' }}>
                    {isLeadCoordinator 
                      ? 'Rules configured for this event shown below:' 
                      : 'Rules will appear dynamically with numbered badges on the public event rules page.'}
                  </p>

                  {rulesInputMode === 'list' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {eventRules.map((rule, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isDark ? '#1e293b' : '#e2e8f0',
                            color: isDark ? '#93c5fd' : '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            flexShrink: 0
                          }}>
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={rule}
                            onChange={(e) => handleRuleChange(idx, e.target.value)}
                            placeholder={`Rule #${idx + 1}`}
                            disabled={isLeadCoordinator}
                            readOnly={isLeadCoordinator}
                            style={{ ...S.input, flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                          />
                          {!isLeadCoordinator && (
                            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => handleMoveRule(idx, 'up')}
                                disabled={idx === 0}
                                style={{
                                  padding: '4px 6px',
                                  background: 'transparent',
                                  border: 'none',
                                  color: idx === 0 ? '#6b7280' : (isDark ? '#9ca3af' : '#64748b'),
                                  cursor: idx === 0 ? 'default' : 'pointer',
                                  opacity: idx === 0 ? 0.3 : 1
                                }}
                                title="Move rule up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveRule(idx, 'down')}
                                disabled={idx === eventRules.length - 1}
                                style={{
                                  padding: '4px 6px',
                                  background: 'transparent',
                                  border: 'none',
                                  color: idx === eventRules.length - 1 ? '#6b7280' : (isDark ? '#9ca3af' : '#64748b'),
                                  cursor: idx === eventRules.length - 1 ? 'default' : 'pointer',
                                  opacity: idx === eventRules.length - 1 ? 0.3 : 1
                                }}
                                title="Move rule down"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRule(idx)}
                                style={{
                                  padding: '4px 6px',
                                  background: isDark ? '#451a1a' : '#fee2e2',
                                  border: isDark ? '1px solid #7f1d1d' : '1px solid #fecaca',
                                  color: '#ef4444',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                                title="Delete rule"
                              >
                                <FaTrash size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {eventRules.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '1rem', color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.85rem' }}>
                          No rules listed for this event.
                        </div>
                      )}

                      {!isLeadCoordinator && (
                        <button
                          type="button"
                          onClick={handleAddRule}
                          style={{
                            marginTop: '4px',
                            alignSelf: 'flex-start',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '6px',
                            background: isDark ? '#1f2937' : '#f8fafc',
                            border: isDark ? '1px dashed #4b5563' : '1px dashed #cbd5e1',
                            color: isDark ? '#60a5fa' : '#2563eb',
                            fontSize: '0.82rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <FaPlus size={10} /> Add Another Rule
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={bulkRulesText}
                        onChange={(e) => setBulkRulesText(e.target.value)}
                        rows={6}
                        placeholder="Paste or type one rule per line..."
                        style={{
                          ...S.input,
                          width: '100%',
                          fontFamily: 'monospace',
                          fontSize: '0.82rem',
                          lineHeight: '1.5',
                          resize: 'vertical'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                          Bullet markers (1., 2., -, *) will be cleaned automatically.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const parsed = parseBulkRules(bulkRulesText);
                            setEventRules(parsed.length > 0 ? parsed : ['']);
                            setRulesInputMode('list');
                          }}
                          style={{
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            background: isDark ? '#374151' : '#e2e8f0',
                            color: isDark ? '#f3f4f6' : '#1e293b',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          Apply to List
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Event Rounds & Competition Stages Management */}
                <div style={{
                  marginTop: '0.85rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(31, 41, 55, 0.45)' : 'rgba(248, 250, 252, 0.95)',
                  border: isDark ? '1px solid #374151' : '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaLayerGroup style={{ color: isDark ? '#38bdf8' : '#0284c7' }} />
                      <label style={{ ...S.label, margin: 0, fontSize: '0.92rem', fontWeight: '700' }}>
                        Competition Rounds & Stages
                      </label>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: isDark ? '#0c4a6e' : '#e0f2fe',
                        color: isDark ? '#38bdf8' : '#0284c7',
                        fontWeight: '700'
                      }}>
                        {roundsInputMode === 'bulk'
                          ? `${parseBulkRounds(bulkRoundsText).length} Rounds`
                          : `${eventRounds.filter(r => (r.name && r.name.trim()) || (r.desc && r.desc.trim())).length} Rounds`}
                      </span>
                    </div>

                    {!isLeadCoordinator && (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (roundsInputMode === 'list') {
                              setBulkRoundsText(formatRoundsToBulkText(eventRounds));
                              setRoundsInputMode('bulk');
                            } else {
                              const parsed = parseBulkRounds(bulkRoundsText);
                              setEventRounds(parsed.length > 0 ? parsed : [{ name: 'Round 1: Preliminary', time: '', desc: '' }]);
                              setRoundsInputMode('list');
                            }
                          }}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            borderRadius: '6px',
                            background: isDark ? '#374151' : '#f1f5f9',
                            color: isDark ? '#e5e7eb' : '#475569',
                            border: isDark ? '1px solid #4b5563' : '1px solid #cbd5e1',
                            cursor: 'pointer'
                          }}
                        >
                          {roundsInputMode === 'list' ? 'Switch to Bulk Paste' : 'Switch to Card View'}
                        </button>

                        {roundsInputMode === 'list' && (
                          <button
                            type="button"
                            onClick={handleAddRound}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              borderRadius: '6px',
                              background: isDark ? '#0284c7' : '#0ea5e9',
                              color: '#ffffff',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <FaPlus size={10} /> Add Round
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <p style={{ ...S.inputHelper, marginBottom: '0.75rem' }}>
                    {isLeadCoordinator
                      ? 'Competition rounds and evaluation stages configured for this event shown below:'
                      : 'Configure the stages, timings, and rules for each round. These synchronize live with the Round Structure card on the participant event details page.'}
                  </p>

                  {roundsInputMode === 'list' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {eventRounds.map((rnd, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '0.85rem',
                            borderRadius: '8px',
                            background: isDark ? 'rgba(17, 24, 39, 0.75)' : '#ffffff',
                            border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          {/* Top Row: Round Badge and Actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: isDark ? '#1e293b' : '#e2e8f0',
                              color: isDark ? '#38bdf8' : '#0284c7',
                              letterSpacing: '0.04em'
                            }}>
                              ROUND {idx + 1}
                            </span>

                            {!isLeadCoordinator && (
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleMoveRound(idx, 'up')}
                                  disabled={idx === 0}
                                  style={{
                                    padding: '3px 6px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: idx === 0 ? '#6b7280' : (isDark ? '#9ca3af' : '#64748b'),
                                    cursor: idx === 0 ? 'default' : 'pointer',
                                    opacity: idx === 0 ? 0.3 : 1
                                  }}
                                  title="Move round up"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveRound(idx, 'down')}
                                  disabled={idx === eventRounds.length - 1}
                                  style={{
                                    padding: '3px 6px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: idx === eventRounds.length - 1 ? '#6b7280' : (isDark ? '#9ca3af' : '#64748b'),
                                    cursor: idx === eventRounds.length - 1 ? 'default' : 'pointer',
                                    opacity: idx === eventRounds.length - 1 ? 0.3 : 1
                                  }}
                                  title="Move round down"
                                >
                                  ▼
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRound(idx)}
                                  style={{
                                    padding: '3px 6px',
                                    background: isDark ? '#451a1a' : '#fee2e2',
                                    border: isDark ? '1px solid #7f1d1d' : '1px solid #fecaca',
                                    color: '#ef4444',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                  title="Delete round"
                                >
                                  <FaTrash size={10} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Round Name & Duration inputs */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '8px' }}>
                            <div>
                              <input
                                type="text"
                                value={rnd.name || ''}
                                onChange={(e) => handleRoundChange(idx, 'name', e.target.value)}
                                placeholder="Round Title / Name (e.g. Preliminary Screening)"
                                disabled={isLeadCoordinator}
                                readOnly={isLeadCoordinator}
                                style={{ ...S.input, padding: '0.45rem 0.65rem', fontSize: '0.82rem', width: '100%' }}
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={rnd.time || ''}
                                onChange={(e) => handleRoundChange(idx, 'time', e.target.value)}
                                placeholder="Timing (e.g. 30 Mins)"
                                disabled={isLeadCoordinator}
                                readOnly={isLeadCoordinator}
                                style={{ ...S.input, padding: '0.45rem 0.65rem', fontSize: '0.82rem', width: '100%' }}
                              />
                            </div>
                          </div>

                          {/* Description / Evaluation details */}
                          <div>
                            <textarea
                              value={rnd.desc || ''}
                              onChange={(e) => handleRoundChange(idx, 'desc', e.target.value)}
                              placeholder="Round objectives, challenge format, or evaluation criteria..."
                              rows={2}
                              disabled={isLeadCoordinator}
                              readOnly={isLeadCoordinator}
                              style={{ ...S.input, padding: '0.45rem 0.65rem', fontSize: '0.82rem', width: '100%', resize: 'vertical' }}
                            />
                          </div>
                        </div>
                      ))}

                      {eventRounds.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '1rem', color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.85rem' }}>
                          No rounds listed for this event.
                        </div>
                      )}

                      {!isLeadCoordinator && (
                        <button
                          type="button"
                          onClick={handleAddRound}
                          style={{
                            marginTop: '4px',
                            alignSelf: 'flex-start',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '6px',
                            background: isDark ? '#1f2937' : '#f8fafc',
                            border: isDark ? '1px dashed #4b5563' : '1px dashed #cbd5e1',
                            color: isDark ? '#38bdf8' : '#0284c7',
                            fontSize: '0.82rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <FaPlus size={10} /> Add Another Round
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={bulkRoundsText}
                        onChange={(e) => setBulkRoundsText(e.target.value)}
                        rows={6}
                        placeholder={"Format: Round Name | Duration | Description\ne.g.\nRound 1: Rapid Fire MCQs | 15 Mins | 30 fast-paced technical questions\nRound 2: Live Coding Challenge | 45 Mins | Fix broken code snippets and solve algorithms"}
                        style={{
                          ...S.input,
                          width: '100%',
                          fontFamily: 'monospace',
                          fontSize: '0.82rem',
                          lineHeight: '1.5',
                          resize: 'vertical'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                          Separate Title, Duration, and Description using "|" or ":".
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const parsed = parseBulkRounds(bulkRoundsText);
                            setEventRounds(parsed.length > 0 ? parsed : [{ name: 'Round 1', time: '', desc: '' }]);
                            setRoundsInputMode('list');
                          }}
                          style={{
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            background: isDark ? '#374151' : '#e2e8f0',
                            color: isDark ? '#f3f4f6' : '#1e293b',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          Apply to List
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={isLeadCoordinator ? { ...S.modalFooter, justifyContent: 'flex-end' } : S.modalFooter}>
                {isLeadCoordinator ? (
                  <button type="button" onClick={resetEventEditModal} style={S.primaryBtn}>
                    Close
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={resetEventEditModal} style={S.cancelBtn}>
                      Cancel
                    </button>
                    <button type="submit" style={S.primaryBtn}>
                      {editingEvent ? 'Save Event Changes' : 'Create Event'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: USER CREATE / EDIT                                */}
      {/* ======================================================== */}
      {isUserFormVisible && (
        <div style={S.modalBackdrop} onClick={resetUserForm}>
          <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalHeaderLeft}>
                <div style={S.modalIconBox}><FaUserCheck size={20} /></div>
                <div>
                  <h3 style={S.modalTitle}>{editingUserId ? 'Edit System User' : 'Create New User'}</h3>
                  <p style={S.modalSubtitle}>{editingUserId ? 'Modify user credentials or permission level' : 'Grant administrative access to a new user account'}</p>
                </div>
              </div>
              <button onClick={resetUserForm} style={S.modalCloseBtn}><FaTimes /></button>
            </div>
            
            <form onSubmit={handleSubmitUser} style={S.modalForm}>
              <div style={S.modalFormBody}>
                <div style={S.modalInputGroup}>
                  <label style={S.label}>Username *</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="e.g. jdoe_admin"
                    style={S.input}
                    required
                  />
                </div>

                <div style={S.modalInputGroup}>
                  <label style={S.label}>Password {editingUserId ? '(Leave blank to retain current)' : '*'}</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder={editingUserId ? '••••••••' : 'Enter strong password'}
                    style={S.input}
                    required={!editingUserId}
                  />
                </div>

                <div style={S.modalInputGroup}>
                  <label style={S.label}>Assigned Role *</label>
                  <select 
                    value={userRole} 
                    onChange={(e) => setUserRole(e.target.value)}
                    style={S.select}
                    required
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={S.modalFooter}>
                <button type="button" onClick={resetUserForm} style={S.cancelBtn}>Cancel</button>
                <button type="submit" style={S.primaryBtn}>
                  {editingUserId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ROLE CREATE / EDIT                                */}
      {/* ======================================================== */}
      {isRoleFormVisible && (
        <div style={S.modalBackdrop} onClick={resetRoleForm}>
          <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalHeaderLeft}>
                <div style={S.modalIconBoxRole}><FaShieldAlt size={20} /></div>
                <div>
                  <h3 style={S.modalTitle}>{editingRoleId ? 'Edit Role' : 'Create New Role'}</h3>
                  <p style={S.modalSubtitle}>{editingRoleId ? 'Modify custom role label' : 'Define an access level identifier for user grouping'}</p>
                </div>
              </div>
              <button onClick={resetRoleForm} style={S.modalCloseBtn}><FaTimes /></button>
            </div>
            
            <form onSubmit={handleSubmitRole} style={S.modalForm}>
              <div style={S.modalFormBody}>
                <div style={S.modalInputGroup}>
                  <label style={S.label}>Role Identifier Name *</label>
                  <input 
                    type="text" 
                    value={roleNameInput} 
                    onChange={(e) => setRoleNameInput(e.target.value)} 
                    placeholder="e.g. coordinator, validator, reviewer"
                    style={S.input}
                    required
                  />
                  <span style={S.inputHelper}>Lowercase identifier without spaces recommended.</span>
                </div>
              </div>

              <div style={S.modalFooter}>
                <button type="button" onClick={resetRoleForm} style={S.cancelBtn}>Cancel</button>
                <button type="submit" style={{ ...S.primaryBtn, background: '#059669' }}>
                  {editingRoleId ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SPONSOR CREATE / EDIT / VIEW                      */}
      {/* ======================================================== */}
      {isSponsorFormVisible && (
        <div style={S.modalBackdrop} onClick={resetSponsorForm}>
          <div style={{ ...S.modalCard, maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalHeaderLeft}>
                <div style={{ ...S.modalIconBox, background: isDark ? '#78350f' : '#fef3c7', color: '#b45309' }}>
                  <FaHandshake size={20} />
                </div>
                <div>
                  <h3 style={S.modalTitle}>
                    {isLeadCoordinator 
                      ? `Sponsor Details: ${sponsorName || 'Sponsor'}` 
                      : (editingSponsorId ? 'Edit Sponsor' : 'Add New Sponsor')}
                  </h3>
                  <p style={S.modalSubtitle}>
                    {isLeadCoordinator 
                      ? 'View sponsor branding, category, contact information, and public status' 
                      : 'Configure branding, category, contact info, and website link'}
                  </p>
                </div>
              </div>
              <button onClick={resetSponsorForm} style={S.modalCloseBtn}><FaTimes /></button>
            </div>
            
            <form onSubmit={isLeadCoordinator ? (e) => { e.preventDefault(); resetSponsorForm(); } : handleSubmitSponsor} style={S.modalForm}>
              <div style={S.modalFormBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Sponsor Name *</label>
                    <input 
                      type="text" 
                      value={sponsorName} 
                      onChange={(e) => setSponsorName(e.target.value)} 
                      placeholder="e.g. APEX DYNAMICS"
                      style={S.input}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                      required
                    />
                  </div>

                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Company / Organization</label>
                    <input 
                      type="text" 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)} 
                      placeholder="e.g. Apex Dynamics Pvt Ltd"
                      style={S.input}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                    />
                  </div>
                </div>

                {/* Logo Upload Section */}
                <div style={S.modalInputGroup}>
                  <label style={S.label}>Sponsor Logo</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '10px',
                      background: isDark ? '#1f2937' : '#f8fafc',
                      border: isDark ? '2px dashed #4b5563' : '2px dashed #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <FaImage color="#94a3b8" size={24} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleLogoFileSelect} 
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        style={{ display: 'none' }}
                        disabled={isLeadCoordinator}
                      />
                      {!isLeadCoordinator ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '0.5rem 0.9rem',
                              background: isDark ? '#1e3a8a' : '#eff6ff',
                              border: isDark ? '1px solid #1e40af' : '1px solid #bfdbfe',
                              color: isDark ? '#93c5fd' : '#2563eb',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                            disabled={isUploadingLogo}
                          >
                            <FaUpload size={12} /> {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                          </button>
                          {logoPreview && (
                            <button 
                              type="button" 
                              onClick={() => { setSponsorLogo(''); setLogoPreview(''); }}
                              style={{
                                padding: '0.5rem 0.8rem',
                                background: isDark ? '#1f2937' : '#f8fafc',
                                border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
                                color: isDark ? '#9ca3af' : '#64748b',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                          {logoPreview ? 'Sponsor brand logo is on file' : 'No logo uploaded for this sponsor'}
                        </span>
                      )}
                      {!isLeadCoordinator && (
                        <span style={S.inputHelper}>Supported formats: PNG, JPG, WEBP, SVG (Max 5MB)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Sponsorship Level *</label>
                    <select 
                      value={sponsorCategory} 
                      onChange={(e) => setSponsorCategory(e.target.value)}
                      style={S.select}
                      disabled={isLeadCoordinator}
                      required
                    >
                      <option value="Elite">Elite</option>
                      <option value="Premium">Premium</option>
                      <option value="Standard">Standard</option>
                    </select>
                  </div>

                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Display Order (Priority)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={sponsorDisplayOrder} 
                      onChange={(e) => setSponsorDisplayOrder(e.target.value)} 
                      placeholder="1"
                      style={S.input}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div>
                    <label style={S.label}>Website URL</label>
                    <input 
                      type="url" 
                      value={sponsorWebsite} 
                      onChange={(e) => setSponsorWebsite(e.target.value)} 
                      placeholder="https://example.com/partner"
                      style={S.input}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                    />
                  </div>
                  <div>
                    <label style={S.label}>Location / Map URL</label>
                    <input 
                      type="url" 
                      value={sponsorLocationUrl} 
                      onChange={(e) => setSponsorLocationUrl(e.target.value)} 
                      placeholder="https://maps.google.com/?q=..."
                      style={S.input}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                    />
                  </div>
                </div>

                <div style={S.modalInputGroup}>
                  <label style={S.label}>Sponsor Description</label>
                  <textarea 
                    value={sponsorDesc} 
                    onChange={(e) => setSponsorDesc(e.target.value)} 
                    placeholder="Short description displayed on the flip card on the public website..."
                    rows={3}
                    style={{ ...S.input, resize: 'vertical' }}
                    disabled={isLeadCoordinator}
                    readOnly={isLeadCoordinator}
                  />
                </div>

                {/* Contact Information */}
                <div style={{ background: isDark ? '#1a2234' : '#f8fafc', padding: '1rem', borderRadius: '10px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isDark ? '#cbd5e1' : '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Contact Person (Internal Admin Record - Optional)
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.6rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b' }}>Contact Name</label>
                      <input 
                        type="text" 
                        value={sponsorContactName} 
                        onChange={(e) => setSponsorContactName(e.target.value)} 
                        placeholder="e.g. John Doe"
                        style={{ ...S.input, marginTop: '2px' }}
                        disabled={isLeadCoordinator}
                        readOnly={isLeadCoordinator}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b' }}>Phone Number</label>
                      <input 
                        type="text" 
                        value={sponsorContactPhone} 
                        onChange={(e) => setSponsorContactPhone(e.target.value)} 
                        placeholder="e.g. 9876543210"
                        style={{ ...S.input, marginTop: '2px' }}
                        disabled={isLeadCoordinator}
                        readOnly={isLeadCoordinator}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.6rem' }}>
                    <label style={{ fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b' }}>Contact Email</label>
                    <input 
                      type="email" 
                      value={sponsorContactEmail} 
                      onChange={(e) => setSponsorContactEmail(e.target.value)} 
                      placeholder="e.g. partner@company.com"
                      style={{ ...S.input, marginTop: '2px' }}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0.2rem' }}>
                  <input 
                    type="checkbox" 
                    id="sponsorActive"
                    checked={sponsorIsActive} 
                    onChange={(e) => setSponsorIsActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: isLeadCoordinator ? 'default' : 'pointer' }}
                    disabled={isLeadCoordinator}
                  />
                  <label htmlFor="sponsorActive" style={{ fontSize: '0.9rem', fontWeight: '600', color: isDark ? '#f9fafb' : '#0f172a', cursor: isLeadCoordinator ? 'default' : 'pointer' }}>
                    Active Sponsor (Visible publicly on website marquee)
                  </label>
                </div>
              </div>

              <div style={isLeadCoordinator ? { ...S.modalFooter, justifyContent: 'flex-end' } : S.modalFooter}>
                {isLeadCoordinator ? (
                  <button type="button" onClick={resetSponsorForm} style={S.primaryBtn}>
                    Close
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={resetSponsorForm} style={S.cancelBtn}>Cancel</button>
                    <button type="submit" style={S.primaryBtn}>
                      {editingSponsorId ? 'Save Changes' : 'Create Sponsor'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: COORDINATOR CREATE / EDIT / VIEW                  */}
      {/* ======================================================== */}
      {isCoordFormVisible && (
        <div style={S.modalBackdrop} onClick={resetCoordForm}>
          <div style={{ ...S.modalCard, maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalHeaderLeft}>
                <div style={{ ...S.modalIconBox, background: isDark ? '#1e3a8a' : '#eff6ff', color: '#2563eb' }}>
                  <FaUserTie size={20} />
                </div>
                <div>
                  <h3 style={S.modalTitle}>
                    {isLeadCoordinator 
                      ? `Member Details: ${coordName || 'Event Member'}` 
                      : (editingCoordId ? 'Edit Event Coordinator / Sub-Coordinator' : 'Add Event Coordinator / Sub-Coordinator')}
                  </h3>
                  <p style={S.modalSubtitle}>
                    {isLeadCoordinator 
                      ? 'View coordinator/sub-coordinator assignment, contact phone, and allocated event' 
                      : 'Allocate Lead Coordinators, Coordinators, and Sub-Coordinators with phone numbers to symposium events'}
                  </p>
                </div>
              </div>
              <button onClick={resetCoordForm} style={S.modalCloseBtn}><FaTimes /></button>
            </div>
            
            <form onSubmit={isLeadCoordinator ? (e) => { e.preventDefault(); resetCoordForm(); } : handleSubmitCoord} style={S.modalForm}>
              <div style={S.modalFormBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Full Name *</label>
                    <input 
                      type="text" 
                      value={coordName} 
                      onChange={(e) => setCoordName(e.target.value)} 
                      placeholder="e.g. Mohammed Nabeel"
                      style={S.input}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                      required
                    />
                  </div>

                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Phone Number (10 Digits) *</label>
                    <input 
                      type="tel" 
                      value={coordPhone} 
                      onChange={(e) => setCoordPhone(e.target.value)} 
                      placeholder="e.g. 9994023366"
                      style={S.input}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>WhatsApp Number</label>
                    <input 
                      type="tel" 
                      value={coordWhatsapp} 
                      onChange={(e) => setCoordWhatsapp(e.target.value)} 
                      placeholder="e.g. 9994023366"
                      style={S.input}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                    />
                  </div>

                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Email Address</label>
                    <input 
                      type="email" 
                      value={coordEmail} 
                      onChange={(e) => setCoordEmail(e.target.value)} 
                      placeholder="e.g. nabeel@cahcet.edu.in"
                      style={S.input}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Department</label>
                    <input 
                      type="text" 
                      value={coordDept} 
                      onChange={(e) => setCoordDept(e.target.value)} 
                      placeholder="CSE / IT / ECE"
                      style={S.input}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                    />
                  </div>

                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Year of Study</label>
                    <select 
                      value={coordYear} 
                      onChange={(e) => setCoordYear(e.target.value)}
                      style={S.select}
                      disabled={isLeadCoordinator}
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>

                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Role *</label>
                    <select 
                      value={coordRole} 
                      onChange={(e) => setCoordRole(e.target.value)}
                      style={S.select}
                      disabled={isLeadCoordinator}
                      required
                    >
                      <option value="Lead Coordinator">Lead Coordinator</option>
                      <option value="Coordinator">Coordinator</option>
                      <option value="Sub-Coordinator">Sub-Coordinator</option>
                    </select>
                  </div>
                </div>

                {/* Event Assignment Checklist */}
                <div style={S.modalInputGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={S.label}>Assigned Events * ({coordEvents.length} selected)</label>
                    <span style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                      {isLeadCoordinator ? 'Events assigned to this coordinator' : 'Select one or more events'}
                    </span>
                  </div>

                  <div style={{ 
                    border: isDark ? '1px solid #374151' : '1px solid #cbd5e1', 
                    borderRadius: '10px', 
                    padding: '0.85rem', 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    background: isDark ? '#1f2937' : '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}>
                    {/* Technical Events */}
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isDark ? '#93c5fd' : '#1e40af', letterSpacing: '0.04em' }}>
                      TECHNICAL EVENTS
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {eventsList.filter(e => e.category === 'technical').map(ev => {
                        const isChecked = coordEvents.includes(ev.id);
                        return (
                          <label 
                            key={ev.id} 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              background: isChecked ? (isDark ? '#1e3a8a' : '#eff6ff') : (isDark ? '#111827' : '#ffffff'),
                              border: isChecked ? (isDark ? '1px solid #2563eb' : '1px solid #bfdbfe') : (isDark ? '1px solid #374151' : '1px solid #e2e8f0'),
                              cursor: isLeadCoordinator ? 'default' : 'pointer',
                              fontSize: '0.82rem',
                              fontWeight: isChecked ? '700' : '500',
                              color: isChecked ? (isDark ? '#bfdbfe' : '#1e40af') : (isDark ? '#e5e7eb' : '#334155')
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => toggleEventSelection(ev.id)}
                              style={{ cursor: isLeadCoordinator ? 'default' : 'pointer' }}
                              disabled={isLeadCoordinator}
                            />
                            <span>{ev.name}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Non-Technical Events */}
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isDark ? '#f472b6' : '#9d174d', letterSpacing: '0.04em', marginTop: '6px' }}>
                      NON-TECHNICAL EVENTS
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {eventsList.filter(e => e.category === 'non-technical').map(ev => {
                        const isChecked = coordEvents.includes(ev.id);
                        return (
                          <label 
                            key={ev.id} 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              background: isChecked ? (isDark ? '#831843' : '#fdf2f8') : (isDark ? '#111827' : '#ffffff'),
                              border: isChecked ? (isDark ? '1px solid #db2777' : '1px solid #fbcfe8') : (isDark ? '1px solid #374151' : '1px solid #e2e8f0'),
                              cursor: isLeadCoordinator ? 'default' : 'pointer',
                              fontSize: '0.82rem',
                              fontWeight: isChecked ? '700' : '500',
                              color: isChecked ? (isDark ? '#fbcfe8' : '#be185d') : (isDark ? '#e5e7eb' : '#334155')
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => toggleEventSelection(ev.id)}
                              style={{ cursor: isLeadCoordinator ? 'default' : 'pointer' }}
                              disabled={isLeadCoordinator}
                            />
                            <span>{ev.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Battle of Champions Game Selection Option */}
                {coordEvents.includes('nontech-05') && (
                  <div style={{
                    borderRadius: '12px',
                    padding: '1rem',
                    background: isDark ? 'linear-gradient(135deg, rgba(234, 88, 12, 0.12), rgba(6, 182, 212, 0.12))' : 'linear-gradient(135deg, #fff7ed, #ecfeff)',
                    border: `1.5px solid ${isDark ? 'rgba(234, 88, 12, 0.35)' : '#fed7aa'}`,
                    boxShadow: '0 4px 15px rgba(234, 88, 12, 0.08)',
                    transition: 'all 0.25s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                      <label style={{ ...S.label, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px', color: isDark ? '#fdba74' : '#c2410c', fontWeight: '800' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FaGamepad /> Battle of Champions Game Track *</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: '600', padding: '0.1rem 0.4rem', borderRadius: '4px', background: isDark ? '#374151' : '#ffedd5' }}>Required</span>
                      </label>
                      <span style={{ fontSize: '0.74rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                        Select tournament arena
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {/* FREE FIRE */}
                      <button
                        type="button"
                        onClick={() => setCoordGame('Free Fire')}
                        disabled={isLeadCoordinator}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: coordGame === 'Free Fire' 
                            ? '2px solid #ea580c' 
                            : `1px solid ${isDark ? '#374151' : '#e2e8f0'}`,
                          background: coordGame === 'Free Fire'
                            ? (isDark ? 'linear-gradient(135deg, rgba(234, 88, 12, 0.3), rgba(220, 38, 38, 0.3))' : '#ffedd5')
                            : (isDark ? '#111827' : '#ffffff'),
                          color: coordGame === 'Free Fire' ? (isDark ? '#fdba74' : '#c2410c') : (isDark ? '#d1d5db' : '#475569'),
                          fontWeight: coordGame === 'Free Fire' ? '800' : '600',
                          fontSize: '0.84rem',
                          cursor: isLeadCoordinator ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: coordGame === 'Free Fire' ? '0 0 12px rgba(234, 88, 12, 0.35)' : 'none',
                          transform: coordGame === 'Free Fire' ? 'scale(1.02)' : 'scale(1)'
                        }}
                      >
                        <FaFire size={15} color={coordGame === 'Free Fire' ? '#ea580c' : (isDark ? '#fdba74' : '#c2410c')} />
                        <span>Free Fire</span>
                        {coordGame === 'Free Fire' && <FaCheckCircle size={13} color="#ea580c" />}
                      </button>

                      {/* BGMI */}
                      <button
                        type="button"
                        onClick={() => setCoordGame('BGMI')}
                        disabled={isLeadCoordinator}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: coordGame === 'BGMI' 
                            ? '2px solid #0891b2' 
                            : `1px solid ${isDark ? '#374151' : '#e2e8f0'}`,
                          background: coordGame === 'BGMI'
                            ? (isDark ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(16, 185, 129, 0.3))' : '#cffafe')
                            : (isDark ? '#111827' : '#ffffff'),
                          color: coordGame === 'BGMI' ? (isDark ? '#67e8f9' : '#0e7490') : (isDark ? '#d1d5db' : '#475569'),
                          fontWeight: coordGame === 'BGMI' ? '800' : '600',
                          fontSize: '0.84rem',
                          cursor: isLeadCoordinator ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: coordGame === 'BGMI' ? '0 0 12px rgba(6, 182, 212, 0.35)' : 'none',
                          transform: coordGame === 'BGMI' ? 'scale(1.02)' : 'scale(1)'
                        }}
                      >
                        <FaCrosshairs size={15} color={coordGame === 'BGMI' ? '#0891b2' : (isDark ? '#67e8f9' : '#0e7490')} />
                        <span>BGMI</span>
                        {coordGame === 'BGMI' && <FaCheckCircle size={13} color="#0891b2" />}
                      </button>

                      {/* BOTH */}
                      <button
                        type="button"
                        onClick={() => setCoordGame('Both')}
                        disabled={isLeadCoordinator}
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: coordGame === 'Both' 
                            ? '2px solid #7c3aed' 
                            : `1px solid ${isDark ? '#374151' : '#e2e8f0'}`,
                          background: coordGame === 'Both'
                            ? (isDark ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(236, 72, 153, 0.3))' : '#ede9fe')
                            : (isDark ? '#111827' : '#ffffff'),
                          color: coordGame === 'Both' ? (isDark ? '#d8b4fe' : '#6d28d9') : (isDark ? '#d1d5db' : '#475569'),
                          fontWeight: coordGame === 'Both' ? '800' : '600',
                          fontSize: '0.84rem',
                          cursor: isLeadCoordinator ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: coordGame === 'Both' ? '0 0 12px rgba(124, 58, 237, 0.35)' : 'none',
                          transform: coordGame === 'Both' ? 'scale(1.02)' : 'scale(1)'
                        }}
                      >
                        <FaGamepad size={15} color={coordGame === 'Both' ? '#7c3aed' : (isDark ? '#d8b4fe' : '#6d28d9')} />
                        <span>Both (FF & BGMI)</span>
                        {coordGame === 'Both' && <FaCheckCircle size={13} color="#7c3aed" />}
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Display Order</label>
                    <input 
                      type="number" 
                      min="1"
                      value={coordDisplayOrder} 
                      onChange={(e) => setCoordDisplayOrder(e.target.value)} 
                      placeholder="1"
                      style={S.input}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '1.2rem' }}>
                    <input 
                      type="checkbox" 
                      id="coordActive"
                      checked={coordIsActive} 
                      onChange={(e) => setCoordIsActive(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: isLeadCoordinator ? 'default' : 'pointer' }}
                      disabled={isLeadCoordinator}
                    />
                    <label htmlFor="coordActive" style={{ fontSize: '0.9rem', fontWeight: '600', color: isDark ? '#f9fafb' : '#0f172a', cursor: isLeadCoordinator ? 'default' : 'pointer' }}>
                      Active Status
                    </label>
                  </div>
                </div>
              </div>

              <div style={isLeadCoordinator ? { ...S.modalFooter, justifyContent: 'flex-end' } : S.modalFooter}>
                {isLeadCoordinator ? (
                  <button type="button" onClick={resetCoordForm} style={S.primaryBtn}>
                    Close
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={resetCoordForm} style={S.cancelBtn}>Cancel</button>
                    <button type="submit" style={S.primaryBtn}>
                      {editingCoordId ? 'Save Changes' : 'Add Coordinator'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* PARTICIPANT REGISTRATION DETAILS MODAL                    */}
      {/* ======================================================== */}
      {isRegDetailsModalOpen && selectedRegDetails && (
        <div style={S.modalBackdrop} onClick={() => { setIsRegDetailsModalOpen(false); setSelectedRegDetails(null); }}>
          <div style={{ ...S.modalCard, maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalHeaderLeft}>
                <div style={S.modalIconBoxReg}><FaIdCard size={20} /></div>
                <div>
                  <h3 style={S.modalTitle}>Participant Registration Details</h3>
                  <p style={S.modalSubtitle}>
                    Ticket Code: #{selectedRegDetails.ticket_code || selectedRegDetails.registrationId || selectedRegDetails.id}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setIsRegDetailsModalOpen(false); setSelectedRegDetails(null); }} 
                style={S.modalCloseBtn}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ ...S.modalFormBody, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Ticket Overview Banner */}
              <div style={{ 
                background: isDark ? '#1a2333' : '#f0fdf4', 
                border: isDark ? '1px solid #2563eb' : '1px solid #bbf7d0', 
                borderRadius: '12px', 
                padding: '1.2rem',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: '1rem' 
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: isDark ? '#93c5fd' : '#15803d', letterSpacing: '0.05em' }}>
                    Registration Reference
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'monospace', color: isDark ? '#f8fafc' : '#14532d', marginTop: '2px' }}>
                    #{selectedRegDetails.ticket_code || selectedRegDetails.registrationId || selectedRegDetails.id}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={isOnlineRecord(selectedRegDetails) ? S.badgeOnline : S.badgeOffline}>
                    {isOnlineRecord(selectedRegDetails) ? <FaGlobe size={11} /> : <FaCashRegister size={11} />}
                    <span>{isOnlineRecord(selectedRegDetails) ? 'Online Registration' : 'Offline Desk Entry'}</span>
                  </span>
                  <span style={S.badgePaid}>
                    <FaCheck size={9} style={{ marginRight: '4px' }} />
                    <span>{selectedRegDetails.payment_status || selectedRegDetails.paymentStatus || 'CONFIRMED'}</span>
                  </span>
                </div>
              </div>

              {/* Personal & Academic Details Section */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: '700', color: isDark ? '#93c5fd' : '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Participant & Academic Profile
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: isDark ? '#161e2e' : '#f8fafc', padding: '1.2rem', borderRadius: '12px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
                  <div>
                    <div style={S.label}>Full Name</div>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: isDark ? '#f9fafb' : '#0f172a', marginTop: '3px' }}>
                      {selectedRegDetails.full_name || selectedRegDetails.fullName || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={S.label}>Contact Phone</div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem', color: isDark ? '#f9fafb' : '#0f172a', marginTop: '3px' }}>
                      <a href={`tel:${selectedRegDetails.phone}`} style={{ color: isDark ? '#93c5fd' : '#2563eb', textDecoration: 'none' }}>
                        {selectedRegDetails.phone || 'N/A'}
                      </a>
                    </div>
                  </div>
                  <div>
                    <div style={S.label}>Email Address</div>
                    <div style={{ fontWeight: '600', fontSize: '0.92rem', color: isDark ? '#cbd5e1' : '#334155', marginTop: '3px', wordBreak: 'break-all' }}>
                      <a href={`mailto:${selectedRegDetails.email}`} style={{ color: isDark ? '#93c5fd' : '#2563eb', textDecoration: 'none' }}>
                        {selectedRegDetails.email || 'N/A'}
                      </a>
                    </div>
                  </div>
                  <div>
                    <div style={S.label}>WhatsApp Number</div>
                    <div style={{ fontWeight: '600', fontSize: '0.92rem', color: isDark ? '#cbd5e1' : '#334155', marginTop: '3px' }}>
                      {selectedRegDetails.whatsapp || selectedRegDetails.phone || 'N/A'}
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={S.label}>College / Institution</div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem', color: isDark ? '#f9fafb' : '#0f172a', marginTop: '3px' }}>
                      {selectedRegDetails.college || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={S.label}>Department</div>
                    <div style={{ fontWeight: '600', fontSize: '0.92rem', color: isDark ? '#cbd5e1' : '#334155', marginTop: '3px' }}>
                      {selectedRegDetails.department || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={S.label}>Academic Year</div>
                    <div style={{ fontWeight: '600', fontSize: '0.92rem', color: isDark ? '#cbd5e1' : '#334155', marginTop: '3px' }}>
                      {selectedRegDetails.year || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Event & Registration Details */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: '700', color: isDark ? '#93c5fd' : '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Event & Registration Info
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: isDark ? '#161e2e' : '#f8fafc', padding: '1.2rem', borderRadius: '12px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
                  <div>
                    <div style={S.label}>Enrolled Event</div>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: isDark ? '#f9fafb' : '#0f172a', marginTop: '3px' }}>
                      {getEventName(selectedRegDetails)}
                    </div>
                  </div>
                  <div>
                    <div style={S.label}>Category</div>
                    <div style={{ marginTop: '4px' }}>
                      <span style={getEventCategory(selectedRegDetails) === 'technical' ? S.badgeTech : S.badgeNonTech}>
                        {getEventCategory(selectedRegDetails) === 'technical' ? <FaBolt size={10} style={{ marginRight: '4px' }} /> : <FaGamepad size={10} style={{ marginRight: '4px' }} />}
                        {getEventCategory(selectedRegDetails) === 'technical' ? 'Technical Event' : 'Non-Technical Event'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={S.label}>Total Fee Paid</div>
                    <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#10b981', marginTop: '3px' }}>
                      ₹{getFee(selectedRegDetails)}
                    </div>
                  </div>
                  <div>
                    <div style={S.label}>Payment Method</div>
                    <div style={{ fontWeight: '600', fontSize: '0.92rem', color: isDark ? '#cbd5e1' : '#334155', marginTop: '3px' }}>
                      {isOnlineRecord(selectedRegDetails) ? 'Online Website Portal (Gateway/UPI)' : 'On-Site Registration Desk (Cash/Manual)'}
                    </div>
                  </div>
                  <div>
                    <div style={S.label}>Payment Screenshot</div>
                    <div style={{ marginTop: '4px' }}>
                      {getRegScreenshot(selectedRegDetails) ? (
                        <button
                          type="button"
                          onClick={() => setViewerScreenshotReg(selectedRegDetails)}
                          style={{
                            background: 'rgba(2, 132, 199, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            color: '#38bdf8',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <FaImage size={11} />
                          <span>View Screenshot</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: isDark ? '#64748b' : '#94a3b8', fontStyle: 'italic' }}>
                          Screenshot: Not uploaded
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={S.label}>Registered At</div>
                    <div style={{ fontWeight: '500', fontSize: '0.88rem', color: isDark ? '#cbd5e1' : '#475569', marginTop: '3px' }}>
                      {selectedRegDetails.created_at 
                        ? new Date(selectedRegDetails.created_at).toLocaleString('en-IN') 
                        : (selectedRegDetails.createdAtFormatted || 'N/A')}
                    </div>
                  </div>
                  <div>
                    <div style={S.label}>Event ID</div>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem', color: isDark ? '#9ca3af' : '#64748b', marginTop: '3px' }}>
                      {selectedRegDetails.event_id || selectedRegDetails.eventId || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Details (if team event) */}
              {(getDetailedTeamMembers(selectedRegDetails).length > 0 || selectedRegDetails.team_name || selectedRegDetails.teamName) && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: isDark ? '#93c5fd' : '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Team Details: {selectedRegDetails.team_name || selectedRegDetails.teamName || 'Team'}
                    </h4>
                    <span style={{ fontSize: '0.75rem', background: isDark ? '#1e3a8a' : '#dbeafe', color: isDark ? '#93c5fd' : '#1e40af', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: '700' }}>
                      {1 + getDetailedTeamMembers(selectedRegDetails).length} Members
                    </span>
                  </div>
                  <div style={{ background: isDark ? '#161e2e' : '#f8fafc', padding: '1.2rem', borderRadius: '12px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {/* 1. Team Lead Card */}
                      <div style={{ paddingBottom: '0.6rem', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '700', color: isDark ? '#93c5fd' : '#2563eb', fontSize: '0.88rem' }}>1.</span>
                            <span style={{ fontWeight: '600', color: isDark ? '#f9fafb' : '#0f172a', fontSize: '0.9rem' }}>
                              {selectedRegDetails.full_name || selectedRegDetails.fullName}
                            </span>
                            <span style={{ fontSize: '0.72rem', background: isDark ? '#1e3a8a' : '#dbeafe', color: isDark ? '#93c5fd' : '#1e40af', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: '700' }}>
                              Team Lead
                            </span>
                          </div>
                          {(selectedRegDetails.phone || selectedRegDetails.whatsapp) && (
                            <a
                              href={`https://wa.me/91${(selectedRegDetails.phone || selectedRegDetails.whatsapp).replace(/\D/g, '').slice(-10)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '0.78rem', textDecoration: 'none', fontWeight: '600' }}
                            >
                              <FaWhatsapp size={12} /> {selectedRegDetails.phone || selectedRegDetails.whatsapp}
                            </a>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b', marginTop: '3px', marginLeft: '1.2rem', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                          {selectedRegDetails.email && <span>Email: {selectedRegDetails.email}</span>}
                          {selectedRegDetails.college && <span>College: {selectedRegDetails.college}</span>}
                          {selectedRegDetails.department && <span>Dept: {selectedRegDetails.department} ({selectedRegDetails.year || 'N/A'})</span>}
                        </div>
                      </div>

                      {/* Other Team Members */}
                      {getDetailedTeamMembers(selectedRegDetails).map((member, idx) => (
                        <div key={idx} style={{ paddingBottom: idx < getDetailedTeamMembers(selectedRegDetails).length - 1 ? '0.6rem' : '0', borderBottom: idx < getDetailedTeamMembers(selectedRegDetails).length - 1 ? (isDark ? '1px solid #1f2937' : '1px solid #e2e8f0') : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '700', color: isDark ? '#93c5fd' : '#2563eb', fontSize: '0.88rem' }}>{idx + 2}.</span>
                              <span style={{ fontWeight: '500', color: isDark ? '#e2e8f0' : '#334155', fontSize: '0.9rem' }}>
                                {member.fullName || member.name}
                              </span>
                              <span style={{ fontSize: '0.72rem', background: isDark ? '#1f2937' : '#e2e8f0', color: isDark ? '#9ca3af' : '#64748b', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                Member
                              </span>
                            </div>
                            {(member.phone || member.whatsapp) && (
                              <a
                                href={`https://wa.me/91${(member.phone || member.whatsapp).replace(/\D/g, '').slice(-10)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '0.78rem', textDecoration: 'none', fontWeight: '600' }}
                              >
                                <FaWhatsapp size={12} /> {member.phone || member.whatsapp}
                              </a>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b', marginTop: '3px', marginLeft: '1.2rem', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {member.email && <span>Email: {member.email}</span>}
                            {member.college && <span>College: {member.college}</span>}
                            {(member.department || member.year) && (
                              <span>Dept: {member.department || 'CSE'} {member.year ? `(${member.year})` : ''}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ ...S.modalFooter, justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {getRegScreenshot(selectedRegDetails) && (
                  <button
                    type="button"
                    onClick={() => setViewerScreenshotReg(selectedRegDetails)}
                    style={{ ...S.filterBtn, background: isDark ? 'rgba(2, 132, 199, 0.2)' : '#eff6ff', color: '#0284c7', borderColor: '#38bdf8' }}
                    title="View uploaded payment screenshot"
                  >
                    <FaImage size={11} />
                    <span>View Screenshot</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handlePrintTicket(selectedRegDetails)}
                  style={{ ...S.filterBtn, background: '#2563eb', color: '#ffffff', borderColor: '#2563eb' }}
                >
                  <FaPrint size={12} />
                  <span>Print Ticket</span>
                </button>
                {!isLeadCoordinator && (
                  <button
                    type="button"
                    onClick={() => {
                      const regToEdit = selectedRegDetails;
                      setIsRegDetailsModalOpen(false);
                      setSelectedRegDetails(null);
                      setEditingReg(regToEdit);
                      setIsEditRegModalOpen(true);
                    }}
                    style={{
                      ...S.filterBtn,
                      background: isDark ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
                      color: isDark ? '#93c5fa' : '#2563eb',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#bfdbfe'
                    }}
                    title="Edit registration details"
                  >
                    <FaEdit size={12} />
                    <span>Edit Registration</span>
                  </button>
                )}
                {!isLeadCoordinator && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRegistration(selectedRegDetails)}
                    disabled={isDeletingRegId === (selectedRegDetails.id || selectedRegDetails.registrationId || selectedRegDetails.ticket_code)}
                    style={S.actionBtnDelete}
                  >
                    <FaTrash size={12} style={{ marginRight: '4px' }} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => { setIsRegDetailsModalOpen(false); setSelectedRegDetails(null); }} 
                style={S.cancelBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ON-SITE DESK REGISTRATION MODAL                          */}
      {/* ======================================================== */}
      {isOnSiteRegisterModalOpen && (
        <div style={S.modalBackdrop} onClick={() => setIsOnSiteRegisterModalOpen(false)}>
          <div style={{ ...S.modalCard, maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalHeaderLeft}>
                <div style={{ ...S.modalIconBox, background: isDark ? '#064e3b' : '#ecfdf5', color: '#059669' }}>
                  <FaUserPlus size={20} />
                </div>
                <div>
                  <h3 style={S.modalTitle}>On-Site Desk Walk-in Registration</h3>
                  <p style={S.modalSubtitle}>Record an instant in-person registration at the symposium desk</p>
                </div>
              </div>
              <button onClick={() => setIsOnSiteRegisterModalOpen(false)} style={S.modalCloseBtn}><FaTimes /></button>
            </div>

            <form onSubmit={handleOnSiteRegisterSubmit} style={S.modalForm}>
              <div style={S.modalFormBody}>
                {/* Event Select */}
                <div style={S.modalInputGroup}>
                  <label style={S.label}>Select Symposium Event *</label>
                  <select
                    value={onSiteEventId}
                    onChange={(e) => setOnSiteEventId(e.target.value)}
                    style={S.select}
                    required
                  >
                    <option value="">-- Choose Event --</option>
                    {eventsList.map(evt => (
                      <option key={evt.id} value={evt.id}>
                        [{evt.category.toUpperCase()}] {evt.name} • ₹{evt.feePerHead || 50}/head {evt.isTeam ? `(Team max ${evt.maxTeam || 4})` : '(Solo)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Participant Personal Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Participant Full Name *</label>
                    <input
                      type="text"
                      value={onSiteFullName}
                      onChange={(e) => setOnSiteFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      style={S.input}
                      required
                    />
                  </div>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>10-Digit Mobile Phone *</label>
                    <input
                      type="tel"
                      value={onSitePhone}
                      onChange={(e) => setOnSitePhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      style={S.input}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Email Address *</label>
                    <input
                      type="email"
                      value={onSiteEmail}
                      onChange={(e) => setOnSiteEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      style={S.input}
                      required
                    />
                  </div>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Academic Year</label>
                    <select
                      value={onSiteYear}
                      onChange={(e) => setOnSiteYear(e.target.value)}
                      style={S.select}
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="PG">PG / Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>College / Institution *</label>
                    <input
                      type="text"
                      value={onSiteCollege}
                      onChange={(e) => setOnSiteCollege(e.target.value)}
                      placeholder="Enter college name"
                      style={S.input}
                      required
                    />
                  </div>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Department</label>
                    <input
                      type="text"
                      value={onSiteDept}
                      onChange={(e) => setOnSiteDept(e.target.value)}
                      placeholder="e.g. CSE / IT / ECE"
                      style={S.input}
                    />
                  </div>
                </div>

                {/* Team Details if selected event is team */}
                {(() => {
                  const selEvt = eventsList.find(e => e.id === onSiteEventId);
                  if (!selEvt || !selEvt.isTeam) return null;
                  return (
                    <div style={{ background: isDark ? '#161e2e' : '#f8fafc', padding: '1rem', borderRadius: '10px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={S.modalInputGroup}>
                        <label style={S.label}>Team Name</label>
                        <input
                          type="text"
                          value={onSiteTeamName}
                          onChange={(e) => setOnSiteTeamName(e.target.value)}
                          placeholder="e.g. Code Warriors"
                          style={S.input}
                        />
                      </div>

                      <div style={S.modalInputGroup}>
                        <label style={S.label}>Team Members (Lead is {onSiteFullName || 'entered above'})</label>
                        {onSiteTeamMembers.map((member, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                            <input
                              type="text"
                              value={member}
                              onChange={(e) => {
                                const copy = [...onSiteTeamMembers];
                                copy[idx] = e.target.value;
                                setOnSiteTeamMembers(copy);
                              }}
                              placeholder={`Member ${idx + 2} Full Name`}
                              style={S.input}
                            />
                            {onSiteTeamMembers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setOnSiteTeamMembers(prev => prev.filter((_, i) => i !== idx))}
                                style={{ ...S.cancelBtn, padding: '0.5rem 0.8rem', color: '#ef4444' }}
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                        ))}
                        {onSiteTeamMembers.length < ((selEvt.maxMembers || selEvt.maxTeam || 4) - 1) && (
                          <button
                            type="button"
                            onClick={() => setOnSiteTeamMembers(prev => [...prev, ''])}
                            style={{ ...S.filterBtn, alignSelf: 'flex-start', marginTop: '4px' }}
                          >
                            + Add Another Member
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Calculation breakdown */}
                {onSiteEventId && (() => {
                  const selEvt = eventsList.find(e => e.id === onSiteEventId);
                  if (!selEvt) return null;
                  const validMembers = onSiteTeamMembers.filter(m => m.trim().length > 0);
                  const memberCount = 1 + validMembers.length;
                  const feePerHead = selEvt.feePerHead || 50;
                  const isFixedTeam = selEvt.feeType === 'per_team' || selEvt.feeType === 'per_squad' || selEvt.feeType === 'fixed';
                  const totalFee = selEvt.isTeam && isFixedTeam
                    ? (selEvt.id === 'nontech-07' ? 250 : (selEvt.id === 'nontech-05' ? 200 : (selEvt.feePerHead || 250)))
                    : (feePerHead * memberCount);

                  return (
                    <div style={{ background: isDark ? '#1a2333' : '#eff6ff', padding: '0.85rem 1.2rem', borderRadius: '10px', border: isDark ? '1px solid #1e3a8a' : '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: '600', color: isDark ? '#93c5fd' : '#1d4ed8' }}>
                        Desk Entry Fee ({memberCount} participant{memberCount > 1 ? 's' : ''}):
                      </span>
                      <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>
                        ₹{totalFee}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div style={S.modalFooter}>
                <button type="button" onClick={() => setIsOnSiteRegisterModalOpen(false)} style={S.cancelBtn}>Cancel</button>
                <button type="submit" disabled={isRegisteringOnSite} style={{ ...S.primaryBtn, background: '#059669' }}>
                  {isRegisteringOnSite ? 'Recording...' : 'Record On-Site Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HOMEPAGE STUDENT-COORDINATOR TEAM CREATE/EDIT MODAL      */}
      {/* ======================================================== */}
      {isHpTeamModalOpen && (
        <div style={S.modalBackdrop} onClick={resetHpTeamForm}>
          <div
            style={{
              ...S.modalCard,
              maxWidth: '960px',
              maxHeight: '92vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={S.modalHeader}>
              <div style={S.modalHeaderLeft}>
                <div style={{
                  ...S.modalIconBoxEvent,
                  background: isDark ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
                  color: '#2563eb'
                }}>
                  <FaUsers size={20} />
                </div>
                <div>
                  <h3 style={S.modalTitle}>
                    {isLeadCoordinator ? `Team Details: ${hpTeamRole || 'Team'}` : (editingHpTeamId ? `Edit Homepage Team: ${hpTeamRole || 'Team'}` : 'Add New Homepage Student-Coordinator Team')}
                  </h3>
                  <p style={S.modalSubtitle}>
                    {isLeadCoordinator ? 'Viewing team configuration displayed dynamically on the symposium homepage marquee.' : 'Teams configured here will appear dynamically in the live scrolling marquee on the symposium homepage.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetHpTeamForm}
                style={S.modalCloseBtn}
                title="Close (Esc)"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveHpTeam} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{
                padding: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '1.75rem',
                overflowY: 'auto',
                maxHeight: 'calc(92vh - 150px)'
              }}>
                {/* Left Column: Form Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Team Title / Role */}
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>
                      Team Name / Role Title {!isLeadCoordinator && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <input
                      type="text"
                      required={!isLeadCoordinator}
                      disabled={isLeadCoordinator}
                      placeholder="e.g. MAIN COORDINATOR TEAM, WEBSITE DEVELOPMENT TEAM, MEDIA & PROMOTIONS TEAM"
                      value={hpTeamRole}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHpTeamRole(val);
                        if (!editingHpTeamId && !hpTeamTierManuallySelected) {
                          const suggested = suggestCoordinatorTheme(val, hpTeamTag);
                          setHpTeamTier(suggested.tier);
                        }
                      }}
                      style={S.input}
                    />
                    <span style={{ fontSize: '0.74rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                      This is the prominent headline displayed on the card (usually in ALL CAPS).
                    </span>
                  </div>

                  {/* Category Tag & Display Order */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div style={S.modalInputGroup}>
                      <label style={S.label}>Category Tag / Badge</label>
                      <input
                        type="text"
                        disabled={isLeadCoordinator}
                        readOnly={isLeadCoordinator}
                        placeholder="e.g. STUDENT LEADERSHIP, WEB & TECH CREW, CREATIVE TEAM"
                        value={hpTeamTag}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHpTeamTag(val);
                          if (!editingHpTeamId && !hpTeamTierManuallySelected) {
                            const suggested = suggestCoordinatorTheme(hpTeamRole, val);
                            setHpTeamTier(suggested.tier);
                          }
                        }}
                        style={S.input}
                      />
                    </div>
                    <div style={S.modalInputGroup}>
                      <label style={S.label}>Display Order</label>
                      <input
                        type="number"
                        min="1"
                        disabled={isLeadCoordinator}
                        readOnly={isLeadCoordinator}
                        placeholder="1"
                        value={hpTeamOrder}
                        onChange={(e) => setHpTeamOrder(e.target.value)}
                        style={S.input}
                      />
                    </div>
                  </div>

                  {/* Card Theme & Color Selector with Smart Suggestion */}
                  {(() => {
                    const smartThemeSuggestion = suggestCoordinatorTheme(hpTeamRole, hpTeamTag);
                    const isSuggestedSelected = hpTeamTier === smartThemeSuggestion.tier;

                    return (
                      <div style={S.modalInputGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                          <label style={{ ...S.label, marginBottom: 0 }}>
                            Card Color Theme {!isLeadCoordinator && <span style={{ color: '#ef4444' }}>*</span>}
                          </label>
                          {smartThemeSuggestion && (
                            <div style={{
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              background: isSuggestedSelected
                                ? (isDark ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5')
                                : (isDark ? 'rgba(59, 130, 246, 0.16)' : '#eff6ff'),
                              color: isSuggestedSelected ? '#10b981' : '#3b82f6',
                              border: `1px solid ${isSuggestedSelected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(59, 130, 246, 0.35)'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <FaMagic style={{ color: '#eab308' }} /> Suggested: <strong>{smartThemeSuggestion.name}</strong>
                              </span>
                              {!isSuggestedSelected && !isLeadCoordinator && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHpTeamTier(smartThemeSuggestion.tier);
                                    setHpTeamTierManuallySelected(true);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#2563eb',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    padding: 0,
                                    marginLeft: '2px'
                                  }}
                                >
                                  Apply
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '8px'
                        }}>
                          {COORDINATOR_THEMES.map((theme) => {
                            const isSelected = hpTeamTier === theme.id;
                            return (
                              <button
                                key={theme.id}
                                type="button"
                                disabled={isLeadCoordinator}
                                onClick={() => {
                                  if (!isLeadCoordinator) {
                                    setHpTeamTier(theme.id);
                                    setHpTeamTierManuallySelected(true);
                                  }
                                }}
                                style={{
                                  padding: '0.7rem 0.8rem',
                                  borderRadius: '12px',
                                  border: isSelected
                                    ? `2px solid ${theme.primaryColor}`
                                    : (isDark ? '1px solid #374151' : '1px solid #e2e8f0'),
                                  background: isSelected
                                    ? (isDark ? `linear-gradient(135deg, ${theme.bgColor}, rgba(255,255,255,0.03))` : '#ffffff')
                                    : (isDark ? '#161e2e' : '#f8fafc'),
                                  boxShadow: isSelected
                                    ? `0 0 16px ${theme.borderGlow}`
                                    : 'none',
                                  cursor: isLeadCoordinator ? 'default' : 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-start',
                                  gap: '4px',
                                  textAlign: 'left',
                                  transition: 'all 0.18s ease',
                                  position: 'relative',
                                  opacity: isLeadCoordinator && !isSelected ? 0.6 : 1
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '50%',
                                      background: theme.primaryColor,
                                      boxShadow: `0 0 8px ${theme.primaryColor}`,
                                      display: 'inline-block',
                                      flexShrink: 0
                                    }} />
                                    <span style={{
                                      fontSize: '0.8rem',
                                      fontWeight: isSelected ? '800' : '700',
                                      color: isSelected ? (isDark ? '#f9fafb' : '#0f172a') : (isDark ? '#d1d5db' : '#334155')
                                    }}>
                                      {theme.name}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <FaCheck
                                      size={11}
                                      style={{
                                        color: theme.primaryColor,
                                        flexShrink: 0
                                      }}
                                    />
                                  )}
                                </div>

                                <span style={{
                                  fontSize: '0.67rem',
                                  color: isSelected ? theme.primaryColor : (isDark ? '#9ca3af' : '#64748b'),
                                  fontWeight: '600',
                                  lineHeight: '1.2'
                                }}>
                                  {theme.roleHint}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Icon Selector */}
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Card Icon</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                      {[
                        { id: 'Users', label: 'Users' },
                        { id: 'Code', label: 'Code' },
                        { id: 'Terminal', label: 'Terminal' },
                        { id: 'Rocket', label: 'Rocket' },
                        { id: 'Sparkles', label: 'Sparkles' },
                        { id: 'Shield', label: 'Shield' },
                      ].map(ic => {
                        const isSelected = hpTeamIcon === ic.id;
                        return (
                          <button
                            key={ic.id}
                            type="button"
                            disabled={isLeadCoordinator}
                            onClick={() => !isLeadCoordinator && setHpTeamIcon(ic.id)}
                            style={{
                              padding: '0.65rem 0.4rem',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid #2563eb' : (isDark ? '1px solid #374151' : '1px solid #e2e8f0'),
                              background: isSelected ? (isDark ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff') : 'transparent',
                              cursor: isLeadCoordinator ? 'default' : 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                              opacity: isLeadCoordinator && !isSelected ? 0.5 : 1
                            }}
                          >
                            {renderHpCoordinatorIcon(ic.id, hpTeamTier, 20)}
                            <span style={{ fontSize: '0.7rem', fontWeight: isSelected ? '700' : '500', color: isDark ? '#d1d5db' : '#475569' }}>
                              {ic.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description */}
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Team Description / Mission</label>
                    <textarea
                      rows={2}
                      disabled={isLeadCoordinator}
                      readOnly={isLeadCoordinator}
                      placeholder="Briefly describe what this team organizes or builds for Eloquence 2026..."
                      value={hpTeamDesc}
                      onChange={(e) => setHpTeamDesc(e.target.value)}
                      style={{ ...S.textarea, minHeight: '65px' }}
                    />
                  </div>

                  {/* Active on Homepage Toggle */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    background: isDark ? '#161e2e' : '#f8fafc',
                    border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0'
                  }}>
                    <input
                      type="checkbox"
                      id="hpTeamActiveCheck"
                      disabled={isLeadCoordinator}
                      checked={hpTeamIsActive}
                      onChange={(e) => setHpTeamIsActive(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: isLeadCoordinator ? 'default' : 'pointer' }}
                    />
                    <label htmlFor="hpTeamActiveCheck" style={{ fontSize: '0.88rem', fontWeight: '600', color: isDark ? '#f9fafb' : '#0f172a', cursor: isLeadCoordinator ? 'default' : 'pointer' }}>
                      Publish this team to the live homepage marquee
                    </label>
                  </div>

                  {/* Members Manager Section */}
                  <div style={{
                    border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '1.15rem',
                    background: isDark ? '#0e1524' : '#fafafa',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: '700', color: isDark ? '#f9fafb' : '#0f172a' }}>
                        Team Members ({hpTeamMembers.length})
                      </span>
                      {!isLeadCoordinator && (
                        <button
                          type="button"
                          onClick={() => setIsBatchInputOpen(!isBatchInputOpen)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          {isBatchInputOpen ? 'Single Add Mode' : '+ Batch Paste Multiple Names'}
                        </button>
                      )}
                    </div>

                    {!isLeadCoordinator && (
                      isBatchInputOpen ? (
                        /* Batch Paste Box */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <textarea
                            rows={3}
                            placeholder="Paste member names separated by commas or line breaks (e.g.&#10;SAMNESH S&#10;HARISH KUMAR RG&#10;SHARMILA Y)"
                            value={batchMembersText}
                            onChange={(e) => setBatchMembersText(e.target.value)}
                            style={{ ...S.textarea, fontSize: '0.82rem' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setIsBatchInputOpen(false)}
                              style={{ ...S.cancelBtn, padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleBatchAddMembers}
                              style={{ ...S.primaryBtn, padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                            >
                              Import All Names
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Single Member Add Controls */
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Member Full Name (e.g. MOHAMMED AYAZ A)"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMemberToTeam(); } }}
                            style={{ ...S.input, fontSize: '0.86rem', flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={handleAddMemberToTeam}
                            style={{
                              ...S.primaryBtn,
                              padding: '0.55rem 1.15rem',
                              fontSize: '0.84rem',
                              whiteSpace: 'nowrap',
                              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                              fontWeight: '700'
                            }}
                          >
                            + Add Member
                          </button>
                        </div>
                      )
                    )}

                    {/* Members List Table / Cards */}
                    <div style={{
                      maxHeight: '180px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      marginTop: '4px'
                    }}>
                      {hpTeamMembers.length > 0 ? (
                        hpTeamMembers.map((mem, idx) => {
                          const nameStr = typeof mem === 'string' ? mem : (mem?.name || '');
                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.45rem 0.75rem',
                                borderRadius: '8px',
                                background: isDark ? '#1a2234' : '#ffffff',
                                border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                                fontSize: '0.84rem'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: '0.72rem', color: isDark ? '#6b7280' : '#94a3b8', width: '22px' }}>
                                  #{idx + 1}
                                </span>
                                <span style={{
                                  fontWeight: '700',
                                  color: isDark ? '#f9fafb' : '#0f172a',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {nameStr}
                                </span>
                              </div>

                              {!isLeadCoordinator && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleMoveMember(idx, -1)}
                                      style={{ background: 'none', border: 'none', color: isDark ? '#9ca3af' : '#64748b', cursor: 'pointer', padding: '2px 4px', fontSize: '0.75rem' }}
                                      title="Move Up"
                                    >
                                      ▲
                                    </button>
                                  )}
                                  {idx < hpTeamMembers.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleMoveMember(idx, 1)}
                                      style={{ background: 'none', border: 'none', color: isDark ? '#9ca3af' : '#64748b', cursor: 'pointer', padding: '2px 4px', fontSize: '0.75rem' }}
                                      title="Move Down"
                                    >
                                      ▼
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(idx)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px 4px' }}
                                    title="Remove Member"
                                  >
                                    <FaTrash size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: isDark ? '#6b7280' : '#94a3b8', padding: '0.5rem' }}>
                          No members added yet.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Real-Time Live Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.76rem',
                      fontWeight: '800',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: isDark ? '#9ca3af' : '#64748b'
                    }}>
                      Live Homepage Marquee Preview
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                      Real-Time Rendering
                    </span>
                  </div>

                  {/* Cyber Slide Card Preview */}
                  {(() => {
                    const tier = hpTeamTier || 'emerald';
                    const currentTheme = COORDINATOR_THEMES.find(ct => ct.id === tier) || COORDINATOR_THEMES[0];
                    const strokeColor = currentTheme.primaryColor;
                    const color1 = currentTheme.secondaryColor;
                    const color2 = currentTheme.primaryColor;
                    const color3 = currentTheme.bgColor;

                    return (
                      <div style={{
                        background: `radial-gradient(circle at top left, ${color1}25, transparent 60%), linear-gradient(180deg, ${color3}, #050810)`,
                        border: `1.5px solid ${strokeColor}70`,
                        boxShadow: `0 0 25px ${strokeColor}25, inset 0 0 20px ${strokeColor}10`,
                        borderRadius: '20px',
                        padding: '1.75rem',
                        position: 'relative',
                        color: '#ffffff',
                        minHeight: '380px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        {/* Header Badge Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: `${strokeColor}15`,
                            border: `1px solid ${strokeColor}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 12px ${strokeColor}30`
                          }}>
                            {renderHpCoordinatorIcon(hpTeamIcon, tier, 22)}
                          </div>
                          <div style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '999px',
                            background: `${strokeColor}15`,
                            border: `1px solid ${strokeColor}50`,
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            letterSpacing: '0.08em',
                            color: strokeColor,
                            textTransform: 'uppercase'
                          }}>
                            {hpTeamTag || 'TEAM'}
                          </div>
                        </div>

                        {/* Role Title */}
                        <h3 style={{
                          margin: '0 0 0.75rem 0',
                          fontSize: '1.25rem',
                          fontWeight: '800',
                          letterSpacing: '0.04em',
                          color: '#f8fafc',
                          textTransform: 'uppercase'
                        }}>
                          {hpTeamRole || 'TEAM NAME'}
                        </h3>

                        {/* Flourish Line with Diamond Symbol */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0.5rem 0 1rem 0' }}>
                          <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${strokeColor}60, transparent)` }} />
                          <span style={{ color: strokeColor, fontSize: '0.7rem' }}>◆</span>
                          <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${strokeColor}60)` }} />
                        </div>

                        {/* Members List */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                          {hpTeamMembers.length > 0 ? (
                            hpTeamMembers.map((m, i) => {
                              const nameStr = typeof m === 'string' ? m : (m?.name || '');
                              return (
                                <div
                                  key={i}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '0.2rem 0'
                                  }}
                                >
                                  <span style={{ color: strokeColor, fontSize: '0.45rem' }}><FaCircle /></span>
                                  <span style={{
                                    fontSize: '0.88rem',
                                    fontWeight: '700',
                                    color: '#f1f5f9'
                                  }}>
                                    {nameStr}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div style={{ padding: '1rem 0', color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
                              Members announcement coming soon
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        {hpTeamDesc && (
                          <p style={{
                            margin: '0',
                            fontSize: '0.82rem',
                            color: '#94a3b8',
                            lineHeight: '1.5',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            paddingTop: '0.75rem'
                          }}>
                            {hpTeamDesc}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={S.modalFooter}>
                {isLeadCoordinator ? (
                  <button
                    type="button"
                    onClick={resetHpTeamForm}
                    style={S.primaryBtn}
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={resetHpTeamForm}
                      style={S.cancelBtn}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        ...S.primaryBtn,
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        padding: '0.65rem 1.6rem',
                        fontWeight: '700'
                      }}
                    >
                      {editingHpTeamId ? 'Save Changes' : 'Create Team'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CLOSE RG CONFIRMATION MODAL                              */}
      {/* ======================================================== */}
      {isCloseRgModalOpen && (
        <div style={S.modalBackdrop} onClick={() => setIsCloseRgModalOpen(false)}>
          <div style={{ ...S.modalCard, maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalHeaderLeft}>
                <div style={{
                  ...S.modalIconBox,
                  background: closeRgPendingAction === 'close' 
                    ? (isDark ? '#451a1a' : '#fee2e2') 
                    : (isDark ? '#064e3b' : '#d1fae5'),
                  color: closeRgPendingAction === 'close' ? '#dc2626' : '#059669'
                }}>
                  {closeRgPendingAction === 'close' ? <FaLock size={20} /> : <FaUnlock size={20} />}
                </div>
                <div>
                  <h3 style={S.modalTitle}>
                    {closeRgPendingAction === 'close' ? 'Confirm Registration Closure' : 'Confirm Re-opening Registrations'}
                  </h3>
                  <p style={S.modalSubtitle}>
                    {closeRgPendingAction === 'close' 
                      ? 'Immediate action affecting all public event registrations' 
                      : 'Restore public access to symposium registration forms'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCloseRgModalOpen(false)} style={S.modalCloseBtn}><FaTimes /></button>
            </div>

            <div style={S.modalFormBody}>
              {closeRgPendingAction === 'close' ? (
                <>
                  <div style={{
                    background: isDark ? '#451a1a40' : '#fff1f2',
                    border: isDark ? '1px solid #7f1d1d' : '1px solid #fecdd3',
                    borderRadius: '10px',
                    padding: '1rem',
                    color: isDark ? '#fca5a5' : '#9f1239',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start'
                  }}>
                    <FaExclamationTriangle style={{ flexShrink: 0, marginTop: '2px' }} size={16} />
                    <div>
                      <strong>Warning:</strong> Closing registrations will immediately block the registration form across all 12 events. Participants will see the closed notice instead of the entry form.
                    </div>
                  </div>

                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Closing Announcement Notice</label>
                    <textarea
                      rows={3}
                      value={customClosedReason}
                      onChange={(e) => setCustomClosedReason(e.target.value)}
                      style={{ ...S.input, resize: 'vertical', lineHeight: 1.4 }}
                    />
                    <span style={S.inputHelper}>This message is shown to visitors when they attempt to register.</span>
                  </div>
                </>
              ) : (
                <div style={{
                  background: isDark ? '#064e3b40' : '#f0fdf4',
                  border: isDark ? '1px solid #059669' : '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '1rem',
                  color: isDark ? '#6ee7b7' : '#166534',
                  fontSize: '0.88rem',
                  lineHeight: 1.5
                }}>
                  Are you sure you want to <strong>re-open registrations</strong>? Visitors will immediately be able to fill out forms and register for all symposium events.
                </div>
              )}
            </div>

            <div style={S.modalFooter}>
              <button
                type="button"
                onClick={() => setIsCloseRgModalOpen(false)}
                style={S.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isTogglingCloseRg}
                onClick={handleConfirmCloseRgToggle}
                style={{
                  ...S.primaryBtn,
                  background: closeRgPendingAction === 'close'
                    ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isTogglingCloseRg ? <FaSpinner className="fa-spin" /> : (closeRgPendingAction === 'close' ? <FaLock /> : <FaUnlock />)}
                <span>{closeRgPendingAction === 'close' ? 'Yes, Close Registrations' : 'Yes, Re-Open Registrations'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* MODAL: EVENT ALLOCATION FOR COORDINATOR USER              */}
      {/* ======================================================== */}
      {isAllocModalOpen && selectedAllocUser && (
        <div style={S.modalBackdrop} onClick={() => setIsAllocModalOpen(false)}>
          <div style={{ ...S.modalCard, maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalHeaderLeft}>
                <div style={{ ...S.modalIconBox, background: isDark ? 'rgba(57, 255, 136, 0.15)' : '#ecfdf5', color: '#10b981' }}>
                  <FaCalendarAlt size={18} />
                </div>
                <div>
                  <h3 style={S.modalTitle}>
                    Allocate Events: {selectedAllocUser.username}
                  </h3>
                  <p style={S.modalSubtitle}>
                    Role: <strong>{selectedAllocUser.role}</strong> • Choose which event(s) this coordinator can access
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAllocModalOpen(false)} style={S.modalCloseBtn}><FaTimes /></button>
            </div>

            <form onSubmit={handleSaveAllocations} style={S.modalForm}>
              <div style={S.modalFormBody}>
                {/* Quick Selection Shortcuts */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const techIds = eventsList.filter(e => e.category === 'technical').map(e => e.id);
                      setSelectedAllocEvents(prev => Array.from(new Set([...prev, ...techIds])));
                    }}
                    style={{ ...S.filterBtn, fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                  >
                    + All Technical ({eventsList.filter(e => e.category === 'technical').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nonTechIds = eventsList.filter(e => e.category === 'non-technical').map(e => e.id);
                      setSelectedAllocEvents(prev => Array.from(new Set([...prev, ...nonTechIds])));
                    }}
                    style={{ ...S.filterBtn, fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                  >
                    + All Non-Technical ({eventsList.filter(e => e.category === 'non-technical').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAllocEvents(eventsList.map(e => e.id))}
                    style={{ ...S.filterBtn, fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                  >
                    Select All 12
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAllocEvents([])}
                    style={{ ...S.filterBtn, fontSize: '0.78rem', padding: '0.35rem 0.75rem', color: '#ef4444' }}
                  >
                    Clear Selection
                  </button>
                </div>

                {/* Event Selection Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '10px',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {eventsList.map(evt => {
                    const isSelected = selectedAllocEvents.includes(evt.id);
                    const isTech = evt.category === 'technical';

                    return (
                      <div
                        key={evt.id}
                        onClick={() => handleToggleAllocEvent(evt.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          border: isSelected
                            ? '2px solid #10b981'
                            : (isDark ? '1px solid #374151' : '1px solid #e2e8f0'),
                          background: isSelected
                            ? (isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5')
                            : (isDark ? '#1f2937' : '#ffffff'),
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none'
                        }}
                      >
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid #10b981' : (isDark ? '2px solid #4b5563' : '2px solid #cbd5e1'),
                          background: isSelected ? '#10b981' : 'transparent',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          flexShrink: 0
                        }}>
                          {isSelected && <FaCheck />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.88rem',
                            fontWeight: '700',
                            color: isDark ? '#f9fafb' : '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {evt.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: '800',
                              color: isTech ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#f472b6' : '#db2777'),
                              textTransform: 'uppercase'
                            }}>
                              {evt.id}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                              • {isTech ? 'Technical' : 'Non-Technical'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Scoped Access Warning / Info */}
                <div style={{
                  background: isDark ? '#1e293b' : '#f8fafc',
                  border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.82rem',
                  color: isDark ? '#cbd5e1' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FaInfoCircle style={{ color: '#3b82f6', flexShrink: 0 }} size={16} />
                  <div>
                    <strong>{selectedAllocEvents.length} event(s) selected:</strong> When <strong>{selectedAllocUser.username}</strong> logs in, their dashboard and participant rosters will strictly only show these allocated events.
                  </div>
                </div>
              </div>

              <div style={S.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsAllocModalOpen(false)}
                  style={S.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAlloc}
                  style={{
                    ...S.primaryBtn,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isSavingAlloc ? <FaSpinner className="fa-spin" /> : <FaCheck />}
                  <span>Save Event Allocations</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE COORDINATOR LOGIN WITH ALLOCATION           */}
      {/* ======================================================== */}
      {isCreateCoordLoginModalOpen && (
        <div style={S.modalBackdrop} onClick={() => setIsCreateCoordLoginModalOpen(false)}>
          <div style={{ ...S.modalCard, maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div style={S.modalHeaderLeft}>
                <div style={{ ...S.modalIconBox, background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5', color: '#10b981' }}>
                  <FaUserPlus size={18} />
                </div>
                <div>
                  <h3 style={S.modalTitle}>
                    Create Coordinator Login & Allocate Events
                  </h3>
                  <p style={S.modalSubtitle}>
                    Set credentials and assign specific event(s) to this coordinator in one step
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCreateCoordLoginModalOpen(false)} style={S.modalCloseBtn}><FaTimes /></button>
            </div>

            <form onSubmit={handleCreateCoordWithAlloc} style={S.modalForm}>
              <div style={S.modalFormBody}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Username *</label>
                    <input
                      type="text"
                      placeholder="e.g. coord_tech01 or slidecraft_coord"
                      value={newCoordUsername}
                      onChange={(e) => setNewCoordUsername(e.target.value)}
                      style={S.input}
                      required
                    />
                  </div>

                  <div style={S.modalInputGroup}>
                    <label style={S.label}>Password *</label>
                    <input
                      type="password"
                      placeholder="Enter secure password"
                      value={newCoordPassword}
                      onChange={(e) => setNewCoordPassword(e.target.value)}
                      style={S.input}
                      required
                    />
                  </div>
                </div>

                <div style={S.modalInputGroup}>
                  <label style={S.label}>Role *</label>
                  <select
                    value={newCoordRole}
                    onChange={(e) => setNewCoordRole(e.target.value)}
                    style={S.select}
                  >
                    <option value="Lead Coordinator">Lead Coordinator</option>
                    <option value="Event Coordinator">Event Coordinator</option>
                    <option value="Coordinator">Coordinator</option>
                  </select>
                </div>

                <div style={S.modalInputGroup}>
                  <label style={S.label}>Allocate Event(s) for this Coordinator *</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '8px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}>
                    {eventsList.map(evt => {
                      const isSelected = newCoordAllocEvents.includes(evt.id);
                      const isTech = evt.category === 'technical';

                      return (
                        <div
                          key={evt.id}
                          onClick={() => {
                            setNewCoordAllocEvents(prev => {
                              if (prev.includes(evt.id)) {
                                return prev.filter(id => id !== evt.id);
                              } else {
                                return [...prev, evt.id];
                              }
                            });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #10b981' : (isDark ? '1px solid #374151' : '1px solid #e2e8f0'),
                            background: isSelected
                              ? (isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5')
                              : (isDark ? '#1f2937' : '#ffffff'),
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '5px',
                            border: isSelected ? '2px solid #10b981' : (isDark ? '2px solid #4b5563' : '2px solid #cbd5e1'),
                            background: isSelected ? '#10b981' : 'transparent',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            flexShrink: 0
                          }}>
                            {isSelected && <FaCheck />}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: isDark ? '#f9fafb' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {evt.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: isTech ? '#38bdf8' : '#f472b6', fontWeight: '700' }}>
                              {evt.id} • {isTech ? 'Technical' : 'Non-Tech'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={S.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsCreateCoordLoginModalOpen(false)}
                  style={S.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCoordLogin}
                  style={{
                    ...S.primaryBtn,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isCreatingCoordLogin ? <FaSpinner className="fa-spin" /> : <FaPlus />}
                  <span>Create Coordinator Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Screenshot Viewer Modal */}
      <PaymentScreenshotViewerModal
        registration={viewerScreenshotReg}
        token={token}
        isOpen={Boolean(viewerScreenshotReg)}
        onClose={() => setViewerScreenshotReg(null)}
        onVerify={async (reg) => {
          const id = reg.id || reg.registrationId || reg.ticket_code;
          const ticket = reg.ticket_code || reg.ticketCode || id;
          executeDirectVerifyRegistration(id, ticket);
          setViewerScreenshotReg(null);
        }}
        onReject={async (reg) => {
          const id = reg.id || reg.registrationId || reg.ticket_code;
          await handleQuickVerifyRegistration(id, 'flagged');
          setViewerScreenshotReg(null);
        }}
        isDark={isDark}
      />

      {/* Edit Registration Modal */}
      <EditRegistrationModal
        isOpen={isEditRegModalOpen}
        onClose={() => {
          setIsEditRegModalOpen(false);
          setEditingReg(null);
        }}
        registration={editingReg}
        eventsList={eventsList}
        token={token}
        isDark={isDark}
        onSuccess={() => {
          fetchRegistrations();
          fetchDashboardData();
        }}
      />
    </div>
  );
}
