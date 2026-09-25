import { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  FaChartBar, 
  FaCalendarCheck, 
  FaUsers, 
  FaQrcode, 
  FaTrophy, 
  FaSignOutAlt, 
  FaSun, 
  FaMoon, 
  FaPhoneAlt, 
  FaWhatsapp, 
  FaEnvelope, 
  FaEdit, 
  FaCheck, 
  FaTimes, 
  FaSearch, 
  FaFilter, 
  FaFileCsv, 
  FaFilePdf,
  FaUserTie, 
  FaLayerGroup, 
  FaClock, 
  FaMapMarkerAlt, 
  FaPaperPlane, 
  FaAward, 
  FaMedal, 
  FaStar, 
  FaInfoCircle, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaBars,
  FaShieldAlt,
  FaFileAlt,
  FaLock,
  FaSyncAlt,
  FaThLarge,
  FaTable,
  FaCrown,
  FaBolt,
  FaCamera,
  FaUpload,
  FaTrash,
  FaEye,
  FaImage,
  FaGlobe,
  FaBuilding,
  FaFire,
  FaCrosshairs,
  FaGamepad
} from 'react-icons/fa';
import defaultEvents from '../data/events.js';
import rulesData from '../data/rules.js';
import { getApiUrl } from '../config/api';
import ParticipantVerifier from '../components/ParticipantVerifier.jsx';
import VenueImageModal from '../components/VenueImageModal.jsx';
import { 
  fetchEventWinners, 
  submitEventWinners, 
  updateEventCoordinatorDetails,
  getCachedEvents,
  fetchEventsData
} from '../services/api.js';

export default function EventCoordinatorDashboard({ token, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('coord_theme') || 'dark');
  const isDark = theme === 'dark';

  // ── Venue Photos Management State ──
  const [venuePhotoInput, setVenuePhotoInput] = useState('');
  const [venuePhotoPreview, setVenuePhotoPreview] = useState('');
  const [venueHallName, setVenueHallName] = useState('');
  const [isUploadingVenuePhoto, setIsUploadingVenuePhoto] = useState(false);
  const [isSavingVenuePhoto, setIsSavingVenuePhoto] = useState(false);
  const [showCoordinatorVenueModal, setShowCoordinatorVenueModal] = useState(false);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('coord_theme', next);
  };

  // ── 1. Load Data ──
  const [eventsList, setEventsList] = useState(() => getCachedEvents() || defaultEvents);
  const [registrationsList, setRegistrationsList] = useState([]);
  const [coordinatorsList, setCoordinatorsList] = useState([]);
  const [winnersList, setWinnersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── 2. Determine Allocated Event(s) for this Coordinator ──
  // Check user.assignedEvents or match user.username with coordinator data
  const userAllocatedEventIds = useMemo(() => {
    let raw = user?.assignedEvents || user?.assigned_events || (user?.eventId ? [user.eventId] : null);
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch (_) { raw = [raw]; }
    }
    if (Array.isArray(raw) && raw.length > 0) {
      return raw;
    }
    // Try matching coordinator name with logged in username
    const uName = String(user?.username || '').toLowerCase().trim();
    if (uName) {
      const matchedCoord = coordinatorsList.find(c => {
        const cName = String(c.name || '').toLowerCase().trim();
        return cName === uName || (uName.length >= 3 && (cName.includes(uName) || uName.includes(cName.split(' ')[0])));
      });
      if (matchedCoord) {
        let cEvts = matchedCoord.assignedEvents || matchedCoord.assigned_events;
        if (typeof cEvts === 'string') {
          try { cEvts = JSON.parse(cEvts); } catch (_) { cEvts = [cEvts]; }
        }
        if (Array.isArray(cEvts) && cEvts.length > 0) {
          return cEvts;
        }
      }
    }
    return [];
  }, [user, coordinatorsList]);

  // List of events strictly allocated to this coordinator
  const allocatedEventsList = useMemo(() => {
    if (!userAllocatedEventIds || userAllocatedEventIds.length === 0) {
      return eventsList.length > 0 ? eventsList.slice(0, 1) : defaultEvents.slice(0, 1);
    }
    const filtered = eventsList.filter(e => {
      const eId = (e.id || '').toLowerCase().trim();
      return userAllocatedEventIds.some(allocId => {
        const aId = String(allocId || '').toLowerCase().trim();
        return aId === eId || aId === eId.replace('-', '') || aId.replace('-', '') === eId;
      });
    });
    return filtered.length > 0 ? filtered : [eventsList[0] || defaultEvents[0]];
  }, [eventsList, userAllocatedEventIds]);

  const [selectedEventId, setSelectedEventId] = useState(() => {
    return userAllocatedEventIds[0] || 'tech-01';
  });

  useEffect(() => {
    if (allocatedEventsList.length > 0 && !allocatedEventsList.some(e => e.id === selectedEventId)) {
      setSelectedEventId(allocatedEventsList[0].id);
    }
  }, [allocatedEventsList, selectedEventId]);

  // Current allocated event object
  const currentEvent = useMemo(() => {
    return allocatedEventsList.find(e => e.id === selectedEventId) || allocatedEventsList[0] || {
      id: selectedEventId,
      name: 'Allocated Event',
      category: 'technical',
      fee: 250,
      isTeam: false
    };
  }, [allocatedEventsList, selectedEventId]);

  // Current event's rules and rounds
  const currentEventRuleData = useMemo(() => {
    return rulesData[selectedEventId] || null;
  }, [selectedEventId]);

  // ── 3. Fetch Master Data on Mount ──
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Events
      fetchEventsData().then(evts => {
        if (evts && evts.length > 0) setEventsList(evts);
      }).catch(() => {});

      // 2. Fetch Registrations (Online + Offline)
      const [regRes, offlineRes] = await Promise.all([
        fetch(getApiUrl('/api/registrations')).catch(() => null),
        fetch(getApiUrl('/api/offline-registrations')).catch(() => null)
      ]);
      let combinedRegs = [];
      if (regRes) {
        try {
          const regJson = await regRes.json();
          const rawRegs = regJson.registrations || regJson.data || (Array.isArray(regJson) ? regJson : []);
          if (Array.isArray(rawRegs)) combinedRegs.push(...rawRegs);
        } catch (_) {}
      }
      if (offlineRes) {
        try {
          const offJson = await offlineRes.json();
          const rawOff = offJson.registrations || offJson.data || (Array.isArray(offJson) ? offJson : []);
          if (Array.isArray(rawOff)) combinedRegs.push(...rawOff);
        } catch (_) {}
      }
      setRegistrationsList(combinedRegs);

      // 3. Fetch Coordinators
      const coordRes = await fetch(getApiUrl('/api/coordinators'));
      const coordJson = await coordRes.json();
      const rawCoords = coordJson.data || coordJson.coordinators || (Array.isArray(coordJson) ? coordJson : []);
      if (Array.isArray(rawCoords)) {
        setCoordinatorsList(rawCoords);
      }

      // 4. Fetch Dispatches
      try {
        const dispRes = await fetch(getApiUrl('/api/dispatches'));
        const dispJson = await dispRes.json();
        const rawDisps = dispJson.data || dispJson.dispatches || (Array.isArray(dispJson) ? dispJson : []);
        if (Array.isArray(rawDisps)) {
          setDispatchesList(rawDisps);
        }
      } catch (_) {}

      // 5. Fetch Winners
      const winData = await fetchEventWinners();
      if (Array.isArray(winData)) {
        setWinnersList(winData);
      }
    } catch (err) {
      console.warn('Error fetching coordinator dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const [dispatchesList, setDispatchesList] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  // ── 4. Filtered Coordinators for ONLY this Allocated Event ──
  const currentEventTeam = useMemo(() => {
    return coordinatorsList.filter(c => {
      const assigned = Array.isArray(c.assignedEvents) ? c.assignedEvents : (c.assigned_events || []);
      return assigned.some(a => String(a).toLowerCase().trim() === selectedEventId.toLowerCase().trim());
    });
  }, [coordinatorsList, selectedEventId]);

  // Check if a participant list was dispatched specifically to this event or login
  const eventDispatch = useMemo(() => {
    return dispatchesList.find(d => {
      const isEvt = String(d.eventId || d.event_id || '').toLowerCase().trim() === selectedEventId.toLowerCase().trim();
      const coordUser = String(d.coordinatorUsername || d.coordinator_username || '').toLowerCase().trim();
      const currentUName = String(user?.username || '').toLowerCase().trim();
      const coordName = String(d.coordinatorName || d.coordinator_name || '').toLowerCase().trim();
      
      const isUser = !coordUser || 
        coordUser === currentUName || 
        coordName.includes(currentUName) || 
        (user?.name && coordName.includes(user.name.toLowerCase()));

      return isEvt && isUser;
    });
  }, [dispatchesList, selectedEventId, user]);

  // ── 5. Filtered Participants for ONLY the Allocated Event ──
  const eventParticipants = useMemo(() => {
    return registrationsList.filter(r => {
      const eId = String(r.eventId || r.event_id || '').toLowerCase().trim();
      const target = String(selectedEventId || '').toLowerCase().trim();
      const rEventName = String(r.eventName || r.event_name || '').toLowerCase().trim();
      const curEventName = String(currentEvent?.name || '').toLowerCase().trim();
      
      return (
        eId === target ||
        eId === target.replace('-', '') ||
        target === eId.replace('-', '') ||
        (rEventName && curEventName && (rEventName === curEventName || curEventName.includes(rEventName) || rEventName.includes(curEventName)))
      );
    });
  }, [registrationsList, selectedEventId, currentEvent]);

  // ── 5. Participant Search & Filter State ──
  const [partSearch, setPartSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all'); // all | present | absent
  const [partViewMode, setPartViewMode] = useState('cards'); // 'cards' | 'table'

  const filteredEventParticipants = useMemo(() => {
    return eventParticipants.filter(p => {
      const q = partSearch.toLowerCase().trim();
      const pName = String(p.fullName || p.full_name || p.name || '').toLowerCase();
      const pId = String(p.ticketCode || p.ticket_code || p.registrationId || p.id || '').toLowerCase();
      const pCollege = String(p.college || '').toLowerCase();
      const pPhone = String(p.phone || '');
      const pEmail = String(p.email || '').toLowerCase();
      const pTeam = String(p.teamName || p.team_name || '').toLowerCase();

      const matchQuery = !q || 
        pName.includes(q) ||
        pId.includes(q) ||
        pCollege.includes(q) ||
        pPhone.includes(q) ||
        pEmail.includes(q) ||
        pTeam.includes(q);

      const isPresent = Boolean(p.verified || p.attended || p.checkedIn || (p.attendance_status && p.attendance_status === 'PRESENT'));
      const matchAttendance = 
        attendanceFilter === 'all' ? true :
        attendanceFilter === 'present' ? isPresent :
        !isPresent;

      return matchQuery && matchAttendance;
    });
  }, [eventParticipants, partSearch, attendanceFilter]);

  // Verified / Attended stats
  const verifiedCount = useMemo(() => {
    return eventParticipants.filter(p => p.verified || p.attended || p.checkedIn).length;
  }, [eventParticipants]);

  // Current Event Coordinators / Conductors
  const currentEventCoordinators = useMemo(() => {
    return coordinatorsList.filter(c => 
      c.assignedEvents?.includes(selectedEventId) || 
      c.assignedEvents?.includes(selectedEventId.replace('-', ''))
    );
  }, [coordinatorsList, selectedEventId]);

  // Current Event Winner Submission
  const currentWinnerSubmission = useMemo(() => {
    return winnersList.find(w => w.eventId === selectedEventId) || null;
  }, [winnersList, selectedEventId]);

  // ── Venue Photo Synchronization & Handlers ──
  useEffect(() => {
    if (currentEvent) {
      const currentPhoto = currentEvent.venueImage || currentEvent.venue_image || '';
      setVenuePhotoInput(currentPhoto);
      setVenuePhotoPreview(currentPhoto);
      setVenueHallName(currentEvent.venue || '');
    }
  }, [currentEvent?.id, currentEvent?.venueImage, currentEvent?.venue_image, currentEvent?.venue]);

  const handlePhotoFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be under 8MB');
      return;
    }

    setIsUploadingVenuePhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setVenuePhotoPreview(base64);
      setVenuePhotoInput(base64);
      setIsUploadingVenuePhoto(false);
      toast.success('Photo loaded! Click "Save & Publish Venue Photo" to apply.');
    };
    reader.onerror = () => {
      setIsUploadingVenuePhoto(false);
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveVenuePhoto = async () => {
    if (!currentEvent?.id) return;
    setIsSavingVenuePhoto(true);
    try {
      const payload = {
        venueImage: venuePhotoInput.trim(),
        venue_image: venuePhotoInput.trim(),
        venue: venueHallName.trim() || currentEvent.venue || 'Designated Campus Venue'
      };

      const result = await updateEventCoordinatorDetails(currentEvent.id, payload, token);
      if (result.success) {
        setEventsList(prev => prev.map(ev => {
          if (ev.id === currentEvent.id) {
            return {
              ...ev,
              venueImage: payload.venueImage,
              venue_image: payload.venueImage,
              venue: payload.venue
            };
          }
          return ev;
        }));
        toast.success(`Venue photo for ${currentEvent.name} updated successfully!`);
        try {
          await fetchEventsData(true);
        } catch (_) {}
      } else {
        toast.error(result.message || 'Failed to update venue photo');
      }
    } catch (err) {
      console.error('Error saving venue photo:', err);
      toast.error('Network error saving venue photo');
    } finally {
      setIsSavingVenuePhoto(false);
    }
  };

  const handleRemoveVenuePhoto = async () => {
    if (!window.confirm(`Are you sure you want to remove the venue photo for ${currentEvent.name}?`)) {
      return;
    }
    setIsSavingVenuePhoto(true);
    try {
      const payload = {
        venueImage: '',
        venue_image: '',
        venue: venueHallName.trim() || currentEvent.venue || ''
      };
      const result = await updateEventCoordinatorDetails(currentEvent.id, payload, token);
      if (result.success) {
        setVenuePhotoInput('');
        setVenuePhotoPreview('');
        setEventsList(prev => prev.map(ev => {
          if (ev.id === currentEvent.id) {
            return {
              ...ev,
              venueImage: '',
              venue_image: '',
              venue: payload.venue
            };
          }
          return ev;
        }));
        toast.success(`Venue photo removed for ${currentEvent.name}`);
        try {
          await fetchEventsData(true);
        } catch (_) {}
      } else {
        toast.error(result.message || 'Failed to remove venue photo');
      }
    } catch (err) {
      toast.error('Error removing venue photo');
    } finally {
      setIsSavingVenuePhoto(false);
    }
  };

  // ── 6. Attendance Toggle Handler ──
  const handleToggleAttendance = async (participant) => {
    const regId = participant.registrationId || participant.id;
    const nextStatus = !(participant.verified || participant.attended || participant.checkedIn);
    
    // Optimistic UI update
    setRegistrationsList(prev => prev.map(item => {
      const id = item.registrationId || item.id;
      if (id === regId) {
        return { ...item, verified: nextStatus, attended: nextStatus, checkedIn: nextStatus };
      }
      return item;
    }));

    toast.success(`${participant.fullName || 'Participant'} marked ${nextStatus ? 'PRESENT' : 'ABSENT'}`);

    try {
      await fetch(getApiUrl(`/api/admin/registrations/${regId}/verify`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verified: nextStatus, attended: nextStatus })
      });
    } catch (err) {
      console.warn('Could not persist verification to server:', err);
    }
  };

  // ── 7. CSV Export for Allocated Event ──
  const handleExportCSV = () => {
    if (eventParticipants.length === 0) {
      return toast.error('No participants found to export for this event');
    }

    const headers = ['Registration ID', 'Participant Name', 'Email', 'Phone', 'WhatsApp', 'College', 'Department', 'Year', 'Team Name', 'Team Members', 'Status', 'Attendance'];
    const rows = eventParticipants.map(p => [
      `"${p.registrationId || p.id || ''}"`,
      `"${p.fullName || p.name || ''}"`,
      `"${p.email || ''}"`,
      `"${p.phone || ''}"`,
      `"${p.whatsapp || p.phone || ''}"`,
      `"${p.college || ''}"`,
      `"${p.dept || p.department || ''}"`,
      `"${p.year || ''}"`,
      `"${p.teamName || ''}"`,
      `"${Array.isArray(p.teamMembers) ? p.teamMembers.map(m => typeof m === 'string' ? m : m.name).join('; ') : ''}"`,
      `"${p.paymentStatus || 'Confirmed'}"`,
      `"${(p.verified || p.attended || p.checkedIn) ? 'PRESENT' : 'ABSENT'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentEvent.name.replace(/\s+/g, '_')}_Participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${eventParticipants.length} participants to CSV`);
  };

  // ── 7B. PDF Export for Allocated Event ──
  const handleExportPDF = () => {
    if (eventParticipants.length === 0) {
      return toast.error('No participants found to export for this event');
    }

    const win = window.open('', '_blank');
    if (!win) return toast.error('Please allow popups to export PDF');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${currentEvent.name} - Official Participant Sheet</title>
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
          <div><strong>EVENT:</strong> ${currentEvent.name} (${(currentEvent.category || 'TECHNICAL').toUpperCase()})</div>
          <div><strong>TOTAL PARTICIPANTS:</strong> ${eventParticipants.length}</div>
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
              <th style="width: 70px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${eventParticipants.map((r, i) => {
              const members = Array.isArray(r.teamMembers) ? r.teamMembers.map(m => typeof m === 'string' ? m : m.name) : [];
              const isPresent = (r.verified || r.attended || r.checkedIn);
              return `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${r.registrationId || r.ticket_code || r.id || '-'}</strong></td>
                  <td>${r.teamName ? `<span class="badge">${r.teamName}</span>` : 'Individual'}</td>
                  <td><strong>${r.fullName || r.name || 'Anonymous'}</strong></td>
                  <td>${r.phone || '-'}<br/><span style="color:#64748b;font-size:11px;">${r.email || '-'}</span></td>
                  <td>
                    ${members.length > 0 ? `<strong>${members.length + 1} Members:</strong><div class="members-box">1. ${r.fullName || r.name} (Lead)<br/>${members.map((m, idx) => `${idx + 2}. ${m}`).join('<br/>')}</div>` : 'Individual Entry'}
                  </td>
                  <td>${r.college || 'CAHCET'}<br/><span style="color:#64748b;font-size:11px;">${r.dept || r.department || ''} (${r.year || ''})</span></td>
                  <td><strong>${isPresent ? 'PRESENT' : 'ABSENT'}</strong></td>
                </tr>
              `;
            }).join('')}
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
    toast.success(`Generated PDF Participant Sheet for ${currentEvent.name}`);
  };

  // ── 8. Edit Event Rounds & Conductor Modal States ──
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editVenue, setEditVenue] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editRoundsText, setEditRoundsText] = useState('');
  const [editRulesText, setEditRulesText] = useState('');
  const [editConductorNotes, setEditConductorNotes] = useState('');
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  const openEditEventModal = () => {
    setEditVenue(currentEvent.venue || 'Lab 3 / Main Seminar Hall');
    setEditTime(currentEvent.time || '10:00 AM - 1:00 PM');
    
    // Rounds
    if (Array.isArray(currentEvent.rounds) && currentEvent.rounds.length > 0) {
      setEditRoundsText(currentEvent.rounds.map(r => typeof r === 'string' ? r : `${r.title || r.name}: ${r.desc || ''}`).join('\n'));
    } else if (currentEventRuleData?.rounds) {
      setEditRoundsText(currentEventRuleData.rounds.map(r => `${r.title}: ${r.desc || ''}`).join('\n'));
    } else {
      setEditRoundsText('Round 1: Preliminary Round\nRound 2: Main Challenge\nRound 3: Final Evaluation');
    }

    // Rules
    if (Array.isArray(currentEvent.rules) && currentEvent.rules.length > 0) {
      setEditRulesText(currentEvent.rules.join('\n'));
    } else if (currentEventRuleData?.rules) {
      setEditRulesText(currentEventRuleData.rules.join('\n'));
    } else {
      setEditRulesText('1. College ID card is mandatory.\n2. Malpractice leads to immediate disqualification.\n3. Judges decision is final.');
    }

    setEditConductorNotes(currentEvent.conductorNotes || '');
    setIsEditEventModalOpen(true);
  };

  const handleSaveEventDetails = async (e) => {
    e.preventDefault();
    setIsSavingEvent(true);
    const toastId = toast.loading('Updating event details & rounds...');

    const roundsArray = editRoundsText.split('\n').map(s => s.trim()).filter(Boolean);
    const rulesArray = editRulesText.split('\n').map(s => s.trim()).filter(Boolean);

    try {
      const res = await updateEventCoordinatorDetails(selectedEventId, {
        venue: editVenue,
        time: editTime,
        timing: editTime,
        rounds: roundsArray,
        rules: rulesArray,
        conductorNotes: editConductorNotes
      }, token);

      if (res.success) {
        toast.success('Event details & rounds updated successfully!', { id: toastId });
        setEventsList(prev => prev.map(evt => {
          if (evt.id === selectedEventId) {
            return {
              ...evt,
              venue: editVenue,
              time: editTime,
              timing: editTime,
              rounds: roundsArray,
              rules: rulesArray,
              conductorNotes: editConductorNotes
            };
          }
          return evt;
        }));
        setIsEditEventModalOpen(false);

        // Force-refresh global events cache so public website reflects changes immediately
        try {
          await fetchEventsData(true);
        } catch (_) {}
      } else {
        toast.error(res.message || 'Failed to update event', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error saving event details', { id: toastId });
    } finally {
      setIsSavingEvent(false);
    }
  };

  // ── 9. Winner Selection & Submission State ──
  const [firstPlaceRegId, setFirstPlaceRegId] = useState('');
  const [firstPlaceScore, setFirstPlaceScore] = useState('');
  const [firstPlaceRemarks, setFirstPlaceRemarks] = useState('');

  const [secondPlaceRegId, setSecondPlaceRegId] = useState('');
  const [secondPlaceScore, setSecondPlaceScore] = useState('');
  const [secondPlaceRemarks, setSecondPlaceRemarks] = useState('');

  const [thirdPlaceRegId, setThirdPlaceRegId] = useState('');
  const [thirdPlaceScore, setThirdPlaceScore] = useState('');
  const [thirdPlaceRemarks, setThirdPlaceRemarks] = useState('');

  const [winnerNotes, setWinnerNotes] = useState('');
  const [isSubmittingWinners, setIsSubmittingWinners] = useState(false);

  // Sync existing winner record if present
  useEffect(() => {
    if (currentWinnerSubmission) {
      if (currentWinnerSubmission.firstPlace) {
        setFirstPlaceRegId(currentWinnerSubmission.firstPlace.registrationId || '');
        setFirstPlaceScore(currentWinnerSubmission.firstPlace.score || '');
        setFirstPlaceRemarks(currentWinnerSubmission.firstPlace.remarks || '');
      }
      if (currentWinnerSubmission.secondPlace) {
        setSecondPlaceRegId(currentWinnerSubmission.secondPlace.registrationId || '');
        setSecondPlaceScore(currentWinnerSubmission.secondPlace.score || '');
        setSecondPlaceRemarks(currentWinnerSubmission.secondPlace.remarks || '');
      }
      if (currentWinnerSubmission.thirdPlace) {
        setThirdPlaceRegId(currentWinnerSubmission.thirdPlace.registrationId || '');
        setThirdPlaceScore(currentWinnerSubmission.thirdPlace.score || '');
        setThirdPlaceRemarks(currentWinnerSubmission.thirdPlace.remarks || '');
      }
      setWinnerNotes(currentWinnerSubmission.notes || '');
    } else {
      setFirstPlaceRegId('');
      setFirstPlaceScore('');
      setFirstPlaceRemarks('');
      setSecondPlaceRegId('');
      setSecondPlaceScore('');
      setSecondPlaceRemarks('');
      setThirdPlaceRegId('');
      setThirdPlaceScore('');
      setThirdPlaceRemarks('');
      setWinnerNotes('');
    }
  }, [currentWinnerSubmission, selectedEventId]);

  const handleSubmitWinners = async (e) => {
    e.preventDefault();
    if (!firstPlaceRegId) {
      return toast.error('Please select the 1st Place (Winner) participant');
    }

    const p1 = eventParticipants.find(p => (p.registrationId || p.id) === firstPlaceRegId);
    const p2 = secondPlaceRegId ? eventParticipants.find(p => (p.registrationId || p.id) === secondPlaceRegId) : null;
    const p3 = thirdPlaceRegId ? eventParticipants.find(p => (p.registrationId || p.id) === thirdPlaceRegId) : null;

    if (!p1) {
      return toast.error('Selected 1st place participant not found in roster');
    }

    const formatWinnerObj = (p, score, remarks) => {
      if (!p) return null;
      return {
        registrationId: p.registrationId || p.id,
        name: p.fullName || p.name,
        college: p.college || 'CAHCET',
        dept: p.dept || p.department || '',
        year: p.year || '',
        phone: p.phone || '',
        email: p.email || '',
        teamName: p.teamName || '',
        teamMembers: p.teamMembers || [],
        score: score || '',
        remarks: remarks || ''
      };
    };

    const payload = {
      eventId: selectedEventId,
      eventName: currentEvent.name,
      eventCategory: currentEvent.category || 'technical',
      submittedBy: user?.username || 'Lead Coordinator',
      firstPlace: formatWinnerObj(p1, firstPlaceScore, firstPlaceRemarks),
      secondPlace: formatWinnerObj(p2, secondPlaceScore, secondPlaceRemarks),
      thirdPlace: formatWinnerObj(p3, thirdPlaceScore, thirdPlaceRemarks),
      notes: winnerNotes
    };

    setIsSubmittingWinners(true);
    const toastId = toast.loading(`Submitting Winner List for ${currentEvent.name} to Certificate Team...`);

    try {
      const res = await submitEventWinners(payload);
      if (res.success) {
        toast.success(res.message || 'Winner list submitted successfully!', { id: toastId, duration: 6000 });
        setWinnersList(prev => {
          const filtered = prev.filter(w => w.eventId !== selectedEventId);
          return [...filtered, res.data];
        });
      } else {
        toast.error(res.message || 'Failed to submit winners', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error submitting winners', { id: toastId });
    } finally {
      setIsSubmittingWinners(false);
    }
  };

  // ── Styles (Cyberpunk Dark / Sleek Light) ──
  const S = useMemo(() => getCoordinatorStyles(isDark), [isDark]);

  return (
    <div style={S.container} className="coord-container">
      {/* ── Mobile Responsive Styles ── */}
      <style>{`
        .coord-mobile-btn {
          display: none;
        }
        @media (max-width: 900px) {
          .coord-header {
            padding: 0.75rem 1rem !important;
            gap: 0.5rem !important;
          }
          .coord-brand-sub {
            display: none !important;
          }
          .coord-brand-title {
            font-size: 0.85rem !important;
          }
          .coord-mobile-btn {
            display: flex !important;
          }
          .coord-sidebar {
            position: fixed !important;
            left: -320px !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 280px !important;
            height: 100vh !important;
            z-index: 1000 !important;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.8) !important;
          }
          .coord-sidebar.coord-sidebar-open {
            left: 0 !important;
          }
          .coord-logout-text {
            display: none !important;
          }
          .coord-event-selector-wrap {
            max-width: 180px !important;
          }
          .coord-event-select {
            max-width: 180px !important;
            font-size: 0.78rem !important;
            padding: 0.35rem 0.5rem !important;
          }
          .coord-main-content {
            padding: 1rem !important;
          }
          .coord-hero-banner {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 1.25rem !important;
            gap: 1rem !important;
          }
          .coord-hero-actions {
            width: 100% !important;
            flex-direction: row !important;
          }
          .coord-hero-actions button {
            flex: 1 !important;
          }
          .coord-metric-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 0.75rem !important;
          }
          .coord-participant-grid {
            grid-template-columns: 1fr !important;
          }
          .coord-form-grid {
            grid-template-columns: 1fr !important;
          }
          .coord-two-col-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 540px) {
          .coord-metric-grid {
            grid-template-columns: 1fr !important;
          }
          .coord-header-right {
            gap: 0.35rem !important;
          }
          .coord-user-badge {
            display: none !important;
          }
          .coord-hero-actions {
            flex-direction: column !important;
          }
        }
      `}</style>

      {/* ── Top Header Navigation Bar ── */}
      <header style={S.header} className="coord-header">
        <div style={S.headerLeft}>
          <button 
            type="button" 
            style={S.mobileMenuBtn} 
            className="coord-mobile-btn"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            aria-label="Toggle navigation menu"
          >
            <FaBars size={18} />
          </button>
          
          <div style={S.brandLogoGroup}>
            <div style={S.brandIconBadge}>
              <FaShieldAlt style={{ color: '#39FF88', fontSize: '1.1rem' }} />
            </div>
            <div>
              <div style={S.brandTitle} className="coord-brand-title">EVENT COORDINATOR</div>
              <div style={S.brandSub} className="coord-brand-sub">ELOQUENCE 2026 • CAHCET</div>
            </div>
          </div>
        </div>

        {/* Header Right: Event Selector Pills & Actions */}
        <div style={S.headerRight} className="coord-header-right">
          {/* Assigned Event Selector */}
          <div style={S.eventSelectorWrap} className="coord-event-selector-wrap">
            <span style={S.eventSelectorLabel}>ALLOCATED EVENT:</span>
            {allocatedEventsList.length > 1 ? (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={S.eventSelectDropdown}
                className="coord-event-select"
              >
                {allocatedEventsList.map(evt => (
                  <option key={evt.id} value={evt.id}>
                    {String(evt.id).toUpperCase()} • {evt.name} ({evt.category === 'technical' ? 'TECH' : 'NON-TECH'})
                  </option>
                ))}
              </select>
            ) : (
              <div style={{
                background: isDark ? 'rgba(57, 255, 136, 0.12)' : '#ecfdf5',
                border: '1px solid rgba(57, 255, 136, 0.35)',
                color: isDark ? '#39FF88' : '#047857',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.85rem',
                letterSpacing: '0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#39FF88', boxShadow: '0 0 8px #39FF88' }} />
                <span>{currentEvent.name}</span>
                <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>({currentEvent.category === 'technical' ? 'TECH' : 'NON-TECH'})</span>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            style={S.themeBtn}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <FaSun size={15} style={{ color: '#fbbf24' }} /> : <FaMoon size={15} style={{ color: '#6366f1' }} />}
          </button>

          {/* User Badge */}
          <div style={S.userBadge} className="coord-user-badge">
            <FaUserTie size={12} style={{ color: '#39FF88' }} />
            <span>{user?.username || 'Coordinator'}</span>
          </div>

          {/* Logout */}
          <button onClick={onLogout} style={S.logoutBtn} title="Sign Out">
            <FaSignOutAlt size={14} />
            <span className="coord-logout-text">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Mobile Sidebar Backdrop Overlay ── */}
      {mobileSidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'block'
          }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Main Layout Body ── */}
      <div style={S.layoutBody}>
        {/* ── Dedicated Sidebar for Event Coordinator ── */}
        <aside 
          style={{ ...S.sidebar, ...(mobileSidebarOpen ? S.sidebarMobileOpen : {}) }} 
          className={`coord-sidebar ${mobileSidebarOpen ? 'coord-sidebar-open' : ''}`}
        >
          <div style={S.sidebarHeader}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={S.sidebarEventBadge}>
                <span style={S.sidebarEventDot} />
                <span style={S.sidebarEventName}>{currentEvent.name}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setMobileSidebarOpen(false)}
                className="coord-mobile-btn"
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'none' }}
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>

          <nav style={S.navMenu}>
            {/* 1. Dashboard */}
            <button
              type="button"
              style={activeTab === 'dashboard' ? { ...S.navItem, ...S.navItemActive } : S.navItem}
              onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
            >
              <FaChartBar style={S.navIcon} />
              <span>Dashboard</span>
            </button>

            {/* 2. Event Allocated & Rounds */}
            <button
              type="button"
              style={activeTab === 'allocated-event' ? { ...S.navItem, ...S.navItemActive } : S.navItem}
              onClick={() => { setActiveTab('allocated-event'); setMobileSidebarOpen(false); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FaCalendarCheck style={S.navIcon} />
                  <span>Event Allocated</span>
                </div>
                <span style={S.badgePill}>{selectedEventId.toUpperCase()}</span>
              </div>
            </button>

            {/* 3. Event Members */}
            <button
              type="button"
              style={activeTab === 'event-team' ? { ...S.navItem, ...S.navItemActive } : S.navItem}
              onClick={() => { setActiveTab('event-team'); setMobileSidebarOpen(false); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FaUsers style={S.navIcon} />
                  <span>Event Members</span>
                </div>
                <span style={S.badgeCount}>{currentEventTeam.length}</span>
              </div>
            </button>

            {/* 4. Event Participant List */}
            <button
              type="button"
              style={activeTab === 'event-participants' ? { ...S.navItem, ...S.navItemActive } : S.navItem}
              onClick={() => { setActiveTab('event-participants'); setMobileSidebarOpen(false); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FaUsers style={S.navIcon} />
                  <span>Participant List</span>
                </div>
                {eventDispatch ? (
                  <span style={{ ...S.badgeCount, background: '#10b981', color: '#ffffff', fontWeight: '800' }}>
                    {eventParticipants.length}
                  </span>
                ) : (
                  <span style={{
                    ...S.badgeCount,
                    background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                    color: isDark ? '#f87171' : '#dc2626',
                    fontSize: '0.62rem',
                    fontWeight: '800'
                  }}>
                    AWAITING
                  </span>
                )}
              </div>
            </button>

            {/* 5. Search & Verify (QR) */}
            <button
              type="button"
              style={activeTab === 'search-verify' ? { ...S.navItem, ...S.navItemActive } : S.navItem}
              onClick={() => { setActiveTab('search-verify'); setMobileSidebarOpen(false); }}
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

            {/* 6. Winner Selection & Certificates */}
            <button
              type="button"
              style={activeTab === 'winners-certificates' ? { ...S.navItem, ...S.navItemActive } : S.navItem}
              onClick={() => { setActiveTab('winners-certificates'); setMobileSidebarOpen(false); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FaTrophy style={{ ...S.navIcon, color: '#f59e0b' }} />
                  <span>Winner Selection</span>
                </div>
                {currentWinnerSubmission && (
                  <span style={{ ...S.badgeCount, background: '#10b981', color: '#ffffff', fontSize: '0.62rem' }}>
                    SUBMITTED
                  </span>
                )}
              </div>
            </button>

            {/* 7. Venue Photos Management */}
            <button
              type="button"
              style={activeTab === 'venue-photos' ? { ...S.navItem, ...S.navItemActive } : S.navItem}
              onClick={() => { setActiveTab('venue-photos'); setMobileSidebarOpen(false); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <FaCamera style={{ ...S.navIcon, color: '#ec4899' }} />
                  <span>Venue Photos</span>
                </div>
                {currentEvent?.venueImage || currentEvent?.venue_image ? (
                  <span style={{ ...S.badgeCount, background: isDark ? '#064e3b' : '#ecfdf5', color: isDark ? '#6ee7b7' : '#047857' }}>
                    LIVE
                  </span>
                ) : (
                  <span style={{ ...S.badgeCount, background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2', color: isDark ? '#f87171' : '#dc2626', fontSize: '0.62rem' }}>
                    NO PHOTO
                  </span>
                )}
              </div>
            </button>
          </nav>

          <div style={S.sidebarFooter}>
            <div style={S.allocatedInfoBox}>
              <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>Allocated Category:</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: currentEvent.category === 'technical' ? '#38bdf8' : '#ec4899', textTransform: 'uppercase' }}>
                {currentEvent.category} • {currentEvent.isTeam ? 'Team Event' : 'Solo Event'}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content View Area ── */}
        <main style={S.mainContent}>
          {/* ======================================================== */}
          {/* TAB 1: DASHBOARD VIEW                                   */}
          {/* ======================================================== */}
          {activeTab === 'dashboard' && (
            <div style={S.tabView}>
              <div style={S.viewHeroBanner}>
                <div style={S.heroBannerContent}>
                  <div style={S.heroBadge}>
                    <FaAward /> {currentEvent.category === 'technical' ? 'TECHNICAL TRACK' : 'NON-TECHNICAL TRACK'}
                  </div>
                  <h1 style={S.heroTitle}>{currentEvent.name}</h1>
                  <p style={S.heroDesc}>
                    {currentEvent.description || 'Welcome to your event coordinator control center. Monitor attendance, communicate with participants directly, and finalize winners.'}
                  </p>
                  
                  <div style={S.heroMetaRow}>
                    <span style={S.metaChip}><FaClock style={{ color: '#39FF88' }} /> {currentEvent.time || '10:00 AM - 1:00 PM'}</span>
                    <span style={S.metaChip}><FaMapMarkerAlt style={{ color: '#39FF88' }} /> {currentEvent.venue || 'Lab 3 / Main Seminar Hall'}</span>
                    <span style={S.metaChip}><FaUsers style={{ color: '#39FF88' }} /> {currentEvent.isTeam ? 'Team Event (2-4 Members)' : 'Solo Event'}</span>
                  </div>
                </div>

                <div style={S.heroActions}>
                  <button 
                    onClick={() => setActiveTab('search-verify')}
                    style={S.btnPrimaryHero}
                  >
                    <FaQrcode /> Fast Verify QR
                  </button>
                  <button 
                    onClick={() => setActiveTab('event-participants')}
                    style={S.btnSecondaryHero}
                  >
                    <FaUsers /> View Participants ({eventParticipants.length})
                  </button>
                </div>
              </div>

              {/* Stat Metric Cards */}
              <div style={S.metricGrid}>
                {/* Total Participants for this event */}
                <div style={S.metricCard}>
                  <div style={S.metricIconWrap}>
                    <FaUsers style={{ color: '#38bdf8' }} />
                  </div>
                  <div>
                    <div style={S.metricLabel}>Total Registrations</div>
                    <div style={S.metricVal}>{eventParticipants.length}</div>
                    <div style={S.metricSub}>Registered for {currentEvent.name}</div>
                  </div>
                </div>

                {/* Verified / Present */}
                <div style={S.metricCard}>
                  <div style={{ ...S.metricIconWrap, background: 'rgba(57, 255, 136, 0.12)' }}>
                    <FaCheckCircle style={{ color: '#39FF88' }} />
                  </div>
                  <div>
                    <div style={S.metricLabel}>Verified / Present</div>
                    <div style={{ ...S.metricVal, color: '#39FF88' }}>{verifiedCount}</div>
                    <div style={S.metricSub}>
                      {eventParticipants.length > 0 
                        ? `${Math.round((verifiedCount / eventParticipants.length) * 100)}% attendance rate`
                        : '0% attendance'}
                    </div>
                  </div>
                </div>

                {/* Pending Check-in */}
                <div style={S.metricCard}>
                  <div style={{ ...S.metricIconWrap, background: 'rgba(245, 158, 11, 0.12)' }}>
                    <FaClock style={{ color: '#f59e0b' }} />
                  </div>
                  <div>
                    <div style={S.metricLabel}>Pending Check-in</div>
                    <div style={{ ...S.metricVal, color: '#f59e0b' }}>
                      {Math.max(0, eventParticipants.length - verifiedCount)}
                    </div>
                    <div style={S.metricSub}>Awaiting arrival at venue</div>
                  </div>
                </div>

                {/* Winner Status */}
                <div style={S.metricCard}>
                  <div style={{ ...S.metricIconWrap, background: 'rgba(234, 179, 8, 0.12)' }}>
                    <FaTrophy style={{ color: '#eab308' }} />
                  </div>
                  <div>
                    <div style={S.metricLabel}>Winner Selection</div>
                    <div style={{ ...S.metricVal, fontSize: '1.25rem', color: currentWinnerSubmission ? '#10b981' : '#eab308' }}>
                      {currentWinnerSubmission ? 'SUBMITTED' : 'PENDING'}
                    </div>
                    <div style={S.metricSub}>
                      {currentWinnerSubmission 
                        ? 'Transmitted to Certificate Team' 
                        : 'Select winners after final round'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Conductor Overview */}
              <div style={S.twoColGrid}>
                {/* Event Conductors Box */}
                <div style={S.cardBox}>
                  <div style={S.cardHeader}>
                    <div style={S.cardTitle}>
                      <FaUserTie style={{ color: '#39FF88' }} /> Event Conductors & Coordinators
                    </div>
                    <button onClick={openEditEventModal} style={S.btnSmallOutline}>
                      <FaEdit /> Edit Details
                    </button>
                  </div>

                  <div style={S.cardBody}>
                    {currentEventCoordinators.length > 0 ? (
                      <div style={S.conductorList}>
                        {currentEventCoordinators.map(c => (
                          <div key={c.id} style={S.conductorItem}>
                            <div style={S.conductorAvatar}>
                              {c.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={S.conductorName}>{c.name}</div>
                              <div style={S.conductorRole}>{c.role || 'Lead Coordinator'} • {c.department || 'CSE'}</div>
                              <div style={S.conductorContactRow}>
                                {c.phone && (
                                  <a href={`tel:${c.phone}`} style={S.contactChip} title="Call Conductor">
                                    <FaPhoneAlt size={10} /> {c.phone}
                                  </a>
                                )}
                                {c.whatsapp && (
                                  <a href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ ...S.contactChip, color: '#10b981' }} title="WhatsApp">
                                    <FaWhatsapp size={11} /> WhatsApp
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={S.emptyBox}>
                        <p>No specific conductor records mapped. You are the assigned lead coordinator for {currentEvent.name}.</p>
                        <button onClick={openEditEventModal} style={S.btnPrimarySmall}>
                          <FaEdit /> Add Conductor Notes & Timing
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Rounds Preview Box */}
                <div style={S.cardBox}>
                  <div style={S.cardHeader}>
                    <div style={S.cardTitle}>
                      <FaLayerGroup style={{ color: '#38bdf8' }} /> Rounds & Evaluation Breakdown
                    </div>
                    <button onClick={openEditEventModal} style={S.btnSmallOutline}>
                      <FaEdit /> Update Rounds
                    </button>
                  </div>

                  <div style={S.cardBody}>
                    <div style={S.roundStepsList}>
                      {(Array.isArray(currentEvent.rounds) && currentEvent.rounds.length > 0
                        ? currentEvent.rounds
                        : currentEventRuleData?.rounds || ['Round 1: Preliminary screening', 'Round 2: Technical Challenge', 'Round 3: Grand Finale & Scoring']
                      ).map((rnd, idx) => (
                        <div key={idx} style={S.roundStepCard}>
                          <div style={S.roundStepBadge}>0{idx + 1}</div>
                          <div style={S.roundStepContent}>
                            <div style={S.roundStepTitle}>
                              {typeof rnd === 'string' ? rnd : rnd.title || `Round ${idx + 1}`}
                            </div>
                            {typeof rnd === 'object' && rnd.desc && (
                              <div style={S.roundStepDesc}>{rnd.desc}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ALLOCATED EVENT & ROUNDS DETAILS                  */}
          {/* ======================================================== */}
          {activeTab === 'allocated-event' && (
            <div style={S.tabView}>
              <div style={S.sectionHeadingRow}>
                <div>
                  <h2 style={S.sectionHeadingTitle}>Allocated Event Management</h2>
                  <p style={S.sectionHeadingSub}>
                    View and update coordinator details, round breakdown, rules, and venue schedule for <strong>{currentEvent.name}</strong>.
                  </p>
                </div>
                <button onClick={openEditEventModal} style={S.btnPrimary}>
                  <FaEdit /> Edit Event Details & Rounds
                </button>
              </div>

              <div style={S.detailsGrid}>
                {/* Event Summary Box */}
                <div style={S.cardBox}>
                  <div style={S.cardHeader}>
                    <div style={S.cardTitle}><FaInfoCircle style={{ color: '#39FF88' }} /> Event Overview</div>
                    <span style={S.badgePill}>{currentEvent.id}</span>
                  </div>
                  <div style={S.cardBody}>
                    <div style={S.infoRow}>
                      <span style={S.infoLabel}>Event Title:</span>
                      <span style={S.infoValue}>{currentEvent.name}</span>
                    </div>
                    <div style={S.infoRow}>
                      <span style={S.infoLabel}>Category:</span>
                      <span style={S.infoValue}>{currentEvent.category?.toUpperCase()}</span>
                    </div>
                    <div style={S.infoRow}>
                      <span style={S.infoLabel}>Participation Type:</span>
                      <span style={S.infoValue}>{currentEvent.isTeam ? 'Team Event (2-4 Members)' : 'Solo Individual'}</span>
                    </div>
                    <div style={S.infoRow}>
                      <span style={S.infoLabel}>Registration Fee:</span>
                      <span style={S.infoValue}>₹{currentEvent.fee || 250}</span>
                    </div>
                    <div style={S.infoRow}>
                      <span style={S.infoLabel}>Allocated Venue:</span>
                      <span style={S.infoValue}>{currentEvent.venue || 'Lab 3 / Main Seminar Hall'}</span>
                    </div>
                    <div style={S.infoRow}>
                      <span style={S.infoLabel}>Time Schedule:</span>
                      <span style={S.infoValue}>{currentEvent.time || '10:00 AM - 1:00 PM'}</span>
                    </div>
                    {currentEvent.conductorNotes && (
                      <div style={S.infoRow}>
                        <span style={S.infoLabel}>Conductor Notes:</span>
                        <span style={S.infoValue}>{currentEvent.conductorNotes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conductors List */}
                <div style={S.cardBox}>
                  <div style={S.cardHeader}>
                    <div style={S.cardTitle}><FaUserTie style={{ color: '#38bdf8' }} /> Assigned Coordinators</div>
                  </div>
                  <div style={S.cardBody}>
                    {currentEventCoordinators.length > 0 ? (
                      currentEventCoordinators.map(c => (
                        <div key={c.id} style={{ ...S.conductorItem, marginBottom: '0.85rem' }}>
                          <div style={S.conductorAvatar}>{c.name.slice(0, 2).toUpperCase()}</div>
                          <div style={{ flex: 1 }}>
                            <div style={S.conductorName}>{c.name}</div>
                            <div style={S.conductorRole}>{c.role} • {c.department} ({c.year || '3rd Year'})</div>
                            <div style={S.conductorContactRow}>
                              {c.phone && (
                                <a href={`tel:${c.phone}`} style={S.contactChip}>
                                  <FaPhoneAlt size={10} /> Call ({c.phone})
                                </a>
                              )}
                              {c.email && (
                                <a href={`mailto:${c.email}`} style={S.contactChip}>
                                  <FaEnvelope size={10} /> {c.email}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.88rem' }}>
                        You are managing this event as the lead coordinator.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Rounds & Rules */}
              <div style={{ ...S.cardBox, marginTop: '1.5rem' }}>
                <div style={S.cardHeader}>
                  <div style={S.cardTitle}><FaLayerGroup style={{ color: '#39FF88' }} /> Event Guidelines & Round Structure</div>
                  <button onClick={openEditEventModal} style={S.btnSmallOutline}>
                    <FaEdit /> Modify Guidelines
                  </button>
                </div>
                <div style={S.cardBody}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.95rem', color: '#39FF88', marginBottom: '0.65rem' }}>Round Breakdown:</h4>
                    <div style={S.roundStepsList}>
                      {(Array.isArray(currentEvent.rounds) && currentEvent.rounds.length > 0
                        ? currentEvent.rounds
                        : currentEventRuleData?.rounds || ['Round 1: Preliminary Round', 'Round 2: Final Evaluation']
                      ).map((rnd, idx) => (
                        <div key={idx} style={S.roundStepCard}>
                          <div style={S.roundStepBadge}>0{idx + 1}</div>
                          <div style={S.roundStepContent}>
                            <div style={S.roundStepTitle}>
                              {typeof rnd === 'string' ? rnd : rnd.title || `Round ${idx + 1}`}
                            </div>
                            {typeof rnd === 'object' && rnd.desc && (
                              <div style={S.roundStepDesc}>{rnd.desc}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: '#38bdf8', marginBottom: '0.65rem' }}>Rules & Judging Criteria:</h4>
                    <ul style={S.rulesList}>
                      {(Array.isArray(currentEvent.rules) && currentEvent.rules.length > 0
                        ? currentEvent.rules
                        : currentEventRuleData?.rules || ['Participants must carry college ID card.', 'All submissions must be original.']
                      ).map((rule, idx) => (
                        <li key={idx} style={S.ruleItem}>
                          <FaCheck size={11} style={{ color: '#39FF88', marginTop: '3px' }} />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: EVENT PARTICIPANT LIST (ALLOCATED EVENT ONLY)     */}
          {/* ======================================================== */}
          {activeTab === 'event-participants' && (
            <div style={S.tabView}>
              <div style={S.sectionHeadingRow}>
                <div>
                  <h2 style={S.sectionHeadingTitle}>
                    Participant List — {currentEvent.name}
                  </h2>
                  <p style={S.sectionHeadingSub}>
                    {eventDispatch 
                      ? `Showing ${filteredEventParticipants.length} of ${eventParticipants.length} participants registered strictly for your allocated event.`
                      : `Official participant list for ${currentEvent.name} is awaiting administrative dispatch.`}
                  </p>
                </div>
                
                {eventDispatch && (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={handleExportPDF} style={S.btnSecondary}>
                      <FaFilePdf /> Export PDF
                    </button>
                    <button onClick={handleExportCSV} style={S.btnSecondary}>
                      <FaFileCsv /> Export CSV
                    </button>
                    <button onClick={() => setActiveTab('search-verify')} style={S.btnPrimary}>
                      <FaQrcode /> Scan QR & Verify
                    </button>
                  </div>
                )}
              </div>

              {/* Conditional Dispatch View */}
              {eventDispatch ? (
                <>
                  {/* Dispatch Status Banner */}
                  <div style={{
                    background: isDark ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)' : '#ecfdf5',
                    border: isDark ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #a7f3d0',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: isDark ? 'rgba(16, 185, 129, 0.25)' : '#d1fae5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#10b981',
                        fontSize: '1.2rem'
                      }}>
                        <FaCheckCircle />
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', color: isDark ? '#34d399' : '#065f46', fontSize: '0.95rem' }}>
                          Official Participant List Dispatched by Admin
                        </div>
                        <div style={{ fontSize: '0.82rem', color: isDark ? '#9ca3af' : '#047857', marginTop: '2px' }}>
                          Assigned To: <strong>{eventDispatch.coordinatorName}</strong> • Dispatched: <strong>{new Date(eventDispatch.sentAt).toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                    <div style={{
                      background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#10b981',
                      color: isDark ? '#6ee7b7' : '#ffffff',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                      LIVE AUTHORIZED DISPATCH
                    </div>
                  </div>

                  {/* Search & Filter Bar */}
                  <div style={{ ...S.filterBar, flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
                      <div style={S.searchWrap}>
                        <FaSearch style={S.searchIcon} />
                        <input
                          type="text"
                          placeholder="Search by participant name, registration ID, phone, college..."
                          value={partSearch}
                          onChange={(e) => setPartSearch(e.target.value)}
                          style={S.searchInput}
                        />
                        {partSearch && (
                          <button onClick={() => setPartSearch('')} style={S.clearSearchBtn}>
                            <FaTimes size={12} />
                          </button>
                        )}
                      </div>

                      <div style={S.filterGroup}>
                        <span style={S.filterLabel}><FaFilter size={11} /> Attendance:</span>
                        <select 
                          value={attendanceFilter} 
                          onChange={(e) => setAttendanceFilter(e.target.value)}
                          style={S.filterSelect}
                        >
                          <option value="all">All ({eventParticipants.length})</option>
                          <option value="present">Present ({verifiedCount})</option>
                          <option value="absent">Pending ({Math.max(0, eventParticipants.length - verifiedCount)})</option>
                        </select>
                      </div>
                    </div>

                    {/* View Mode Switcher (Cards vs Table) */}
                    <div style={{
                      display: 'inline-flex',
                      background: isDark ? 'rgba(0,0,0,0.4)' : '#f1f5f9',
                      borderRadius: '8px',
                      padding: '3px',
                      border: isDark ? '1px solid rgba(57, 255, 136, 0.25)' : '1px solid #cbd5e1',
                      alignSelf: 'center'
                    }}>
                      <button
                        type="button"
                        onClick={() => setPartViewMode('cards')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0.42rem 0.8rem',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          background: partViewMode === 'cards' 
                            ? (isDark ? '#39FF88' : '#059669') 
                            : 'transparent',
                          color: partViewMode === 'cards' 
                            ? (isDark ? '#050a06' : '#ffffff') 
                            : (isDark ? '#9ca3af' : '#64748b'),
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <FaThLarge size={12} /> Cards
                      </button>
                      <button
                        type="button"
                        onClick={() => setPartViewMode('table')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0.42rem 0.8rem',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          background: partViewMode === 'table' 
                            ? (isDark ? '#39FF88' : '#059669') 
                            : 'transparent',
                          color: partViewMode === 'table' 
                            ? (isDark ? '#050a06' : '#ffffff') 
                            : (isDark ? '#9ca3af' : '#64748b'),
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <FaTable size={12} /> Table
                      </button>
                    </div>
                  </div>

                  {/* Participant Cards / Table View */}
                  {filteredEventParticipants.length > 0 ? (
                    partViewMode === 'cards' ? (
                      /* Cards Grid View */
                      <div style={S.participantGrid}>
                        {filteredEventParticipants.map(p => {
                          const isPresent = Boolean(p.verified || p.attended || p.checkedIn || (p.attendance_status && p.attendance_status === 'PRESENT'));
                          const cleanPhone = (p.phone || '').replace(/[^0-9+]/g, '');
                          const cleanWhatsapp = (p.whatsapp || p.phone || '').replace(/[^0-9]/g, '');

                          return (
                            <div key={p.registrationId || p.id} style={{ ...S.participantCard, borderLeft: isPresent ? '4px solid #39FF88' : '4px solid #64748b' }}>
                              {/* Header: Name + ID + Attendance Badge */}
                              <div style={S.partCardHeader}>
                                <div>
                                  <div style={S.partName}>{p.fullName || p.full_name || p.name || 'Participant'}</div>
                                  <div style={S.partIdBadge}>{p.ticketCode || p.ticket_code || p.registrationId || p.id}</div>
                                </div>

                                {/* Attendance Status Button */}
                                <button
                                  onClick={() => handleToggleAttendance(p)}
                                  style={{
                                    ...S.attendanceToggleBtn,
                                    background: isPresent ? 'rgba(57, 255, 136, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                                    color: isPresent ? '#39FF88' : '#94a3b8',
                                    border: isPresent ? '1px solid #39FF88' : '1px solid rgba(255, 255, 255, 0.15)'
                                  }}
                                  title="Click to toggle attendance status"
                                >
                                  {isPresent ? <FaCheck size={11} /> : <FaTimes size={11} />}
                                  <span>{isPresent ? 'PRESENT' : 'MARK PRESENT'}</span>
                                </button>
                              </div>

                              {/* College & Department */}
                              <div style={S.partDetailsBox}>
                                <div style={S.partDetailRow}>
                                  <span style={S.detailKey}>College:</span>
                                  <span style={S.detailVal}>{p.college || 'CAHCET'}</span>
                                </div>
                                {(p.dept || p.department) && (
                                  <div style={S.partDetailRow}>
                                    <span style={S.detailKey}>Dept & Year:</span>
                                    <span style={S.detailVal}>{p.dept || p.department} • {p.year || '3rd Year'}</span>
                                  </div>
                                )}
                                {(p.teamName || p.team_name) && (
                                  <div style={S.partDetailRow}>
                                    <span style={S.detailKey}>Team Name:</span>
                                    <span style={{ ...S.detailVal, color: '#38bdf8', fontWeight: '700' }}>{p.teamName || p.team_name}</span>
                                  </div>
                                )}
                                {((Array.isArray(p.teamMembers) && p.teamMembers.length > 0) || (Array.isArray(p.registration_members) && p.registration_members.length > 0)) && (
                                  <div style={S.partDetailRow}>
                                    <span style={S.detailKey}>Members:</span>
                                    <span style={S.detailVal}>
                                      {(Array.isArray(p.teamMembers) && p.teamMembers.length > 0
                                        ? p.teamMembers.map(m => typeof m === 'string' ? m : (m.name || m.member_name))
                                        : (p.registration_members || []).map(m => m.member_name || m.name || m)
                                      ).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Direct Call & Action Buttons */}
                              <div style={S.partActionRow}>
                                {cleanPhone ? (
                                  <a
                                    href={`tel:${cleanPhone}`}
                                    style={S.btnDirectCall}
                                    title={`Call ${p.fullName || 'Participant'} directly`}
                                  >
                                    <FaPhoneAlt size={12} />
                                    <span>CALL NOW ({cleanPhone})</span>
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No phone provided</span>
                                )}

                                {cleanWhatsapp && (
                                  <a
                                    href={`https://wa.me/${cleanWhatsapp}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={S.btnDirectWhatsapp}
                                    title="Message on WhatsApp"
                                  >
                                    <FaWhatsapp size={14} />
                                  </a>
                                )}

                                {p.email && (
                                  <a
                                    href={`mailto:${p.email}`}
                                    style={S.btnDirectEmail}
                                    title={`Send Email to ${p.email}`}
                                  >
                                    <FaEnvelope size={13} />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Table View */
                      <div style={{
                        background: isDark ? '#0d1810' : '#ffffff',
                        border: isDark ? '1px solid rgba(57, 255, 136, 0.2)' : '1px solid #e2e8f0',
                        borderRadius: '12px',
                        overflowX: 'auto',
                        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0,0,0,0.05)'
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                          <thead>
                            <tr style={{ background: isDark ? '#050a06' : '#f8fafc', borderBottom: isDark ? '1px solid rgba(57, 255, 136, 0.2)' : '1px solid #e2e8f0' }}>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: '800', color: isDark ? '#9ca3af' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: '800', color: isDark ? '#9ca3af' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket Code / ID</th>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: '800', color: isDark ? '#9ca3af' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Participant & Team</th>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: '800', color: isDark ? '#9ca3af' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>College / Dept</th>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: '800', color: isDark ? '#9ca3af' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Direct Contact</th>
                              <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: '800', color: isDark ? '#9ca3af' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Attendance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEventParticipants.map((p, idx) => {
                              const isPresent = Boolean(p.verified || p.attended || p.checkedIn || (p.attendance_status && p.attendance_status === 'PRESENT'));
                              const cleanPhone = (p.phone || '').replace(/[^0-9+]/g, '');
                              const cleanWhatsapp = (p.whatsapp || p.phone || '').replace(/[^0-9]/g, '');
                              const members = Array.isArray(p.teamMembers) && p.teamMembers.length > 0
                                ? p.teamMembers.map(m => typeof m === 'string' ? m : (m.name || m.member_name))
                                : (p.registration_members || []).map(m => m.member_name || m.name || m);

                              return (
                                <tr
                                  key={p.registrationId || p.id || idx}
                                  style={{
                                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #f1f5f9',
                                    background: isPresent 
                                      ? (isDark ? 'rgba(57, 255, 136, 0.03)' : 'rgba(16, 185, 129, 0.03)')
                                      : 'transparent',
                                    transition: 'background 0.2s ease'
                                  }}
                                >
                                  <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' }}>
                                    #{idx + 1}
                                  </td>
                                  <td style={{ padding: '1rem' }}>
                                    <div style={{
                                      display: 'inline-block',
                                      padding: '0.25rem 0.6rem',
                                      borderRadius: '6px',
                                      background: isDark ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe',
                                      color: isDark ? '#38bdf8' : '#0284c7',
                                      fontWeight: '800',
                                      fontSize: '0.82rem',
                                      fontFamily: 'monospace',
                                      letterSpacing: '0.03em'
                                    }}>
                                      {p.ticketCode || p.ticket_code || p.registrationId || p.id}
                                    </div>
                                  </td>
                                  <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '800', color: isDark ? '#f9fafb' : '#0f172a', fontSize: '0.92rem' }}>
                                      {p.fullName || p.full_name || p.name || 'Participant'}
                                    </div>
                                    {(p.teamName || p.team_name) && (
                                      <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: '700', marginTop: '2px' }}>
                                        Team: {p.teamName || p.team_name}
                                      </div>
                                    )}
                                    {members.length > 0 && (
                                      <div style={{ fontSize: '0.75rem', color: isDark ? '#9ca3af' : '#64748b', marginTop: '2px' }}>
                                        Members: {members.join(', ')}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '600', color: isDark ? '#cbd5e1' : '#334155', fontSize: '0.85rem' }}>
                                      {p.college || 'CAHCET'}
                                    </div>
                                    {(p.dept || p.department) && (
                                      <div style={{ fontSize: '0.78rem', color: isDark ? '#9ca3af' : '#64748b' }}>
                                        {p.dept || p.department} {p.year ? `• ${p.year}` : ''}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                      {cleanPhone && (
                                        <a
                                          href={`tel:${cleanPhone}`}
                                          style={{
                                            padding: '0.35rem 0.65rem',
                                            borderRadius: '6px',
                                            background: isDark ? 'rgba(57, 255, 136, 0.12)' : '#ecfdf5',
                                            color: isDark ? '#39FF88' : '#047857',
                                            border: isDark ? '1px solid rgba(57, 255, 136, 0.3)' : '1px solid #a7f3d0',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            textDecoration: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                          title={`Call ${cleanPhone}`}
                                        >
                                          <FaPhoneAlt size={10} /> Call
                                        </a>
                                      )}
                                      {cleanWhatsapp && (
                                        <a
                                          href={`https://wa.me/${cleanWhatsapp}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{
                                            padding: '0.35rem 0.6rem',
                                            borderRadius: '6px',
                                            background: isDark ? 'rgba(34, 197, 94, 0.12)' : '#dcfce7',
                                            color: isDark ? '#4ade80' : '#15803d',
                                            border: isDark ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid #86efac',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            textDecoration: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                          title="WhatsApp"
                                        >
                                          <FaWhatsapp size={12} /> WA
                                        </a>
                                      )}
                                      {p.email && (
                                        <a
                                          href={`mailto:${p.email}`}
                                          style={{
                                            padding: '0.35rem 0.55rem',
                                            borderRadius: '6px',
                                            background: isDark ? 'rgba(56, 189, 248, 0.12)' : '#f0f9ff',
                                            color: isDark ? '#38bdf8' : '#0284c7',
                                            border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #bae6fd',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            textDecoration: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center'
                                          }}
                                          title={p.email}
                                        >
                                          <FaEnvelope size={11} />
                                        </a>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <button
                                      onClick={() => handleToggleAttendance(p)}
                                      style={{
                                        padding: '0.4rem 0.85rem',
                                        borderRadius: '8px',
                                        fontSize: '0.78rem',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        transition: 'all 0.2s ease',
                                        background: isPresent ? 'rgba(57, 255, 136, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                                        color: isPresent ? '#39FF88' : (isDark ? '#94a3b8' : '#64748b'),
                                        border: isPresent ? '1px solid #39FF88' : (isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #cbd5e1')
                                      }}
                                      title="Click to toggle attendance status"
                                    >
                                      {isPresent ? <FaCheck size={11} /> : <FaTimes size={11} />}
                                      <span>{isPresent ? 'PRESENT' : 'MARK PRESENT'}</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    <div style={S.emptyBox}>
                      <FaUsers size={36} style={{ color: '#64748b', marginBottom: '0.75rem' }} />
                      <h3>No Participants Found</h3>
                      <p>
                        {partSearch 
                          ? `No registered participants match "${partSearch}" for ${currentEvent.name}.`
                          : `No participants have registered for ${currentEvent.name} yet.`}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* Awaiting Dispatch Lock State */
                <div style={{
                  background: isDark ? 'rgba(15, 23, 42, 0.75)' : '#f8fafc',
                  border: isDark ? '1px dashed rgba(239, 68, 68, 0.4)' : '1px dashed #fca5a5',
                  borderRadius: '16px',
                  padding: '3.5rem 2rem',
                  textAlign: 'center',
                  maxWidth: '720px',
                  margin: '2rem auto'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
                    color: isDark ? '#f87171' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    fontSize: '1.75rem'
                  }}>
                    <FaLock />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: isDark ? '#f87171' : '#b91c1c', marginBottom: '0.65rem' }}>
                    Participant List Awaiting Dispatch from Admin
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: isDark ? '#cbd5e1' : '#475569', lineHeight: '1.6', maxWidth: '560px', margin: '0 auto 1.5rem' }}>
                    The Admin has not yet dispatched the official participant list for <strong>{currentEvent.name}</strong> to your coordinator login (<strong>@{user?.username || 'coordinator'}</strong>).
                    <br />
                    Once Admin sends the list from the Admin Portal, it will appear here automatically with direct calling, WhatsApp communication, and attendance controls.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      toast.loading('Checking for newly dispatched participant lists from Admin...', { duration: 1500 });
                      fetchData();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.65rem 1.4rem',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.88rem'
                    }}
                  >
                    <FaSyncAlt /> Check / Refresh Status
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: SEARCH & VERIFY (RESTRICTED TO ALLOCATED EVENT)   */}
          {/* ======================================================== */}
          {activeTab === 'search-verify' && (
            <div style={S.tabView}>
              <div style={S.sectionHeadingRow}>
                <div>
                  <h2 style={S.sectionHeadingTitle}>
                    Search & QR Ticket Verification
                  </h2>
                  <p style={S.sectionHeadingSub}>
                    Scan ticket QR codes or search registration IDs. Verification is scoped to <strong>{currentEvent.name}</strong>.
                  </p>
                </div>
              </div>

              {/* QR / Search Verifier Component */}
              <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <ParticipantVerifier
                  token={token}
                  user={user}
                  isDark={isDark}
                  registrations={registrationsList}
                  events={eventsList}
                  allocatedEventId={selectedEventId}
                  allocatedEventName={currentEvent.name}
                  onRefreshRegistrations={fetchData}
                  onVerificationSuccess={(verifiedItem) => {
                    toast.success(`Verified participant: ${verifiedItem.fullName || verifiedItem.name}`);
                    fetchData();
                  }}
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: WINNER SELECTION & CERTIFICATE SUBMISSION        */}
          {/* ======================================================== */}
          {activeTab === 'winners-certificates' && (
            <div style={S.tabView}>
              <div style={S.sectionHeadingRow}>
                <div>
                  <h2 style={S.sectionHeadingTitle}>
                    Winner Selection & Certificate Pipeline
                  </h2>
                  <p style={S.sectionHeadingSub}>
                    Select 1st, 2nd, and 3rd place winners from your verified participants. Submitting locks the record and sends it directly to the <strong>Certificate Team</strong> to generate official certificates.
                  </p>
                </div>

                {currentWinnerSubmission && (
                  <div style={S.submissionStatusBadge}>
                    <FaCheckCircle style={{ color: '#10b981' }} />
                    <span>WINNER LIST SUBMITTED</span>
                  </div>
                )}
              </div>

              {/* Form to Select Winners */}
              <div style={S.cardBox}>
                <div style={S.cardHeader}>
                  <div style={S.cardTitle}>
                    <FaTrophy style={{ color: '#f59e0b' }} /> Select Event Winners — {currentEvent.name}
                  </div>
                  <span style={S.badgePill}>{eventParticipants.length} Participants Available</span>
                </div>

                <div style={S.cardBody}>
                  <form onSubmit={handleSubmitWinners}>
                    {/* 1st Place / Winner */}
                    <div style={S.winnerFormSection}>
                      <div style={S.winnerRankHeader}>
                        <FaTrophy style={{ color: '#eab308', fontSize: '1.2rem' }} />
                        <span style={{ color: '#eab308', fontWeight: '800', fontSize: '1rem' }}>1ST PLACE (WINNER) *</span>
                      </div>

                      <div style={S.formGrid}>
                        <div style={S.formFieldFull}>
                          <label style={S.formLabel}>Select 1st Place Winner *</label>
                          <select
                            value={firstPlaceRegId}
                            onChange={(e) => setFirstPlaceRegId(e.target.value)}
                            style={S.formInput}
                            required
                          >
                            <option value="">-- Choose Winner from Verified Participants --</option>
                            {eventParticipants.map(p => (
                              <option key={p.registrationId || p.id} value={p.registrationId || p.id}>
                                {p.fullName || p.name} ({p.registrationId || p.id}) • {p.college || 'CAHCET'} {p.teamName ? `[Team: ${p.teamName}]` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={S.formField}>
                          <label style={S.formLabel}>Final Score / Points (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. 96/100 or 1st Place"
                            value={firstPlaceScore}
                            onChange={(e) => setFirstPlaceScore(e.target.value)}
                            style={S.formInput}
                          />
                        </div>

                        <div style={S.formField}>
                          <label style={S.formLabel}>Project Title / Remarks (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. AI Sentinel Project"
                            value={firstPlaceRemarks}
                            onChange={(e) => setFirstPlaceRemarks(e.target.value)}
                            style={S.formInput}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2nd Place / 1st Runner Up */}
                    <div style={{ ...S.winnerFormSection, borderLeftColor: '#94a3b8' }}>
                      <div style={S.winnerRankHeader}>
                        <FaMedal style={{ color: '#94a3b8', fontSize: '1.2rem' }} />
                        <span style={{ color: '#94a3b8', fontWeight: '800', fontSize: '1rem' }}>2ND PLACE (RUNNER UP)</span>
                      </div>

                      <div style={S.formGrid}>
                        <div style={S.formFieldFull}>
                          <label style={S.formLabel}>Select 2nd Place Runner Up</label>
                          <select
                            value={secondPlaceRegId}
                            onChange={(e) => setSecondPlaceRegId(e.target.value)}
                            style={S.formInput}
                          >
                            <option value="">-- None / Select Participant --</option>
                            {eventParticipants.map(p => (
                              <option key={p.registrationId || p.id} value={p.registrationId || p.id}>
                                {p.fullName || p.name} ({p.registrationId || p.id}) • {p.college || 'CAHCET'} {p.teamName ? `[Team: ${p.teamName}]` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={S.formField}>
                          <label style={S.formLabel}>Score / Points (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. 88/100"
                            value={secondPlaceScore}
                            onChange={(e) => setSecondPlaceScore(e.target.value)}
                            style={S.formInput}
                          />
                        </div>

                        <div style={S.formField}>
                          <label style={S.formLabel}>Remarks (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Clean architecture"
                            value={secondPlaceRemarks}
                            onChange={(e) => setSecondPlaceRemarks(e.target.value)}
                            style={S.formInput}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3rd Place / 2nd Runner Up */}
                    <div style={{ ...S.winnerFormSection, borderLeftColor: '#b45309' }}>
                      <div style={S.winnerRankHeader}>
                        <FaAward style={{ color: '#b45309', fontSize: '1.2rem' }} />
                        <span style={{ color: '#b45309', fontWeight: '800', fontSize: '1rem' }}>3RD PLACE (2ND RUNNER UP)</span>
                      </div>

                      <div style={S.formGrid}>
                        <div style={S.formFieldFull}>
                          <label style={S.formLabel}>Select 3rd Place Winner</label>
                          <select
                            value={thirdPlaceRegId}
                            onChange={(e) => setThirdPlaceRegId(e.target.value)}
                            style={S.formInput}
                          >
                            <option value="">-- None / Select Participant --</option>
                            {eventParticipants.map(p => (
                              <option key={p.registrationId || p.id} value={p.registrationId || p.id}>
                                {p.fullName || p.name} ({p.registrationId || p.id}) • {p.college || 'CAHCET'} {p.teamName ? `[Team: ${p.teamName}]` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={S.formField}>
                          <label style={S.formLabel}>Score / Points (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. 82/100"
                            value={thirdPlaceScore}
                            onChange={(e) => setThirdPlaceScore(e.target.value)}
                            style={S.formInput}
                          />
                        </div>

                        <div style={S.formField}>
                          <label style={S.formLabel}>Remarks (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Excellent presentation"
                            value={thirdPlaceRemarks}
                            onChange={(e) => setThirdPlaceRemarks(e.target.value)}
                            style={S.formInput}
                          />
                        </div>
                      </div>
                    </div>

                    {/* General Coordinator Notes for Certificate Team */}
                    <div style={{ marginTop: '1rem' }}>
                      <label style={S.formLabel}>Notes for Certificate Generation Team (Optional)</label>
                      <textarea
                        rows={3}
                        placeholder="Any special remarks or instructions for printing/generating winner certificates..."
                        value={winnerNotes}
                        onChange={(e) => setWinnerNotes(e.target.value)}
                        style={S.formTextarea}
                      />
                    </div>

                    {/* Submit Button */}
                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        disabled={isSubmittingWinners}
                        style={S.btnSubmitWinners}
                      >
                        <FaPaperPlane />
                        <span>{isSubmittingWinners ? 'Transmitting Winner List...' : 'Submit to Certificate Team'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* All Submitted Winners Overview */}
              <div style={{ ...S.cardBox, marginTop: '1.5rem' }}>
                <div style={S.cardHeader}>
                  <div style={S.cardTitle}>
                    <FaAward style={{ color: '#38bdf8' }} /> Verified Winner List Records
                  </div>
                  <span style={S.badgePill}>{winnersList.length} Events Completed</span>
                </div>

                <div style={S.cardBody}>
                  {winnersList.length > 0 ? (
                    <div style={S.winnerCardsGrid}>
                      {winnersList.map(w => (
                        <div key={w.id || w.eventId} style={S.winnerSummaryCard}>
                          <div style={S.winnerCardHead}>
                            <div>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#39FF88', margin: 0 }}>
                                {w.eventName}
                              </h4>
                              <span style={{ fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                                Submitted by: {w.submittedBy} • {new Date(w.submittedAt || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                            <span style={S.badgePill}>CERTIFICATE READY</span>
                          </div>

                          <div style={S.winnerPlacesList}>
                            {w.firstPlace && (
                              <div style={S.winnerPlaceItem}>
                                <span style={{ color: '#eab308', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <FaTrophy style={{ color: '#eab308' }} /> 1st Place:
                                </span>
                                <span style={{ fontWeight: '700' }}>{w.firstPlace.name}</span>
                                <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>({w.firstPlace.college})</span>
                              </div>
                            )}
                            {w.secondPlace && (
                              <div style={S.winnerPlaceItem}>
                                <span style={{ color: '#94a3b8', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <FaMedal style={{ color: '#94a3b8' }} /> 2nd Place:
                                </span>
                                <span style={{ fontWeight: '700' }}>{w.secondPlace.name}</span>
                                <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>({w.secondPlace.college})</span>
                              </div>
                            )}
                            {w.thirdPlace && (
                              <div style={S.winnerPlaceItem}>
                                <span style={{ color: '#b45309', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <FaMedal style={{ color: '#b45309' }} /> 3rd Place:
                                </span>
                                <span style={{ fontWeight: '700' }}>{w.thirdPlace.name}</span>
                                <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>({w.thirdPlace.college})</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.88rem' }}>
                      No winner lists have been submitted yet. Once you submit, certificates can be generated directly.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: EVENT MEMBERS (Assigned Coordinators & Sub-Coordinators) */}
          {/* ======================================================== */}
          {activeTab === 'event-team' && (
            <div style={S.tabView}>
              <div style={S.viewHeroBanner} className="coord-hero-banner">
                <div style={S.heroBannerContent}>
                  <div style={S.heroBadge}>
                    <FaUsers /> ALLOCATED EVENT MEMBERS
                  </div>
                  <h1 style={S.heroTitle}>{currentEvent.name} — Event Members Roster</h1>
                  <p style={S.heroDesc}>
                    Official Lead Coordinators, Coordinators, and Sub-Coordinators allocated to lead and execute {currentEvent.name}. Direct calling and WhatsApp support enabled for instant team synchronization.
                  </p>
                  <div style={S.heroMetaRow}>
                    <span style={S.metaChip}>
                      <FaCrown style={{ color: '#fbbf24' }} /> {currentEventTeam.filter(c => (c.role || '').toLowerCase().includes('lead')).length} Lead Coordinator(s)
                    </span>
                    <span style={S.metaChip}>
                      <FaBolt style={{ color: '#38bdf8' }} /> {currentEventTeam.filter(c => !((c.role || '').toLowerCase().includes('lead')) && !((c.role || '').toLowerCase().includes('sub'))).length} Coordinator(s)
                    </span>
                    <span style={S.metaChip}>
                      <FaShieldAlt style={{ color: '#c084fc' }} /> {currentEventTeam.filter(c => (c.role || '').toLowerCase().includes('sub')).length} Sub-Coordinator(s)
                    </span>
                    <span style={{ ...S.metaChip, background: 'rgba(57, 255, 136, 0.12)', color: '#39FF88', fontWeight: '800' }}>
                      <FaUsers /> {currentEventTeam.length} Allocated Members
                    </span>
                  </div>
                </div>
              </div>

              {/* Coordinator & Sub-Coordinator Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
                {currentEventTeam.map((coord, idx) => {
                  const roleStr = (coord.role || '').toLowerCase();
                  const isLead = roleStr.includes('lead');
                  const isSub = roleStr.includes('sub');
                  const cleanPhone = (coord.phone || '').replace(/[^0-9+]/g, '');
                  const cleanWhatsapp = (coord.whatsapp || coord.phone || '').replace(/[^0-9]/g, '');

                  const cardBorder = isLead 
                    ? '1.5px solid rgba(57, 255, 136, 0.5)' 
                    : isSub 
                    ? '1.5px solid rgba(192, 132, 252, 0.45)' 
                    : `1.5px solid ${isDark ? 'rgba(56, 189, 248, 0.35)' : '#bae6fd'}`;

                  const avatarBg = isLead 
                    ? 'rgba(57, 255, 136, 0.15)' 
                    : isSub 
                    ? 'rgba(192, 132, 252, 0.15)' 
                    : 'rgba(56, 189, 248, 0.15)';

                  const avatarColor = isLead 
                    ? '#39FF88' 
                    : isSub 
                    ? '#c084fc' 
                    : '#38bdf8';

                  const badgeBg = isLead 
                    ? (isDark ? 'rgba(57, 255, 136, 0.15)' : '#ecfdf5') 
                    : isSub 
                    ? (isDark ? 'rgba(192, 132, 252, 0.15)' : '#f5f3ff') 
                    : (isDark ? 'rgba(56, 189, 248, 0.15)' : '#f0f9ff');

                  const badgeColor = isLead 
                    ? (isDark ? '#39FF88' : '#047857') 
                    : isSub 
                    ? (isDark ? '#c084fc' : '#7e22ce') 
                    : (isDark ? '#38bdf8' : '#0369a1');

                  const badgeBorder = isLead 
                    ? '1px solid rgba(57, 255, 136, 0.35)' 
                    : isSub 
                    ? '1px solid rgba(192, 132, 252, 0.35)' 
                    : '1px solid rgba(56, 189, 248, 0.35)';

                  return (
                    <div 
                      key={coord.id || idx} 
                      style={{
                        background: isDark ? 'rgba(8, 18, 10, 0.85)' : '#ffffff',
                        border: cardBorder,
                        borderRadius: '16px',
                        padding: '1.5rem',
                        boxShadow: isLead 
                          ? '0 0 20px rgba(57, 255, 136, 0.12)' 
                          : isSub 
                          ? '0 0 15px rgba(192, 132, 252, 0.1)' 
                          : '0 4px 12px rgba(0,0,0,0.03)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: avatarBg,
                            border: `1px solid ${avatarColor}40`,
                            color: avatarColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '1.1rem'
                          }}>
                            {coord.name.slice(0, 2).toUpperCase()}
                          </div>

                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '20px',
                            background: badgeBg,
                            color: badgeColor,
                            border: badgeBorder,
                            fontSize: '0.74rem',
                            fontWeight: '800',
                            letterSpacing: '0.03em',
                            textTransform: 'uppercase'
                          }}>
                            {isLead && <FaCrown size={11} />}
                            {isSub && <FaShieldAlt size={11} />}
                            {!isLead && !isSub && <FaBolt size={11} />}
                            {coord.role || (isLead ? 'Lead Coordinator' : isSub ? 'Sub-Coordinator' : 'Coordinator')}
                          </span>

                          {coord.game && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.74rem',
                              fontWeight: '800',
                              letterSpacing: '0.03em',
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

                        <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.15rem', fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>
                          {coord.name}
                        </h3>
                        
                        <div style={{ fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '1rem' }}>
                          {coord.department || 'CSE'} Department • {coord.year || '3rd Year'}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                          {coord.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#f1f5f9' : '#0f172a', fontWeight: '700' }}>
                              <FaPhoneAlt size={12} style={{ color: '#39FF88', flexShrink: 0 }} />
                              <a href={`tel:${cleanPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                {coord.phone}
                              </a>
                            </div>
                          )}
                          {coord.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#cbd5e1' : '#334155' }}>
                              <FaEnvelope size={12} style={{ color: '#38bdf8', flexShrink: 0 }} />
                              <span style={{ wordBreak: 'break-all' }}>{coord.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Direct Contact Buttons (Call & WhatsApp) */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem', paddingTop: '1rem', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}` }}>
                        {cleanPhone ? (
                          <a
                            href={`tel:${cleanPhone}`}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '0.65rem 0.85rem',
                              borderRadius: '8px',
                              background: isDark ? 'rgba(57, 255, 136, 0.15)' : '#ecfdf5',
                              color: isDark ? '#39FF88' : '#047857',
                              border: '1px solid rgba(57, 255, 136, 0.35)',
                              fontWeight: '800',
                              fontSize: '0.82rem',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease'
                            }}
                            title={`Call ${coord.name} (${cleanPhone})`}
                          >
                            <FaPhoneAlt size={12} /> CALL NOW
                          </a>
                        ) : null}

                        {cleanWhatsapp ? (
                          <a
                            href={`https://wa.me/${cleanWhatsapp}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '0.65rem 0.85rem',
                              borderRadius: '8px',
                              background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              fontWeight: '800',
                              fontSize: '0.82rem',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease'
                            }}
                            title="Chat on WhatsApp"
                          >
                            <FaWhatsapp size={14} /> WHATSAPP
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {currentEventTeam.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: '3rem 1.5rem', textAlign: 'center', background: isDark ? 'rgba(8, 18, 10, 0.6)' : '#ffffff', borderRadius: '16px', border: `1px solid ${isDark ? 'rgba(57, 255, 136, 0.15)' : '#e2e8f0'}` }}>
                    <FaUserTie size={36} style={{ color: '#39FF88', opacity: 0.5, marginBottom: '0.75rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', color: isDark ? '#ffffff' : '#0f172a' }}>No Coordinators Configured Yet</h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                      Symposium administrators have not assigned coordinator profiles to {currentEvent.name} yet. Coordinators can be added in the Admin Dashboard under the Members tab.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: VENUE PHOTOS MANAGEMENT (Allocated Event Only) */}
          {/* ======================================================== */}
          {activeTab === 'venue-photos' && (
            <div style={S.tabView}>
              <div style={S.viewHeroBanner} className="coord-hero-banner">
                <div style={S.heroBannerContent}>
                  <div style={{ ...S.heroBadge, background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', borderColor: 'rgba(236, 72, 153, 0.35)' }}>
                    <FaCamera /> VENUE PHOTOS MANAGEMENT
                  </div>
                  <h1 style={S.heroTitle}>{currentEvent.name} — Venue Hall Photos</h1>
                  <p style={S.heroDesc}>
                    Upload, preview, and update the official venue arena photograph and exact hall details for your allocated event <strong>{currentEvent.name}</strong>. Updates made here are immediately published on public event cards and the venue popup modal for all participants.
                  </p>
                  <div style={S.heroMetaRow}>
                    <span style={S.metaChip}>
                      <FaMapMarkerAlt style={{ color: '#39FF88' }} /> {venueHallName || currentEvent.venue || 'Designated Campus Venue'}
                    </span>
                    <span style={{
                      ...S.metaChip,
                      background: venuePhotoPreview ? 'rgba(57, 255, 136, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: venuePhotoPreview ? '#39FF88' : '#f87171',
                      borderColor: venuePhotoPreview ? 'rgba(57, 255, 136, 0.4)' : 'rgba(239, 68, 68, 0.35)'
                    }}>
                      <FaCamera /> {venuePhotoPreview ? 'Photo Live & Published' : 'No Photo Uploaded'}
                    </span>
                    <span style={S.metaChip}>
                      <FaBuilding style={{ color: '#38bdf8' }} /> {currentEvent.category === 'technical' ? 'Technical Lab' : 'Non-Technical Arena'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCoordinatorVenueModal(true)}
                      style={{
                        ...S.metaChip,
                        background: 'rgba(56, 189, 248, 0.16)',
                        color: '#38bdf8',
                        borderColor: 'rgba(56, 189, 248, 0.4)',
                        cursor: 'pointer',
                        fontWeight: '700'
                      }}
                      title="Test how participants see this photo"
                    >
                      <FaEye /> Preview Public Modal
                    </button>
                  </div>
                </div>
              </div>

              {/* Two-Column Management Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                {/* Column 1: Live Public Photo Preview */}
                <div style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${isDark ? 'rgba(57, 255, 136, 0.15)' : '#e2e8f0'}` }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: isDark ? '#ffffff' : '#0f172a' }}>
                      <FaEye style={{ color: '#39FF88' }} /> Public Participant Preview
                    </h3>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '0.2rem 0.55rem', borderRadius: '6px', background: isDark ? 'rgba(57, 255, 136, 0.1)' : '#ecfdf5', color: isDark ? '#39FF88' : '#047857' }}>
                      LIVE SYNC
                    </span>
                  </div>

                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.84rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                    Participants viewing <strong>{currentEvent.name}</strong> on the website will see this venue photo when clicking the "Photo" button on the event card.
                  </p>

                  {venuePhotoPreview ? (
                    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid rgba(57, 255, 136, 0.35)', background: '#000000' }}>
                      <img
                        src={venuePhotoPreview}
                        alt={venueHallName || currentEvent.name}
                        style={{
                          width: '100%',
                          height: '240px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        pointerEvents: 'none'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            background: 'rgba(57, 255, 136, 0.9)',
                            color: '#000000',
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '999px',
                            letterSpacing: '0.5px'
                          }}>
                            OFFICIAL VENUE
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowCoordinatorVenueModal(true)}
                            style={{
                              pointerEvents: 'auto',
                              background: 'rgba(0, 0, 0, 0.65)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              color: '#ffffff',
                              borderRadius: '6px',
                              padding: '0.3rem 0.65rem',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FaEye size={11} /> Enlarge
                          </button>
                        </div>

                        <div>
                          <div style={{ color: '#39FF88', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {currentEvent.name}
                          </div>
                          <h4 style={{ margin: '0.2rem 0 0 0', color: '#ffffff', fontSize: '1.1rem', fontWeight: '800' }}>
                            {venueHallName || currentEvent.venue || 'Designated Campus Venue'}
                          </h4>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '2.5rem 1.5rem',
                      textAlign: 'center',
                      background: isDark ? 'rgba(0, 0, 0, 0.4)' : '#f8fafc',
                      borderRadius: '12px',
                      border: `1.5px dashed ${isDark ? 'rgba(57, 255, 136, 0.25)' : '#cbd5e1'}`
                    }}>
                      <div style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        background: 'rgba(236, 72, 153, 0.12)',
                        border: '1px solid rgba(236, 72, 153, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem auto'
                      }}>
                        <FaCamera size={22} style={{ color: '#ec4899' }} />
                      </div>
                      <h4 style={{ margin: '0 0 0.35rem 0', color: isDark ? '#ffffff' : '#0f172a', fontWeight: '800' }}>
                        No Venue Photo Set
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', maxWidth: '320px', marginInline: 'auto' }}>
                        Upload a photo on the right so participants can easily recognize the room, lab, or arena on symposium day.
                      </p>
                    </div>
                  )}

                  {/* Event Card Simulation Preview */}
                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: isDark ? 'rgba(0, 0, 0, 0.25)' : '#f1f5f9', borderRadius: '10px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}` }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                      Card Preview on Homepage & Events Page
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? '#060d08' : '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(57, 255, 136, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a' }}>Venue:</span>
                        <span style={{ fontSize: '0.8rem', color: isDark ? '#cbd5e1' : '#475569', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {venueHallName || currentEvent.venue || 'CSE Department Labs'}
                        </span>
                      </div>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        background: venuePhotoPreview ? 'rgba(57, 255, 136, 0.14)' : 'rgba(255, 255, 255, 0.07)',
                        color: venuePhotoPreview ? '#39FF88' : '#94a3b8',
                        border: venuePhotoPreview ? '1px solid rgba(57, 255, 136, 0.35)' : '1px solid rgba(255, 255, 255, 0.12)',
                        flexShrink: 0
                      }}>
                        <FaCamera size={10} />
                        <span>{venuePhotoPreview ? 'Photo' : 'Venue'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Upload & Management Form */}
                <div style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `1px solid ${isDark ? 'rgba(57, 255, 136, 0.15)' : '#e2e8f0'}` }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: isDark ? '#ffffff' : '#0f172a' }}>
                      <FaUpload style={{ color: '#ec4899' }} /> Upload & Edit Venue Details
                    </h3>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' }}>
                      {currentEvent.id.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    {/* Venue Hall Name Input */}
                    <div>
                      <label style={S.formLabel}>
                        <FaMapMarkerAlt style={{ color: '#39FF88', marginRight: '4px' }} /> Venue Hall Name & Floor / Arena
                      </label>
                      <input
                        type="text"
                        value={venueHallName}
                        onChange={(e) => setVenueHallName(e.target.value)}
                        placeholder="e.g. Main CSE Lab 1 (Ground Floor, Room 104)"
                        style={S.formInput}
                      />
                      <div style={{ fontSize: '0.72rem', color: isDark ? '#64748b' : '#94a3b8', marginTop: '4px' }}>
                        Specific hall or room name where participants must report.
                      </div>
                    </div>

                    {/* File Upload Drop Area */}
                    <div>
                      <label style={S.formLabel}>
                        <FaImage style={{ color: '#ec4899', marginRight: '4px' }} /> Upload Image File from Device
                      </label>
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.25rem 1rem',
                        borderRadius: '10px',
                        background: isDark ? 'rgba(236, 72, 153, 0.06)' : '#fdf2f8',
                        border: `1.5px dashed ${isDark ? 'rgba(236, 72, 153, 0.35)' : '#f472b6'}`,
                        cursor: isUploadingVenuePhoto ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handlePhotoFileSelect}
                          disabled={isUploadingVenuePhoto}
                          style={{ display: 'none' }}
                        />
                        <FaUpload size={22} style={{ color: '#ec4899', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: isDark ? '#ffffff' : '#0f172a' }}>
                          {isUploadingVenuePhoto ? 'Reading image...' : 'Click to Browse or Drag Image Here'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                          Supports PNG, JPG, JPEG, WEBP (Max 8MB)
                        </div>
                      </label>
                    </div>

                    {/* Image URL Input */}
                    <div>
                      <label style={S.formLabel}>
                        <FaGlobe style={{ color: '#38bdf8', marginRight: '4px' }} /> Or Paste Image Web URL
                      </label>
                      <input
                        type="url"
                        value={venuePhotoInput.startsWith('data:') ? '' : venuePhotoInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVenuePhotoInput(val);
                          setVenuePhotoPreview(val);
                        }}
                        placeholder="https://images.unsplash.com/... or https://..."
                        style={S.formInput}
                      />
                      <div style={{ fontSize: '0.72rem', color: isDark ? '#64748b' : '#94a3b8', marginTop: '4px' }}>
                        Paste any high-resolution image link from Unsplash, Imgur, or college CDN.
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9'}` }}>
                      <button
                        type="button"
                        onClick={handleSaveVenuePhoto}
                        disabled={isSavingVenuePhoto || isUploadingVenuePhoto}
                        style={{
                          ...S.btnPrimary,
                          flex: '1 1 180px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <FaCheck /> {isSavingVenuePhoto ? 'Publishing...' : 'Save & Publish Venue Photo'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCoordinatorVenueModal(true)}
                        style={{
                          ...S.btnSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <FaEye /> Test Modal
                      </button>

                      {venuePhotoPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveVenuePhoto}
                          disabled={isSavingVenuePhoto}
                          style={{
                            background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2',
                            color: isDark ? '#f87171' : '#dc2626',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            borderRadius: '8px',
                            padding: '0.65rem 0.95rem',
                            fontSize: '0.84rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          title="Remove venue photo"
                        >
                          <FaTrash size={12} /> Remove
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const original = currentEvent.venueImage || currentEvent.venue_image || '';
                          setVenuePhotoInput(original);
                          setVenuePhotoPreview(original);
                          setVenueHallName(currentEvent.venue || '');
                          toast.success('Reset to saved values');
                        }}
                        style={{
                          background: 'transparent',
                          color: isDark ? '#94a3b8' : '#64748b',
                          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'}`,
                          borderRadius: '8px',
                          padding: '0.65rem 0.85rem',
                          fontSize: '0.84rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        <FaSyncAlt size={11} style={{ marginRight: '4px' }} /> Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Edit Event Details & Rounds Modal ── */}
      {isEditEventModalOpen && (
        <div style={S.modalOverlay}>
          <div style={S.modalBox}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>
                <FaEdit style={{ color: '#39FF88' }} /> Edit Event Rounds & Details — {currentEvent.name}
              </h3>
              <button onClick={() => setIsEditEventModalOpen(false)} style={S.modalCloseBtn}>
                <FaTimes size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEventDetails} style={S.modalForm}>
              <div style={S.formGrid}>
                <div style={S.formField}>
                  <label style={S.formLabel}>Allocated Venue</label>
                  <input
                    type="text"
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    placeholder="e.g. Lab 3 / Seminar Hall"
                    style={S.formInput}
                    required
                  />
                </div>

                <div style={S.formField}>
                  <label style={S.formLabel}>Time Schedule</label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    placeholder="e.g. 10:00 AM - 1:00 PM"
                    style={S.formInput}
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.85rem' }}>
                <label style={S.formLabel}>Event Rounds (One round per line)</label>
                <textarea
                  rows={4}
                  value={editRoundsText}
                  onChange={(e) => setEditRoundsText(e.target.value)}
                  placeholder="Round 1: Preliminary Quiz\nRound 2: Problem Solving\nRound 3: Final Presentation"
                  style={S.formTextarea}
                />
              </div>

              <div style={{ marginTop: '0.85rem' }}>
                <label style={S.formLabel}>Rules & Guidelines (One rule per line)</label>
                <textarea
                  rows={4}
                  value={editRulesText}
                  onChange={(e) => setEditRulesText(e.target.value)}
                  placeholder="1. College ID card is mandatory.\n2. Decision of judges will be final."
                  style={S.formTextarea}
                />
              </div>

              <div style={{ marginTop: '0.85rem' }}>
                <label style={S.formLabel}>Conductor / Coordinator Special Notes (Optional)</label>
                <input
                  type="text"
                  value={editConductorNotes}
                  onChange={(e) => setEditConductorNotes(e.target.value)}
                  placeholder="e.g. Bring your own laptops with Python installed"
                  style={S.formInput}
                />
              </div>

              <div style={S.modalActionRow}>
                <button
                  type="button"
                  onClick={() => setIsEditEventModalOpen(false)}
                  style={S.btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEvent}
                  style={S.btnPrimary}
                >
                  {isSavingEvent ? 'Saving Changes...' : 'Save & Publish Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Coordinator Venue Photo Test Modal ── */}
      <VenueImageModal
        isOpen={showCoordinatorVenueModal}
        onClose={() => setShowCoordinatorVenueModal(false)}
        event={{
          ...currentEvent,
          venue: venueHallName || currentEvent.venue,
          venueImage: venuePhotoPreview || currentEvent.venueImage
        }}
      />
    </div>
  );
}

// ── High-Tech Cyberpunk & Sleek Responsive Styles ──
function getCoordinatorStyles(isDark) {
  const bg = isDark ? '#050a06' : '#f8fafc';
  const headerBg = isDark ? 'rgba(5, 12, 7, 0.92)' : 'rgba(255, 255, 255, 0.95)';
  const sidebarBg = isDark ? '#060d08' : '#ffffff';
  const cardBg = isDark ? 'rgba(8, 18, 10, 0.75)' : '#ffffff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const border = isDark ? 'rgba(57, 255, 136, 0.16)' : 'rgba(0, 0, 0, 0.08)';
  const green = '#39FF88';

  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: bg,
      color: text,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1.5rem',
      background: headerBg,
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${border}`,
      position: 'sticky',
      top: 0,
      zIndex: 100
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    mobileMenuBtn: {
      display: 'none',
      background: 'transparent',
      border: 'none',
      color: text,
      cursor: 'pointer',
      padding: '0.4rem'
    },
    brandLogoGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    brandIconBadge: {
      width: '34px',
      height: '34px',
      borderRadius: '8px',
      background: 'rgba(57, 255, 136, 0.12)',
      border: '1px solid rgba(57, 255, 136, 0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    brandTitle: {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '0.95rem',
      fontWeight: '800',
      letterSpacing: '0.04em',
      color: isDark ? '#ffffff' : '#0f172a'
    },
    brandSub: {
      fontSize: '0.68rem',
      color: green,
      fontWeight: '700',
      letterSpacing: '0.08em'
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.85rem'
    },
    eventSelectorWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.45rem',
      background: isDark ? 'rgba(0, 0, 0, 0.35)' : '#f1f5f9',
      padding: '0.25rem 0.65rem',
      borderRadius: '8px',
      border: `1px solid ${border}`
    },
    eventSelectorLabel: {
      fontSize: '0.66rem',
      fontWeight: '800',
      color: green,
      letterSpacing: '0.05em'
    },
    eventSelectDropdown: {
      background: 'transparent',
      border: 'none',
      color: isDark ? '#ffffff' : '#0f172a',
      fontSize: '0.82rem',
      fontWeight: '700',
      outline: 'none',
      cursor: 'pointer'
    },
    themeBtn: {
      background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
      border: `1px solid ${border}`,
      borderRadius: '8px',
      width: '34px',
      height: '34px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    },
    userBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.35rem 0.75rem',
      borderRadius: '20px',
      background: isDark ? 'rgba(57, 255, 136, 0.08)' : 'rgba(57, 255, 136, 0.15)',
      border: '1px solid rgba(57, 255, 136, 0.3)',
      fontSize: '0.78rem',
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#047857'
    },
    logoutBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.4rem 0.85rem',
      borderRadius: '8px',
      background: 'rgba(239, 68, 68, 0.12)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#ef4444',
      fontSize: '0.78rem',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    layoutBody: {
      display: 'flex',
      flex: 1
    },
    sidebar: {
      width: '260px',
      flexShrink: 0,
      background: sidebarBg,
      borderRight: `1px solid ${border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0.85rem'
    },
    sidebarMobileOpen: {
      display: 'flex'
    },
    sidebarHeader: {
      marginBottom: '1.25rem',
      paddingBottom: '0.75rem',
      borderBottom: `1px solid ${border}`
    },
    sidebarEventBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: isDark ? 'rgba(57, 255, 136, 0.08)' : 'rgba(57, 255, 136, 0.12)',
      padding: '0.5rem 0.75rem',
      borderRadius: '8px',
      border: '1px solid rgba(57, 255, 136, 0.25)'
    },
    sidebarEventDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: green,
      boxShadow: '0 0 8px #39FF88'
    },
    sidebarEventName: {
      fontSize: '0.82rem',
      fontWeight: '800',
      color: isDark ? '#ffffff' : '#0f172a',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    navMenu: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.45rem',
      flex: 1
    },
    navItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.65rem 0.85rem',
      borderRadius: '8px',
      background: 'transparent',
      border: '1px solid transparent',
      color: isDark ? '#94a3b8' : '#64748b',
      fontSize: '0.84rem',
      fontWeight: '600',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s ease'
    },
    navItemActive: {
      background: isDark ? 'rgba(57, 255, 136, 0.12)' : 'rgba(57, 255, 136, 0.18)',
      color: isDark ? '#ffffff' : '#047857',
      border: '1px solid rgba(57, 255, 136, 0.35)',
      fontWeight: '700'
    },
    navIcon: {
      fontSize: '1rem',
      color: green
    },
    badgeCount: {
      padding: '0.15rem 0.5rem',
      borderRadius: '12px',
      background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
      color: text,
      fontSize: '0.7rem',
      fontWeight: '800'
    },
    badgePill: {
      padding: '0.15rem 0.55rem',
      borderRadius: '6px',
      background: 'rgba(57, 255, 136, 0.15)',
      color: green,
      fontSize: '0.66rem',
      fontWeight: '800',
      letterSpacing: '0.04em'
    },
    sidebarFooter: {
      marginTop: 'auto',
      paddingTop: '1rem',
      borderTop: `1px solid ${border}`
    },
    allocatedInfoBox: {
      background: isDark ? 'rgba(0, 0, 0, 0.3)' : '#f8fafc',
      padding: '0.6rem 0.75rem',
      borderRadius: '6px',
      border: `1px solid ${border}`
    },
    mainContent: {
      flex: 1,
      padding: '1.75rem',
      overflowY: 'auto'
    },
    tabView: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    viewHeroBanner: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1.5rem',
      padding: '2rem',
      borderRadius: '14px',
      background: isDark 
        ? 'linear-gradient(135deg, rgba(8, 24, 12, 0.9) 0%, rgba(3, 10, 5, 0.95) 100%)' 
        : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      border: `1px solid ${border}`,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      marginBottom: '1.75rem',
      position: 'relative',
      overflow: 'hidden'
    },
    heroBannerContent: {
      flex: 1
    },
    heroBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.25rem 0.65rem',
      borderRadius: '20px',
      background: 'rgba(57, 255, 136, 0.15)',
      color: green,
      fontSize: '0.72rem',
      fontWeight: '800',
      letterSpacing: '0.06em',
      marginBottom: '0.75rem'
    },
    heroTitle: {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '1.85rem',
      fontWeight: '900',
      margin: '0 0 0.5rem 0',
      letterSpacing: '0.02em',
      color: isDark ? '#ffffff' : '#064e3b'
    },
    heroDesc: {
      fontSize: '0.9rem',
      color: isDark ? '#94a3b8' : '#475569',
      margin: '0 0 1.25rem 0',
      lineHeight: '1.5'
    },
    heroMetaRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.65rem'
    },
    metaChip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.35rem 0.75rem',
      borderRadius: '6px',
      background: isDark ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
      border: `1px solid ${border}`,
      fontSize: '0.78rem',
      fontWeight: '600'
    },
    heroActions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      flexShrink: 0
    },
    btnPrimaryHero: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.35rem',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #00C84B 0%, #008732 100%)',
      color: '#ffffff',
      border: 'none',
      fontSize: '0.86rem',
      fontWeight: '800',
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(0, 200, 75, 0.35)',
      transition: 'all 0.2s ease'
    },
    btnSecondaryHero: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      padding: '0.65rem 1.25rem',
      borderRadius: '8px',
      background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
      color: text,
      border: `1px solid ${border}`,
      fontSize: '0.84rem',
      fontWeight: '700',
      cursor: 'pointer'
    },
    metricGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '1.25rem',
      marginBottom: '1.75rem'
    },
    metricCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1.35rem',
      borderRadius: '12px',
      background: cardBg,
      border: `1px solid ${border}`,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
    },
    metricIconWrap: {
      width: '46px',
      height: '46px',
      borderRadius: '10px',
      background: 'rgba(56, 189, 248, 0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem'
    },
    metricLabel: {
      fontSize: '0.78rem',
      fontWeight: '700',
      color: isDark ? '#94a3b8' : '#64748b'
    },
    metricVal: {
      fontSize: '1.65rem',
      fontWeight: '900',
      color: isDark ? '#ffffff' : '#0f172a',
      lineHeight: '1.2',
      margin: '0.15rem 0'
    },
    metricSub: {
      fontSize: '0.72rem',
      color: isDark ? '#64748b' : '#94a3b8'
    },
    twoColGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
      gap: '1.5rem'
    },
    cardBox: {
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.25rem',
      borderBottom: `1px solid ${border}`,
      background: isDark ? 'rgba(0, 0, 0, 0.25)' : '#f8fafc'
    },
    cardTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.95rem',
      fontWeight: '800',
      color: isDark ? '#ffffff' : '#0f172a'
    },
    cardBody: {
      padding: '1.25rem'
    },
    conductorList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem'
    },
    conductorItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.85rem',
      padding: '0.75rem',
      borderRadius: '8px',
      background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
      border: `1px solid ${border}`
    },
    conductorAvatar: {
      width: '38px',
      height: '38px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #00A83B 0%, #032b11 100%)',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '800',
      fontSize: '0.85rem'
    },
    conductorName: {
      fontSize: '0.9rem',
      fontWeight: '800',
      color: isDark ? '#ffffff' : '#0f172a'
    },
    conductorRole: {
      fontSize: '0.74rem',
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: '0.35rem'
    },
    conductorContactRow: {
      display: 'flex',
      gap: '0.5rem'
    },
    contactChip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.2rem 0.5rem',
      borderRadius: '4px',
      background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
      color: text,
      fontSize: '0.72rem',
      fontWeight: '600',
      textDecoration: 'none'
    },
    roundStepsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    },
    roundStepCard: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      padding: '0.75rem',
      borderRadius: '8px',
      background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
      border: `1px solid ${border}`
    },
    roundStepBadge: {
      width: '26px',
      height: '26px',
      borderRadius: '6px',
      background: 'rgba(57, 255, 136, 0.15)',
      color: green,
      fontWeight: '800',
      fontSize: '0.76rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    roundStepContent: {
      flex: 1
    },
    roundStepTitle: {
      fontSize: '0.86rem',
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#0f172a'
    },
    roundStepDesc: {
      fontSize: '0.76rem',
      color: isDark ? '#94a3b8' : '#64748b',
      marginTop: '0.2rem'
    },
    sectionHeadingRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    sectionHeadingTitle: {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '1.45rem',
      fontWeight: '800',
      margin: 0,
      color: isDark ? '#ffffff' : '#0f172a'
    },
    sectionHeadingSub: {
      fontSize: '0.84rem',
      color: isDark ? '#94a3b8' : '#64748b',
      margin: '0.25rem 0 0 0'
    },
    filterBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      marginBottom: '1.25rem',
      flexWrap: 'wrap'
    },
    searchWrap: {
      position: 'relative',
      flex: 1,
      minWidth: '280px'
    },
    searchIcon: {
      position: 'absolute',
      left: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: isDark ? '#64748b' : '#94a3b8',
      fontSize: '0.85rem'
    },
    searchInput: {
      width: '100%',
      padding: '0.65rem 2.25rem 0.65rem 2.5rem',
      borderRadius: '8px',
      background: isDark ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
      border: `1px solid ${border}`,
      color: text,
      fontSize: '0.84rem',
      outline: 'none',
      boxSizing: 'border-box'
    },
    clearSearchBtn: {
      position: 'absolute',
      right: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'transparent',
      border: 'none',
      color: '#94a3b8',
      cursor: 'pointer'
    },
    filterGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    filterLabel: {
      fontSize: '0.76rem',
      fontWeight: '700',
      color: isDark ? '#94a3b8' : '#64748b'
    },
    filterSelect: {
      padding: '0.55rem 0.85rem',
      borderRadius: '8px',
      background: isDark ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
      border: `1px solid ${border}`,
      color: text,
      fontSize: '0.8rem',
      fontWeight: '600',
      outline: 'none'
    },
    participantGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '1.25rem'
    },
    participantCard: {
      background: cardBg,
      border: `1px solid ${border}`,
      borderRadius: '10px',
      padding: '1.25rem',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem'
    },
    partCardHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '0.75rem'
    },
    partName: {
      fontSize: '1rem',
      fontWeight: '800',
      color: isDark ? '#ffffff' : '#0f172a'
    },
    partIdBadge: {
      display: 'inline-block',
      padding: '0.15rem 0.5rem',
      borderRadius: '4px',
      background: 'rgba(57, 255, 136, 0.1)',
      color: green,
      fontFamily: 'monospace',
      fontSize: '0.72rem',
      fontWeight: '700',
      marginTop: '0.2rem'
    },
    attendanceToggleBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.35rem 0.65rem',
      borderRadius: '20px',
      border: '1px solid',
      fontSize: '0.72rem',
      fontWeight: '800',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      flexShrink: 0
    },
    partDetailsBox: {
      background: isDark ? 'rgba(0, 0, 0, 0.25)' : '#f8fafc',
      padding: '0.65rem 0.85rem',
      borderRadius: '6px',
      border: `1px solid ${border}`,
      fontSize: '0.78rem'
    },
    partDetailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.2rem 0'
    },
    detailKey: {
      color: isDark ? '#94a3b8' : '#64748b',
      fontWeight: '600'
    },
    detailVal: {
      color: text,
      fontWeight: '700',
      textAlign: 'right'
    },
    partActionRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginTop: 'auto'
    },
    btnDirectCall: {
      flex: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.4rem',
      padding: '0.55rem',
      borderRadius: '6px',
      background: 'linear-gradient(135deg, #00C84B 0%, #008732 100%)',
      color: '#ffffff',
      fontSize: '0.78rem',
      fontWeight: '800',
      textDecoration: 'none',
      boxShadow: '0 2px 8px rgba(0, 200, 75, 0.25)'
    },
    btnDirectWhatsapp: {
      width: '34px',
      height: '34px',
      borderRadius: '6px',
      background: 'rgba(16, 185, 129, 0.15)',
      border: '1px solid rgba(16, 185, 129, 0.35)',
      color: '#10b981',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none'
    },
    btnDirectEmail: {
      width: '34px',
      height: '34px',
      borderRadius: '6px',
      background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
      border: `1px solid ${border}`,
      color: text,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none'
    },
    winnerFormSection: {
      borderLeft: '4px solid #eab308',
      background: isDark ? 'rgba(0, 0, 0, 0.25)' : '#f8fafc',
      borderRadius: '8px',
      padding: '1.25rem',
      marginBottom: '1.25rem',
      border: `1px solid ${border}`,
      borderLeftWidth: '4px'
    },
    winnerRankHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.85rem'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '0.85rem'
    },
    formFieldFull: {
      gridColumn: '1 / -1',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem'
    },
    formField: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem'
    },
    formLabel: {
      fontSize: '0.78rem',
      fontWeight: '700',
      color: isDark ? '#cbd5e1' : '#334155'
    },
    formInput: {
      padding: '0.65rem 0.85rem',
      borderRadius: '6px',
      background: isDark ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
      border: `1px solid ${border}`,
      color: text,
      fontSize: '0.84rem',
      outline: 'none'
    },
    formTextarea: {
      width: '100%',
      padding: '0.65rem 0.85rem',
      borderRadius: '6px',
      background: isDark ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
      border: `1px solid ${border}`,
      color: text,
      fontSize: '0.84rem',
      outline: 'none',
      fontFamily: 'inherit',
      boxSizing: 'border-box'
    },
    btnSubmitWinners: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.65rem',
      padding: '0.85rem 1.75rem',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
      color: '#000000',
      border: 'none',
      fontSize: '0.9rem',
      fontWeight: '900',
      cursor: 'pointer',
      boxShadow: '0 4px 16px rgba(234, 179, 8, 0.35)'
    },
    submissionStatusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.45rem 0.95rem',
      borderRadius: '20px',
      background: 'rgba(16, 185, 129, 0.15)',
      border: '1px solid rgba(16, 185, 129, 0.4)',
      color: '#10b981',
      fontSize: '0.78rem',
      fontWeight: '800',
      letterSpacing: '0.04em'
    },
    winnerCardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '1.25rem'
    },
    winnerSummaryCard: {
      background: isDark ? 'rgba(0, 0, 0, 0.3)' : '#f8fafc',
      borderRadius: '8px',
      padding: '1rem',
      border: `1px solid ${border}`
    },
    winnerCardHead: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${border}`,
      paddingBottom: '0.65rem',
      marginBottom: '0.75rem'
    },
    winnerPlacesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.45rem',
      fontSize: '0.82rem'
    },
    winnerPlaceItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.45rem',
      flexWrap: 'wrap'
    },
    detailsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
      gap: '1.5rem'
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.45rem 0',
      borderBottom: `1px dashed ${border}`,
      fontSize: '0.84rem'
    },
    infoLabel: {
      color: isDark ? '#94a3b8' : '#64748b',
      fontWeight: '600'
    },
    infoValue: {
      fontWeight: '700',
      color: text,
      textAlign: 'right'
    },
    rulesList: {
      margin: 0,
      padding: 0,
      listStyle: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    ruleItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.5rem',
      fontSize: '0.84rem',
      lineHeight: '1.4'
    },
    btnPrimary: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.6rem 1.15rem',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #00C84B 0%, #008732 100%)',
      color: '#ffffff',
      border: 'none',
      fontSize: '0.82rem',
      fontWeight: '800',
      cursor: 'pointer'
    },
    btnPrimarySmall: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.45rem 0.85rem',
      borderRadius: '6px',
      background: 'linear-gradient(135deg, #00C84B 0%, #008732 100%)',
      color: '#ffffff',
      border: 'none',
      fontSize: '0.78rem',
      fontWeight: '800',
      cursor: 'pointer'
    },
    btnSecondary: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.6rem 1.15rem',
      borderRadius: '8px',
      background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
      color: text,
      border: `1px solid ${border}`,
      fontSize: '0.82rem',
      fontWeight: '700',
      cursor: 'pointer'
    },
    btnSmallOutline: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.3rem 0.65rem',
      borderRadius: '6px',
      background: 'transparent',
      color: isDark ? '#39FF88' : '#047857',
      border: '1px solid rgba(57, 255, 136, 0.35)',
      fontSize: '0.74rem',
      fontWeight: '700',
      cursor: 'pointer'
    },
    emptyBox: {
      textAlign: 'center',
      padding: '2.5rem 1rem',
      color: isDark ? '#94a3b8' : '#64748b'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '1rem'
    },
    modalBox: {
      width: '100%',
      maxWidth: '620px',
      maxHeight: '90vh',
      overflowY: 'auto',
      background: isDark ? '#0b160e' : '#ffffff',
      border: `1px solid ${border}`,
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)'
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `1px solid ${border}`,
      paddingBottom: '0.85rem',
      marginBottom: '1rem'
    },
    modalTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1.05rem',
      fontWeight: '800',
      margin: 0,
      color: isDark ? '#ffffff' : '#0f172a'
    },
    modalCloseBtn: {
      background: 'transparent',
      border: 'none',
      color: '#94a3b8',
      cursor: 'pointer',
      padding: '0.25rem'
    },
    modalForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.85rem'
    },
    modalActionRow: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '0.75rem',
      marginTop: '1.25rem',
      paddingTop: '0.85rem',
      borderTop: `1px solid ${border}`
    }
  };
}
