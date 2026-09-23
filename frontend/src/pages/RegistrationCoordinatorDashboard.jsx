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
  FaCrosshairs
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
  const [coordinatorsList, setCoordinatorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statFilter, setStatFilter] = useState('all'); // 'all' | 'online' | 'offline' | 'technical' | 'non-technical'

  // Search & Filter States
  const [dashSearch, setDashSearch] = useState('');
  const [regSearch, setRegSearch] = useState('');
  const [onlineRegSearch, setOnlineRegSearch] = useState('');
  const [partEventFilter, setPartEventFilter] = useState('all');
  const [partCategoryFilter, setPartCategoryFilter] = useState('all');
  const [partSearch, setPartSearch] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Send Modal States
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendTargetEvent, setSendTargetEvent] = useState(null);
  const [selectedCoordName, setSelectedCoordName] = useState('');
  const [isSendingList, setIsSendingList] = useState(false);

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

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
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

  // PDF Export Sheet Handler
  const handleExportPDF = (targetEvt) => {
    const evtRegs = registrationsList.filter(r => (r.event_id || r.eventId) === targetEvt.id);
    const win = window.open('', '_blank');
    if (!win) return toast.error('Please allow popups to export PDF');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${targetEvt.name} - Official Participant Sheet</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; color: #1e293b; line-height: 1.5; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #2563eb; padding-bottom: 12px; }
          .header h1 { margin: 0; color: #1e3a8a; font-size: 24px; text-transform: uppercase; letter-spacing: 0.5px; }
          .header p { margin: 6px 0 0 0; color: #64748b; font-size: 14px; font-weight: 600; }
          .info-bar { display: flex; justify-content: space-between; background: #f8fafc; padding: 10px 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 9px 12px; text-align: left; vertical-align: top; }
          th { background: #1e293b; color: #ffffff; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { display: inline-block; background: #059669; color: #ffffff; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: bold; }
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
          <div><strong>EVENT:</strong> ${targetEvt.name} (${targetEvt.category.toUpperCase()})</div>
          <div><strong>TOTAL REGISTRATIONS:</strong> ${evtRegs.length}</div>
          <div><strong>DATE:</strong> ${new Date().toLocaleDateString()}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th style="width: 100px;">Ticket Code</th>
              <th style="width: 110px;">Team Name</th>
              <th>Lead Participant</th>
              <th>Phone & Email</th>
              <th>Team Members</th>
              <th>College & Dept</th>
            </tr>
          </thead>
          <tbody>
            ${evtRegs.map((r, i) => {
              const members = getTeamMembers(r);
              return `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${r.ticket_code || r.registrationId || r.id || '-'}</strong></td>
                  <td>${r.team_name || r.teamName ? `<span class="badge">${r.team_name || r.teamName}</span>` : 'Individual'}</td>
                  <td><strong>${r.full_name || r.fullName || 'Anonymous'}</strong></td>
                  <td>${r.phone || '-'}<br/><span style="color:#64748b;font-size:11px;">${r.email || '-'}</span></td>
                  <td>
                    ${members.length > 0 ? `<strong>${members.length + 1} Members:</strong><div class="members-box">1. ${r.full_name || r.fullName} (Lead)<br/>${members.map((m, idx) => `${idx + 2}. ${m}`).join('<br/>')}</div>` : 'Individual Entry'}
                  </td>
                  <td>${r.college || 'CAHCET'}<br/><span style="color:#64748b;font-size:11px;">${r.department || ''} (${r.year || ''})</span></td>
                </tr>
              `;
            }).join('')}
            ${evtRegs.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:20px;">No registered participants for this event.</td></tr>' : ''}
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

  // Open Send Modal
  const handleOpenSendModal = (evt) => {
    setSendTargetEvent(evt);
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

    setIsSendingList(true);
    const toastId = toast.loading(`Dispatching list for "${sendTargetEvent.name}"...`);

    fetch(getApiUrl('/api/send-participant-list'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: sendTargetEvent.id,
        eventName: sendTargetEvent.name,
        coordinatorName: selectedCoordName.trim()
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
        teamMembersDetails: (onSiteFields.teamMembers || []).filter(m => m.fullName && m.fullName.trim().length > 0)
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
          ticketCode: `ELQ26-${selectedOnSiteEvent.category === 'technical' ? 'TCH' : 'NT'}-${Math.floor(10000 + Math.random() * 90000)}`,
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

        toast.success(`Registration completed! Ticket #${ticket.ticketCode}`, { id: toastId, duration: 6000 });
        setOnSiteTicketResult(ticket);
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
  };

  // Helper Analytics Calculations
  const isOnlineRecord = (r) => (r.payment_method || r.paymentMethod) !== 'ON_SITE_DESK';
  const getEventCategory = (r) => {
    const evt = eventsList.find(e => e.id === (r.event_id || r.eventId));
    if (evt) return evt.category;
    const id = (r.event_id || r.eventId || '').toLowerCase();
    return id.startsWith('tech') ? 'technical' : 'non-technical';
  };

  const getFee = (r) => Number(r.total_fee || r.totalAmount || r.total_amount || 0);

  const onlineRegs = registrationsList.filter(isOnlineRecord);
  const offlineRegs = registrationsList.filter(r => !isOnlineRecord(r));
  const techRegs = registrationsList.filter(r => getEventCategory(r) === 'technical');
  const nonTechRegs = registrationsList.filter(r => getEventCategory(r) === 'non-technical');

  const totalRevenue = registrationsList.reduce((sum, r) => sum + getFee(r), 0);
  const onlineRevenue = onlineRegs.reduce((sum, r) => sum + getFee(r), 0);
  const offlineRevenue = offlineRegs.reduce((sum, r) => sum + getFee(r), 0);
  const techRevenue = techRegs.reduce((sum, r) => sum + getFee(r), 0);
  const nonTechRevenue = nonTechRegs.reduce((sum, r) => sum + getFee(r), 0);

  const getTeamMembers = (r) => {
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

  // Filtered registrations for Dashboard breakdown table
  const dashboardFilteredRegs = registrationsList.filter(r => {
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
  const participantFilteredRegs = registrationsList.filter(r => {
    if (partEventFilter !== 'all' && (r.event_id || r.eventId) !== partEventFilter) return false;
    if (partCategoryFilter !== 'all' && getEventCategory(r) !== partCategoryFilter) return false;

    const q = partSearch.toLowerCase().trim();
    if (!q) return true;
    const name = (r.full_name || r.fullName || '').toLowerCase();
    const teamName = (r.team_name || r.teamName || '').toLowerCase();
    const ticket = (r.ticket_code || r.registrationId || r.id || '').toString().toLowerCase();
    const phone = (r.phone || '').toLowerCase();
    const college = (r.college || '').toLowerCase();
    const members = getTeamMembers(r).join(' ').toLowerCase();

    return name.includes(q) || teamName.includes(q) || ticket.includes(q) || phone.includes(q) || college.includes(q) || members.includes(q);
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
            <FaUserCheck style={S.navIcon} /> Registration
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
              <span style={S.badgeCount}>{registrationsList.length}</span>
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
            style={activeTab === 'participant-list' ? { ...S.navItem, ...S.navItemActive } : S.navItem} 
            onClick={() => { setActiveTab('participant-list'); setMobileSidebarOpen(false); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <FaUsers style={S.navIcon} />
                <span>Participant List</span>
              </div>
              <span style={S.badgeCount}>{registrationsList.length}</span>
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
              {activeTab === 'registration' && 'On-Site Desk Registration'}
              {activeTab === 'register-list' && 'Complete Registrations List'}
              {activeTab === 'online-register-list' && 'Online Portal Registrations'}
              {activeTab === 'participant-list' && 'Event-Wise Participant & Team List'}
            </h1>
            <p style={S.pageSubtitle}>
              {activeTab === 'dashboard' && 'Live breakdown of online vs offline registration counts and revenue collection.'}
              {activeTab === 'search-participant' && 'Search by ticket code, name, phone, email, college or scan participant ticket QR code for live on-site verification & admission.'}
              {activeTab === 'registration' && 'Register participants on-the-spot and generate ticket codes.'}
              {activeTab === 'register-list' && 'Search and filter all registered symposium participants.'}
              {activeTab === 'online-register-list' && 'View participants who registered online via website.'}
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
                /* Rich On-Site Form Entry */
                <div style={{ ...S.card, padding: '2rem', maxWidth: '840px', margin: '0 auto' }}>
                  <div style={{ borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(57, 255, 136, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <FaBolt style={{ marginRight: '4px' }} /> ON-SITE DESK ENTRY
                      </span>
                      <span style={{ fontSize: '0.72rem', color: isDark ? '#9ca3af' : '#64748b' }}>• ELOQUENCE 2026</span>
                    </div>
                    <h3 style={{ ...S.cardTitle, fontSize: '1.35rem', margin: 0 }}>
                      Participant On-Site Registration Form
                    </h3>
                    <p style={{ color: isDark ? '#9ca3af' : '#64748b', fontSize: '0.85rem', margin: '0.35rem 0 0 0' }}>
                      Register students visiting the spot registration counter. Complete participant profile and issue verified entry passes in real-time.
                    </p>
                  </div>

                  <form onSubmit={handleOnSiteRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* ── STEP 1: EVENT SELECTION ── */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <label style={{ ...S.label, margin: 0, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaLayerGroup style={{ color: '#3b82f6' }} /> 1. Select Symposium Event *
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {['all', 'technical', 'non-technical'].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setOnSiteCategoryFilter(cat)}
                              style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                textTransform: 'capitalize',
                                cursor: 'pointer',
                                border: 'none',
                                background: onSiteCategoryFilter === cat ? '#2563eb' : (isDark ? '#1f2937' : '#f1f5f9'),
                                color: onSiteCategoryFilter === cat ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569')
                              }}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <select
                        value={onSiteEventId}
                        onChange={(e) => setOnSiteEventId(e.target.value)}
                        style={{
                          ...S.select,
                          fontSize: '0.95rem',
                          padding: '0.8rem 1rem',
                          border: onSiteErrors.eventId ? '1.5px solid #ef4444' : S.select.border
                        }}
                        required
                      >
                        <option value="">-- Choose Symposium Event --</option>
                        {eventsList
                          .filter(evt => onSiteCategoryFilter === 'all' || evt.category === onSiteCategoryFilter)
                          .map((evt) => (
                            <option key={evt.id} value={evt.id}>
                              [{evt.category.toUpperCase()}] {evt.name} — {evt.fee || `₹${evt.feePerHead || 50}`} ({evt.isTeam ? `Team: ${evt.teamSize || '2-4'}` : 'Solo'})
                            </option>
                          ))}
                      </select>
                      {onSiteErrors.eventId && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{onSiteErrors.eventId}</div>}

                      {/* Selected Event Details Banner */}
                      {selectedOnSiteEvent && (
                        <div style={{
                          marginTop: '0.85rem',
                          padding: '1rem 1.25rem',
                          borderRadius: '10px',
                          background: isDark ? 'rgba(37, 99, 235, 0.08)' : '#eff6ff',
                          border: isDark ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid #bfdbfe',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '800', fontSize: '1rem', color: isDark ? '#ffffff' : '#1e3a8a' }}>
                                {selectedOnSiteEvent.name}
                              </span>
                              <span style={{ fontSize: '0.68rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '6px', background: selectedOnSiteEvent.category === 'technical' ? '#2563eb' : '#ec4899', color: '#ffffff' }}>
                                {selectedOnSiteEvent.category.toUpperCase()}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#059669', background: '#ecfdf5', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                              {selectedOnSiteEvent.fee}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.78rem', color: isDark ? '#cbd5e1' : '#475569' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FaMapMarkerAlt style={{ color: '#10b981' }} /> {selectedOnSiteEvent.venue || 'CSE Dept Labs'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FaClock style={{ color: '#f59e0b' }} /> {selectedOnSiteEvent.timing || '10:00 AM – 1:00 PM'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FaUsers style={{ color: '#6366f1' }} /> {selectedOnSiteEvent.isTeam ? `Team Event (${selectedOnSiteEvent.teamSize || '2-4 members'})` : 'Solo / Individual'}
                            </span>
                          </div>

                          {/* Esports Game Selector */}
                          {isOnSiteEsports && (
                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: isDark ? '#93c5fd' : '#1d4ed8', display: 'block', marginBottom: '0.35rem' }}>
                                <FaGamepad style={{ marginRight: '4px' }} /> CHOOSE ESPORTS GAME *
                              </label>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {['FREE FIRE', 'BGMI'].map((gameOption) => (
                                  <button
                                    key={gameOption}
                                    type="button"
                                    onClick={() => setOnSiteGame(gameOption)}
                                    style={{
                                      flex: 1,
                                      padding: '0.55rem',
                                      borderRadius: '8px',
                                      fontSize: '0.82rem',
                                      fontWeight: '800',
                                      cursor: 'pointer',
                                      border: onSiteGame === gameOption ? '2px solid #3b82f6' : `1px solid ${isDark ? '#374151' : '#cbd5e1'}`,
                                      background: onSiteGame === gameOption ? (isDark ? '#1e3a8a' : '#dbeafe') : (isDark ? '#111827' : '#ffffff'),
                                      color: onSiteGame === gameOption ? (isDark ? '#ffffff' : '#1e40af') : (isDark ? '#9ca3af' : '#475569')
                                    }}
                                  >
                                    {gameOption === 'FREE FIRE' ? (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                        <FaFire style={{ color: '#ff9d42' }} /> FREE FIRE
                                      </span>
                                    ) : (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                        <FaCrosshairs style={{ color: '#38bdf8' }} /> BGMI
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── STEP 2: LEAD PARTICIPANT DETAILS ── */}
                    <div style={{ background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaUser style={{ color: '#10b981' }} /> 2. {selectedOnSiteEvent?.isTeam ? 'Team Leader / Lead Participant Details' : 'Participant Details'}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        {/* Full Name */}
                        <div>
                          <label style={S.label}>Full Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Mohamed Ali"
                            value={onSiteFields.fullName}
                            onChange={(e) => setOnSiteFields({ ...onSiteFields, fullName: e.target.value })}
                            style={{
                              ...S.input,
                              border: onSiteErrors.fullName ? '1.5px solid #ef4444' : S.input.border
                            }}
                            required
                          />
                          {onSiteErrors.fullName && <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '3px' }}>{onSiteErrors.fullName}</div>}
                        </div>

                        {/* Phone Number */}
                        <div>
                          <label style={S.label}>Mobile Phone (10 digits) *</label>
                          <input
                            type="tel"
                            placeholder="e.g. 9876543210"
                            maxLength={10}
                            value={onSiteFields.phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setOnSiteFields({
                                ...onSiteFields,
                                phone: val,
                                ...(onSiteFields.sameAsPhone ? { whatsapp: val } : {})
                              });
                            }}
                            style={{
                              ...S.input,
                              border: onSiteErrors.phone ? '1.5px solid #ef4444' : S.input.border
                            }}
                            required
                          />
                          {onSiteErrors.phone && <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '3px' }}>{onSiteErrors.phone}</div>}
                        </div>

                        {/* WhatsApp Number with toggle */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label style={{ ...S.label, margin: 0 }}>WhatsApp Number *</label>
                            <label style={{ fontSize: '0.72rem', color: isDark ? '#9ca3af' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="checkbox"
                                checked={onSiteFields.sameAsPhone}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setOnSiteFields({
                                    ...onSiteFields,
                                    sameAsPhone: checked,
                                    whatsapp: checked ? onSiteFields.phone : ''
                                  });
                                }}
                              />
                              Same as Phone
                            </label>
                          </div>
                          <input
                            type="tel"
                            placeholder="WhatsApp Number"
                            maxLength={10}
                            disabled={onSiteFields.sameAsPhone}
                            value={onSiteFields.sameAsPhone ? onSiteFields.phone : onSiteFields.whatsapp}
                            onChange={(e) => setOnSiteFields({ ...onSiteFields, whatsapp: e.target.value.replace(/\D/g, '') })}
                            style={{
                              ...S.input,
                              opacity: onSiteFields.sameAsPhone ? 0.75 : 1,
                              border: onSiteErrors.whatsapp ? '1.5px solid #ef4444' : S.input.border
                            }}
                            required
                          />
                          {onSiteErrors.whatsapp && <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '3px' }}>{onSiteErrors.whatsapp}</div>}
                        </div>

                        {/* Email Address */}
                        <div>
                          <label style={S.label}>Email Address *</label>
                          <input
                            type="email"
                            placeholder="student@example.com"
                            value={onSiteFields.email}
                            onChange={(e) => setOnSiteFields({ ...onSiteFields, email: e.target.value })}
                            style={{
                              ...S.input,
                              border: onSiteErrors.email ? '1.5px solid #ef4444' : S.input.border
                            }}
                            required
                          />
                          {onSiteErrors.email && <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '3px' }}>{onSiteErrors.email}</div>}
                        </div>

                        {/* College Name with CAHCET Quick Chip */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <label style={{ ...S.label, margin: 0 }}>College Name *</label>
                            <button
                              type="button"
                              onClick={() => setOnSiteFields({ ...onSiteFields, college: 'C. Abdul Hakeem College of Engineering & Technology' })}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#2563eb',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              + Set CAHCET
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="College Name"
                            value={onSiteFields.college}
                            onChange={(e) => setOnSiteFields({ ...onSiteFields, college: e.target.value })}
                            style={{
                              ...S.input,
                              border: onSiteErrors.college ? '1.5px solid #ef4444' : S.input.border
                            }}
                            required
                          />
                          {onSiteErrors.college && <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '3px' }}>{onSiteErrors.college}</div>}
                        </div>

                        {/* Department */}
                        <div>
                          <label style={S.label}>Department *</label>
                          <input
                            type="text"
                            placeholder="e.g. CSE / IT / ECE / MECH"
                            value={onSiteFields.department}
                            onChange={(e) => setOnSiteFields({ ...onSiteFields, department: e.target.value })}
                            style={{
                              ...S.input,
                              border: onSiteErrors.department ? '1.5px solid #ef4444' : S.input.border
                            }}
                            required
                          />
                          {onSiteErrors.department && <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '3px' }}>{onSiteErrors.department}</div>}
                        </div>

                        {/* Year of Study */}
                        <div>
                          <label style={S.label}>Year of Study *</label>
                          <select
                            value={onSiteFields.year}
                            onChange={(e) => setOnSiteFields({ ...onSiteFields, year: e.target.value })}
                            style={S.select}
                            required
                          >
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* ── STEP 3: TEAM MEMBERS (FOR TEAM EVENTS) ── */}
                    {selectedOnSiteEvent?.isTeam && (
                      <div style={{ background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FaUsers style={{ color: '#6366f1' }} /> 3. Team Information & Additional Members
                            </div>
                            <div style={{ fontSize: '0.72rem', color: isDark ? '#9ca3af' : '#64748b', marginTop: '2px' }}>
                              Event requirement: {selectedOnSiteEvent.teamSize || `${selectedOnSiteEvent.minMembers || 2} to ${selectedOnSiteEvent.maxMembers || 4} members`}
                            </div>
                          </div>

                          <span style={{ fontSize: '0.75rem', fontWeight: '800', background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
                            {onSiteTotalMemberCount} Member(s) Total
                          </span>
                        </div>

                        {/* Team Name Input */}
                        <div style={{ marginBottom: '1.25rem' }}>
                          <label style={S.label}>Official Team Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Pixel Pioneers / Cyber Hawks"
                            value={onSiteFields.teamName}
                            onChange={(e) => setOnSiteFields({ ...onSiteFields, teamName: e.target.value })}
                            style={{
                              ...S.input,
                              border: onSiteErrors.teamName ? '1.5px solid #ef4444' : S.input.border
                            }}
                            required
                          />
                          {onSiteErrors.teamName && <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '3px' }}>{onSiteErrors.teamName}</div>}
                        </div>

                        {/* Member Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {(onSiteFields.teamMembers || []).map((member, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '1rem',
                                borderRadius: '10px',
                                background: isDark ? '#111827' : '#ffffff',
                                border: isDark ? '1px solid #374151' : '1px solid #e2e8f0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: isDark ? '#93c5fd' : '#1d4ed8', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                  <FaUser size={11} /> Team Member #{idx + 2}
                                </span>

                                {(onSiteFields.teamMembers.length > ((Number(selectedOnSiteEvent.minMembers) || 2) - 1)) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const filtered = onSiteFields.teamMembers.filter((_, i) => i !== idx);
                                      setOnSiteFields({ ...onSiteFields, teamMembers: filtered });
                                    }}
                                    style={{
                                      background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2',
                                      color: '#ef4444',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '0.2rem 0.5rem',
                                      fontSize: '0.72rem',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <FaTrash size={10} /> Remove
                                  </button>
                                )}
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                <div>
                                  <label style={{ ...S.label, fontSize: '0.72rem' }}>Member #{idx + 2} Full Name *</label>
                                  <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={member.fullName}
                                    onChange={(e) => {
                                      const copy = [...onSiteFields.teamMembers];
                                      copy[idx] = { ...copy[idx], fullName: e.target.value };
                                      setOnSiteFields({ ...onSiteFields, teamMembers: copy });
                                    }}
                                    style={S.input}
                                  />
                                </div>

                                <div>
                                  <label style={{ ...S.label, fontSize: '0.72rem' }}>Phone Number (Optional)</label>
                                  <input
                                    type="tel"
                                    placeholder="Mobile Number"
                                    maxLength={10}
                                    value={member.phone || ''}
                                    onChange={(e) => {
                                      const copy = [...onSiteFields.teamMembers];
                                      copy[idx] = { ...copy[idx], phone: e.target.value.replace(/\D/g, '') };
                                      setOnSiteFields({ ...onSiteFields, teamMembers: copy });
                                    }}
                                    style={S.input}
                                  />
                                </div>

                                <div>
                                  <label style={{ ...S.label, fontSize: '0.72rem' }}>Email Address (Optional)</label>
                                  <input
                                    type="email"
                                    placeholder="Email"
                                    value={member.email || ''}
                                    onChange={(e) => {
                                      const copy = [...onSiteFields.teamMembers];
                                      copy[idx] = { ...copy[idx], email: e.target.value };
                                      setOnSiteFields({ ...onSiteFields, teamMembers: copy });
                                    }}
                                    style={S.input}
                                  />
                                </div>

                                <div>
                                  <label style={{ ...S.label, fontSize: '0.72rem' }}>Department & Year</label>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <input
                                      type="text"
                                      placeholder="Dept"
                                      value={member.department || 'CSE'}
                                      onChange={(e) => {
                                        const copy = [...onSiteFields.teamMembers];
                                        copy[idx] = { ...copy[idx], department: e.target.value };
                                        setOnSiteFields({ ...onSiteFields, teamMembers: copy });
                                      }}
                                      style={{ ...S.input, flex: 1 }}
                                    />
                                    <select
                                      value={member.year || '3rd Year'}
                                      onChange={(e) => {
                                        const copy = [...onSiteFields.teamMembers];
                                        copy[idx] = { ...copy[idx], year: e.target.value };
                                        setOnSiteFields({ ...onSiteFields, teamMembers: copy });
                                      }}
                                      style={{ ...S.select, flex: 1 }}
                                    >
                                      <option value="1st Year">1st Yr</option>
                                      <option value="2nd Year">2nd Yr</option>
                                      <option value="3rd Year">3rd Yr</option>
                                      <option value="4th Year">4th Yr</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {onSiteErrors.teamMembers && (
                            <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: '600' }}>
                              {onSiteErrors.teamMembers}
                            </div>
                          )}

                          {/* Add Member Button */}
                          {(onSiteFields.teamMembers || []).length < ((Number(selectedOnSiteEvent.maxMembers) || 4) - 1) && (
                            <button
                              type="button"
                              onClick={() => {
                                setOnSiteFields({
                                  ...onSiteFields,
                                  teamMembers: [...(onSiteFields.teamMembers || []), createEmptyTeamMember(onSiteFields.college)]
                                });
                              }}
                              style={{
                                alignSelf: 'flex-start',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: isDark ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
                                color: '#6366f1',
                                border: '1px dashed #6366f1',
                                borderRadius: '8px',
                                padding: '0.5rem 1rem',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                marginTop: '0.25rem'
                              }}
                            >
                              <FaPlus size={10} /> Add Another Team Member (Up to {selectedOnSiteEvent.maxMembers || 4})
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── STEP 4: REAL-TIME FEE & PAYMENT SUMMARY ── */}
                    {selectedOnSiteEvent && (
                      <div style={{
                        padding: '1.25rem 1.5rem',
                        borderRadius: '12px',
                        background: isDark ? '#064e3b' : '#ecfdf5',
                        border: '1px solid #10b981',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: isDark ? '#6ee7b7' : '#047857', textTransform: 'uppercase' }}>
                            <FaMoneyBillWave style={{ marginRight: '4px' }} /> ON-SITE FEE CALCULATION
                          </div>
                          <div style={{ fontSize: '0.82rem', color: isDark ? '#cbd5e1' : '#065f46', marginTop: '2px' }}>
                            {selectedOnSiteEvent.name} • {selectedOnSiteEvent.feeType === 'per_squad' || selectedOnSiteEvent.feeType === 'fixed' ? 'Fixed Squad Fee' : `₹${selectedOnSiteEvent.feePerHead || 50} × ${onSiteTotalMemberCount} member(s)`}
                          </div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: isDark ? '#34d399' : '#059669', marginTop: '2px' }}>
                            Payment Mode: CASH / DESK SPOT UPI (PAID)
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: isDark ? '#a7f3d0' : '#047857', fontWeight: '700', display: 'block' }}>TOTAL AMOUNT</span>
                          <span style={{ fontSize: '1.75rem', fontWeight: '900', color: isDark ? '#ffffff' : '#064e3b' }}>
                            ₹{calculateOnSiteFee()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Submit & Reset Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <button
                        type="submit"
                        disabled={isRegisteringOnSite}
                        style={{
                          ...S.primaryBtn,
                          flex: 1,
                          padding: '0.95rem',
                          fontSize: '1rem',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <FaBolt /> {isRegisteringOnSite ? 'Generating Ticket Pass...' : 'Complete On-Site Registration & Issue Pass'}
                      </button>

                      <button
                        type="button"
                        onClick={handleResetOnSiteForm}
                        style={{
                          ...S.filterBtn,
                          padding: '0.95rem 1.25rem',
                          fontSize: '0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FaUndo /> Reset
                      </button>
                    </div>
                  </form>
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
                  <h3 style={S.cardTitle}>Complete Registered Participants ({registrationsList.length})</h3>
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
                      {registrationsList
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
                      {eventsList.map(evt => (
                        <option key={evt.id} value={evt.id}>
                          [{evt.category.toUpperCase()}] {evt.name}
                        </option>
                      ))}
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
                    .filter(evt => partEventFilter === 'all' || evt.id === partEventFilter)
                    .filter(evt => partCategoryFilter === 'all' || evt.category === partCategoryFilter)
                    .map(evt => {
                      const evtRegs = registrationsList.filter(r => (r.event_id || r.eventId) === evt.id);
                      const isTech = evt.category === 'technical';
                      const teamsCount = evtRegs.filter(r => getTeamMembers(r).length > 0 || r.team_name || r.teamName).length;

                      return (
                        <div key={evt.id} style={{ ...S.card, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <div style={S.cardHeaderFlex}>
                              <div>
                                <h3 style={S.cardTitle}>{evt.name}</h3>
                                <span style={isTech ? S.badgeTech : S.badgeNonTech}>
                                  {isTech ? 'Technical Event' : 'Non-Technical Event'}
                                </span>
                              </div>
                              <span style={S.idBadge}>
                                {evt.fee || `₹${evt.feePerHead || 50}`}
                              </span>
                            </div>

                            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {/* Event Stats Summary Bar */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', background: isDark ? '#1f2937' : '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0' }}>
                                <div>
                                  <span style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '600' }}>Registrations</span>
                                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a' }}>{evtRegs.length}</div>
                                </div>
                                <div>
                                  <span style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '600' }}>Teams Count</span>
                                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981' }}>{teamsCount}</div>
                                </div>
                                <div>
                                  <span style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b', fontWeight: '600' }}>Venue</span>
                                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: isDark ? '#93c5fd' : '#2563eb', marginTop: '4px' }}>{evt.venue || 'Main Lab'}</div>
                                </div>
                              </div>

                              {/* Participant & Team Member Preview */}
                              <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isDark ? '#cbd5e1' : '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Participants & Team Members ({evtRegs.length})
                                </span>
                                <div style={{ maxHeight: '180px', overflowY: 'auto', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {evtRegs.map((reg, idx) => {
                                    const members = getTeamMembers(reg);
                                    const teamName = reg.team_name || reg.teamName;

                                    return (
                                      <div key={idx} style={{ background: isDark ? '#1f2937' : '#f1f5f9', padding: '0.65rem 0.85rem', borderRadius: '8px', border: isDark ? '1px solid #374151' : '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontWeight: '700', fontSize: '0.88rem', color: isDark ? '#f9fafb' : '#0f172a' }}>
                                            {reg.full_name || reg.fullName || 'Participant'}
                                          </span>
                                          {teamName && (
                                            <span style={{ background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#6ee7b7' : '#047857', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>
                                              {teamName}
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b', marginTop: '2px' }}>
                                          {reg.college} • {reg.department}
                                        </div>
                                        {members.length > 0 && (
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                            <span style={{ fontSize: '0.72rem', color: isDark ? '#93c5fd' : '#1d4ed8', fontWeight: '700' }}>
                                              Members ({members.length + 1}):
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
                                  {evtRegs.length === 0 && (
                                    <div style={{ color: isDark ? '#6b7280' : '#94a3b8', fontSize: '0.82rem', padding: '0.75rem', textAlign: 'center' }}>
                                      No participants registered yet for this event.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: Export PDF & Send to Event Coordinator */}
                          <div style={{ padding: '1rem 1.25rem', borderTop: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0', background: isDark ? '#1a2234' : '#f8fafc', display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleExportPDF(evt)}
                              style={{ ...S.filterBtn, flex: 1, justifyContent: 'center', background: isDark ? '#1e3a8a' : '#eff6ff', color: isDark ? '#93c5fd' : '#1d4ed8', borderColor: isDark ? '#1e40af' : '#bfdbfe' }}
                            >
                              <FaFilePdf size={13} /> Export PDF
                            </button>
                            <button
                              onClick={() => handleOpenSendModal(evt)}
                              style={{ ...S.primaryBtn, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.55rem 0.85rem' }}
                            >
                              <FaPaperPlane size={12} /> Send
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
                      Showing participants for {partEventFilter === 'all' ? 'All Events' : (eventsList.find(e => e.id === partEventFilter)?.name || partEventFilter)}.
                    </span>
                  </div>

                  <div style={S.tableResponsive}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>Ticket</th>
                          <th style={S.th}>Event</th>
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

                          return (
                            <tr key={i} style={S.tr}>
                              <td style={S.td}><span style={S.idBadge}>{ticketCode}</span></td>
                              <td style={S.td}>
                                <div>
                                  <span style={S.strongText}>{evtName}</span>
                                  <div>
                                    <span style={isTech ? S.badgeTech : S.badgeNonTech}>
                                      {isTech ? 'Tech' : 'Non-Tech'}
                                    </span>
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
                                  <span style={S.strongText}>{name}</span>
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
                    <span style={{ fontSize: '0.82rem', color: isDark ? '#cbd5e1' : '#475569', fontWeight: '600' }}>
                      Summary to Dispatch:
                    </span>
                    <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0, fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                      <li>Event: {sendTargetEvent.name} ({sendTargetEvent.category.toUpperCase()})</li>
                      <li>Total Registered Participants: {registrationsList.filter(r => (r.event_id || r.eventId) === sendTargetEvent.id).length}</li>
                      <li>Includes complete team member rosters & ticket codes.</li>
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
                      style={{ ...S.primaryBtn, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0.75rem' }}
                    >
                      <FaPaperPlane size={12} /> {isSendingList ? 'Sending...' : 'Confirm & Send List'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
