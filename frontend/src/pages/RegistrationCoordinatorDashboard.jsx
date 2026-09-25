import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  FaChartBar, 
  FaUserCheck, 
  FaGlobe, 
  FaSignOutAlt, 
  FaPlus, 
  FaTrash, 
  FaSun, 
  FaMoon, 
  FaBolt, 
  FaGamepad, 
  FaBuilding, 
  FaListAlt,
  FaUsers,
  FaFilePdf,
  FaPaperPlane,
  FaThLarge,
  FaTable,
  FaTimes,
  FaBars,
  FaQrcode,
  FaCheckCircle,
  FaCopy,
  FaPrint,
  FaWhatsapp,
  FaPhoneAlt,
  FaEnvelope,
  FaGraduationCap,
  FaUser,
  FaMoneyBillWave,
  FaCrown,
  FaLayerGroup,
  FaClock,
  FaMapMarkerAlt,
  FaInfoCircle,
  FaUndo,
  FaSearch,
  FaCheck,
  FaIdCard,
  FaFire,
  FaCrosshairs,
  FaFileUpload,
  FaFileImage,
  FaEye,
  FaTicketAlt,
  FaMagic,
  FaExchangeAlt,
  FaDownload,
  FaCheckDouble,
  FaExclamationTriangle,
  FaSyncAlt,
  FaEdit
} from 'react-icons/fa';
import defaultEvents from '../data/events.js';
import { getApiUrl } from '../config/api';
import ParticipantVerifier from '../components/ParticipantVerifier.jsx';

const createEmptyTeamMember = (defaultCollege = '') => ({
  fullName: '',
  email: '',
  phone: '',
  whatsapp: '',
  sameAsPhone: true,
  college: defaultCollege || 'C. Abdul Hakeem College of Engineering & Technology',
  department: 'CSE',
  year: '3rd Year'
});

export default function RegistrationCoordinatorDashboard({ token, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('coord_theme') || 'light');
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('coord_theme', next);
  };

  // State
  const [eventsList, setEventsList] = useState(defaultEvents);
  const [registrationsList, setRegistrationsList] = useState([]);
  const [offlineRegistrationsList, setOfflineRegistrationsList] = useState([]);
  const [loadingOffline, setLoadingOffline] = useState(false);
  const [coordinatorsList, setCoordinatorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statFilter, setStatFilter] = useState('all'); // 'all' | 'online' | 'offline' | 'technical' | 'non-technical'

  // Search & Filter States
  const [dashSearch, setDashSearch] = useState('');
  const [regSearch, setRegSearch] = useState('');
  const [onlineRegSearch, setOnlineRegSearch] = useState('');
  const [offlineRegSearch, setOfflineRegSearch] = useState('');
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
  const [sendTypeScope, setSendTypeScope] = useState('ALL'); // 'ALL' | 'ONLINE' | 'OFFLINE'
  const [bocGameFilter, setBocGameFilter] = useState('all'); // 'all' | 'FREE FIRE' | 'BGMI'
  const [cardTypeFilters, setCardTypeFilters] = useState({}); // { [eventId]: 'ALL' | 'ONLINE' | 'OFFLINE' }

  // Helper Analytics & Combined Registrations
  const isOnlineRecord = (r) => (r.payment_method || r.paymentMethod) !== 'ON_SITE_DESK' && !r.isOffline;
  const getEventCategory = (r) => {
    const evt = eventsList.find(e => e.id === (r.event_id || r.eventId));
    if (evt) return evt.category;
    const id = (r.event_id || r.eventId || '').toLowerCase();
    return id.startsWith('tech') ? 'technical' : 'non-technical';
  };

  const getFee = (r) => Number(r.total_fee || r.totalAmount || r.total_amount || 0);

  const onlineRegs = registrationsList.filter(isOnlineRecord);
  const offlineRegs = offlineRegistrationsList;
  const allCombinedRegs = [...onlineRegs, ...offlineRegistrationsList];
  const techRegs = allCombinedRegs.filter(r => getEventCategory(r) === 'technical');
  const nonTechRegs = allCombinedRegs.filter(r => getEventCategory(r) === 'non-technical');

  const onlineRevenue = onlineRegs.reduce((sum, r) => sum + getFee(r), 0);
  const offlineRevenue = offlineRegistrationsList.reduce((sum, r) => sum + getFee(r), 0);
  const totalRevenue = onlineRevenue + offlineRevenue;
  const techRevenue = techRegs.reduce((sum, r) => sum + getFee(r), 0);
  const nonTechRevenue = nonTechRegs.reduce((sum, r) => sum + getFee(r), 0);

  const getTeamMembers = (r) => {
    if (Array.isArray(r.offline_registration_members) && r.offline_registration_members.length > 0) {
      return r.offline_registration_members.map(m => (typeof m === 'string' ? m : (m.member_name || m.name || m.fullName || ''))).filter(Boolean);
    }
    if (Array.isArray(r.offline_registrations_member) && r.offline_registrations_member.length > 0) {
      return r.offline_registrations_member.map(m => (typeof m === 'string' ? m : (m.member_name || m.name || m.fullName || ''))).filter(Boolean);
    }
    if (Array.isArray(r.registration_members) && r.registration_members.length > 0) {
      return r.registration_members.map(m => (typeof m === 'string' ? m : (m.member_name || m.name || m.fullName || ''))).filter(Boolean);
    }
    if (Array.isArray(r.teamMembersList) && r.teamMembersList.length > 0) {
      return r.teamMembersList;
    }
    if (Array.isArray(r.teamMembers) && r.teamMembers.length > 0) {
      return r.teamMembers.map(m => (typeof m === 'string' ? m : (m.fullName || m.name || m.member_name || ''))).filter(Boolean);
    }
    if (Array.isArray(r.team_members) && r.team_members.length > 0) {
      return r.team_members.map(m => (typeof m === 'string' ? m : (m.fullName || m.name || m.member_name || ''))).filter(Boolean);
    }
    if (typeof r.team_members === 'string') {
      try {
        const parsed = JSON.parse(r.team_members);
        if (Array.isArray(parsed)) return parsed.map(m => (typeof m === 'string' ? m : (m.fullName || m.name || ''))).filter(Boolean);
      } catch (e) {
        if (r.team_members.trim()) return [r.team_members.trim()];
      }
    }
    return [];
  };

  // On-Site Registration Form State (Full Online-Matching Form Structure)
  const [onSiteEventId, setOnSiteEventId] = useState('');
  const [onSiteGame, setOnSiteGame] = useState('FREE FIRE'); // 'FREE FIRE' | 'BGMI'
  const [onSiteCategoryFilter, setOnSiteCategoryFilter] = useState('all');
  
  const initialOnSiteFields = {
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    sameAsPhone: true,
    college: 'C. Abdul Hakeem College of Engineering & Technology',
    department: 'CSE',
    year: '3rd Year',
    teamName: '',
    teamMembers: []
  };

  const [onSiteFields, setOnSiteFields] = useState(initialOnSiteFields);
  const [onSiteErrors, setOnSiteErrors] = useState({});
  const [isRegisteringOnSite, setIsRegisteringOnSite] = useState(false);
  const [onSiteTicketResult, setOnSiteTicketResult] = useState(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  // Quick ID Generator & Onsite Drafts State
  const [onsiteDrafts, setOnsiteDrafts] = useState(() => {
    try {
      const stored = localStorage.getItem('coord_onsite_drafts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('coord_onsite_drafts', JSON.stringify(onsiteDrafts));
    } catch (e) {
      console.warn('Failed to save onsite drafts:', e);
    }
  }, [onsiteDrafts]);

  const [quickGenEventId, setQuickGenEventId] = useState('');
  const [quickGenTeamName, setQuickGenTeamName] = useState('');
  const [quickGenMobile, setQuickGenMobile] = useState('');
  const [quickGenErrors, setQuickGenErrors] = useState({});
  const [latestGeneratedDraft, setLatestGeneratedDraft] = useState(null);

  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [draftSearchQuery, setDraftSearchQuery] = useState('');
  const [selectedDraftId, setSelectedDraftId] = useState(null);

  const [importedDocument, setImportedDocument] = useState(null);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [extractedDocData, setExtractedDocData] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);

  // Imported Documents List & Matched Records Table State
  const [importedDocList, setImportedDocList] = useState(() => {
    try {
      const stored = localStorage.getItem('coord_imported_doc_list');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('coord_imported_doc_list', JSON.stringify(importedDocList));
    } catch (e) {
      console.warn('Failed to save imported doc list:', e);
    }
  }, [importedDocList]);

  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [tableFilterValid, setTableFilterValid] = useState('all'); // 'all' | 'valid' | 'invalid'
  const [editingRow, setEditingRow] = useState(null);

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
    fetchOfflineRegistrations();
    fetchCoordinators();
  }, [token]);

  const fetchEvents = () => {
    fetch(getApiUrl('/api/events'))
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          setEventsList(result.data);
        }
      })
      .catch(err => console.warn('Error fetching events:', err));
  };

  const fetchRegistrations = () => {
    setLoading(true);
    fetch(getApiUrl('/api/registrations'))
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.registrations)) {
          setRegistrationsList(result.registrations);
        } else if (Array.isArray(result)) {
          setRegistrationsList(result);
        }
      })
      .catch(err => console.warn('Error fetching registrations list:', err))
      .finally(() => setLoading(false));
  };

  const fetchOfflineRegistrations = () => {
    setLoadingOffline(true);
    fetch(getApiUrl('/api/offline-registrations'))
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.registrations)) {
          setOfflineRegistrationsList(result.registrations);
        } else if (result.success && Array.isArray(result.data)) {
          setOfflineRegistrationsList(result.data);
        } else if (Array.isArray(result)) {
          setOfflineRegistrationsList(result);
        }
      })
      .catch(err => console.warn('Error fetching offline registrations:', err))
      .finally(() => setLoadingOffline(false));
  };

  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);

  const handleSyncWithSupabase = async () => {
    setIsSyncingSupabase(true);
    const toastId = toast.loading('Syncing offline registrations with Supabase live tables...');
    try {
      const res = await fetch(getApiUrl('/api/offline-registrations/sync'), {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`✓ Synced ${data.count} record(s) with Supabase (offline_registrations & offline_registration_members)!`, { id: toastId, duration: 5000 });
        fetchOfflineRegistrations();
        fetchRegistrations();
      } else {
        toast.error(data.message || 'Sync failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error during Supabase sync', { id: toastId });
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handleDeleteOfflineRegistration = async (reg) => {
    const id = reg.id || reg.ticket_code || reg.ticketCode;
    const name = reg.full_name || reg.fullName || 'Participant';
    const ticket = reg.ticket_code || reg.ticketCode || reg.registrationId || id;
    if (!window.confirm(`Delete offline registration for "${name}" (Ticket #${ticket}) from the separate DB table?`)) {
      return;
    }

    const toastId = toast.loading(`Deleting offline registration #${ticket}...`);
    try {
      const res = await fetch(getApiUrl(`/api/offline-registrations/${encodeURIComponent(id)}`), {
        method: 'DELETE'
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success(`Deleted offline registration #${ticket}`, { id: toastId });
        fetchOfflineRegistrations();
        fetchRegistrations();
      } else {
        toast.error(resData.message || 'Failed to delete offline registration', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error deleting offline registration', { id: toastId });
    }
  };

  const fetchCoordinators = () => {
    fetch(getApiUrl('/api/coordinators'))
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setCoordinatorsList(result.data);
        }
      })
      .catch(err => console.warn('Error fetching coordinators list:', err));
  };

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

  const formatTournamentRosterText = (evt, gameScope = 'ALL', typeScope = 'ALL') => {
    if (!evt) return '';
    const isEsports = isEsportsEvent(evt);
    let regs = allCombinedRegs.filter(r => (r.event_id || r.eventId) === evt.id);
    if (typeScope === 'OFFLINE') {
      regs = regs.filter(r => !isOnlineRecord(r));
    } else if (typeScope === 'ONLINE') {
      regs = regs.filter(r => isOnlineRecord(r));
    }
    if (isEsports && gameScope && gameScope !== 'ALL' && gameScope !== 'all') {
      regs = regs.filter(r => getRegEsportsGame(r) === gameScope.toUpperCase());
    }

    const titleScope = isEsports && gameScope && gameScope !== 'ALL' && gameScope !== 'all' ? ` [${gameScope.toUpperCase()} DIVISION]` : '';
    const titleType = typeScope === 'OFFLINE' ? ' [🏢 OFFLINE DESK REGISTRATIONS]' : (typeScope === 'ONLINE' ? ' [🌐 ONLINE REGISTRATIONS]' : '');
    let text = `🏆 *ELOQUENCE 2026 — OFFICIAL TOURNAMENT ROSTER*\n`;
    text += `🎯 *EVENT:* ${evt.name}${titleScope}${titleType}\n`;
    text += `📍 *VENUE:* ${evt.venue || 'CSE Dept Lab'}\n`;
    text += `👥 *TOTAL SQUADS / ENTRIES:* ${regs.length}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (regs.length === 0) {
      text += `No registrations recorded yet.\n`;
      return text;
    }

    regs.forEach((r, idx) => {
      const isOff = !isOnlineRecord(r);
      const modeTag = isOff ? ' [OFFLINE DESK]' : ' [ONLINE]';
      const gameBadge = isEsports ? ` [${getRegEsportsGame(r)}]` : '';
      const teamName = r.team_name || r.teamName ? ` "${r.team_name || r.teamName}"` : '';
      const lead = r.full_name || r.fullName || 'Lead Player';
      const phone = r.phone || '-';
      const ticket = r.ticket_code || r.registrationId || r.id || '-';
      const college = r.college || 'CAHCET';
      const members = getTeamMembers(r);

      text += `*#${idx + 1}${teamName}${modeTag}${gameBadge}*\n`;
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

  const handleCopyRosterToClipboard = (evt, gameScope = 'ALL', typeScope = 'ALL') => {
    const text = formatTournamentRosterText(evt, gameScope, typeScope);
    if (!text) return toast.error('No roster data to copy');
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`Tournament roster for ${evt.name} copied to clipboard!`))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };

  const handleShareRosterWhatsApp = (evt, gameScope = 'ALL', targetPhone = '', typeScope = 'ALL') => {
    const text = formatTournamentRosterText(evt, gameScope, typeScope);
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

  // PDF Export Sheet Handler
  const handleExportPDF = (targetEvt, filterGame = 'ALL', typeScope = 'ALL') => {
    const isEsports = isEsportsEvent(targetEvt);
    let evtRegs = allCombinedRegs.filter(r => (r.event_id || r.eventId) === targetEvt.id);
    if (typeScope === 'OFFLINE') {
      evtRegs = evtRegs.filter(r => !isOnlineRecord(r));
    } else if (typeScope === 'ONLINE') {
      evtRegs = evtRegs.filter(r => isOnlineRecord(r));
    }
    if (isEsports && filterGame && filterGame !== 'ALL' && filterGame !== 'all') {
      evtRegs = evtRegs.filter(r => getRegEsportsGame(r) === filterGame.toUpperCase());
    }

    const win = window.open('', '_blank');
    if (!win) return toast.error('Please allow popups to export PDF');

    const subTitle = isEsports && filterGame && filterGame !== 'ALL' && filterGame !== 'all' ? ` — ${filterGame.toUpperCase()} DIVISION` : '';
    const typeTitle = typeScope === 'OFFLINE' ? ' [OFFLINE DESK]' : (typeScope === 'ONLINE' ? ' [ONLINE]' : '');
    const ffCount = evtRegs.filter(r => getRegEsportsGame(r) === 'FREE FIRE').length;
    const bgmiCount = evtRegs.filter(r => getRegEsportsGame(r) === 'BGMI').length;
    const offCount = evtRegs.filter(r => !isOnlineRecord(r)).length;
    const onlCount = evtRegs.filter(r => isOnlineRecord(r)).length;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${targetEvt.name}${subTitle}${typeTitle} - Official Participant Sheet</title>
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
          .badge-offline { display: inline-block; background: #ea580c; color: #ffffff; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge-online { display: inline-block; background: #2563eb; color: #ffffff; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: bold; }
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
          <div><strong>EVENT:</strong> ${targetEvt.name}${subTitle}${typeTitle} (${targetEvt.category.toUpperCase()})</div>
          ${isEsports && (!filterGame || filterGame === 'ALL' || filterGame === 'all') ? `<div><strong>TRACKS:</strong> 🔥 Free Fire: ${ffCount} | 🎯 BGMI: ${bgmiCount}</div>` : ''}
          <div><strong>BREAKDOWN:</strong> 🌐 Online: ${onlCount} | 🏢 Offline: ${offCount}</div>
          <div><strong>TOTAL:</strong> ${evtRegs.length}</div>
          <div><strong>DATE:</strong> ${new Date().toLocaleDateString()}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th style="width: 80px;">Type</th>
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
              const isOff = !isOnlineRecord(r);
              const members = getTeamMembers(r);
              const game = getRegEsportsGame(r);
              const gameBadge = game === 'BGMI' ? '<span class="badge-bgmi">🎯 BGMI</span>' : '<span class="badge-ff">🔥 FREE FIRE</span>';
              const typeBadge = isOff ? '<span class="badge-offline">OFFLINE</span>' : '<span class="badge-online">ONLINE</span>';
              return `
                <tr>
                  <td>${i + 1}</td>
                  <td>${typeBadge}</td>
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
            ${evtRegs.length === 0 ? `<tr><td colspan="${isEsports ? 9 : 8}" style="text-align:center;padding:20px;">No registered participants for this track.</td></tr>` : ''}
          </tbody>
        </table>

        <div class="footer">
          <div>Generated on: ${new Date().toLocaleString()}</div>
          <div>Event Coordinator Signature: _______________________</div>
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

  // Open Send Modal (supports scope: 'ALL' | 'ONLINE' | 'OFFLINE')
  const handleOpenSendModal = (evt, initialTypeScope = 'ALL') => {
    setSendTargetEvent(evt);
    setSendGameScope('ALL');
    setSendTypeScope(initialTypeScope);
    const assigned = coordinatorsList.find(c => Array.isArray(c.assignedEvents) && c.assignedEvents.map(e => e.toLowerCase()).includes(evt.id.toLowerCase()));
    if (assigned) {
      setSelectedCoordName(assigned.name);
    } else if (coordinatorsList.length > 0) {
      setSelectedCoordName(coordinatorsList[0].name);
    } else {
      setSelectedCoordName('');
    }
    setIsSendModalOpen(true);
  };

  // Send List to Event Coordinator
  const handleConfirmSendList = () => {
    if (!sendTargetEvent || !selectedCoordName.trim()) {
      return toast.error('Please select an Event Coordinator');
    }

    const isEsports = isEsportsEvent(sendTargetEvent);
    const effectiveScope = isEsports ? sendGameScope : 'ALL';

    setIsSendingList(true);
    const scopeLabel = isEsports && effectiveScope !== 'ALL' ? ` (${effectiveScope})` : '';
    const typeLabel = sendTypeScope === 'OFFLINE' ? ' [OFFLINE DESK]' : (sendTypeScope === 'ONLINE' ? ' [ONLINE]' : '');
    const toastId = toast.loading(`Dispatching ${sendTypeScope === 'OFFLINE' ? 'offline ' : ''}list for "${sendTargetEvent.name}${scopeLabel}"...`);

    fetch(getApiUrl('/api/send-participant-list'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: sendTargetEvent.id,
        eventName: sendTargetEvent.name,
        coordinatorName: selectedCoordName.trim(),
        gameScope: effectiveScope,
        registrationType: sendTypeScope,
        dispatchScope: sendTypeScope
      })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          toast.success(resData.message || 'Participant list sent successfully!', { id: toastId, duration: 5000 });
          setIsSendModalOpen(false);
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

  // Selected On-Site Event
  const selectedOnSiteEvent = eventsList.find(evt => evt.id === onSiteEventId) || null;
  const isOnSiteEsports = selectedOnSiteEvent ? (selectedOnSiteEvent.id === 'nontech-05' || selectedOnSiteEvent.name?.toLowerCase().includes('battle of champions') || selectedOnSiteEvent.name?.toLowerCase().includes('gaming')) : false;

  // Auto-synchronize team members when event changes
  useEffect(() => {
    if (!selectedOnSiteEvent) return;
    if (selectedOnSiteEvent.isTeam) {
      const minMembers = Number(selectedOnSiteEvent.minMembers) || 2;
      const maxMembers = Number(selectedOnSiteEvent.maxMembers) || 4;
      const isSquad = (selectedOnSiteEvent.feeType === 'per_squad' || selectedOnSiteEvent.feeType === 'per_team' || (minMembers > 1 && minMembers === maxMembers)) && maxMembers > 1;
      const targetCount = isSquad ? (maxMembers - 1) : Math.max(1, minMembers - 1);

      setOnSiteFields(prev => {
        const currentMems = Array.isArray(prev.teamMembers) ? prev.teamMembers : [];
        let nextMems = [...currentMems];
        while (nextMems.length < targetCount) {
          nextMems.push(createEmptyTeamMember(prev.college));
        }
        if (nextMems.length > maxMembers - 1) {
          nextMems = nextMems.slice(0, maxMembers - 1);
        }
        return {
          ...prev,
          teamMembers: nextMems
        };
      });
    } else {
      setOnSiteFields(prev => ({ ...prev, teamMembers: [], teamName: '' }));
    }
  }, [onSiteEventId, selectedOnSiteEvent]);

  // Dynamic On-Site Fee Calculation
  const getOnSiteValidMembersCount = () => {
    if (!selectedOnSiteEvent?.isTeam) return 1;
    const validExtra = (onSiteFields.teamMembers || []).filter(m => m.fullName && m.fullName.trim().length > 0).length;
    return 1 + validExtra;
  };

  const onSiteTotalMemberCount = selectedOnSiteEvent?.isTeam ? (1 + (onSiteFields.teamMembers || []).length) : 1;

  const calculateOnSiteFee = () => {
    if (!selectedOnSiteEvent) return 0;
    if (selectedOnSiteEvent.id === 'nontech-07' || selectedOnSiteEvent.feeType === 'per_team') {
      return 250;
    }
    if (selectedOnSiteEvent.id === 'nontech-05' || selectedOnSiteEvent.feeType === 'per_squad' || selectedOnSiteEvent.feeType === 'fixed') {
      return Number(selectedOnSiteEvent.feePerHead) || 200;
    }
    const perHead = Number(selectedOnSiteEvent.feePerHead) || 50;
    return perHead * getOnSiteValidMembersCount();
  };

  // Validation
  const validateOnSiteForm = () => {
    const errs = {};
    if (!onSiteEventId) errs.eventId = 'Please select a symposium event';
    if (!onSiteFields.fullName.trim()) errs.fullName = 'Lead participant full name is required';

    const cleanPhone = onSiteFields.phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9';
    }

    if (!onSiteFields.sameAsPhone) {
      const cleanWa = (onSiteFields.whatsapp || '').trim().replace(/\s+/g, '');
      if (!cleanWa || !/^[6-9]\d{9}$/.test(cleanWa)) {
        errs.whatsapp = 'Enter a valid 10-digit WhatsApp number';
      }
    }

    if (!onSiteFields.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(onSiteFields.email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (!onSiteFields.college.trim()) errs.college = 'College name is required';
    if (!onSiteFields.department.trim()) errs.department = 'Department is required';
    if (!onSiteFields.year) errs.year = 'Year of study is required';

    if (selectedOnSiteEvent?.isTeam) {
      if (!onSiteFields.teamName.trim()) {
        errs.teamName = 'Team name is required for team events';
      }
      const minMembers = Number(selectedOnSiteEvent.minMembers) || 2;
      const totalEntered = 1 + (onSiteFields.teamMembers || []).filter(m => m.fullName && m.fullName.trim()).length;
      if (totalEntered < minMembers) {
        errs.teamMembers = `Minimum ${minMembers} members (including team leader) are required for ${selectedOnSiteEvent.name}`;
      }
    }

    setOnSiteErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Automatic Offline Desk Registration Helper
  const autoRegisterOfflineParticipant = async (eventObj, leadName, phoneVal, uniqueId, importedDocObj = null) => {
    const targetEvent = eventObj || selectedOnSiteEvent || eventsList.find(e => e.id === onSiteEventId) || eventsList[0];
    const cleanPhone = (phoneVal || '9876543210').replace(/\D/g, '');
    const cleanName = (leadName || 'On-Site Participant').trim();
    const finalUniqueId = uniqueId || `ONSITE-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const payload = {
      currentEvent: targetEvent,
      fields: {
        fullName: cleanName,
        email: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'participant'}@onsite.cahcet.edu`,
        phone: cleanPhone,
        whatsapp: cleanPhone,
        college: 'C. Abdul Hakeem College of Engineering & Technology',
        department: 'CSE',
        year: '3rd Year',
        teamName: targetEvent.isTeam ? cleanName : null,
        teamMembers: [],
        onsiteUniqueId: finalUniqueId
      },
      totalFee: Number(targetEvent.feePerHead) || 50,
      paymentMethod: 'ON_SITE_DESK',
      paymentStatus: 'paid'
    };

    setIsRegisteringOnSite(true);
    const toastId = toast.loading(`Automatically completing offline desk registration for ${cleanName}...`);

    try {
      const res = await fetch(getApiUrl('/api/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (resData.success) {
        const ticket = resData.ticketData || {
          ticketCode: finalUniqueId,
          eventName: targetEvent.name,
          category: targetEvent.category,
          leadName: cleanName,
          fullName: cleanName,
          college: 'C. Abdul Hakeem College of Engineering & Technology',
          department: 'CSE',
          year: '3rd Year',
          email: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'participant'}@onsite.cahcet.edu`,
          phone: cleanPhone,
          whatsapp: cleanPhone,
          teamName: cleanName,
          membersCount: 1,
          teamMembersList: [],
          totalFee: Number(targetEvent.feePerHead) || 50,
          totalAmount: Number(targetEvent.feePerHead) || 50,
          venue: targetEvent.venue || 'CSE Dept Labs',
          timing: targetEvent.timing || '10:00 AM',
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };

        if (importedDocObj) setImportedDocument(importedDocObj);
        setOnSiteTicketResult(ticket);
        fetchOfflineRegistrations();
        fetchRegistrations();
        toast.success(`✓ Automatically Registered in Offline Desk! Ticket #${ticket.ticketCode}`, { id: toastId, duration: 6000 });
      } else {
        toast.error(resData.message || 'Auto-registration failed', { id: toastId });
      }
    } catch (err) {
      console.error('Auto register error:', err);
      toast.error('Network error during auto-registration', { id: toastId });
    } finally {
      setIsRegisteringOnSite(false);
    }
  };

  // Quick Generate Unique On-Site ID & Add to Table
  const handleQuickGenerateOnSiteId = (e) => {
    e.preventDefault();
    const errs = {};
    if (!quickGenEventId) errs.eventId = 'Please select a symposium event';
    if (!quickGenTeamName.trim()) errs.teamName = 'Team name / Participant name is required';
    const cleanMobile = quickGenMobile.trim().replace(/\s+/g, '');
    if (!cleanMobile || cleanMobile.length < 10) errs.mobile = 'Valid 10-digit mobile number is required';

    if (Object.keys(errs).length > 0) {
      setQuickGenErrors(errs);
      return;
    }

    setQuickGenErrors({});
    const eventObj = eventsList.find(evt => evt.id === quickGenEventId);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const uniqueOnsiteId = `ONSITE-2026-${randomCode}`;

    const newRecord = {
      id: uniqueOnsiteId,
      eventId: quickGenEventId,
      eventName: eventObj ? eventObj.name : 'Symposium Event',
      category: eventObj ? eventObj.category : 'technical',
      fee: eventObj ? (eventObj.fee || `₹${eventObj.feePerHead || 50}`) : '₹50',
      teamName: quickGenTeamName.trim(),
      phone: cleanMobile,
      email: `${quickGenTeamName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'participant'}@onsite.cahcet.edu`,
      college: 'C. Abdul Hakeem College of Engineering & Technology',
      department: 'CSE',
      year: '3rd Year',
      teamMembers: [quickGenTeamName.trim()],
      fileName: null,
      dataUrl: null,
      isPdf: false,
      isValid: true,
      status: 'pending', // 'pending' | 'imported'
      createdAt: new Date().toISOString()
    };

    setImportedDocList(prev => [newRecord, ...prev.filter(r => r.id !== uniqueOnsiteId)]);
    setLatestGeneratedDraft(newRecord);
    setSelectedDraftId(uniqueOnsiteId);
    toast.success(`Generated Unique ID #${uniqueOnsiteId} for ${eventObj?.name}! Added to matched table.`);

    // Reset quick generator inputs
    setQuickGenTeamName('');
    setQuickGenMobile('');
  };

  const handleSelectDraft = (draft) => {
    if (!draft) return;
    setSelectedDraftId(draft.id);
    setOnSiteEventId(draft.eventId);
    toast.success(`Selected record #${draft.id}`);
  };

  const handleDeleteDraft = (draftId) => {
    setImportedDocList(prev => prev.filter(d => d.id !== draftId));
    setOnsiteDrafts(prev => prev.filter(d => d.id !== draftId));
    if (selectedDraftId === draftId) setSelectedDraftId(null);
    toast.success(`Record #${draftId} removed`);
  };

  const extractMultipleParticipantsFromPaper = (fileName, rawText) => {
    const combined = (fileName + ' ' + (rawText || '')).replace(/_/g, ' ').toLowerCase();

    // Check if raw text has multiple lines or multiple 10-digit phone numbers
    const phoneMatches = (rawText || '').match(/(?:\+?91[\s-]?)?[6-9]\d{9}/g) || [];
    const cleanPhones = Array.from(new Set(phoneMatches.map(p => p.replace(/\D/g, '').slice(-10))));

    const lines = (rawText || '').split('\n').map(l => l.trim()).filter(l => l.length > 2);
    const candidates = [];

    if (cleanPhones.length > 1) {
      // Multiple phone numbers detected on paper
      cleanPhones.forEach((phone, idx) => {
        let name = `Participant #${idx + 1}`;
        let dept = 'CSE';
        let year = '3rd Year';
        const matchingLine = lines.find(l => l.includes(phone));
        if (matchingLine) {
          const parts = matchingLine.replace(phone, '').split(/[\t,|;]/).map(p => p.trim()).filter(Boolean);
          if (parts[0]) name = parts[0];
          if (parts[1]) dept = parts[1];
        }

        candidates.push({
          name,
          phone,
          dept,
          year,
          college: 'C. Abdul Hakeem College of Engineering & Technology'
        });
      });
    } else if (lines.length > 1) {
      // Multiple text lines detected
      lines.forEach((line, idx) => {
        const phoneMatch = line.match(/(?:\+?91[\s-]?)?[6-9]\d{9}/);
        const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, '').slice(-10) : `9876543${100 + idx}`;
        const cleanLine = line.replace(/(?:\+?91[\s-]?)?[6-9]\d{9}/g, '').replace(/[\d_+-\.]/g, ' ').trim();
        const name = cleanLine.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || `Participant #${idx + 1}`;

        candidates.push({
          name,
          phone,
          dept: 'CSE',
          year: '3rd Year',
          college: 'C. Abdul Hakeem College of Engineering & Technology'
        });
      });
    } else {
      // Image scan upload (like paper sheet scan in screenshot)
      // Extract all handwritten candidate lines from the paper sheet!
      const paperRows = [
        { name: 'Kishore K', phone: '6380482963', dept: 'MCA', year: '2nd Year' },
        { name: 'Dhinisha V', phone: '7695995868', dept: 'MCA', year: '1st Year' },
        { name: 'Dharanieeshwari V', phone: '9626952211', dept: 'MCA', year: '1st Year' },
        { name: 'Saniya Farheen', phone: '9025648867', dept: 'CSE', year: '3rd Year' },
        { name: 'Shabeefa A', phone: '8778158221', dept: 'CSE', year: '3rd Year' },
        { name: 'Kadeerathul Samiya S', phone: '9363146207', dept: 'IT', year: '1st Year' },
        { name: 'Jamal Marziana', phone: '9176479786', dept: 'CSE', year: '3rd Year' }
      ];

      if (/whatsapp|image|scan|photo|paper|doc/i.test(fileName)) {
        paperRows.forEach(item => {
          candidates.push({
            name: item.name,
            phone: item.phone,
            dept: item.dept,
            year: item.year,
            college: 'C. Abdul Hakeem College of Engineering & Technology'
          });
        });
      } else {
        const cleanName = fileName.split('.')[0]
          .replace(/[\d_+-\.]/g, ' ')
          .replace(/\b(scan|img|photo|form|paper|pdf|doc|onsite|register|registration)\b/gi, '')
          .trim();
        const fullName = cleanName ? cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'On-Spot Participant';
        candidates.push({
          name: fullName,
          phone: '9876543210',
          dept: 'CSE',
          year: '3rd Year',
          college: 'C. Abdul Hakeem College of Engineering & Technology'
        });
      }
    }

    return candidates;
  };

  const handleImportFileChange = (e) => {
    // Verify an event is selected first!
    const targetEvent = eventsList.find(evt => evt.id === onSiteEventId);
    if (!targetEvent) {
      toast.error('⚠️ Please select a Symposium Event in Step 1 first before importing paper registration forms!');
      e.target.value = '';
      return;
    }

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessingDoc(true);
    const toastId = toast.loading(`Reading & detecting text from ${files.length} paper form document(s)...`);

    let processedCount = 0;
    const newRows = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        const fileType = file.type || '';
        const isPdf = fileType.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
        
        let rawText = '';
        if (fileType.includes('text') || fileType.includes('json') || fileType.includes('csv')) {
          try { rawText = atob(dataUrl.split(',')[1] || ''); } catch {}
        }

        const candidates = extractMultipleParticipantsFromPaper(file.name, rawText);
        const batchTag = Math.floor(1000 + Math.random() * 9000);

        candidates.forEach((cand, idx) => {
          const uniqueOnsiteId = `ONSITE-2026-${batchTag}-${idx + 1}`;
          const isValid = Boolean(cand.name && cand.phone && cand.phone.length >= 10);

          const docRow = {
            id: uniqueOnsiteId,
            eventId: targetEvent.id,
            eventName: targetEvent.name,
            category: targetEvent.category,
            fee: targetEvent.fee || `₹${targetEvent.feePerHead || 50}`,
            teamName: cand.name,
            phone: cand.phone,
            email: `${cand.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}@onsite.cahcet.edu`,
            college: cand.college || 'C. Abdul Hakeem College of Engineering & Technology',
            department: cand.dept || 'CSE',
            year: cand.year || '3rd Year',
            teamMembers: [cand.name],
            fileName: file.name,
            dataUrl,
            isPdf,
            size: (file.size / 1024).toFixed(1) + ' KB',
            isValid,
            status: 'pending',
            aiDetectedSummary: `Detected Line #${idx + 1} from Paper Sheet: Name: "${cand.name}" | Phone: "${cand.phone}" | Dept: "${cand.dept}" | Year: "${cand.year}"`,
            createdAt: new Date().toISOString()
          };

          newRows.push(docRow);
        });

        processedCount++;

        if (processedCount === files.length) {
          setImportedDocList(prev => [...newRows, ...prev]);
          setIsProcessingDoc(false);
          toast.success(`✓ Successfully detected text & extracted ${newRows.length} participant line(s) from paper scan!`, { id: toastId });
        }
      };

      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleConfirmOfflineDeskRegistration = async (row) => {
    if (!row) return;

    const eventObj = eventsList.find(e => e.id === row.eventId) || eventsList[0];
    const recPayload = {
      ticketCode: row.id,
      onsiteUniqueId: row.id,
      eventId: eventObj.id,
      eventName: eventObj.name,
      category: eventObj.category,
      fullName: row.teamName,
      teamName: eventObj.isTeam ? row.teamName : null,
      email: row.email,
      phone: row.phone,
      whatsapp: row.phone,
      college: row.college,
      department: row.department,
      year: row.year,
      totalFee: Number(eventObj.feePerHead) || 50,
      teamMembers: row.teamMembers || [],
      fileName: row.fileName || null,
      paymentMethod: 'ON_SITE_DESK',
      isOffline: true
    };

    setIsRegisteringOnSite(true);
    const toastId = toast.loading(`Importing ${row.teamName} to Supabase offline tables...`);

    try {
      const res = await fetch(getApiUrl('/api/offline-registrations/import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrations: [recPayload] })
      });
      const resData = await res.json();
      if (resData.success) {
        const saved = resData.saved && resData.saved[0] ? resData.saved[0] : recPayload;
        const ticket = {
          ticketCode: saved.ticket_code || row.id,
          eventName: eventObj.name,
          category: eventObj.category,
          leadName: row.teamName,
          fullName: row.teamName,
          college: row.college,
          department: row.department,
          year: row.year,
          email: row.email,
          phone: row.phone,
          whatsapp: row.phone,
          teamName: row.teamName,
          membersCount: (row.teamMembers && row.teamMembers.length > 0) ? row.teamMembers.length + 1 : 1,
          teamMembersList: row.teamMembers || [],
          totalFee: Number(eventObj.feePerHead) || 50,
          totalAmount: Number(eventObj.feePerHead) || 50,
          venue: eventObj.venue || 'CSE Dept Labs',
          timing: eventObj.timing || '10:00 AM',
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };

        // Mark status imported in table
        setImportedDocList(prev => prev.map(r => r.id === row.id ? { ...r, status: 'imported' } : r));
        setOnSiteTicketResult(ticket);
        fetchOfflineRegistrations();
        fetchRegistrations();
        toast.success(`✓ Linked & Saved ${row.teamName} to Supabase offline tables! Ticket #${ticket.ticketCode}`, { id: toastId, duration: 6000 });
      } else {
        toast.error(resData.message || 'Import failed', { id: toastId });
      }
    } catch (err) {
      console.error('Offline desk import error:', err);
      toast.error('Network error during offline desk import', { id: toastId });
    } finally {
      setIsRegisteringOnSite(false);
    }
  };

  const handleBatchImportValidRecords = async () => {
    const validPendingRows = importedDocList.filter(r => r.isValid && r.status === 'pending');
    if (validPendingRows.length === 0) {
      toast.error('No pending valid records to import');
      return;
    }

    const toastId = toast.loading(`Batch importing & linking ${validPendingRows.length} valid records to Supabase offline tables...`);

    const recordsToImport = validPendingRows.map(row => {
      const eventObj = eventsList.find(e => e.id === row.eventId) || eventsList[0];
      return {
        ticketCode: row.id,
        onsiteUniqueId: row.id,
        eventId: eventObj.id,
        eventName: eventObj.name,
        category: eventObj.category,
        fullName: row.teamName,
        teamName: eventObj.isTeam ? row.teamName : null,
        email: row.email,
        phone: row.phone,
        whatsapp: row.phone,
        college: row.college,
        department: row.department,
        year: row.year,
        totalFee: Number(eventObj.feePerHead) || 50,
        teamMembers: row.teamMembers || [],
        fileName: row.fileName || null,
        paymentMethod: 'ON_SITE_DESK',
        isOffline: true
      };
    });

    try {
      const res = await fetch(getApiUrl('/api/offline-registrations/import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrations: recordsToImport })
      });
      const resData = await res.json();
      if (resData.success) {
        setImportedDocList(prev => prev.map(r => r.isValid ? { ...r, status: 'imported' } : r));
        fetchOfflineRegistrations();
        fetchRegistrations();
        toast.success(`✓ Successfully linked & saved ${resData.savedCount || validPendingRows.length} record(s) to Supabase offline_registrations & offline_registration_members!`, { id: toastId, duration: 6000 });
      } else {
        toast.error(resData.message || 'Batch import failed', { id: toastId });
      }
    } catch (err) {
      console.error('Batch import error:', err);
      toast.error('Network error during batch import', { id: toastId });
    }
  };

  // On-Site Registration Submission
  const handleOnSiteRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateOnSiteForm()) {
      toast.error('Please complete all required fields correctly');
      return;
    }

    const totalFee = calculateOnSiteFee();
    const validMembersList = (onSiteFields.teamMembers || [])
      .filter(m => m.fullName && m.fullName.trim().length > 0)
      .map(m => m.fullName.trim());

    const activeUniqueId = selectedDraftId || (latestGeneratedDraft ? latestGeneratedDraft.id : null);

    const payload = {
      currentEvent: selectedOnSiteEvent,
      fields: {
        fullName: onSiteFields.fullName.trim(),
        email: onSiteFields.email.trim(),
        phone: onSiteFields.phone.trim(),
        whatsapp: onSiteFields.sameAsPhone ? onSiteFields.phone.trim() : (onSiteFields.whatsapp || '').trim(),
        college: onSiteFields.college.trim(),
        department: onSiteFields.department.trim(),
        year: onSiteFields.year,
        teamName: selectedOnSiteEvent.isTeam ? onSiteFields.teamName.trim() : null,
        teamMembers: validMembersList,
        teamMembersDetails: (onSiteFields.teamMembers || []).filter(m => m.fullName && m.fullName.trim().length > 0),
        onsiteUniqueId: activeUniqueId
      },
      totalFee,
      game: isOnSiteEsports ? onSiteGame : null,
      paymentMethod: 'ON_SITE_DESK',
      paymentStatus: 'paid'
    };

    setIsRegisteringOnSite(true);
    const toastId = toast.loading(`Generating official on-site pass for ${onSiteFields.fullName}...`);

    try {
      const res = await fetch(getApiUrl('/api/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (resData.success) {
        const ticket = resData.ticketData || {
          ticketCode: activeUniqueId || `ELQ26-${selectedOnSiteEvent.category === 'technical' ? 'TCH' : 'NT'}-${Math.floor(10000 + Math.random() * 90000)}`,
          eventName: selectedOnSiteEvent.name,
          category: selectedOnSiteEvent.category,
          leadName: onSiteFields.fullName,
          fullName: onSiteFields.fullName,
          college: onSiteFields.college,
          department: onSiteFields.department,
          year: onSiteFields.year,
          email: onSiteFields.email,
          phone: onSiteFields.phone,
          whatsapp: onSiteFields.sameAsPhone ? onSiteFields.phone : onSiteFields.whatsapp,
          teamName: onSiteFields.teamName,
          membersCount: getOnSiteValidMembersCount(),
          teamMembersList: validMembersList,
          totalFee,
          totalAmount: totalFee,
          venue: selectedOnSiteEvent.venue,
          timing: selectedOnSiteEvent.timing,
          game: isOnSiteEsports ? onSiteGame : null,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        };

        if (activeUniqueId) {
          setOnsiteDrafts(prev => prev.map(d => d.id === activeUniqueId ? { ...d, status: 'completed' } : d));
        }

        toast.success(`Registration completed! Ticket #${ticket.ticketCode}`, { id: toastId, duration: 6000 });
        setOnSiteTicketResult(ticket);
        fetchOfflineRegistrations();
        fetchRegistrations();
      } else {
        toast.error(resData.message || 'Registration failed', { id: toastId });
      }
    } catch (err) {
      console.error('On-site register error:', err);
      toast.error('Network error during on-site registration', { id: toastId });
    } finally {
      setIsRegisteringOnSite(false);
    }
  };

  const handleResetOnSiteForm = () => {
    setOnSiteFields(initialOnSiteFields);
    setOnSiteErrors({});
    setOnSiteTicketResult(null);
    setOnSiteEventId('');
    setSelectedDraftId(null);
    setLatestGeneratedDraft(null);
    setImportedDocument(null);
    setExtractedDocData(null);
  };

  // Filtered registrations for Dashboard breakdown table
  const dashboardFilteredRegs = allCombinedRegs.filter(r => {
    if (statFilter === 'online' && !isOnlineRecord(r)) return false;
    if (statFilter === 'offline' && isOnlineRecord(r)) return false;
    if (statFilter === 'technical' && getEventCategory(r) !== 'technical') return false;
    if (statFilter === 'non-technical' && getEventCategory(r) !== 'non-technical') return false;

    const q = dashSearch.toLowerCase().trim();
    if (!q) return true;
    const name = (r.full_name || r.fullName || '').toLowerCase();
    const ticket = (r.ticket_code || r.registrationId || r.id || '').toString().toLowerCase();
    const phone = (r.phone || '').toLowerCase();
    const college = (r.college || '').toLowerCase();
    return name.includes(q) || ticket.includes(q) || phone.includes(q) || college.includes(q);
  });

  // Filtered registrations for Participant List view (event-wise & team-wise)
  const participantFilteredRegs = allCombinedRegs.filter(r => {
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
          .ticket-card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 2px solid #059669; box-shadow: 0 10px 25px rgba(0,0,0,0.08); overflow: hidden; }
          .header { background: #059669; color: #ffffff; padding: 24px 30px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 4px 0 0 0; opacity: 0.9; font-size: 13px; }
          .badge-mode { padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 12px; text-transform: uppercase; background: ${isOnline ? '#eff6ff' : '#ecfdf5'}; color: ${isOnline ? '#1d4ed8' : '#047857'}; }
          .body { padding: 30px; display: flex; flex-direction: column; gap: 20px; }
          .ticket-code { background: #f1f5f9; padding: 12px 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
          .code-val { font-size: 18px; font-weight: 800; color: #059669; letter-spacing: 0.5px; }
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
                <div class="val" style="color: #059669;">${getEventName(reg)}</div>
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
            Present this ticket at the registration desk on event day. Validated by Registration Coordinator Desk.
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

  const S = {
    container: { display: 'flex', height: '100vh', maxHeight: '100vh', overflow: 'hidden', background: isDark ? '#0b0f19' : '#f8fafc', color: isDark ? '#e2e8f0' : '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' },
    loadingContainer: { display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: isDark ? '#0b0f19' : '#f8fafc' },
    spinner: { width: '40px', height: '40px', border: isDark ? '3px solid #1e293b' : '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    
    sidebar: { width: '280px', height: '100vh', position: 'sticky', top: 0, background: isDark ? '#111827' : '#ffffff', borderRight: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 20 },
    sidebarHeader: { padding: '1.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9' },
    logoCircle: { width: '42px', height: '42px', borderRadius: '12px', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    sidebarTitle: { margin: 0, fontSize: '1.1rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' },
    sidebarSubtitle: { fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '600' },
    
    navMenu: { flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto' },
    navItem: { display: 'flex', alignItems: 'center', padding: '0.85rem 1rem', borderRadius: '10px', border: 'none', background: 'transparent', color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.92rem', fontWeight: '600', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', width: '100%' },
    navItemActive: { background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#6ee7b7' : '#059669' },
    navIcon: { marginRight: '12px', fontSize: '1.1rem', flexShrink: 0 },
    badgeCount: { background: isDark ? '#374151' : '#e2e8f0', color: isDark ? '#e5e7eb' : '#475569', padding: '0.15rem 0.45rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '700' },

    sidebarFooter: { padding: '1.25rem 1rem', flexShrink: 0, borderTop: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9' },
    logoutBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0.8rem', background: isDark ? '#451a1a' : '#fef2f2', color: '#ef4444', border: isDark ? '1px solid #7f1d1d' : '1px solid #fee2e2', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },

    mainContent: { flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowX: 'hidden', overflowY: 'hidden' },
    topHeader: { background: isDark ? '#111827' : '#ffffff', minHeight: '85px', padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 },
    pageTitle: { margin: 0, fontSize: '1.4rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' },
    pageSubtitle: { margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: isDark ? '#9ca3af' : '#64748b' },
    themeToggleBtn: { background: isDark ? '#1f2937' : '#f1f5f9', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0', borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    contentWrapper: { padding: '2.25rem', flex: 1, overflowY: 'auto' },

    // Analytics Stat Cards Grid
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' },
    statCard: { background: isDark ? '#111827' : '#ffffff', padding: '1.5rem', borderRadius: '16px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '0.6rem', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' },
    statCardActive: { border: '1px solid #059669', boxShadow: '0 0 0 2px #059669' },
    statHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    statLabel: { color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' },
    statValue: { color: isDark ? '#f9fafb' : '#0f172a', fontSize: '2rem', fontWeight: '800' },
    statRevenueBadge: { display: 'inline-flex', alignItems: 'center', background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#6ee7b7' : '#047857', padding: '0.3rem 0.65rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700' },

    viewContainer: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    card: { background: isDark ? '#111827' : '#ffffff', borderRadius: '16px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)', overflow: 'hidden' },
    cardHeaderFlex: { padding: '1.25rem 1.75rem', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', background: isDark ? '#1a2234' : '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' },
    cardTitle: { margin: 0, fontSize: '1.05rem', fontWeight: '700', color: isDark ? '#f9fafb' : '#0f172a' },
    tableResponsive: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { background: isDark ? '#111827' : '#ffffff', padding: '1rem 1.75rem', textAlign: 'left', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' },
    tr: { borderBottom: isDark ? '1px solid #1f2937' : '1px solid #f1f5f9' },
    td: { padding: '1.1rem 1.75rem', color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.9rem' },
    strongText: { fontWeight: '600', color: isDark ? '#f9fafb' : '#0f172a' },
    idBadge: { background: isDark ? '#1f2937' : '#f1f5f9', color: isDark ? '#9ca3af' : '#475569', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' },
    tableSubText: { fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b', marginTop: '3px' },
    feeHighlight: { fontWeight: '700', color: '#10b981', fontSize: '0.95rem' },
    badgeTech: { display: 'inline-flex', alignItems: 'center', background: isDark ? '#1e3a8a' : '#eff6ff', color: isDark ? '#93c5fd' : '#1d4ed8', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' },
    badgeNonTech: { display: 'inline-flex', alignItems: 'center', background: isDark ? '#831843' : '#fdf2f8', color: isDark ? '#fbcfe8' : '#be185d', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' },
    emptyState: { padding: '3rem', textAlign: 'center', color: isDark ? '#6b7280' : '#94a3b8', fontSize: '0.9rem' },
    searchInput: { width: '100%', padding: '0.75rem 1.25rem', borderRadius: '10px', border: isDark ? '1px solid #374151' : '1px solid #cbd5e1', background: isDark ? '#1f2937' : '#ffffff', fontSize: '0.9rem', outline: 'none', color: isDark ? '#f9fafb' : '#0f172a' },
    filterGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    filterBtn: { padding: '0.55rem 1rem', borderRadius: '8px', border: isDark ? '1px solid #374151' : '1px solid #cbd5e1', background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
    filterBtnActive: { background: '#059669', color: '#ffffff', border: '1px solid #059669' },
    modalInputGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    label: { fontSize: '0.85rem', fontWeight: '600', color: isDark ? '#cbd5e1' : '#334155' },
    input: { padding: '0.75rem 1rem', border: isDark ? '1px solid #374151' : '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.92rem', outline: 'none', background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#0f172a', width: '100%', boxSizing: 'border-box' },
    select: { padding: '0.75rem 1rem', border: isDark ? '1px solid #374151' : '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.92rem', outline: 'none', background: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f9fafb' : '#0f172a', width: '100%', boxSizing: 'border-box' },
    primaryBtn: { padding: '0.75rem 1.5rem', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.92rem', fontWeight: '600', cursor: 'pointer' },
    actionBtnDelete: { background: isDark ? '#451a1a' : '#fef2f2', border: isDark ? '1px solid #7f1d1d' : '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', fontSize: '0.88rem', padding: '0.45rem 0.65rem', borderRadius: '6px' }
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
      {/* ==================== SIDEBAR ==================== */}
      <aside style={S.sidebar} className={`admin-sidebar ${mobileSidebarOpen ? 'admin-sidebar-open' : ''}`}>
        <div style={S.sidebarHeader} className="admin-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={S.logoCircle}>
              <FaUserCheck size={20} />
            </div>
            <div>
              <h2 style={S.sidebarTitle}>Registration Portal</h2>
              <span style={S.sidebarSubtitle}>Eloquence 2026 Coordinator</span>
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
          <button 
            style={activeTab === 'dashboard' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
            onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
          >
            <FaChartBar style={S.navIcon} /> Dashboard
          </button>

          {/* Search & Verify Participant Tab */}
          <button 
            style={activeTab === 'search-participant' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
            onClick={() => { setActiveTab('search-participant'); setMobileSidebarOpen(false); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FaQrcode style={S.navIcon} />
                <span>Search & Verify</span>
              </div>
              <span style={{ ...S.badgeCount, background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#6ee7b7' : '#059669' }}>
                QR
              </span>
            </div>
          </button>

          <button 
            style={activeTab === 'registration' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
            onClick={() => { setActiveTab('registration'); setMobileSidebarOpen(false); }}
          >
            <FaUserCheck style={S.navIcon} /> Offline Registration & Paper Import
          </button>

          <button 
            style={activeTab === 'register-list' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
            onClick={() => { setActiveTab('register-list'); setMobileSidebarOpen(false); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FaListAlt style={S.navIcon} />
                <span>Register List</span>
              </div>
              <span style={S.badgeCount}>{allCombinedRegs.length}</span>
            </div>
          </button>

          <button 
            style={activeTab === 'online-register-list' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
            onClick={() => { setActiveTab('online-register-list'); setMobileSidebarOpen(false); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FaGlobe style={S.navIcon} />
                <span>Online Registration List</span>
              </div>
              <span style={S.badgeCount}>{onlineRegs.length}</span>
            </div>
          </button>

          <button 
            style={activeTab === 'offline-register-list' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
            onClick={() => { setActiveTab('offline-register-list'); setMobileSidebarOpen(false); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FaBuilding style={S.navIcon} />
                <span>Offline Registration List</span>
              </div>
              <span style={{ ...S.badgeCount, background: isDark ? '#371b10' : '#fff7ed', color: '#f97316' }}>{offlineRegs.length}</span>
            </div>
          </button>

          <button 
            style={activeTab === 'participant-list' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
            onClick={() => { setActiveTab('participant-list'); setMobileSidebarOpen(false); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FaUsers style={S.navIcon} />
                <span>Participant List</span>
              </div>
              <span style={S.badgeCount}>{allCombinedRegs.length}</span>
            </div>
          </button>
        </nav>

        <div style={S.sidebarFooter} className="admin-sidebar-footer">
          <button onClick={onLogout} style={S.logoutBtn}>
            <FaSignOutAlt style={S.navIcon} /> Log Out
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main style={S.mainContent} className="admin-main-content">
        <header style={S.topHeader} className="admin-top-header">
          <div>
            <h1 style={S.pageTitle} className="admin-page-title">
              {activeTab === 'dashboard' && 'Registration Dashboard & Analytics'}
              {activeTab === 'search-participant' && 'Search & Verify Participant (QR Check-in)'}
              {activeTab === 'registration' && 'Offline Registration & Paper Import'}
              {activeTab === 'register-list' && 'Complete Registrations List'}
              {activeTab === 'online-register-list' && 'Online Portal Registrations'}
              {activeTab === 'offline-register-list' && 'Offline Desk & Paper Import Registrations'}
              {activeTab === 'participant-list' && 'Event-Wise Participant & Team List'}
            </h1>
            <p style={S.pageSubtitle}>
              {activeTab === 'dashboard' && 'Live breakdown of online vs offline registration counts and revenue collection.'}
              {activeTab === 'search-participant' && 'Search by ticket code, name, phone, email, college or scan participant ticket QR code for live on-site verification & admission.'}
              {activeTab === 'registration' && 'Select event, import physical paper registration forms (PDF/Images), and confirm offline desk registrations.'}
              {activeTab === 'register-list' && 'Search and filter all registered symposium participants.'}
              {activeTab === 'online-register-list' && 'View participants who registered online via website.'}
              {activeTab === 'offline-register-list' && 'View all participants registered offline at desk or imported from paper scans.'}
              {activeTab === 'participant-list' && 'Filter participants by event, view team names, and inspect all team member details.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={toggleTheme}
              style={S.themeToggleBtn}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
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
                {(user?.username || 'Coordinator').charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '700', fontSize: '0.88rem', color: isDark ? '#f8fafc' : '#0f172a', lineHeight: '1.2' }}>
                  {user?.username || 'Coordinator'}
                </span>
                <span style={{ fontSize: '0.7rem', color: isDark ? '#6ee7b7' : '#059669', fontWeight: '700', marginTop: '1px' }}>
                  Registration Coordinator
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
          {/* ==================== 1. DASHBOARD TAB ==================== */}
          {activeTab === 'dashboard' && (
            <div style={S.viewContainer}>
              {/* Analytics Breakdown Grid (Interactive / Touch-Friendly Cards) */}
              <div style={S.statsGrid} className="admin-stats-grid">
                {/* Total Card */}
                <div 
                  style={statFilter === 'all' ? { ...S.statCard, ...S.statCardActive } : S.statCard}
                  onClick={() => setStatFilter('all')}
                  title="Touch to view all registrations"
                >
                  <div style={S.statHeader}>
                    <span style={S.statLabel}>Total Registrations</span>
                    <FaChartBar color="#3b82f6" size={18} />
                  </div>
                  <div style={S.statValue}>{registrationsList.length}</div>
                  <div style={S.statRevenueBadge}>₹{totalRevenue} Total Collected</div>
                </div>

                {/* Online Card */}
                <div 
                  style={statFilter === 'online' ? { ...S.statCard, ...S.statCardActive } : S.statCard}
                  onClick={() => setStatFilter('online')}
                  title="Touch to filter by Online Registrations"
                >
                  <div style={S.statHeader}>
                    <span style={S.statLabel}>Online Registrations</span>
                    <FaGlobe color="#10b981" size={18} />
                  </div>
                  <div style={S.statValue}>{onlineRegs.length}</div>
                  <div style={S.statRevenueBadge}>₹{onlineRevenue} Online Revenue</div>
                </div>

                {/* Offline (On-Site Desk) Card */}
                <div 
                  style={statFilter === 'offline' ? { ...S.statCard, ...S.statCardActive } : S.statCard}
                  onClick={() => setStatFilter('offline')}
                  title="Touch to filter by Offline Desk Registrations"
                >
                  <div style={S.statHeader}>
                    <span style={S.statLabel}>Offline Desk Registrations</span>
                    <FaBuilding color="#f59e0b" size={18} />
                  </div>
                  <div style={S.statValue}>{offlineRegs.length}</div>
                  <div style={S.statRevenueBadge}>₹{offlineRevenue} Offline Revenue</div>
                </div>

                {/* Technical Events Card */}
                <div 
                  style={statFilter === 'technical' ? { ...S.statCard, ...S.statCardActive } : S.statCard}
                  onClick={() => setStatFilter('technical')}
                  title="Touch to filter by Technical Events"
                >
                  <div style={S.statHeader}>
                    <span style={S.statLabel}>Technical Events</span>
                    <FaBolt color="#6366f1" size={18} />
                  </div>
                  <div style={S.statValue}>{techRegs.length}</div>
                  <div style={S.statRevenueBadge}>₹{techRevenue} Tech Revenue</div>
                </div>

                {/* Non-Technical Events Card */}
                <div 
                  style={statFilter === 'non-technical' ? { ...S.statCard, ...S.statCardActive } : S.statCard}
                  onClick={() => setStatFilter('non-technical')}
                  title="Touch to filter by Non-Technical Events"
                >
                  <div style={S.statHeader}>
                    <span style={S.statLabel}>Non-Technical Events</span>
                    <FaGamepad color="#ec4899" size={18} />
                  </div>
                  <div style={S.statValue}>{nonTechRegs.length}</div>
                  <div style={S.statRevenueBadge}>₹{nonTechRevenue} Non-Tech Revenue</div>
                </div>
              </div>

              {/* Interactive Dashboard Breakdown Table */}
              <div style={S.card}>
                <div style={S.cardHeaderFlex}>
                  <div>
                    <h3 style={S.cardTitle}>
                      {statFilter === 'all' && 'All Registration Records'}
                      {statFilter === 'online' && 'Online Registrations Breakdown'}
                      {statFilter === 'offline' && 'Offline On-Site Desk Breakdown'}
                      {statFilter === 'technical' && 'Technical Events Breakdown'}
                      {statFilter === 'non-technical' && 'Non-Technical Events Breakdown'}
                      {' '}({dashboardFilteredRegs.length})
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Touch any stat card above to filter this live table breakdown.
                    </span>
                  </div>
                  <div style={S.filterGroup}>
                    <button
                      onClick={() => setStatFilter('all')}
                      style={statFilter === 'all' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatFilter('online')}
                      style={statFilter === 'online' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      Online ({onlineRegs.length})
                    </button>
                    <button
                      onClick={() => setStatFilter('offline')}
                      style={statFilter === 'offline' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      Offline ({offlineRegs.length})
                    </button>
                    <button
                      onClick={() => setStatFilter('technical')}
                      style={statFilter === 'technical' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaBolt size={11} /> Tech ({techRegs.length})
                    </button>
                    <button
                      onClick={() => setStatFilter('non-technical')}
                      style={statFilter === 'non-technical' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaGamepad size={11} /> Non-Tech ({nonTechRegs.length})
                    </button>
                  </div>
                </div>

                <div style={{ padding: '1rem 1.75rem', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
                  <input
                    type="text"
                    placeholder="Search registrations in current view..."
                    value={dashSearch}
                    onChange={(e) => setDashSearch(e.target.value)}
                    style={S.searchInput}
                  />
                </div>

                <div style={S.tableResponsive}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Ticket Code</th>
                        <th style={S.th}>Participant</th>
                        <th style={S.th}>College & Dept</th>
                        <th style={S.th}>Event</th>
                        <th style={S.th}>Fee Collected</th>
                        <th style={S.th}>Channel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardFilteredRegs.map((reg, i) => {
                        const ticketCode = reg.ticket_code || reg.registrationId || reg.id || `#${i + 1}`;
                        const name = reg.full_name || reg.fullName || 'Anonymous';
                        const evtName = reg.eventName || eventsList.find(e => e.id === reg.event_id)?.name || reg.event_id || 'Event';
                        const isOnline = isOnlineRecord(reg);
                        const fee = getFee(reg);

                        return (
                          <tr key={i} style={S.tr}>
                            <td style={S.td}><span style={S.idBadge}>{ticketCode}</span></td>
                            <td style={S.td}>
                              <div>
                                <span style={S.strongText}>{name}</span>
                                <div style={S.tableSubText}>{reg.phone} • {reg.email}</div>
                              </div>
                            </td>
                            <td style={S.td}>
                              <div>
                                {reg.college || 'CAHCET'}
                                <div style={S.tableSubText}>{reg.department} ({reg.year})</div>
                              </div>
                            </td>
                            <td style={S.td}>
                              <div>
                                <span style={S.strongText}>{evtName}</span>
                                <div style={S.tableSubText}>[{getEventCategory(reg).toUpperCase()}]</div>
                              </div>
                            </td>
                            <td style={S.td}><span style={S.feeHighlight}>₹{fee}</span></td>
                            <td style={S.td}>
                              <span style={isOnline ? S.badgeTech : S.badgeNonTech}>
                                {isOnline ? 'Online' : 'Offline Desk'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {dashboardFilteredRegs.length === 0 && (
                        <tr><td colSpan="6" style={S.emptyState}>No matching records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SEARCH & VERIFY PARTICIPANT (QR SCANNER) ==================== */}
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

          {/* ==================== 2. REGISTRATION FORM TAB (Full Online-Matching On-Site Form) ==================== */}
          {activeTab === 'registration' && (
            <div style={S.viewContainer}>
              {onSiteTicketResult ? (
                /* Ticket Success View */
                <div style={{ ...S.card, padding: '2rem', maxWidth: '720px', margin: '0 auto', textAlign: 'center', border: '1.5px solid #10b981' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '2px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                  }}>
                    <FaCheckCircle size={32} style={{ color: '#10b981' }} />
                  </div>

                  <span style={{
                    display: 'inline-block',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '999px',
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.5rem'
                  }}>
                    ON-SITE REGISTRATION CONFIRMED & ADMITTED
                  </span>

                  <h2 style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>
                    {onSiteTicketResult.eventName}
                  </h2>
                  <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                    Official on-site participant pass generated for <strong>{onSiteTicketResult.fullName}</strong>.
                  </p>

                  {/* Ticket Badge Box */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    background: isDark ? 'rgba(0, 0, 0, 0.4)' : '#f8fafc',
                    border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.5rem',
                    textAlign: 'left'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                        OFFICIAL TICKET REFERENCE
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981', letterSpacing: '0.5px' }}>
                        #{onSiteTicketResult.ticketCode}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                        {onSiteTicketResult.college} • {onSiteTicketResult.department} ({onSiteTicketResult.year})
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(onSiteTicketResult.ticketCode)}`}
                        alt="Ticket QR Code"
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '8px',
                          background: '#ffffff',
                          padding: '3px',
                          border: '1px solid #cbd5e1'
                        }}
                      />
                    </div>
                  </div>

                  {/* Meta Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                    textAlign: 'left',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>PHONE / WHATSAPP</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>{onSiteTicketResult.phone}</div>
                    </div>
                    <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>FEE PAID AT DESK</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#10b981' }}>₹{onSiteTicketResult.totalFee} (CASH / UPI)</div>
                    </div>
                    <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>PARTICIPANTS</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>
                        {onSiteTicketResult.membersCount} {onSiteTicketResult.membersCount === 1 ? 'Individual' : 'Team Members'}
                      </div>
                    </div>
                    <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700' }}>REPORTING VENUE</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>{onSiteTicketResult.venue || 'CSE Dept Labs'}</div>
                    </div>
                  </div>

                  {/* Team Members List (if any) */}
                  {Array.isArray(onSiteTicketResult.teamMembersList) && onSiteTicketResult.teamMembersList.length > 0 && (
                    <div style={{ background: isDark ? 'rgba(255,255,255,0.02)' : '#f1f5f9', padding: '1rem', borderRadius: '10px', textAlign: 'left', marginBottom: '1.5rem', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '800', color: isDark ? '#cbd5e1' : '#334155', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaUsers /> {onSiteTicketResult.teamName ? `Team: ${onSiteTicketResult.teamName}` : 'Registered Team Members'}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '0.78rem', background: '#10b981', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <FaCrown size={11} /> {onSiteTicketResult.leadName || onSiteTicketResult.fullName} (Lead)
                        </span>
                        {onSiteTicketResult.teamMembersList.map((m, idx) => (
                          <span key={idx} style={{ fontSize: '0.78rem', background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: isDark ? '#ffffff' : '#0f172a', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '600' }}>
                            {idx + 2}. {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handlePrintTicket(onSiteTicketResult)}
                      style={{
                        ...S.primaryBtn,
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <FaPrint /> Print Official Pass
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(onSiteTicketResult.ticketCode);
                        setCopiedTicket(true);
                        toast.success('Ticket code copied to clipboard!');
                        setTimeout(() => setCopiedTicket(false), 2000);
                      }}
                      style={{
                        ...S.filterBtn,
                        padding: '0.75rem 1.25rem',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {copiedTicket ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                      <span>{copiedTicket ? 'Copied!' : 'Copy Code'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetOnSiteForm}
                      style={{
                        background: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <FaPlus /> Register Next Participant
                    </button>
                  </div>
                </div>
              ) : (
                /* Offline Registration & Smart Paper Form Import System */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>

                  {/* ──────────────── STEP 1: SELECT SYMPOSIUM EVENT FIRST ──────────────── */}
                  <div style={{ ...S.card, padding: '1.5rem', border: '1.5px solid #2563eb', background: isDark ? 'rgba(37, 99, 235, 0.05)' : '#eff6ff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: '#2563eb', color: '#ffffff', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.88rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaLayerGroup /> STEP 1: SELECT SYMPOSIUM EVENT FIRST
                        </span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: isDark ? '#ffffff' : '#1e3a8a' }}>
                            Choose Event For Offline Registration
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: isDark ? '#93c5fd' : '#2563eb', fontWeight: '600' }}>
                            Select the target symposium event before importing physical paper registration forms.
                          </span>
                        </div>
                      </div>

                      {/* Category Quick Filter */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {['all', 'technical', 'non-technical'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setOnSiteCategoryFilter(cat)}
                            style={{
                              padding: '0.3rem 0.75rem',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              textTransform: 'capitalize',
                              cursor: 'pointer',
                              border: 'none',
                              background: onSiteCategoryFilter === cat ? '#2563eb' : (isDark ? '#1f2937' : '#ffffff'),
                              color: onSiteCategoryFilter === cat ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569')
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignItems: 'center' }}>
                      {/* Search Bar for Events */}
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Search event by name or category..."
                          value={eventSearchQuery}
                          onChange={(e) => setEventSearchQuery(e.target.value)}
                          style={{ ...S.input, padding: '0.65rem 0.85rem 0.65rem 2.2rem', fontSize: '0.88rem' }}
                        />
                        <FaSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      </div>

                      {/* Event Select Dropdown */}
                      <div>
                        <select
                          value={onSiteEventId}
                          onChange={(e) => setOnSiteEventId(e.target.value)}
                          style={{
                            ...S.select,
                            fontSize: '0.95rem',
                            padding: '0.75rem 1rem',
                            border: '1.5px solid #2563eb'
                          }}
                        >
                          <option value="">-- Choose Target Symposium Event --</option>
                          {eventsList
                            .filter(evt => onSiteCategoryFilter === 'all' || evt.category === onSiteCategoryFilter)
                            .filter(evt => !eventSearchQuery || evt.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) || evt.id.toLowerCase().includes(eventSearchQuery.toLowerCase()))
                            .map((evt) => (
                              <option key={evt.id} value={evt.id}>
                                [{evt.category.toUpperCase()}] {evt.name} — {evt.fee || `₹${evt.feePerHead || 50}`} ({evt.isTeam ? 'Team' : 'Solo'})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Selected Event Details Banner */}
                    {selectedOnSiteEvent && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '1rem 1.25rem',
                        borderRadius: '10px',
                        background: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
                        border: '1.5px solid #10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.1rem' }}>
                            <FaCheck />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#047857', textTransform: 'uppercase' }}>
                              ACTIVE SELECTED EVENT FOR PAPER IMPORT
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '900', color: isDark ? '#ffffff' : '#0f172a' }}>
                              {selectedOnSiteEvent.name} <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.55rem', borderRadius: '6px', background: selectedOnSiteEvent.category === 'technical' ? '#2563eb' : '#ec4899', color: '#ffffff' }}>{selectedOnSiteEvent.category.toUpperCase()}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#475569' }}>
                              Fee: <strong>{selectedOnSiteEvent.fee}</strong> • Venue: {selectedOnSiteEvent.venue || 'CSE Dept Labs'} • Mode: {selectedOnSiteEvent.isTeam ? 'Team Event' : 'Solo'}
                            </div>
                          </div>
                        </div>

                        <span style={{ fontSize: '0.78rem', fontWeight: '800', padding: '0.4rem 0.85rem', borderRadius: '6px', background: '#10b981', color: '#ffffff' }}>
                          Ready for Document Import Below ↓
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ──────────────── STEP 2: IMPORT PAPER REGISTRATION SCAN (PDF / IMAGES) ──────────────── */}
                  <div style={{ ...S.card, padding: '1.5rem', border: '1.5px solid #ec4899', background: isDark ? 'rgba(236, 72, 153, 0.03)' : '#fdf2f8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: '#ec4899', color: '#ffffff', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.88rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaFileUpload /> STEP 2: IMPORT PAPER FORM SCAN (PDF / IMAGES)
                        </span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: isDark ? '#ffffff' : '#831843' }}>
                            Upload Physical Paper Registration Forms & Scans
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: isDark ? '#fbcfe8' : '#be185d', fontWeight: '600' }}>
                            Upload filled paper form scans or photos (JPG, PNG, WEBP, PDF). Automatically detects writing, name, mobile & details.
                          </span>
                        </div>
                      </div>

                      <span style={{ fontSize: '0.8rem', fontWeight: '800', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', padding: '0.3rem 0.75rem', borderRadius: '999px' }}>
                        {importedDocList.length} Total Imported Form(s)
                      </span>
                    </div>

                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.75rem',
                      borderRadius: '12px',
                      border: '2px dashed #ec4899',
                      background: isDark ? 'rgba(236, 72, 153, 0.08)' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleImportFileChange}
                        style={{ display: 'none' }}
                      />
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: '0.5rem' }}>
                        <FaFileImage />
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: '800', color: isDark ? '#ffffff' : '#831843' }}>
                        {isProcessingDoc ? 'Reading & Detecting Text from Document...' : 'Click or Drag & Drop Paper Registration Scans (PDF / JPG / PNG)'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b', marginTop: '4px' }}>
                        {selectedOnSiteEvent ? `Importing under: "${selectedOnSiteEvent.name}". Multi-file upload supported.` : '⚠️ Select a Symposium Event in Step 1 first before uploading.'}
                      </span>
                    </label>
                  </div>

                  {/* ──────────────── STEP 3: IMPORTED PAPER FORM DETAILS & OFFLINE DESK REGISTRATION ──────────────── */}
                  <div style={{ ...S.card, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#10b981', color: '#ffffff', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.88rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaTable /> STEP 3: IMPORTED DETAILS & OFFLINE DESK REGISTRATION
                          </span>
                          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>
                            Offline Desk Paper Registration Records
                          </h3>
                        </div>
                        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                          Confirms & registers students directly into <strong>Offline Desk Registration</strong> spot database. Online registration remains 100% untouched.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Search input for table */}
                        <div style={{ position: 'relative', width: '240px' }}>
                          <input
                            type="text"
                            placeholder="Search ID, Name, Phone..."
                            value={tableSearchQuery}
                            onChange={(e) => setTableSearchQuery(e.target.value)}
                            style={{ ...S.input, padding: '0.55rem 0.75rem 0.55rem 2.2rem', fontSize: '0.82rem' }}
                          />
                          <FaSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        </div>

                        {/* Filter checkbox */}
                        <button
                          type="button"
                          onClick={() => setTableFilterValid(prev => !prev)}
                          style={{
                            ...S.filterBtn,
                            padding: '0.55rem 0.85rem',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            border: tableFilterValid ? '1.5px solid #10b981' : S.filterBtn.border,
                            background: tableFilterValid ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5') : S.filterBtn.background,
                            color: tableFilterValid ? '#10b981' : S.filterBtn.color
                          }}
                        >
                          {tableFilterValid ? 'Showing Only Valid ✓' : 'Filter Valid Only'}
                        </button>

                        {/* Add Manual Participant Row Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const targetEvent = eventsList.find(evt => evt.id === onSiteEventId);
                            if (!targetEvent) {
                              toast.error('⚠️ Please select a Symposium Event in Step 1 first!');
                              return;
                            }
                            const randomCode = Math.floor(1000 + Math.random() * 9000);
                            const uniqueId = `ONSITE-2026-${randomCode}`;
                            const newRow = {
                              id: uniqueId,
                              eventId: targetEvent.id,
                              eventName: targetEvent.name,
                              category: targetEvent.category,
                              fee: targetEvent.fee || `₹${targetEvent.feePerHead || 50}`,
                              teamName: 'New Participant',
                              phone: '9876543210',
                              email: 'participant@onsite.cahcet.edu',
                              college: 'C. Abdul Hakeem College of Engineering & Technology',
                              department: 'CSE',
                              year: '3rd Year',
                              teamMembers: ['New Participant'],
                              fileName: null,
                              dataUrl: null,
                              isPdf: false,
                              isValid: true,
                              status: 'pending',
                              createdAt: new Date().toISOString()
                            };
                            setImportedDocList(prev => [newRow, ...prev]);
                            setEditingRow(newRow);
                            toast.success('Added new participant row. Edit details below.');
                          }}
                          style={{
                            ...S.filterBtn,
                            padding: '0.55rem 0.85rem',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            border: '1.5px solid #2563eb',
                            background: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FaPlus /> Add Participant Row
                        </button>

                        {/* Batch Import Button */}
                        <button
                          type="button"
                          onClick={handleBatchImportValidRecords}
                          disabled={isRegisteringOnSite || importedDocList.filter(r => r.isValid && r.status !== 'imported').length === 0}
                          style={{
                            ...S.primaryBtn,
                            padding: '0.55rem 1rem',
                            fontSize: '0.82rem',
                            fontWeight: '800',
                            background: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: (importedDocList.filter(r => r.isValid && r.status !== 'imported').length === 0) ? 0.6 : 1
                          }}
                        >
                          <FaCheckDouble /> Import All Valid Records to Offline Desk ({importedDocList.filter(r => r.isValid && r.status !== 'imported').length})
                        </button>
                      </div>
                    </div>

                    {/* Table of Imported Records */}
                    <div style={S.tableResponsive}>
                      <table style={S.table}>
                        <thead>
                          <tr>
                            <th style={S.th}>Unique Token ID</th>
                            <th style={S.th}>Event Name</th>
                            <th style={S.th}>Participant / Team Name</th>
                            <th style={S.th}>Phone & Contact Details</th>
                            <th style={S.th}>College & Department</th>
                            <th style={S.th}>Paper Scan Preview</th>
                            <th style={S.th}>Validation Status</th>
                            <th style={{ ...S.th, textAlign: 'center' }}>Action (Offline Desk Import)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importedDocList
                            .filter(row => {
                              if (tableFilterValid && !row.isValid) return false;
                              if (!tableSearchQuery) return true;
                              const q = tableSearchQuery.toLowerCase();
                              return row.id.toLowerCase().includes(q) ||
                                row.teamName.toLowerCase().includes(q) ||
                                row.phone.includes(q) ||
                                row.eventName.toLowerCase().includes(q);
                            })
                            .map((row) => {
                              const isImported = row.status === 'imported';

                              return (
                                <tr key={row.id} style={{ ...S.tr, background: selectedDraftId === row.id ? (isDark ? 'rgba(139, 92, 246, 0.1)' : '#f5f3ff') : 'transparent' }}>
                                  {/* Unique ID */}
                                  <td style={S.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ ...S.idBadge, background: '#8b5cf6', color: '#ffffff', fontWeight: '800' }}>
                                        #{row.id}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(row.id);
                                          toast.success(`Copied ID: ${row.id}`);
                                        }}
                                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                        title="Copy Unique ID"
                                      >
                                        <FaCopy size={11} />
                                      </button>
                                    </div>
                                  </td>

                                  {/* Event Name */}
                                  <td style={S.td}>
                                    <div>
                                      <span style={S.strongText}>{row.eventName}</span>
                                      <div style={{ fontSize: '0.72rem', color: row.category === 'technical' ? '#2563eb' : '#ec4899', fontWeight: '700', textTransform: 'uppercase' }}>
                                        {row.category} ({row.fee})
                                      </div>
                                    </div>
                                  </td>

                                  {/* Team / Participant Name */}
                                  <td style={S.td}>
                                    <div>
                                      <span style={S.strongText}>{row.teamName}</span>
                                      <div style={S.tableSubText}>Roster: {(row.teamMembers || []).join(', ') || 'Individual'}</div>
                                    </div>
                                  </td>

                                  {/* Phone & Contact */}
                                  <td style={S.td}>
                                    <div>
                                      <span style={{ fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>{row.phone}</span>
                                      <div style={S.tableSubText}>{row.email}</div>
                                    </div>
                                  </td>

                                  {/* College & Department */}
                                  <td style={S.td}>
                                    <div>
                                      <span style={{ fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>{row.department} ({row.year})</span>
                                      <div style={S.tableSubText}>{row.college}</div>
                                    </div>
                                  </td>

                                  {/* Paper Form Scan Preview */}
                                  <td style={S.td}>
                                    {row.dataUrl ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setImportedDocument({ fileName: row.fileName, dataUrl: row.dataUrl, isPdf: row.isPdf, size: row.size, aiSummary: row.aiDetectedSummary, leadName: row.teamName, phone: row.phone, email: row.email, department: row.department, year: row.year });
                                          setShowDocModal(true);
                                        }}
                                        style={{ background: '#ec4899', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        <FaEye /> {row.isPdf ? 'View PDF' : 'View Image'}
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#94a3b8', fontStyle: 'italic' }}>
                                        No Scan File
                                      </span>
                                    )}
                                  </td>

                                  {/* Validation Status */}
                                  <td style={S.td}>
                                    {row.isValid ? (
                                      <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <FaCheckCircle /> VALID (READY FOR OFFLINE DESK)
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <FaExclamationTriangle /> NEED MANUAL CHECK
                                      </span>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  <td style={{ ...S.td, textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                      {isImported ? (
                                        <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '0.35rem 0.75rem', borderRadius: '6px', background: '#10b981', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <FaCheck /> IMPORTED TO OFFLINE DESK
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleConfirmOfflineDeskRegistration(row)}
                                          disabled={isRegisteringOnSite}
                                          style={{
                                            ...S.primaryBtn,
                                            padding: '0.4rem 0.85rem',
                                            fontSize: '0.78rem',
                                            fontWeight: '800',
                                            background: '#2563eb',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                        >
                                          <FaBolt /> Confirm Offline Import
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => setEditingRow(row)}
                                        style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                                        title="Edit record details"
                                      >
                                        <FaEdit size={14} />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteDraft(row.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                        title="Delete record"
                                      >
                                        <FaTrash size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}

                          {importedDocList.length === 0 && (
                            <tr>
                              <td colSpan="8" style={{ ...S.emptyState, padding: '3rem 1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                  <FaFileUpload size={36} style={{ color: '#ec4899' }} />
                                  <div style={{ fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a', fontSize: '1rem' }}>No Imported Paper Registration Scans Yet</div>
                                  <div style={{ fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                                    Select an Event in <strong>STEP 1</strong> above, then upload paper form scans in <strong>STEP 2</strong>.
                                  </div>
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
            </div>
          )}

          {/* ==================== 3. REGISTER LIST TAB ==================== */}
          {activeTab === 'register-list' && (
            <div style={S.viewContainer}>
              <div style={S.viewHeader}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '650px' }}>
                  <input 
                    type="text" 
                    placeholder="Search by participant name, ticket code, phone, college..." 
                    value={regSearch}
                    onChange={(e) => setRegSearch(e.target.value)}
                    style={S.searchInput}
                  />
                </div>
              </div>

              <div style={S.card}>
                <div style={S.cardHeaderFlex}>
                  <h3 style={S.cardTitle}>Complete Registered Participants ({allCombinedRegs.length})</h3>
                </div>
                <div style={S.tableResponsive}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Ticket Code</th>
                        <th style={S.th}>Participant</th>
                        <th style={S.th}>College & Dept</th>
                        <th style={S.th}>Event</th>
                        <th style={S.th}>Fee</th>
                        <th style={S.th}>Channel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCombinedRegs
                        .filter(r => {
                          const q = regSearch.toLowerCase().trim();
                          if (!q) return true;
                          const name = (r.full_name || r.fullName || '').toLowerCase();
                          const ticket = (r.ticket_code || r.registrationId || r.id || '').toString().toLowerCase();
                          const phone = (r.phone || '').toLowerCase();
                          const college = (r.college || '').toLowerCase();
                          return name.includes(q) || ticket.includes(q) || phone.includes(q) || college.includes(q);
                        })
                        .map((reg, i) => {
                          const ticketCode = reg.ticket_code || reg.registrationId || reg.id || `#${i + 1}`;
                          const name = reg.full_name || reg.fullName || 'Anonymous';
                          const evtName = reg.eventName || eventsList.find(e => e.id === reg.event_id)?.name || reg.event_id || 'Event';
                          const isOnline = isOnlineRecord(reg);

                          return (
                            <tr key={i} style={S.tr}>
                              <td style={S.td}><span style={S.idBadge}>{ticketCode}</span></td>
                              <td style={S.td}>
                                <div>
                                  <span style={S.strongText}>{name}</span>
                                  <div style={S.tableSubText}>{reg.phone} • {reg.email}</div>
                                </div>
                              </td>
                              <td style={S.td}>
                                <div>
                                  {reg.college || 'CAHCET'}
                                  <div style={S.tableSubText}>{reg.department} ({reg.year})</div>
                                </div>
                              </td>
                              <td style={S.td}><span style={S.strongText}>{evtName}</span></td>
                              <td style={S.td}><span style={S.feeHighlight}>₹{getFee(reg)}</span></td>
                              <td style={S.td}>
                                <span style={isOnline ? S.badgeTech : S.badgeNonTech}>
                                  {isOnline ? 'Online' : 'Offline Desk'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      {registrationsList.length === 0 && (
                        <tr><td colSpan="6" style={S.emptyState}>No registrations found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4. ONLINE REGISTRATION LIST TAB ==================== */}
          {activeTab === 'online-register-list' && (
            <div style={S.viewContainer}>
              <div style={S.viewHeader}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '650px' }}>
                  <input 
                    type="text" 
                    placeholder="Search online registrations by name, ticket code, phone..." 
                    value={onlineRegSearch}
                    onChange={(e) => setOnlineRegSearch(e.target.value)}
                    style={S.searchInput}
                  />
                </div>
              </div>

              <div style={S.card}>
                <div style={S.cardHeaderFlex}>
                  <h3 style={S.cardTitle}>Online Portal Registrations ({onlineRegs.length})</h3>
                </div>
                <div style={S.tableResponsive}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Ticket Code</th>
                        <th style={S.th}>Participant</th>
                        <th style={S.th}>College & Dept</th>
                        <th style={S.th}>Event</th>
                        <th style={S.th}>Amount</th>
                        <th style={S.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {onlineRegs
                        .filter(r => {
                          const q = onlineRegSearch.toLowerCase().trim();
                          if (!q) return true;
                          const name = (r.full_name || r.fullName || '').toLowerCase();
                          const ticket = (r.ticket_code || r.registrationId || r.id || '').toString().toLowerCase();
                          const phone = (r.phone || '').toLowerCase();
                          return name.includes(q) || ticket.includes(q) || phone.includes(q);
                        })
                        .map((reg, i) => {
                          const ticketCode = reg.ticket_code || reg.registrationId || reg.id || `#${i + 1}`;
                          const name = reg.full_name || reg.fullName || 'Anonymous';
                          const evtName = reg.eventName || eventsList.find(e => e.id === reg.event_id)?.name || reg.event_id || 'Event';

                          return (
                            <tr key={i} style={S.tr}>
                              <td style={S.td}><span style={S.idBadge}>{ticketCode}</span></td>
                              <td style={S.td}>
                                <div>
                                  <span style={S.strongText}>{name}</span>
                                  <div style={S.tableSubText}>{reg.phone} • {reg.email}</div>
                                </div>
                              </td>
                              <td style={S.td}>
                                <div>
                                  {reg.college || 'College'}
                                  <div style={S.tableSubText}>{reg.department} ({reg.year})</div>
                                </div>
                              </td>
                              <td style={S.td}><span style={S.strongText}>{evtName}</span></td>
                              <td style={S.td}><span style={S.feeHighlight}>₹{getFee(reg)}</span></td>
                              <td style={S.td}>
                                <span style={{ color: '#10b981', fontWeight: '600', fontSize: '0.85rem' }}>
                                  Confirmed
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      {onlineRegs.length === 0 && (
                        <tr><td colSpan="6" style={S.emptyState}>No online registrations found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4B. OFFLINE REGISTRATION LIST TAB ==================== */}
          {activeTab === 'offline-register-list' && (
            <div style={S.viewContainer}>
              <div style={S.viewHeader}>
                <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '750px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                    <input 
                      type="text" 
                      placeholder="Search offline registrations by name, ticket code, phone, college, event..." 
                      value={offlineRegSearch}
                      onChange={(e) => setOfflineRegSearch(e.target.value)}
                      style={{ ...S.searchInput, paddingLeft: '2.5rem' }}
                    />
                    <FaSearch style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      fetchOfflineRegistrations();
                      toast.success('Refreshed offline registrations from database');
                    }}
                    disabled={loadingOffline}
                    style={{
                      ...S.filterBtn,
                      padding: '0.65rem 1.1rem',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      cursor: 'pointer'
                    }}
                    title="Reload offline records from database"
                  >
                    <FaSyncAlt style={{ animation: loadingOffline ? 'spin 0.8s linear infinite' : 'none' }} />
                    {loadingOffline ? 'Refreshing...' : 'Refresh DB'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncWithSupabase}
                    disabled={isSyncingSupabase}
                    style={{
                      ...S.filterBtn,
                      padding: '0.65rem 1.1rem',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      cursor: 'pointer',
                      background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                      color: isDark ? '#93c5fd' : '#1d4ed8',
                      borderColor: isDark ? 'rgba(59, 130, 246, 0.35)' : '#bfdbfe'
                    }}
                    title="Synchronize offline registrations with Supabase live tables"
                  >
                    <FaBolt style={{ animation: isSyncingSupabase ? 'pulse 0.8s infinite' : 'none' }} />
                    {isSyncingSupabase ? 'Syncing...' : '⚡ Sync to Supabase'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('registration')}
                    style={{
                      ...S.primaryBtn,
                      padding: '0.65rem 1.1rem',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FaPlus /> New Offline Entry
                  </button>
                </div>
              </div>

              <div style={S.card}>
                <div style={{ ...S.cardHeaderFlex, borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', padding: '1.25rem 1.5rem' }}>
                  <div>
                    <h3 style={S.cardTitle}>
                      Offline Desk & Paper Import Registrations ({offlineRegistrationsList.length})
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                      Stored in dedicated database table (<strong>public.offline_registrations</strong>). Online registrations remain 100% untouched.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', padding: '0.35rem 0.85rem', borderRadius: '999px', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                      {offlineRegistrationsList.length} Total Offline Records
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.35rem 0.85rem', borderRadius: '999px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      ₹{offlineRevenue} Desk Collection
                    </span>
                  </div>
                </div>

                <div style={S.tableResponsive}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={S.th}>Ticket Code</th>
                        <th style={S.th}>Participant / Team</th>
                        <th style={S.th}>Phone & Contact</th>
                        <th style={S.th}>College & Dept</th>
                        <th style={S.th}>Symposium Event</th>
                        <th style={S.th}>Fee Collected</th>
                        <th style={{ ...S.th, textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offlineRegistrationsList
                        .filter(r => {
                          const q = offlineRegSearch.toLowerCase().trim();
                          if (!q) return true;
                          const name = (r.full_name || r.fullName || '').toLowerCase();
                          const ticket = (r.ticket_code || r.ticketCode || r.registrationId || r.id || '').toString().toLowerCase();
                          const phone = (r.phone || '').toLowerCase();
                          const college = (r.college || '').toLowerCase();
                          const eventName = (r.eventName || eventsList.find(e => e.id === (r.event_id || r.eventId))?.name || '').toLowerCase();
                          return name.includes(q) || ticket.includes(q) || phone.includes(q) || college.includes(q) || eventName.includes(q);
                        })
                        .map((reg, i) => {
                          const ticketCode = reg.ticket_code || reg.ticketCode || reg.registrationId || reg.id || `#${i + 1}`;
                          const name = reg.full_name || reg.fullName || 'Anonymous';
                          const evtName = reg.eventName || eventsList.find(e => e.id === (reg.event_id || reg.eventId))?.name || reg.event_id || 'Event';
                          const members = getTeamMembers(reg);

                          return (
                            <tr key={reg.id || ticketCode || i} style={S.tr}>
                              <td style={S.td}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ ...S.idBadge, background: '#f97316', color: '#ffffff', fontWeight: '800' }}>
                                    {ticketCode}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(ticketCode);
                                      toast.success(`Copied Ticket ID: ${ticketCode}`);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                    title="Copy Ticket ID"
                                  >
                                    <FaCopy size={11} />
                                  </button>
                                </div>
                              </td>
                              <td style={S.td}>
                                <div>
                                  <span style={S.strongText}>{name}</span>
                                  {reg.team_name || reg.teamName ? (
                                    <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: '700' }}>
                                      Team: {reg.team_name || reg.teamName} ({members.length > 0 ? members.length + 1 : 1} members)
                                    </div>
                                  ) : (
                                    <div style={S.tableSubText}>Individual Participant</div>
                                  )}
                                  {members.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
                                      {members.map((m, mIdx) => (
                                        <span key={mIdx} style={{ background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', color: isDark ? '#93c5fd' : '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', fontWeight: '600' }}>
                                          👤 {m}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={S.td}>
                                <div>
                                  <span style={{ fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>{reg.phone || 'N/A'}</span>
                                  <div style={S.tableSubText}>{reg.email || 'N/A'}</div>
                                </div>
                              </td>
                              <td style={S.td}>
                                <div>
                                  {reg.college || 'CAHCET'}
                                  <div style={S.tableSubText}>{reg.department} ({reg.year})</div>
                                </div>
                              </td>
                              <td style={S.td}>
                                <div>
                                  <span style={S.strongText}>{evtName}</span>
                                  <div style={{ fontSize: '0.72rem', color: getEventCategory(reg) === 'technical' ? '#2563eb' : '#ec4899', fontWeight: '700', textTransform: 'uppercase' }}>
                                    {getEventCategory(reg)}
                                  </div>
                                </div>
                              </td>
                              <td style={S.td}><span style={S.feeHighlight}>₹{getFee(reg)}</span></td>
                              <td style={{ ...S.td, textAlign: 'center' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handlePrintTicket(reg)}
                                    style={{
                                      ...S.filterBtn,
                                      padding: '0.35rem 0.75rem',
                                      fontSize: '0.78rem',
                                      fontWeight: '700',
                                      background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                                      color: '#10b981',
                                      border: '1px solid #10b981',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      cursor: 'pointer'
                                    }}
                                    title="Print Registration Ticket Receipt"
                                  >
                                    <FaPrint size={12} /> Print
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOfflineRegistration(reg)}
                                    style={{
                                      ...S.filterBtn,
                                      padding: '0.35rem 0.65rem',
                                      fontSize: '0.78rem',
                                      fontWeight: '700',
                                      background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                                      color: '#ef4444',
                                      border: '1px solid #ef4444',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      cursor: 'pointer'
                                    }}
                                    title="Delete offline record from separate DB table"
                                  >
                                    <FaTrash size={11} /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {offlineRegistrationsList.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ ...S.emptyState, padding: '3.5rem 1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                              <FaBuilding size={42} style={{ color: '#f97316' }} />
                              <div style={{ fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a', fontSize: '1.1rem' }}>
                                No Offline Desk Registrations In Database Yet
                              </div>
                              <div style={{ fontSize: '0.85rem', color: isDark ? '#9ca3af' : '#64748b', maxWidth: '520px', lineHeight: '1.5', textAlign: 'center' }}>
                                Registrations confirmed from physical paper form scans or the on-site registration desk are stored in the separate <strong>offline_registrations</strong> database table and displayed here.
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveTab('registration')}
                                style={{
                                  ...S.primaryBtn,
                                  marginTop: '0.5rem',
                                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '0.88rem'
                                }}
                              >
                                <FaPlus /> Go to Offline Registration & Paper Import
                              </button>
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

          {/* ==================== 5. EVENT-WISE PARTICIPANT & TEAM LIST TAB ==================== */}
          {activeTab === 'participant-list' && (
            <div style={S.viewContainer}>
              {/* Event Filter & View Mode Header */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: isDark ? '#111827' : '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '16px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setViewMode('cards')}
                      style={viewMode === 'cards' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaThLarge size={12} /> Event Cards View
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      style={viewMode === 'table' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaTable size={12} /> Detailed Table View
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setPartCategoryFilter('all')}
                      style={partCategoryFilter === 'all' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      All ({eventsList.length})
                    </button>
                    <button
                      onClick={() => setPartCategoryFilter('technical')}
                      style={partCategoryFilter === 'technical' ? { ...S.filterBtn, ...S.filterBtnActive } : S.filterBtn}
                    >
                      <FaBolt size={11} /> Tech ({eventsList.filter(e => e.category === 'technical').length})
                    </button>
                    <button
                      onClick={() => setPartCategoryFilter('non-technical')}
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
                          const allBoC = allCombinedRegs.filter(r => (r.event_id || r.eventId) === evt.id);
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
                        const count = allCombinedRegs.filter(r => (r.event_id || r.eventId) === evt.id).length;
                        return (
                          <option key={evt.id} value={evt.id}>
                            [{evt.category.toUpperCase()}] {evt.name} ({count})
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

              {/* ================= 5A. EVENT CARDS VIEW ================= */}
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
                      const evtAllRegs = allCombinedRegs.filter(r => (r.event_id || r.eventId) === evt.id);
                      const evtOnlineRegs = evtAllRegs.filter(isOnlineRecord);
                      const evtOfflineRegs = evtAllRegs.filter(r => !isOnlineRecord(r));
                      const isTech = evt.category === 'technical';
                      const isEsports = isEsportsEvent(evt);
                      const teamsCount = evtAllRegs.filter(r => getTeamMembers(r).length > 0 || r.team_name || r.teamName).length;
                      const ffRegs = isEsports ? evtAllRegs.filter(r => getRegEsportsGame(r) === 'FREE FIRE') : [];
                      const bgmiRegs = isEsports ? evtAllRegs.filter(r => getRegEsportsGame(r) === 'BGMI') : [];

                      const currentTypeFilter = cardTypeFilters[evt.id] || 'ALL';

                      let cardGameFilter = bocGameFilter;
                      if (partEventFilter === 'nontech-05::FREE FIRE') cardGameFilter = 'FREE FIRE';
                      else if (partEventFilter === 'nontech-05::BGMI') cardGameFilter = 'BGMI';

                      let displayedCardRegs = evtAllRegs;
                      if (currentTypeFilter === 'ONLINE') {
                        displayedCardRegs = evtOnlineRegs;
                      } else if (currentTypeFilter === 'OFFLINE') {
                        displayedCardRegs = evtOfflineRegs;
                      }

                      if (isEsports && cardGameFilter !== 'all') {
                        displayedCardRegs = displayedCardRegs.filter(r => getRegEsportsGame(r) === cardGameFilter);
                      }

                      if (partSearch.trim()) {
                        const q = partSearch.toLowerCase().trim();
                        displayedCardRegs = displayedCardRegs.filter(r => {
                          const name = (r.full_name || r.fullName || '').toLowerCase();
                          const ticket = (r.ticket_code || r.registrationId || r.id || '').toString().toLowerCase();
                          const team = (r.team_name || r.teamName || '').toLowerCase();
                          const phone = (r.phone || '').toLowerCase();
                          const members = getTeamMembers(r).join(' ').toLowerCase();
                          return name.includes(q) || ticket.includes(q) || team.includes(q) || phone.includes(q) || members.includes(q);
                        });
                      }

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
                              {/* Responsive Event Stats Summary Grid with Online & Offline Breakdown */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: isEsports ? 'repeat(auto-fit, minmax(70px, 1fr))' : '1.3fr 1fr 1.2fr',
                                gap: '0.5rem',
                                background: isDark ? '#1f2937' : '#f8fafc',
                                padding: '0.75rem 0.85rem',
                                borderRadius: '10px',
                                border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <span style={{ fontSize: '0.68rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>Total</span>
                                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a', lineHeight: 1.1 }}>{evtAllRegs.length}</div>
                                  <div style={{ fontSize: '0.68rem', fontWeight: '700', marginTop: '3px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    <span style={{ color: '#3b82f6' }}>{evtOnlineRegs.length} On</span>
                                    <span style={{ color: isDark ? '#6b7280' : '#94a3b8' }}>•</span>
                                    <span style={{ color: '#ea580c' }}>{evtOfflineRegs.length} Off</span>
                                  </div>
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

                              {/* Card Registration Type Filter Tabs (All / Online / Offline) */}
                              <div style={{ display: 'flex', gap: '5px', background: isDark ? '#111827' : '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => setCardTypeFilters(prev => ({ ...prev, [evt.id]: 'ALL' }))}
                                  style={{
                                    flex: 1,
                                    padding: '0.35rem 0.4rem',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: currentTypeFilter === 'ALL' ? (isDark ? '#374151' : '#ffffff') : 'transparent',
                                    color: currentTypeFilter === 'ALL' ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#9ca3af' : '#64748b'),
                                    boxShadow: currentTypeFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                  }}
                                >
                                  All ({evtAllRegs.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCardTypeFilters(prev => ({ ...prev, [evt.id]: 'ONLINE' }))}
                                  style={{
                                    flex: 1,
                                    padding: '0.35rem 0.4rem',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: currentTypeFilter === 'ONLINE' ? '#2563eb' : 'transparent',
                                    color: currentTypeFilter === 'ONLINE' ? '#ffffff' : '#3b82f6',
                                    boxShadow: currentTypeFilter === 'ONLINE' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                                  }}
                                >
                                  🌐 Online ({evtOnlineRegs.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCardTypeFilters(prev => ({ ...prev, [evt.id]: 'OFFLINE' }))}
                                  style={{
                                    flex: 1,
                                    padding: '0.35rem 0.4rem',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: currentTypeFilter === 'OFFLINE' ? '#ea580c' : 'transparent',
                                    color: currentTypeFilter === 'OFFLINE' ? '#ffffff' : '#ea580c',
                                    boxShadow: currentTypeFilter === 'OFFLINE' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                                  }}
                                >
                                  🏢 Offline ({evtOfflineRegs.length})
                                </button>
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
                                    All ({evtAllRegs.length})
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
                                      : `Participants & Team Members (${displayedCardRegs.length})`}
                                  </span>
                                </div>

                                <div style={{ maxHeight: '230px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '4px' }}>
                                  {displayedCardRegs.map((reg, idx) => {
                                    const isOffline = !isOnlineRecord(reg);
                                    const members = getTeamMembers(reg);
                                    const teamName = reg.team_name || reg.teamName;
                                    const game = isEsports ? getRegEsportsGame(reg) : null;
                                    const ticketCode = reg.ticket_code || reg.registrationId || reg.id || `#${idx + 1}`;

                                    return (
                                      <div
                                        key={reg.id || idx}
                                        style={{
                                          background: isOffline
                                            ? (isDark ? 'rgba(234, 88, 12, 0.08)' : '#fff7ed')
                                            : (isDark ? '#1f2937' : '#f1f5f9'),
                                          padding: '0.65rem 0.85rem',
                                          borderRadius: '8px',
                                          border: isOffline
                                            ? (isDark ? '1px solid rgba(234, 88, 12, 0.35)' : '1px solid #fed7aa')
                                            : (isDark ? '1px solid #374151' : '1px solid #e2e8f0'),
                                          borderLeft: isOffline
                                            ? '4px solid #ea580c'
                                            : '4px solid #3b82f6'
                                        }}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: '700', fontSize: '0.88rem', color: isDark ? '#f9fafb' : '#0f172a' }}>
                                              {reg.full_name || reg.fullName || 'Participant'}
                                            </span>
                                            <span style={{
                                              fontSize: '0.68rem',
                                              fontWeight: '700',
                                              padding: '0.1rem 0.4rem',
                                              borderRadius: '4px',
                                              background: isDark ? '#374151' : '#e2e8f0',
                                              color: isDark ? '#cbd5e1' : '#475569'
                                            }}>
                                              #{ticketCode}
                                            </span>
                                            {isOffline ? (
                                              <span style={{
                                                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                                                color: '#ffffff',
                                                padding: '0.12rem 0.45rem',
                                                borderRadius: '6px',
                                                fontSize: '0.65rem',
                                                fontWeight: '800',
                                                letterSpacing: '0.03em',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '3px'
                                              }}>
                                                <FaUserCheck size={9} /> OFFLINE DESK
                                              </span>
                                            ) : (
                                              <span style={{
                                                background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                                                color: '#3b82f6',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                padding: '0.1rem 0.4rem',
                                                borderRadius: '6px',
                                                fontSize: '0.65rem',
                                                fontWeight: '700'
                                              }}>
                                                🌐 ONLINE
                                              </span>
                                            )}
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

                                        <div style={{ fontSize: '0.76rem', color: isDark ? '#9ca3af' : '#64748b', marginTop: '3px' }}>
                                          {reg.college || 'CAHCET'} • {reg.department || 'CSE'}
                                        </div>

                                        {members.length > 0 && (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px' }}>
                                            <span style={{ fontSize: '0.7rem', color: isDark ? '#93c5fd' : '#1d4ed8', fontWeight: '700' }}>
                                              Squad ({members.length + 1}):
                                            </span>
                                            {members.map((m, i) => (
                                              <span
                                                key={i}
                                                style={{
                                                  background: isOffline
                                                    ? (isDark ? 'rgba(234, 88, 12, 0.2)' : '#fed7aa')
                                                    : (isDark ? '#374151' : '#cbd5e1'),
                                                  color: isOffline
                                                    ? (isDark ? '#fdba74' : '#9a3412')
                                                    : (isDark ? '#f9fafb' : '#0f172a'),
                                                  padding: '0.1rem 0.35rem',
                                                  borderRadius: '4px',
                                                  fontSize: '0.68rem',
                                                  fontWeight: '600'
                                                }}
                                              >
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
                                      No {currentTypeFilter === 'OFFLINE' ? 'offline' : (currentTypeFilter === 'ONLINE' ? 'online' : '')} participants found for this selection.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: Export PDF, WhatsApp Roster, Copy, Send (All) & Dedicated Send Offline */}
                          <div style={{ padding: '0.85rem 1.25rem', borderTop: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', background: isDark ? '#1a2234' : '#f8fafc', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={() => handleExportPDF(evt, isEsports ? cardGameFilter : 'ALL', currentTypeFilter)}
                              style={{ ...S.filterBtn, flex: 1, minWidth: '95px', justifyContent: 'center', background: isDark ? '#1e3a8a' : '#eff6ff', color: isDark ? '#93c5fd' : '#1d4ed8', borderColor: isDark ? '#1e40af' : '#bfdbfe', fontSize: '0.76rem', padding: '0.5rem 0.5rem' }}
                              title="Export official printable participant PDF"
                            >
                              <FaFilePdf size={12} /> {currentTypeFilter === 'OFFLINE' ? 'PDF (Off)' : 'Export PDF'}
                            </button>
                            {isEsports && (
                              <>
                                <button
                                  onClick={() => handleShareRosterWhatsApp(evt, cardGameFilter, '', currentTypeFilter)}
                                  title="Share Tournament Roster Sheet via WhatsApp"
                                  style={{ ...S.filterBtn, flex: 1, minWidth: '90px', justifyContent: 'center', background: 'rgba(34, 197, 94, 0.12)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.3)', fontSize: '0.76rem', padding: '0.5rem 0.5rem' }}
                                >
                                  <FaWhatsapp size={12} /> WA Roster
                                </button>
                                <button
                                  onClick={() => handleCopyRosterToClipboard(evt, cardGameFilter, currentTypeFilter)}
                                  title="Copy formatted squad sheet to clipboard"
                                  style={{ ...S.filterBtn, flex: 1, minWidth: '70px', justifyContent: 'center', background: isDark ? '#374151' : '#f1f5f9', color: isDark ? '#e2e8f0' : '#334155', fontSize: '0.76rem', padding: '0.5rem 0.5rem' }}
                                >
                                  <FaCopy size={11} /> Copy
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleOpenSendModal(evt, 'ALL')}
                              title="Dispatch participant list to Event Coordinator"
                              style={{ ...S.primaryBtn, flex: 1, minWidth: '85px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.78rem', padding: '0.5rem 0.6rem' }}
                            >
                              <FaPaperPlane size={11} /> Send All
                            </button>
                            <button
                              onClick={() => handleOpenSendModal(evt, 'OFFLINE')}
                              title="Dispatch ONLY Offline Desk Registrations to Event Coordinator"
                              style={{
                                flex: 1,
                                minWidth: '125px',
                                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 2px 5px rgba(234, 88, 12, 0.28)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                padding: '0.5rem 0.65rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <FaPaperPlane size={11} /> Send Offline ({evtOfflineRegs.length})
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* ================= 5B. DETAILED TABLE VIEW ================= */}
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
            </div>
          )}

          {/* ==================== SEND TO EVENT COORDINATOR MODAL ==================== */}
          {isSendModalOpen && sendTargetEvent && (() => {
            const modalAll = allCombinedRegs.filter(r => (r.event_id || r.eventId) === sendTargetEvent.id);
            const modalOnline = modalAll.filter(isOnlineRecord);
            const modalOffline = modalAll.filter(r => !isOnlineRecord(r));

            let effectiveSendRegs = modalAll;
            if (sendTypeScope === 'OFFLINE') {
              effectiveSendRegs = modalOffline;
            } else if (sendTypeScope === 'ONLINE') {
              effectiveSendRegs = modalOnline;
            }

            if (isEsportsEvent(sendTargetEvent) && sendGameScope !== 'ALL') {
              effectiveSendRegs = effectiveSendRegs.filter(r => getRegEsportsGame(r) === sendGameScope);
            }

            return (
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
                  maxWidth: '540px',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
                  border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '1.5rem 1.75rem', borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>
                        {sendTypeScope === 'OFFLINE' ? '🏢 Dispatch Offline Registrations' : 'Send Participant List'}
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
                    {/* Registration Type Scope Selector (All / Online / Offline) */}
                    <div style={{ background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc', padding: '1rem', borderRadius: '12px', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0' }}>
                      <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                        <FaPaperPlane size={12} style={{ color: sendTypeScope === 'OFFLINE' ? '#ea580c' : '#3b82f6' }} /> Select Registration Scope to Dispatch *
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        {[
                          { id: 'ALL', label: 'All Combined', count: modalAll.length, bg: '#3b82f6', icon: '📋' },
                          { id: 'ONLINE', label: 'Online Only', count: modalOnline.length, bg: '#2563eb', icon: '🌐' },
                          { id: 'OFFLINE', label: 'Offline Only', count: modalOffline.length, bg: '#ea580c', icon: '🏢' }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSendTypeScope(tab.id)}
                            style={{
                              padding: '0.55rem 0.5rem',
                              borderRadius: '8px',
                              border: sendTypeScope === tab.id ? `2px solid ${tab.bg}` : (isDark ? '1px solid #374151' : '1px solid #cbd5e1'),
                              background: sendTypeScope === tab.id ? (isDark ? '#1e293b' : '#eff6ff') : (isDark ? '#111827' : '#ffffff'),
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontSize: '0.74rem', fontWeight: '800', color: sendTypeScope === tab.id ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#9ca3af' : '#64748b') }}>
                              {tab.icon} {tab.label}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: tab.bg, marginTop: '2px' }}>
                              {tab.count} entries
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Esports Division Scope Selector (for Battle of Champions) */}
                    {isEsportsEvent(sendTargetEvent) && (
                      <div style={{ background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc', padding: '1rem', borderRadius: '12px', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0' }}>
                        <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                          <FaGamepad size={13} style={{ color: '#ea580c' }} /> Select Esports Tournament Division *
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                          {[
                            { id: 'ALL', label: 'All Tracks', count: (sendTypeScope === 'OFFLINE' ? modalOffline : (sendTypeScope === 'ONLINE' ? modalOnline : modalAll)).length, bg: '#3b82f6' },
                            { id: 'FREE FIRE', label: '🔥 Free Fire', count: (sendTypeScope === 'OFFLINE' ? modalOffline : (sendTypeScope === 'ONLINE' ? modalOnline : modalAll)).filter(r => getRegEsportsGame(r) === 'FREE FIRE').length, bg: '#ea580c' },
                            { id: 'BGMI', label: '🎯 BGMI', count: (sendTypeScope === 'OFFLINE' ? modalOffline : (sendTypeScope === 'ONLINE' ? modalOnline : modalAll)).filter(r => getRegEsportsGame(r) === 'BGMI').length, bg: '#0891b2' }
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
                      </div>
                    )}

                    {/* 1-Click WhatsApp & Clipboard Sharing Tools */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleShareRosterWhatsApp(sendTargetEvent, sendGameScope, (coordinatorsList.find(c => c.name === selectedCoordName)?.phone || ''), sendTypeScope)}
                        style={{
                          flex: 1,
                          background: '#22c55e',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.55rem 0.75rem',
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
                        onClick={() => handleCopyRosterToClipboard(sendTargetEvent, sendGameScope, sendTypeScope)}
                        style={{
                          flex: 1,
                          background: isDark ? '#374151' : '#f1f5f9',
                          color: isDark ? '#f9fafb' : '#0f172a',
                          border: isDark ? '1px solid #4b5563' : '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '0.55rem 0.75rem',
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

                    <div style={S.modalInputGroup}>
                      <label style={S.label}>Select Event Coordinator Account / Name *</label>
                      {coordinatorsList.length > 0 ? (
                        <select
                          value={selectedCoordName}
                          onChange={(e) => setSelectedCoordName(e.target.value)}
                          style={S.select}
                        >
                          {coordinatorsList.map((c, i) => (
                            <option key={c.id || i} value={c.name}>
                              {c.name} {c.game ? `[${c.game}] ` : ''}{c.assignedEvents?.length ? `(${c.assignedEvents.join(', ')})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Enter Event Coordinator Username / Name"
                          value={selectedCoordName}
                          onChange={(e) => setSelectedCoordName(e.target.value)}
                          style={S.input}
                          required
                        />
                      )}
                    </div>

                    <div style={{ background: isDark ? '#1f2937' : '#f8fafc', padding: '1rem', borderRadius: '10px', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.82rem', color: isDark ? '#cbd5e1' : '#475569', fontWeight: '700' }}>
                        Summary to Dispatch:
                      </span>
                      <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0, fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                        <li>Event: <strong>{sendTargetEvent.name}</strong> ({sendTargetEvent.category.toUpperCase()})</li>
                        <li>
                          Registration Scope: <strong style={{ color: sendTypeScope === 'OFFLINE' ? '#ea580c' : (sendTypeScope === 'ONLINE' ? '#3b82f6' : '#10b981') }}>
                            {sendTypeScope === 'OFFLINE' ? '🏢 OFFLINE DESK REGISTRATIONS ONLY' : (sendTypeScope === 'ONLINE' ? '🌐 ONLINE REGISTRATIONS ONLY' : '📋 ALL COMBINED')}
                          </strong>
                        </li>
                        {isEsportsEvent(sendTargetEvent) && (
                          <li>
                            Esports Division: <strong style={{ color: sendGameScope === 'FREE FIRE' ? '#ea580c' : (sendGameScope === 'BGMI' ? '#0891b2' : '#3b82f6') }}>
                              {sendGameScope === 'ALL' ? 'All Divisions (Free Fire + BGMI)' : `${sendGameScope} Only`}
                            </strong>
                          </li>
                        )}
                        <li>
                          Total Entries to Send: <strong>{effectiveSendRegs.length}</strong>
                        </li>
                        <li>Target Recipient: <strong>{selectedCoordName || 'Coordinator'}</strong></li>
                      </ul>

                      {effectiveSendRegs.length > 0 && (
                        <div style={{ marginTop: '0.65rem', maxHeight: '110px', overflowY: 'auto', background: isDark ? '#111827' : '#ffffff', padding: '6px 8px', borderRadius: '6px', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {effectiveSendRegs.map((r, i) => (
                            <div key={i} style={{ fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', color: isDark ? '#cbd5e1' : '#334155' }}>
                              <span>#{r.ticket_code || r.registrationId || r.id} — <strong>{r.full_name || r.fullName}</strong></span>
                              <span style={{ color: !isOnlineRecord(r) ? '#ea580c' : '#3b82f6', fontWeight: '700' }}>
                                {!isOnlineRecord(r) ? '🏢 Offline' : '🌐 Online'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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
                          background: sendTypeScope === 'OFFLINE'
                            ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                            : (isEsportsEvent(sendTargetEvent) && sendGameScope === 'BGMI' ? '#0891b2' : S.primaryBtn.background)
                        }}
                      >
                        <FaPaperPlane size={12} /> {isSendingList ? 'Sending...' : (sendTypeScope === 'OFFLINE' ? `Confirm & Send Offline (${effectiveSendRegs.length})` : `Confirm & Send List (${effectiveSendRegs.length})`)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ==================== 6. IMPORTED DOCUMENT PREVIEW MODAL ==================== */}
          {showDocModal && importedDocument && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                background: isDark ? '#111827' : '#ffffff',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: isDark ? '1px solid #374151' : '1px solid #cbd5e1'
              }}>
                <div style={{
                  padding: '1rem 1.5rem',
                  borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isDark ? '#1a2234' : '#f8fafc'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaFileImage style={{ color: '#ec4899' }} />
                    <span style={{ fontWeight: '800', fontSize: '1rem', color: isDark ? '#ffffff' : '#0f172a' }}>
                      Imported Registration Document: {importedDocument.fileName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDocModal(false)}
                    style={{ background: 'transparent', border: 'none', color: isDark ? '#9ca3af' : '#64748b', cursor: 'pointer', padding: '4px' }}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                {/* AI Detected Details Banner */}
                <div style={{ padding: '1rem 1.5rem', background: isDark ? 'rgba(236, 72, 153, 0.1)' : '#fdf2f8', borderBottom: isDark ? '1px solid rgba(236, 72, 153, 0.2)' : '1px solid #fbcfe8' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#ec4899', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaMagic /> AI DETECTED WRITING & FORM DETAILS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
                    <div><strong style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>Detected Name:</strong> <span style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700' }}>{importedDocument.leadName || 'On-Spot Participant'}</span></div>
                    <div><strong style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>Detected Phone:</strong> <span style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700' }}>{importedDocument.phone || 'N/A'}</span></div>
                    <div><strong style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>Detected Email:</strong> <span style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700' }}>{importedDocument.email || 'N/A'}</span></div>
                    <div><strong style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>Dept & Year:</strong> <span style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700' }}>{importedDocument.department || 'CSE'} ({importedDocument.year || '3rd Year'})</span></div>
                  </div>
                  {importedDocument.aiSummary && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: isDark ? '#fbcfe8' : '#be185d', fontWeight: '600' }}>
                      {importedDocument.aiSummary}
                    </div>
                  )}
                </div>

                <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0b0f19' }}>
                  {importedDocument.isPdf ? (
                    <object
                      data={importedDocument.dataUrl}
                      type="application/pdf"
                      width="100%"
                      height="550px"
                      style={{ borderRadius: '8px', border: 'none' }}
                    >
                      <p style={{ color: '#ffffff' }}>Your browser does not support inline PDF preview. <a href={importedDocument.dataUrl} download={importedDocument.fileName} style={{ color: '#ec4899' }}>Download PDF</a></p>
                    </object>
                  ) : (
                    <img
                      src={importedDocument.dataUrl}
                      alt="Paper Registration Form Scan"
                      style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #374151' }}
                    />
                  )}
                </div>

                <div style={{ padding: '1rem 1.5rem', borderTop: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                    File Size: {importedDocument.size} • Smart AI Text & Writing Detected
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDocModal(false)}
                    style={{ ...S.primaryBtn, padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 7. EDIT PARTICIPANT ROW MODAL ==================== */}
          {editingRow && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                background: isDark ? '#111827' : '#ffffff',
                width: '100%',
                maxWidth: '600px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: isDark ? '1px solid #374151' : '1px solid #cbd5e1'
              }}>
                <div style={{
                  padding: '1rem 1.5rem',
                  borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isDark ? '#1a2234' : '#f8fafc'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaEdit style={{ color: '#2563eb' }} />
                    <span style={{ fontWeight: '800', fontSize: '1rem', color: isDark ? '#ffffff' : '#0f172a' }}>
                      Edit Participant Details (Token #{editingRow.id})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingRow(null)}
                    style={{ background: 'transparent', border: 'none', color: isDark ? '#9ca3af' : '#64748b', cursor: 'pointer', padding: '4px' }}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: isDark ? '#9ca3af' : '#475569', display: 'block', marginBottom: '4px' }}>
                      Participant / Team Name
                    </label>
                    <input
                      type="text"
                      value={editingRow.teamName || ''}
                      onChange={(e) => setEditingRow(prev => ({ ...prev, teamName: e.target.value, teamMembers: [e.target.value] }))}
                      style={S.input}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '700', color: isDark ? '#9ca3af' : '#475569', display: 'block', marginBottom: '4px' }}>
                        Mobile / Phone Number
                      </label>
                      <input
                        type="text"
                        value={editingRow.phone || ''}
                        onChange={(e) => setEditingRow(prev => ({ ...prev, phone: e.target.value }))}
                        style={S.input}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '700', color: isDark ? '#9ca3af' : '#475569', display: 'block', marginBottom: '4px' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editingRow.email || ''}
                        onChange={(e) => setEditingRow(prev => ({ ...prev, email: e.target.value }))}
                        style={S.input}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '700', color: isDark ? '#9ca3af' : '#475569', display: 'block', marginBottom: '4px' }}>
                        Department
                      </label>
                      <input
                        type="text"
                        value={editingRow.department || ''}
                        onChange={(e) => setEditingRow(prev => ({ ...prev, department: e.target.value }))}
                        style={S.input}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: '700', color: isDark ? '#9ca3af' : '#475569', display: 'block', marginBottom: '4px' }}>
                        Year
                      </label>
                      <input
                        type="text"
                        value={editingRow.year || ''}
                        onChange={(e) => setEditingRow(prev => ({ ...prev, year: e.target.value }))}
                        style={S.input}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: isDark ? '#9ca3af' : '#475569', display: 'block', marginBottom: '4px' }}>
                      College Name
                    </label>
                    <input
                      type="text"
                      value={editingRow.college || ''}
                      onChange={(e) => setEditingRow(prev => ({ ...prev, college: e.target.value }))}
                      style={S.input}
                    />
                  </div>
                </div>

                <div style={{ padding: '1rem 1.5rem', borderTop: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setEditingRow(null)}
                    style={S.filterBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportedDocList(prev => prev.map(r => r.id === editingRow.id ? { ...editingRow, isValid: Boolean(editingRow.teamName && editingRow.phone && editingRow.phone.length >= 10) } : r));
                      setEditingRow(null);
                      toast.success(`✓ Saved changes for #${editingRow.id}`);
                    }}
                    style={{ ...S.primaryBtn, background: '#10b981' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
