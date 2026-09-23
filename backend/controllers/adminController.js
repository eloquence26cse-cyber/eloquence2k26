const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');
const { broadcastRegistrationUpdate } = require('../config/websocket');
const { saveBase64ImageIfPresent } = require('../utils/imageStorage');
const JWT_SECRET = process.env.JWT_SECRET || 'eloquence2k26_default_secure_jwt_secret_key';

const usersFilePath = path.join(__dirname, '../data/users.json');
const rolesFilePath = path.join(__dirname, '../data/roles.json');
const eventsFilePath = path.join(__dirname, '../data/events.json');
const sponsorsFilePath = path.join(__dirname, '../data/sponsors.json');
const coordinatorsFilePath = path.join(__dirname, '../data/coordinators.json');
const homepageCoordinatorsFilePath = path.join(__dirname, '../data/homepage_coordinators.json');
const frontendStudentCoordinatorsFilePath = path.join(__dirname, '../../frontend/src/data/studentCoordinators.json');
const settingsFilePath = path.join(__dirname, '../data/settings.json');

function getSettingsData() {
  try {
    if (!fs.existsSync(settingsFilePath)) {
      const defaultSettings = {
        isRegistrationClosed: false,
        closedReason: 'Registrations for ELOQUENCE 2026 are officially closed. Thank you for your overwhelming interest!',
        closedAt: null,
        closedBy: null,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
      return defaultSettings;
    }
    const raw = fs.readFileSync(settingsFilePath, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    return {
      isRegistrationClosed: false,
      closedReason: 'Registrations for ELOQUENCE 2026 are officially closed. Thank you for your overwhelming interest!',
      closedAt: null,
      closedBy: null
    };
  }
}

function saveSettingsData(data) {
  try {
    fs.writeFileSync(settingsFilePath, JSON.stringify(data, null, 2), 'utf-8');
    try {
      const apiCtrl = require('./apiController');
      if (apiCtrl && apiCtrl.invalidateSettingsCache) apiCtrl.invalidateSettingsCache();
    } catch (_) {}
    return true;
  } catch (err) {
    return false;
  }
}


// ==================== DATA MAPPER HELPERS ====================
const dbToSponsor = (s) => {
  let website = s.website || '';
  let locationUrl = s.location_url || s.locationUrl || '';

  if (website.includes('::loc::')) {
    const parts = website.split('::loc::');
    website = parts[0] || '';
    locationUrl = parts[1] || '';
  } else if (!locationUrl && (/maps|goo\.gl/i.test(website) || /google\.com\/maps/i.test(website))) {
    locationUrl = website;
    website = '';
  }

  return {
    id: s.id,
    name: s.name,
    companyName: s.company_name || s.companyName || '',
    logo: s.logo || '',
    description: s.description || '',
    website,
    locationUrl,
    contactName: s.contact_name || s.contactName || '',
    contactEmail: s.contact_email || s.contactEmail || '',
    contactPhone: s.contact_phone || s.contactPhone || '',
    category: s.category || 'Elite',
    displayOrder: Number(s.display_order ?? s.displayOrder ?? 999),
    isActive: s.is_active !== false && s.isActive !== false,
    createdAt: s.created_at || s.createdAt,
    updatedAt: s.updated_at || s.updatedAt
  };
};

const sponsorToDb = (s) => {
  const website = s.website || '';
  const locationUrl = s.locationUrl || s.location_url || '';
  let dbWebsite = website;
  if (website && locationUrl) {
    dbWebsite = `${website}::loc::${locationUrl}`;
  } else if (!website && locationUrl) {
    dbWebsite = locationUrl;
  }

  return {
    id: s.id,
    name: s.name,
    company_name: s.companyName || s.company_name || '',
    logo: s.logo || '',
    description: s.description || '',
    website: dbWebsite,
    contact_name: s.contactName || s.contact_name || '',
    contact_email: s.contactEmail || s.contact_email || '',
    contact_phone: s.contactPhone || s.contact_phone || '',
    category: s.category || 'Elite',
    display_order: Number(s.displayOrder ?? s.display_order ?? 999),
    is_active: s.isActive !== false && s.is_active !== false,
    updated_at: new Date().toISOString()
  };
};

const dbToCoordinator = (c) => {
  let game = c.game || '';
  let events = [];
  const rawList = Array.isArray(c.assigned_events) ? c.assigned_events : (Array.isArray(c.assignedEvents) ? c.assignedEvents : []);
  for (const item of rawList) {
    if (typeof item === 'string' && item.startsWith('game:')) {
      if (!game) game = item.replace('game:', '').trim();
    } else if (item && typeof item === 'object' && item.game) {
      if (!game) game = item.game;
      if (item.eventId) events.push(item.eventId);
    } else if (item && typeof item === 'string') {
      events.push(item.trim());
    }
  }
  if (!game && c.id) {
    try {
      const localCoords = getCoordinatorsData();
      const match = localCoords.find(lc => lc.id === c.id);
      if (match && match.game) game = match.game;
    } catch (_) {}
  }
  return {
    id: c.id,
    name: c.name,
    phone: c.phone || '',
    whatsapp: c.whatsapp || '',
    email: c.email || '',
    department: c.department || '',
    year: c.year || '',
    role: c.role || 'Lead Coordinator',
    game: game || c.game || '',
    assignedEvents: events,
    displayOrder: Number(c.display_order ?? c.displayOrder ?? 999),
    isActive: c.is_active !== false && c.isActive !== false,
    createdAt: c.created_at || c.createdAt,
    updatedAt: c.updated_at || c.updatedAt
  };
};

const coordinatorToDb = (c) => {
  let assigned_events = Array.isArray(c.assignedEvents) ? [...c.assignedEvents] : (Array.isArray(c.assigned_events) ? [...c.assigned_events] : []);
  // Clean existing game: tags
  assigned_events = assigned_events.filter(e => typeof e === 'string' && !e.startsWith('game:'));
  // If game is present, encode it safely into assigned_events array for Supabase persistence
  if (c.game && String(c.game).trim()) {
    assigned_events.push(`game:${String(c.game).trim()}`);
  }
  return {
    id: c.id,
    name: c.name,
    phone: c.phone || '',
    whatsapp: c.whatsapp || '',
    email: c.email || '',
    department: c.department || '',
    year: c.year || '',
    role: c.role || 'Lead Coordinator',
    assigned_events: assigned_events,
    display_order: Number(c.displayOrder ?? c.display_order ?? 999),
    is_active: c.isActive !== false && c.is_active !== false,
    updated_at: new Date().toISOString()
  };
};

const dbToEvent = (e) => ({
  id: e.id,
  number: e.number,
  name: e.name,
  alias: e.alias,
  subtitle: e.subtitle,
  category: e.category,
  teamSize: e.team_size || e.teamSize,
  minMembers: e.min_members || e.minMembers || 1,
  maxMembers: e.max_members || e.maxMembers || 1,
  fee: e.fee,
  feePerHead: e.fee_per_head || e.feePerHead || 0,
  feeType: e.fee_type || e.feeType || 'per_head',
  isTeam: e.is_team !== false && e.isTeam !== false,
  tag: e.tag,
  venue: e.venue,
  venueImage: e.venue_image || e.venueImage || '',
  timing: e.timing,
  description: e.description,
  image: e.image || '',
  rules: e.rules,
  rounds: e.rounds,
  guidelines: e.guidelines,
  highlights: e.highlights,
  createdAt: e.created_at || e.createdAt,
  updatedAt: e.updated_at || e.updatedAt
});

const dbToHomepageTeam = (t) => {
  let members = [];
  if (Array.isArray(t.members)) {
    members = t.members;
  } else if (typeof t.members === 'string') {
    try {
      members = JSON.parse(t.members);
    } catch (e) {
      members = [];
    }
  } else if (Array.isArray(t.names)) {
    members = t.names.map(n => typeof n === 'string' ? { name: n, role: '', glow: false } : n);
  }

  const normalizedMembers = (members || []).map(m => {
    if (typeof m === 'string') return { name: m, role: '', glow: false };
    return {
      name: m.name || '',
      role: m.role || '',
      glow: m.glow || false
    };
  });

  return {
    id: t.id,
    role: t.role || '',
    tag: t.tag || 'TEAM',
    iconName: t.icon_name || t.iconName || 'Users',
    tier: t.tier || 'emerald',
    desc: t.description || t.desc || '',
    members: normalizedMembers,
    names: normalizedMembers.map(m => m.name),
    displayOrder: Number(t.display_order ?? t.displayOrder ?? 999),
    isActive: t.is_active !== false && t.isActive !== false,
    createdAt: t.created_at || t.createdAt,
    updatedAt: t.updated_at || t.updatedAt
  };
};

const homepageTeamToDb = (t) => {
  return {
    id: t.id,
    role: t.role,
    tag: t.tag || 'TEAM',
    icon: t.iconName || 'Users',
    icon_name: t.iconName || 'Users',
    tier: t.tier || 'emerald',
    color: t.tier || 'emerald',
    desc_text: t.desc || '',
    description: t.desc || '',
    members: t.members || [],
    display_order: Number(t.displayOrder ?? 999),
    is_active: t.isActive !== false,
    updated_at: new Date().toISOString()
  };
};

// ==================== LOCAL JSON FALLBACK HELPERS ====================
const getUsersData = () => {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const saveUsersData = (users) => {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing users.json:', err);
  }
};

const getRolesData = () => {
  try {
    const data = fs.readFileSync(rolesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const saveRolesData = (roles) => {
  try {
    fs.writeFileSync(rolesFilePath, JSON.stringify(roles, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing roles.json:', err);
  }
};

const getEventsData = () => {
  try {
    const data = fs.readFileSync(eventsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const saveEventsData = (events) => {
  try {
    fs.writeFileSync(eventsFilePath, JSON.stringify(events, null, 2), 'utf8');
    try {
      const apiCtrl = require('./apiController');
      if (apiCtrl && apiCtrl.invalidateEventsCache) apiCtrl.invalidateEventsCache();
    } catch (_) {}
  } catch (err) {
    console.error('Error writing events.json:', err);
  }
};

const getSponsorsData = () => {
  try {
    const data = fs.readFileSync(sponsorsFilePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
};

const saveSponsorsData = (sponsors) => {
  try {
    fs.writeFileSync(sponsorsFilePath, JSON.stringify(sponsors, null, 2), 'utf8');
    try {
      const apiCtrl = require('./apiController');
      if (apiCtrl && apiCtrl.invalidateSponsorsCache) apiCtrl.invalidateSponsorsCache();
    } catch (_) {}
    return true;
  } catch (err) {
    console.error('Error writing sponsors.json:', err);
    return false;
  }
};

const getCoordinatorsData = () => {
  try {
    const data = fs.readFileSync(coordinatorsFilePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
};

const saveCoordinatorsData = (coordinators) => {
  try {
    fs.writeFileSync(coordinatorsFilePath, JSON.stringify(coordinators, null, 2), 'utf8');
    try {
      const apiCtrl = require('./apiController');
      if (apiCtrl && apiCtrl.invalidateCoordinatorsCache) apiCtrl.invalidateCoordinatorsCache();
    } catch (_) {}
    return true;
  } catch (err) {
    console.error('Error writing coordinators.json:', err);
    return false;
  }
};

const getHomepageCoordinatorsData = () => {
  try {
    const data = fs.readFileSync(homepageCoordinatorsFilePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    return [];
  }
};

const saveHomepageCoordinatorsData = (teams) => {
  try {
    fs.writeFileSync(homepageCoordinatorsFilePath, JSON.stringify(teams, null, 2), 'utf8');
    try {
      const apiCtrl = require('./apiController');
      if (apiCtrl && apiCtrl.invalidateHomepageTeamsCache) apiCtrl.invalidateHomepageTeamsCache();
    } catch (_) {}
    if (fs.existsSync(frontendStudentCoordinatorsFilePath)) {
      try {
        const activeTeamsForFrontend = teams
          .filter(t => t.isActive !== false)
          .map(t => ({
            id: t.id,
            role: t.role,
            tag: t.tag,
            iconName: t.iconName,
            tier: t.tier,
            desc: t.desc,
            names: (t.members || []).map(m => typeof m === 'string' ? m : m.name),
            members: t.members || []
          }));
        fs.writeFileSync(frontendStudentCoordinatorsFilePath, JSON.stringify(activeTeamsForFrontend, null, 2), 'utf8');
      } catch (fErr) {
        console.warn('Sync to frontend studentCoordinators.json skipped:', fErr.message);
      }
    }
    return true;
  } catch (err) {
    console.error('Error writing homepage_coordinators.json:', err);
    return false;
  }
};

// ==================== AUTH & TOKEN ====================
exports.login = async (req, res) => {
  const cleanUsername = String(req.body.username || '').trim();
  const cleanPassword = String(req.body.password || '').trim();

  if (!cleanUsername || !cleanPassword) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  // 1. Try Supabase Database with case-insensitive search
  try {
    const { data: dbUsers, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', cleanUsername);

    if (!error && Array.isArray(dbUsers) && dbUsers.length > 0) {
      const matchedDbUser = dbUsers.find(u => String(u.password || '').trim() === cleanPassword);
      if (matchedDbUser) {
        let assignedEvents = matchedDbUser.assigned_events || matchedDbUser.assignedEvents || (matchedDbUser.event_id || matchedDbUser.eventId ? [matchedDbUser.event_id || matchedDbUser.eventId] : []);
        if (typeof assignedEvents === 'string') {
          try { assignedEvents = JSON.parse(assignedEvents); } catch (_) { assignedEvents = [assignedEvents]; }
        }
        if (!Array.isArray(assignedEvents) || assignedEvents.length === 0) {
          const coordinators = getCoordinatorsData();
          const uName = cleanUsername.toLowerCase();
          const matched = coordinators.find(c => 
            c.name?.toLowerCase().includes(uName) || uName.includes(c.name?.toLowerCase().split(' ')[0])
          );
          if (matched) {
            const cEvents = matched.assigned_events || matched.assignedEvents;
            if (Array.isArray(cEvents) && cEvents.length > 0) {
              assignedEvents = cEvents;
            }
          }
        }

        const token = jwt.sign(
          { id: matchedDbUser.id, username: matchedDbUser.username, role: matchedDbUser.role, assignedEvents: Array.isArray(assignedEvents) ? assignedEvents : [] },
          JWT_SECRET,
          { expiresIn: '1d' }
        );
        return res.json({ 
          success: true, 
          token, 
          user: { 
            id: matchedDbUser.id, 
            username: matchedDbUser.username, 
            role: matchedDbUser.role,
            assignedEvents: Array.isArray(assignedEvents) ? assignedEvents : []
          } 
        });
      }
    }
  } catch (e) {
    console.warn('Supabase auth fallback:', e.message);
  }

  // 2. Check local users.json
  const users = getUsersData();
  const user = users.find(u => 
    String(u.username || '').trim().toLowerCase() === cleanUsername.toLowerCase() && 
    String(u.password || '').trim() === cleanPassword
  );

  if (user) {
    let assignedEvents = user.assigned_events || user.assignedEvents || (user.event_id || user.eventId ? [user.event_id || user.eventId] : []);
    if (typeof assignedEvents === 'string') {
      try { assignedEvents = JSON.parse(assignedEvents); } catch (_) { assignedEvents = [assignedEvents]; }
    }
    if (!Array.isArray(assignedEvents) || assignedEvents.length === 0) {
      const coordinators = getCoordinatorsData();
      const uName = cleanUsername.toLowerCase();
      const matched = coordinators.find(c => 
        c.name?.toLowerCase().includes(uName) || uName.includes(c.name?.toLowerCase().split(' ')[0])
      );
      if (matched) {
        const cEvents = matched.assigned_events || matched.assignedEvents;
        if (Array.isArray(cEvents) && cEvents.length > 0) {
          assignedEvents = cEvents;
        }
      }
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, assignedEvents: Array.isArray(assignedEvents) ? assignedEvents : [] }, 
      JWT_SECRET, 
      { expiresIn: '1d' }
    );
    return res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        assignedEvents: Array.isArray(assignedEvents) ? assignedEvents : []
      } 
    });
  }

  // 3. Fallback check for coordinators in coordinators.json
  const coordinators = getCoordinatorsData();
  const matchedCoord = coordinators.find(c => 
    c.name?.toLowerCase().trim() === cleanUsername.toLowerCase() ||
    c.phone === cleanUsername ||
    c.email?.toLowerCase().trim() === cleanUsername.toLowerCase()
  );

  if (matchedCoord && (cleanPassword === 'admin' || cleanPassword === 'coordinator123' || cleanPassword === matchedCoord.phone)) {
    const rawEvents = matchedCoord.assigned_events || matchedCoord.assignedEvents;
    const assignedEvents = Array.isArray(rawEvents) ? rawEvents : [];
    const token = jwt.sign(
      { id: Date.now(), username: matchedCoord.name, role: matchedCoord.role || 'Event Coordinator', assignedEvents }, 
      JWT_SECRET, 
      { expiresIn: '1d' }
    );
    return res.json({ 
      success: true, 
      token, 
      user: { 
        id: Date.now(), 
        username: matchedCoord.name, 
        role: matchedCoord.role || 'Event Coordinator',
        assignedEvents 
      } 
    });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your username and password.' });
};

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

exports.requireWriteAccess = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  if (role.includes('lead') || role === 'lead coordinator' || role === 'lead_coordinator') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Lead Coordinator accounts have read-only view access. Add, edit, and delete actions are not allowed.'
    });
  }
  next();
};

exports.requireAdminOrSuperadmin = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Only Superadmin and Admin accounts can manage registration portal status.'
    });
  }
  next();
};

// ==================== DASHBOARD STATS ====================
exports.getDashboardData = async (req, res) => {
  try {
    let registrations = [];
    let sponsors = getSponsorsData();
    let coordinators = getCoordinatorsData();
    let homepageTeams = getHomepageCoordinatorsData();
    let events = getEventsData();

    try {
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select('*, registration_members(*)')
        .order('created_at', { ascending: false });

      if (regData && Array.isArray(regData)) {
        registrations = regData.map(r => {
          const copy = { ...r };
          if (copy.venue_snapshot && typeof copy.venue_snapshot === 'string' && copy.venue_snapshot.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(copy.venue_snapshot);
              if (parsed.payment_method) {
                copy.payment_method = parsed.payment_method;
                copy.paymentMethod = parsed.payment_method;
              }
              if (parsed.razorpay_payment_id) {
                copy.razorpay_payment_id = parsed.razorpay_payment_id;
                copy.razorpayPaymentId = parsed.razorpay_payment_id;
              }
              if (parsed.razorpay_order_id) {
                copy.razorpay_order_id = parsed.razorpay_order_id;
                copy.razorpayOrderId = parsed.razorpay_order_id;
              }
              if (parsed.upi_utr) {
                copy.upi_utr = parsed.upi_utr;
                copy.upiUtr = parsed.upi_utr;
              }
              if (parsed.verification_status) {
                copy.verification_status = parsed.verification_status;
                copy.verificationStatus = parsed.verification_status;
              }
              if (parsed.flag_reason) {
                copy.flag_reason = parsed.flag_reason;
                copy.flagReason = parsed.flag_reason;
              }
              if (Array.isArray(parsed.team_members) && parsed.team_members.length > 0) {
                copy.team_members = parsed.team_members;
                copy.teamMembers = parsed.team_members;
                copy.teamMembersList = parsed.team_members.map(m => typeof m === 'string' ? m : (m.fullName || m.name || ''));
              }
            } catch (_) {}
          }
          if (Array.isArray(copy.registration_members) && copy.registration_members.length > 0 && (!copy.teamMembers || copy.teamMembers.length === 0)) {
            copy.teamMembers = copy.registration_members.map((m, idx) => ({
              memberNumber: m.member_number || idx + 2,
              fullName: m.member_name || m.name || m.fullName || `Member ${idx + 2}`,
              name: m.member_name || m.name || m.fullName || `Member ${idx + 2}`,
              phone: m.phone || '',
              email: m.email || ''
            }));
            copy.teamMembersList = copy.registration_members.map(m => m.member_name || m.name || m.fullName || '');
          }
          return copy;
        });
      }

      if (spRes.data && spRes.data.length > 0) sponsors = spRes.data.map(dbToSponsor);
      if (coRes.data && coRes.data.length > 0) coordinators = coRes.data.map(dbToCoordinator);
      if (evRes.data && evRes.data.length > 0) events = evRes.data.map(dbToEvent);
      if (hpRes.data && hpRes.data.length > 0) homepageTeams = hpRes.data.map(dbToHomepageTeam);
    } catch (dbErr) {
      console.warn('Dashboard live metrics query error fallback:', dbErr.message);
    }

    const isVerifiedRecord = (r) => Boolean(
      r.is_verified === true ||
      r.isVerified === true ||
      r.verification_status === 'verified' ||
      r.verificationStatus === 'verified' ||
      r.attendance_status === 'verified'
    );
    const isOnlineRecord = (r) => (r.payment_method || r.paymentMethod || '').toUpperCase() !== 'ON_SITE_DESK';
    const onlineRegs = registrations.filter(isOnlineRecord);
    const offlineRegs = registrations.filter(r => !isOnlineRecord(r));
    const verifiedRegistrations = registrations.filter(isVerifiedRecord);
    const verifiedOnlineRegs = onlineRegs.filter(isVerifiedRecord);
    const verifiedOfflineRegs = offlineRegs.filter(isVerifiedRecord);

    const totalRevenue = verifiedRegistrations.reduce((sum, r) => sum + (Number(r.total_fee || r.totalAmount || r.total_amount) || 0), 0);
    const onlineRevenue = verifiedOnlineRegs.reduce((sum, r) => sum + (Number(r.total_fee || r.totalAmount || r.total_amount) || 0), 0);
    const offlineRevenue = verifiedOfflineRegs.reduce((sum, r) => sum + (Number(r.total_fee || r.totalAmount || r.total_amount) || 0), 0);
    const activeSponsors = sponsors.filter(s => s.isActive !== false);
    const activeCoordinators = coordinators.filter(c => c.isActive !== false);
    const activeHomepageTeams = homepageTeams.filter(t => t.isActive !== false);

    const recentRegistrations = [...registrations]
      .reverse()
      .slice(0, 8)
      .map(r => ({
        id: r.ticket_code || r.ticketCode || r.registrationId || r.id,
        name: r.full_name || r.fullName || 'Anonymous',
        event: r.event_id || r.eventName || 'General Registration',
        mode: isOnlineRecord(r) ? 'Online' : 'Offline Desk',
        paymentMethod: r.payment_method || r.paymentMethod || (isOnlineRecord(r) ? 'ONLINE' : 'ON_SITE_DESK'),
        paymentStatus: r.payment_status || r.paymentStatus || 'PAID',
        razorpayPaymentId: r.razorpay_payment_id || r.razorpayPaymentId || '',
        fee: Number(r.total_fee || r.totalAmount || r.total_amount) || 0,
        phone: r.phone || '',
        college: r.college || '',
        date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : (r.createdAtFormatted || 'Recent')
      }));

    res.json({
      success: true,
      data: {
        stats: {
          totalRegistrations: registrations.length,
          revenue: totalRevenue,
          onlineRegistrations: onlineRegs.length,
          onlineRevenue: onlineRevenue,
          offlineRegistrations: offlineRegs.length,
          offlineRevenue: offlineRevenue,
          eventsActive: events.length || 12,
          totalSponsors: sponsors.length,
          activeSponsors: activeSponsors.length,
          totalCoordinators: coordinators.length,
          activeCoordinators: activeCoordinators.length,
          totalHomepageTeams: homepageTeams.length,
          activeHomepageTeams: activeHomepageTeams.length
        },
        recentRegistrations
      }
    });
  } catch (err) {
    console.error('Error in getDashboardData:', err);
    res.status(500).json({ success: false, message: 'Failed to compute dashboard metrics' });
  }
};

// ==================== USER MANAGEMENT ====================
exports.getUsers = async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  let allUsers = [];
  try {
    const { data: dbUsers, error } = await supabase.from('users').select('*').order('id', { ascending: true });
    if (!error && Array.isArray(dbUsers) && dbUsers.length > 0) {
      allUsers = [...dbUsers];
    }
  } catch (e) {
    console.warn('Supabase getUsers fallback:', e.message);
  }

  const localUsers = getUsersData();
  if (allUsers.length === 0) {
    allUsers = [...localUsers];
  } else {
    localUsers.forEach(lu => {
      const luName = String(lu.username || '').toLowerCase().trim();
      const existingIdx = allUsers.findIndex(u => 
        (luName && String(u.username || '').toLowerCase().trim() === luName) || 
        String(u.id) === String(lu.id)
      );
      if (existingIdx === -1) {
        allUsers.push(lu);
      } else {
        const dbEvts = allUsers[existingIdx].assigned_events || allUsers[existingIdx].assignedEvents;
        const locEvts = lu.assigned_events || lu.assignedEvents;
        const dbEvtArray = Array.isArray(dbEvts) ? dbEvts : (typeof dbEvts === 'string' ? [dbEvts] : []);
        const locEvtArray = Array.isArray(locEvts) ? locEvts : (typeof locEvts === 'string' ? [locEvts] : []);

        if (dbEvtArray.length === 0 && locEvtArray.length > 0) {
          allUsers[existingIdx].assigned_events = locEvtArray;
          allUsers[existingIdx].assignedEvents = locEvtArray;
        }
      }
    });
  }

  saveUsersData(allUsers);

  const formattedUsers = allUsers.map(u => {
    let assignedEvents = u.assigned_events || u.assignedEvents || (u.event_id || u.eventId ? [u.event_id || u.eventId] : []);
    if (typeof assignedEvents === 'string') {
      try { assignedEvents = JSON.parse(assignedEvents); } catch (_) { assignedEvents = [assignedEvents]; }
    }
    return {
      id: u.id,
      username: u.username,
      role: u.role,
      assignedEvents: Array.isArray(assignedEvents) ? assignedEvents : [],
      assigned_events: Array.isArray(assignedEvents) ? assignedEvents : []
    };
  });

  res.json({ success: true, data: formattedUsers });
};

exports.createUser = async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const { username, password, role, assignedEvents, eventId } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  const users = getUsersData();
  if (users.find(u => String(u.username || '').toLowerCase() === String(username || '').toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }

  const eventsArray = Array.isArray(assignedEvents) ? assignedEvents : (eventId ? [eventId] : []);
  const newUser = {
    id: Date.now(),
    username: username.trim(),
    password: password.trim(),
    role: role.trim(),
    assigned_events: eventsArray,
    assignedEvents: eventsArray,
    event_id: eventsArray[0] || null,
    eventId: eventsArray[0] || null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const { error: dbError } = await supabase.from('users').insert([{
      id: newUser.id,
      username: newUser.username,
      password: newUser.password,
      role: newUser.role,
      assigned_events: eventsArray,
      is_active: true
    }]);
    if (dbError) console.error('Supabase createUser error:', dbError.message);
  } catch (dbErr) {
    console.error('Supabase createUser exception:', dbErr.message);
  }

  users.push(newUser);
  saveUsersData(users);

  res.json({ success: true, message: 'User created successfully', data: { id: newUser.id, username: newUser.username, role: newUser.role, assignedEvents: eventsArray } });
};

exports.updateUser = async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const { id } = req.params;
  const { username, password, role, assignedEvents } = req.body;
  const userId = id;
  
  if (!username || !role) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  const users = getUsersData();
  const userIndex = users.findIndex(u => String(u.id) === String(userId) || String(u.username).toLowerCase() === String(username).toLowerCase());

  if (userIndex !== -1 && users[userIndex].role === 'superadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Cannot modify a superadmin' });
  }

  const updateFields = { username, role, updated_at: new Date().toISOString() };
  if (password) updateFields.password = password;
  if (assignedEvents !== undefined) {
    const eventsArray = Array.isArray(assignedEvents) ? assignedEvents : (assignedEvents ? [assignedEvents] : []);
    updateFields.assigned_events = eventsArray;
  }

  try {
    const { error: dbErr } = await supabase.from('users').update(updateFields).eq('id', userId);
    if (dbErr) console.error('Supabase updateUser error:', dbErr.message);
  } catch (e) {
    console.error('Supabase updateUser exception:', e.message);
  }

  if (userIndex !== -1) {
    users[userIndex].username = username;
    users[userIndex].role = role;
    if (password) users[userIndex].password = password;
    if (assignedEvents !== undefined) {
      const eventsArray = Array.isArray(assignedEvents) ? assignedEvents : (assignedEvents ? [assignedEvents] : []);
      users[userIndex].assignedEvents = eventsArray;
      users[userIndex].assigned_events = eventsArray;
      users[userIndex].eventId = eventsArray[0] || null;
      users[userIndex].event_id = eventsArray[0] || null;
    }
    users[userIndex].updated_at = new Date().toISOString();
    saveUsersData(users);
  }

  res.json({ success: true, message: 'User updated successfully', data: { id: userId, username, role } });
};

exports.deleteUser = async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const { id } = req.params;
  const userId = id;
  const users = getUsersData();
  const userIndex = users.findIndex(u => String(u.id) === String(userId));

  if (userIndex !== -1) {
    if (users[userIndex].username === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete the primary admin account' });
    }
    if (users[userIndex].role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete a superadmin' });
    }
    if (String(users[userIndex].id) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    users.splice(userIndex, 1);
    saveUsersData(users);
  }

  try {
    const { error: dbErr } = await supabase.from('users').delete().eq('id', userId);
    if (dbErr) console.error('Supabase deleteUser error:', dbErr.message);
  } catch (e) {
    console.error('Supabase deleteUser exception:', e.message);
  }

  res.json({ success: true, message: 'User deleted successfully' });
};

// ==================== EVENT ALLOCATION MANAGEMENT ====================
exports.getEventAllocations = async (req, res) => {
  try {
    let dbUsers = [];
    try {
      const { data: fetchDbUsers, error } = await supabase.from('users').select('*').order('id', { ascending: true });
      if (!error && Array.isArray(fetchDbUsers)) {
        dbUsers = fetchDbUsers;
      }
    } catch (e) {
      console.warn('Supabase getEventAllocations fallback:', e.message);
    }

    const localUsers = getUsersData();
    const localUserMap = new Map();
    localUsers.forEach(lu => {
      if (lu.username) localUserMap.set(String(lu.username).toLowerCase().trim(), lu);
      if (lu.id) localUserMap.set(String(lu.id), lu);
    });

    // 2. Query Supabase dedicated event_allocations table live
    let liveAllocations = [];
    try {
      const { data: dbAllocations } = await supabase.from('event_allocations').select('*');
      if (Array.isArray(dbAllocations) && dbAllocations.length > 0) {
        liveAllocations = dbAllocations;
      }
    } catch (allocErr) {
      console.warn('Supabase event_allocations fetch note:', allocErr.message);
    }

    const coordinators = getCoordinatorsData();

    // Merge strategy: Start from localUsers and merge dbUsers to ensure zero data loss
    const mergedUserMap = new Map();

    localUsers.forEach(lu => {
      const key = String(lu.username || lu.id || '').toLowerCase().trim();
      if (key) {
        let evts = lu.assignedEvents || lu.assigned_events || (lu.eventId ? [lu.eventId] : []);
        if (typeof evts === 'string') {
          try { evts = JSON.parse(evts); } catch (_) { evts = [evts]; }
        }
        mergedUserMap.set(key, { ...lu, assignedEvents: Array.isArray(evts) ? evts : [], assigned_events: Array.isArray(evts) ? evts : [] });
      }
    });

    dbUsers.forEach(dbU => {
      const key = String(dbU.username || dbU.id || '').toLowerCase().trim();
      if (key) {
        const existing = mergedUserMap.get(key) || {};
        let dbEvts = dbU.assigned_events || dbU.assignedEvents || (dbU.event_id || dbU.eventId ? [dbU.event_id || dbU.eventId] : []);
        if (typeof dbEvts === 'string') {
          try { dbEvts = JSON.parse(dbEvts); } catch (_) { dbEvts = [dbEvts]; }
        }
        const existingEvts = existing.assignedEvents || existing.assigned_events || [];
        const finalEvts = (Array.isArray(dbEvts) && dbEvts.length > 0) ? dbEvts : (Array.isArray(existingEvts) && existingEvts.length > 0 ? existingEvts : []);
        mergedUserMap.set(key, { ...existing, ...dbU, assignedEvents: finalEvts, assigned_events: finalEvts });
      }
    });

    liveAllocations.forEach(alloc => {
      const key = String(alloc.username || alloc.user_id || '').toLowerCase().trim();
      if (key) {
        const existing = mergedUserMap.get(key) || { username: alloc.username, role: 'event coordinator' };
        let aEvts = alloc.assigned_events;
        if (typeof aEvts === 'string') {
          try { aEvts = JSON.parse(aEvts); } catch (_) { aEvts = [aEvts]; }
        }
        if (Array.isArray(aEvts) && aEvts.length > 0) {
          mergedUserMap.set(key, { ...existing, assignedEvents: aEvts, assigned_events: aEvts });
        }
      }
    });

    const allUsers = Array.from(mergedUserMap.values());
    saveUsersData(allUsers);

    const users = allUsers.map(u => {
      let assignedEvents = u.assigned_events || u.assignedEvents || (u.event_id || u.eventId ? [u.event_id || u.eventId] : []);
      if (typeof assignedEvents === 'string') {
        try { assignedEvents = JSON.parse(assignedEvents); } catch (_) { assignedEvents = [assignedEvents]; }
      }
      
      const uName = String(u.username || '').toLowerCase().trim();

      // Check coordinators list fallback
      if (!Array.isArray(assignedEvents) || assignedEvents.length === 0) {
        const matched = coordinators.find(c => {
          const cName = String(c.name || '').toLowerCase().trim();
          return cName === uName || (uName.length >= 3 && (cName.includes(uName) || uName.includes(cName.split(' ')[0])));
        });
        if (matched) {
          let cEvents = matched.assigned_events || matched.assignedEvents;
          if (typeof cEvents === 'string') {
            try { cEvents = JSON.parse(cEvents); } catch (_) { cEvents = [cEvents]; }
          }
          if (Array.isArray(cEvents) && cEvents.length > 0) {
            assignedEvents = cEvents;
          }
        }
      }

      return {
        id: u.id,
        username: u.username,
        role: u.role,
        assignedEvents: Array.isArray(assignedEvents) ? assignedEvents : [],
        assigned_events: Array.isArray(assignedEvents) ? assignedEvents : []
      };
    });

    const events = getEventsData().map(e => ({
      id: e.id,
      name: e.name,
      category: e.category,
      isTeam: e.isTeam
    }));

    res.json({
      success: true,
      data: {
        users,
        events,
        coordinators
      }
    });
  } catch (err) {
    console.error('Error in getEventAllocations:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch event allocations' });
  }
};

exports.updateEventAllocation = async (req, res) => {
  try {
    const { userId, username, assignedEvents } = req.body;
    if (!userId && !username) {
      return res.status(400).json({ success: false, message: 'User identifier required' });
    }

    const eventsArray = Array.isArray(assignedEvents) ? assignedEvents : assignedEvents ? [assignedEvents] : [];
    const cleanSearchName = String(username || '').trim();

    // 1. Find user in Supabase by username first or ID
    let targetDbId = null;
    let targetUsername = cleanSearchName || null;
    let dbUserMatch = null;

    try {
      if (cleanSearchName) {
        const { data: dbMatchesName } = await supabase.from('users').select('*').ilike('username', cleanSearchName);
        if (Array.isArray(dbMatchesName) && dbMatchesName.length > 0) {
          dbUserMatch = dbMatchesName[0];
        }
      }
      if (!dbUserMatch && userId) {
        const { data: dbMatchesId } = await supabase.from('users').select('*').eq('id', userId);
        if (Array.isArray(dbMatchesId) && dbMatchesId.length > 0) {
          dbUserMatch = dbMatchesId[0];
        }
      }
    } catch (e) {
      console.warn('Supabase findUser error:', e.message);
    }

    if (dbUserMatch) {
      targetDbId = dbUserMatch.id;
      targetUsername = dbUserMatch.username;
    }

    // 2. Persist directly to Supabase live event_allocations table
    try {
      const allocPayload = {
        username: String(targetUsername || username).trim(),
        user_id: String(targetDbId || userId || ''),
        assigned_events: eventsArray,
        updated_at: new Date().toISOString()
      };
      
      const { error: allocErr } = await supabase.from('event_allocations').upsert([allocPayload], { onConflict: 'username' });
      if (allocErr) {
        console.warn('Supabase event_allocations table upsert notice:', allocErr.message);
        // Fallback string update if JSONB type mismatches
        await supabase.from('event_allocations').upsert([{
          ...allocPayload,
          assigned_events: JSON.stringify(eventsArray)
        }], { onConflict: 'username' });
      }
    } catch (allocEx) {
      console.warn('Supabase event_allocations table exception:', allocEx.message);
    }

    // 3. Update Supabase users table directly
    try {
      if (targetDbId) {
        const { error: sbErr } = await supabase.from('users').update({
          assigned_events: eventsArray,
          updated_at: new Date().toISOString()
        }).eq('id', targetDbId);

        if (sbErr) {
          await supabase.from('users').update({
            assigned_events: JSON.stringify(eventsArray),
            updated_at: new Date().toISOString()
          }).eq('id', targetDbId);
        }
      }
      
      if (targetUsername) {
        const { error: sbErr, data: updatedRows } = await supabase.from('users').update({
          assigned_events: eventsArray,
          updated_at: new Date().toISOString()
        }).ilike('username', targetUsername).select();

        if (sbErr) {
          await supabase.from('users').update({
            assigned_events: JSON.stringify(eventsArray),
            updated_at: new Date().toISOString()
          }).ilike('username', targetUsername);
        }

        // If user does not exist in Supabase yet, insert it!
        if ((!updatedRows || updatedRows.length === 0) && !targetDbId) {
          const localUsers = getUsersData();
          const localU = localUsers.find(u => String(u.username || '').toLowerCase() === targetUsername.toLowerCase());
          await supabase.from('users').insert([{
            username: targetUsername,
            password: localU?.password || 'coordinator123',
            role: localU?.role || 'event coordinator',
            assigned_events: eventsArray,
            is_active: true
          }]);
        }
      }
    } catch (e) {
      console.warn('Supabase updateEventAllocation fallback:', e.message);
    }

    // 3. Update local users.json
    const users = getUsersData();
    const cleanLowerName = String(targetUsername || username || '').toLowerCase().trim();
    let userIndex = users.findIndex(u => 
      (targetDbId && String(u.id) === String(targetDbId)) || 
      (cleanLowerName && String(u.username || '').toLowerCase().trim() === cleanLowerName) ||
      (userId && String(u.id) === String(userId))
    );

    if (userIndex !== -1) {
      if (targetDbId) users[userIndex].id = targetDbId;
      if (targetUsername) users[userIndex].username = targetUsername;
      users[userIndex].assignedEvents = eventsArray;
      users[userIndex].assigned_events = eventsArray;
      users[userIndex].eventId = eventsArray[0] || null;
      users[userIndex].event_id = eventsArray[0] || null;
      users[userIndex].updated_at = new Date().toISOString();
      saveUsersData(users);
    } else {
      const newUser = {
        id: targetDbId || (userId && Number.isInteger(Number(userId)) ? Number(userId) : Date.now()),
        username: String(targetUsername || username).trim(),
        password: 'coordinator123',
        role: 'event coordinator',
        assignedEvents: eventsArray,
        assigned_events: eventsArray,
        eventId: eventsArray[0] || null,
        event_id: eventsArray[0] || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      users.push(newUser);
      saveUsersData(users);
      userIndex = users.length - 1;
    }

    // 4. Sync with coordinators.json & Supabase coordinators table if coordinator matches
    const coordinators = getCoordinatorsData();
    let updatedCoord = false;
    coordinators.forEach(c => {
      const cName = String(c.name || '').toLowerCase().trim();
      if (cName === cleanLowerName || (cleanLowerName.length >= 3 && (cName.includes(cleanLowerName) || cleanLowerName.includes(cName.split(' ')[0])))) {
        c.assignedEvents = eventsArray;
        c.assigned_events = eventsArray;
        c.updated_at = new Date().toISOString();
        updatedCoord = true;
      }
    });
    if (updatedCoord) {
      saveCoordinatorsData(coordinators);
      try {
        const matchedC = coordinators.find(c => {
          const cName = String(c.name || '').toLowerCase().trim();
          return cName === cleanLowerName || (cleanLowerName.length >= 3 && (cName.includes(cleanLowerName) || cleanLowerName.includes(cName.split(' ')[0])));
        });
        if (matchedC && matchedC.id) {
          await supabase.from('coordinators').update({
            assigned_events: eventsArray,
            updated_at: new Date().toISOString()
          }).eq('id', matchedC.id);
        }
      } catch (_) {}
    }

    res.json({
      success: true,
      message: 'Event allocation updated successfully!',
      data: {
        userId: userIndex !== -1 ? users[userIndex].id : (targetDbId || userId),
        username: userIndex !== -1 ? users[userIndex].username : (targetUsername || username),
        assignedEvents: eventsArray
      }
    });
  } catch (err) {
    console.error('Error in updateEventAllocation:', err);
    res.status(500).json({ success: false, message: 'Failed to update event allocation' });
  }
};

// ==================== ROLE MANAGEMENT ====================
exports.getRoles = async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  let allRoles = [];
  try {
    const { data: dbRoles, error } = await supabase.from('roles').select('*').order('id', { ascending: true });
    if (!error && Array.isArray(dbRoles) && dbRoles.length > 0) {
      allRoles = [...dbRoles];
    }
  } catch (e) {
    console.warn('Supabase getRoles fallback:', e.message);
  }

  const localRoles = getRolesData();
  if (allRoles.length === 0) {
    allRoles = [...localRoles];
  } else {
    localRoles.forEach(lr => {
      if (!allRoles.some(r => r.name?.toLowerCase() === lr.name?.toLowerCase() || r.id === lr.id)) {
        allRoles.push(lr);
      }
    });
  }

  res.json({ success: true, data: allRoles });
};

exports.createRole = async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Role name required' });
  }

  const normalizedName = name.toLowerCase().trim();
  const roles = getRolesData();

  if (roles.find(r => r.name === normalizedName)) {
    return res.status(400).json({ success: false, message: 'Role already exists' });
  }

  const newRole = { id: Math.floor(Math.random() * 900000) + 100, name: normalizedName };

  try {
    const { error: dbErr } = await supabase.from('roles').insert([newRole]);
    if (dbErr) console.error('Supabase createRole error:', dbErr.message);
  } catch (e) {
    console.error('Supabase createRole exception:', e.message);
  }

  roles.push(newRole);
  saveRolesData(roles);

  res.json({ success: true, message: 'Role created successfully', data: newRole });
};

exports.updateRole = async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const { id } = req.params;
  const { name } = req.body;
  const roleId = parseInt(id, 10) || id;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Role name required' });
  }

  const roles = getRolesData();
  const roleIndex = roles.findIndex(r => r.id === roleId);

  const normalizedName = name.toLowerCase().trim();

  try {
    const { error: dbErr } = await supabase.from('roles').update({ name: normalizedName }).eq('id', roleId);
    if (dbErr) console.error('Supabase updateRole error:', dbErr.message);
  } catch (e) {
    console.error('Supabase updateRole exception:', e.message);
  }

  if (roleIndex !== -1) {
    const oldRoleName = roles[roleIndex].name;
    roles[roleIndex].name = normalizedName;
    saveRolesData(roles);

    if (oldRoleName !== normalizedName) {
      const users = getUsersData();
      let updated = false;
      users.forEach(u => {
        if (u.role === oldRoleName) {
          u.role = normalizedName;
          updated = true;
        }
      });
      if (updated) saveUsersData(users);
    }
  }

  res.json({ success: true, message: 'Role updated successfully', data: { id: roleId, name: normalizedName } });
};

exports.deleteRole = async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const { id } = req.params;
  const roleId = parseInt(id, 10) || id;
  const roles = getRolesData();
  const roleIndex = roles.findIndex(r => r.id === roleId);

  if (roleIndex !== -1) {
    const roleName = roles[roleIndex].name;
    if (roleName === 'superadmin' || roleName === 'admin') {
      return res.status(400).json({ success: false, message: `Cannot delete primary system role '${roleName}'` });
    }
    roles.splice(roleIndex, 1);
    saveRolesData(roles);
  }

  try {
    const { error: dbErr } = await supabase.from('roles').delete().eq('id', roleId);
    if (dbErr) console.error('Supabase deleteRole error:', dbErr.message);
  } catch (e) {
    console.error('Supabase deleteRole exception:', e.message);
  }

  res.json({ success: true, message: 'Role deleted successfully' });
};

// ==================== EVENT MANAGEMENT ====================
exports.getEvents = async (req, res) => {
  const localEvents = getEventsData();
  try {
    const { data: dbEvents, error } = await supabase.from('events').select('*').order('id', { ascending: true });
    if (!error && Array.isArray(dbEvents) && dbEvents.length > 0) {
      const merged = dbEvents.map(dbToEvent).map(e => {
        const local = localEvents.find(l => l.id === e.id);
        return {
          ...e,
          venueImage: e.venueImage || (local ? (local.venueImage || local.venue_image) : '') || ''
        };
      });
      return res.json({ success: true, data: merged });
    }
  } catch (e) {
    console.warn('Supabase getEvents fallback:', e.message);
  }

  res.json({ success: true, data: localEvents });
};

exports.createEvent = async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const {
    id,
    name,
    alias,
    subtitle,
    category,
    venue,
    venueImage,
    timing,
    fee,
    feePerHead,
    feeType,
    teamSize,
    tag,
    description,
    image,
    rules,
    rounds,
    guidelines,
    highlights
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Event name is required' });
  }

  const events = getEventsData();
  const cat = (category || 'technical').toLowerCase();
  const catPrefix = cat === 'technical' ? 'tech' : 'nontech';

  let eventId = id && id.trim() ? id.trim().toLowerCase().replace(/\s+/g, '-') : null;
  if (!eventId) {
    const existingCatEvents = events.filter(e => e.id.startsWith(catPrefix));
    const nextNum = String(existingCatEvents.length + 1).padStart(2, '0');
    eventId = `${catPrefix}-${nextNum}`;
  }

  const parsedFeePerHead = feePerHead !== undefined && feePerHead !== '' 
    ? Number(feePerHead) 
    : (fee && fee.match(/\d+/) ? Number(fee.match(/\d+/)[0]) : 50);

  const cleanImage = image ? saveBase64ImageIfPresent(image, 'event') : '';
  const cleanVenueImage = venueImage ? saveBase64ImageIfPresent(venueImage, 'venue') : '';

  const newEvent = {
    id: eventId,
    number: String(events.length + 1).padStart(2, '0'),
    name: name.trim(),
    alias: alias ? alias.trim() : name.trim(),
    subtitle: subtitle ? subtitle.trim() : '',
    category: cat,
    teamSize: teamSize ? teamSize.trim() : 'Individual',
    minMembers: 1,
    maxMembers: teamSize && (teamSize.toLowerCase().includes('team') || teamSize.toLowerCase().includes('max') || teamSize.toLowerCase().includes('squad')) ? 4 : 1,
    fee: fee ? fee.trim() : '₹50 per head',
    feePerHead: isNaN(parsedFeePerHead) ? 50 : parsedFeePerHead,
    feeType: feeType || 'per_head',
    isTeam: teamSize ? (teamSize.toLowerCase().includes('team') || teamSize.toLowerCase().includes('max') || teamSize.toLowerCase().includes('squad')) : false,
    tag: tag ? tag.trim() : (cat === 'technical' ? 'Technical Presentation' : 'Non-Technical Event'),
    venue: venue ? venue.trim() : 'CSE Department',
    venueImage: cleanVenueImage ? cleanVenueImage.trim() : '',
    timing: timing ? timing.trim() : '10:00 AM – 01:00 PM',
    description: description ? description.trim() : '',
    image: cleanImage ? cleanImage.trim() : '',
    rules: Array.isArray(rules) && rules.length > 0 ? rules : [],
    rounds: Array.isArray(rounds) && rounds.length > 0 ? rounds : [],
    guidelines: Array.isArray(guidelines) && guidelines.length > 0 ? guidelines : [],
    highlights: Array.isArray(highlights) && highlights.length > 0 ? highlights : []
  };

  try {
    const dbPayload = {
      id: newEvent.id,
      number: newEvent.number,
      name: newEvent.name,
      alias: newEvent.alias,
      subtitle: newEvent.subtitle,
      category: newEvent.category,
      team_size: newEvent.teamSize,
      min_members: newEvent.minMembers,
      max_members: newEvent.maxMembers,
      fee: newEvent.fee,
      fee_per_head: newEvent.feePerHead,
      fee_type: newEvent.feeType,
      is_team: newEvent.isTeam,
      tag: newEvent.tag,
      venue: newEvent.venue,
      venue_image: newEvent.venueImage,
      timing: newEvent.timing,
      description: newEvent.description,
      image: newEvent.image,
      rules: newEvent.rules,
      rounds: newEvent.rounds,
      guidelines: newEvent.guidelines,
      highlights: newEvent.highlights,
      updated_at: new Date().toISOString()
    };
    let { error: dbErr } = await supabase.from('events').upsert([dbPayload], { onConflict: 'id' });
    if (dbErr && dbErr.code === 'PGRST204') {
      delete dbPayload.venue_image;
      const retryRes = await supabase.from('events').upsert([dbPayload], { onConflict: 'id' });
      dbErr = retryRes.error;
    }
    if (dbErr) {
      console.warn('Supabase createEvent warning:', dbErr.message);
    }
  } catch (e) {
    console.warn('Supabase createEvent exception:', e.message);
  }

  const existingIdx = events.findIndex(e => e.id === newEvent.id);
  if (existingIdx !== -1) {
    events[existingIdx] = newEvent;
  } else {
    events.push(newEvent);
  }
  saveEventsData(events);

  res.json({
    success: true,
    message: 'Event created successfully in live database and storage',
    data: newEvent
  });
};

exports.updateEvent = async (req, res) => {
  const userRole = String(req.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'superadmin' || userRole === 'admin';
  const assigned = req.user?.assignedEvents || (req.user?.eventId ? [req.user.eventId] : []);
  const isAssigned = Array.isArray(assigned) && assigned.some(
    e => String(e || '').toLowerCase() === String(req.params.id || '').toLowerCase()
  );

  if (!isAdmin && !isAssigned) {
    return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to edit this event' });
  }

  const { id } = req.params;
  const {
    name,
    alias,
    subtitle,
    category,
    venue,
    venueImage,
    timing,
    fee,
    feePerHead,
    feeType,
    teamSize,
    tag,
    description,
    image,
    rules,
    rounds,
    guidelines,
    highlights
  } = req.body;

  const events = getEventsData();
  const eventIndex = events.findIndex(e => e.id === id);

  const parsedFeePerHead = feePerHead !== undefined && feePerHead !== '' 
    ? Number(feePerHead) 
    : (fee && fee.match(/\d+/) ? Number(fee.match(/\d+/)[0]) : undefined);

  const cleanImage = image !== undefined ? saveBase64ImageIfPresent(image, 'event') : undefined;
  const cleanVenueImage = venueImage !== undefined ? saveBase64ImageIfPresent(venueImage, 'venue') : undefined;

  const updateFields = {
    updated_at: new Date().toISOString()
  };

  if (name) updateFields.name = name.trim();
  if (alias !== undefined) updateFields.alias = alias.trim();
  if (subtitle !== undefined) updateFields.subtitle = subtitle.trim();
  if (category !== undefined) updateFields.category = category.trim().toLowerCase();
  if (venue !== undefined) updateFields.venue = venue.trim();
  if (cleanVenueImage !== undefined) updateFields.venue_image = cleanVenueImage ? cleanVenueImage.trim() : '';
  if (timing !== undefined) updateFields.timing = timing.trim();
  if (fee !== undefined) updateFields.fee = fee.trim();
  if (parsedFeePerHead !== undefined) updateFields.fee_per_head = parsedFeePerHead;
  if (feeType !== undefined) updateFields.fee_type = feeType;
  if (teamSize !== undefined) {
    updateFields.team_size = teamSize.trim();
    updateFields.is_team = (teamSize.toLowerCase().includes('team') || teamSize.toLowerCase().includes('max') || teamSize.toLowerCase().includes('squad'));
  }
  if (tag !== undefined) updateFields.tag = tag.trim();
  if (description !== undefined) updateFields.description = description.trim();
  if (cleanImage !== undefined) updateFields.image = cleanImage ? cleanImage.trim() : '';
  if (rules !== undefined && Array.isArray(rules)) updateFields.rules = rules;
  if (rounds !== undefined && Array.isArray(rounds)) updateFields.rounds = rounds;
  if (guidelines !== undefined && Array.isArray(guidelines)) updateFields.guidelines = guidelines;
  if (highlights !== undefined && Array.isArray(highlights)) updateFields.highlights = highlights;

  try {
    const { data: existingDbEvent } = await supabase.from('events').select('*').eq('id', id).single();
    const dbPayload = {
      id,
      number: (existingDbEvent && existingDbEvent.number) ? existingDbEvent.number : (events[eventIndex]?.number || '01'),
      ...(existingDbEvent || {}),
      ...updateFields
    };
    let { error: dbErr } = await supabase.from('events').upsert(dbPayload);
    if (dbErr && dbErr.code === 'PGRST204') {
      delete dbPayload.venue_image;
      const retryRes = await supabase.from('events').upsert(dbPayload);
      dbErr = retryRes.error;
    }
    if (dbErr) {
      console.warn('Supabase updateEvent warning:', dbErr.message);
    }
  } catch (e) {
    console.warn('Supabase updateEvent exception:', e.message);
  }

  if (eventIndex !== -1) {
    if (name) events[eventIndex].name = name.trim();
    if (alias !== undefined) events[eventIndex].alias = alias.trim();
    if (subtitle !== undefined) events[eventIndex].subtitle = subtitle.trim();
    if (category !== undefined) events[eventIndex].category = category.trim().toLowerCase();
    if (venue !== undefined) events[eventIndex].venue = venue.trim();
    if (cleanVenueImage !== undefined) events[eventIndex].venueImage = cleanVenueImage ? cleanVenueImage.trim() : '';
    if (timing !== undefined) events[eventIndex].timing = timing.trim();
    if (fee !== undefined) events[eventIndex].fee = fee.trim();
    if (parsedFeePerHead !== undefined) events[eventIndex].feePerHead = parsedFeePerHead;
    if (feeType !== undefined) events[eventIndex].feeType = feeType;
    if (teamSize !== undefined) {
      events[eventIndex].teamSize = teamSize.trim();
      events[eventIndex].isTeam = (teamSize.toLowerCase().includes('team') || teamSize.toLowerCase().includes('max') || teamSize.toLowerCase().includes('squad'));
    }
    if (tag !== undefined) events[eventIndex].tag = tag.trim();
    if (description !== undefined) events[eventIndex].description = description.trim();
    if (cleanImage !== undefined) events[eventIndex].image = cleanImage ? cleanImage.trim() : '';
    if (rules !== undefined && Array.isArray(rules)) events[eventIndex].rules = rules;
    if (rounds !== undefined && Array.isArray(rounds)) events[eventIndex].rounds = rounds;
    if (guidelines !== undefined && Array.isArray(guidelines)) events[eventIndex].guidelines = guidelines;
    if (highlights !== undefined && Array.isArray(highlights)) events[eventIndex].highlights = highlights;
    saveEventsData(events);
  } else {
    // If not in events.json, append it
    const constructed = {
      id,
      number: String(events.length + 1).padStart(2, '0'),
      name: name || id,
      alias: alias || name || id,
      subtitle: subtitle || '',
      category: category ? category.trim().toLowerCase() : 'technical',
      teamSize: teamSize || 'Individual',
      minMembers: 1,
      maxMembers: 1,
      fee: fee || '₹50 per head',
      feePerHead: parsedFeePerHead || 50,
      feeType: feeType || 'per_head',
      isTeam: false,
      tag: tag || 'Technical Presentation',
      venue: venue || 'CSE Department',
      timing: timing || '10:00 AM – 01:00 PM',
      description: description || '',
      image: cleanImage || '',
      rules: Array.isArray(rules) ? rules : [],
      rounds: Array.isArray(rounds) ? rounds : [],
      guidelines: Array.isArray(guidelines) ? guidelines : [],
      highlights: Array.isArray(highlights) ? highlights : []
    };
    events.push(constructed);
    saveEventsData(events);
  }

  const updatedResult = eventIndex !== -1 ? events[eventIndex] : { id, ...req.body, image: cleanImage };

  try {
    const { broadcastRegistrationUpdate } = require('../config/websocket');
    if (broadcastRegistrationUpdate) {
      broadcastRegistrationUpdate('EVENT_UPDATED', updatedResult);
    }
  } catch (_) {}

  res.json({ 
    success: true, 
    message: 'Event updated successfully in live database and storage', 
    data: updatedResult 
  });
};

exports.deleteEvent = async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const { id } = req.params;
  const events = getEventsData();
  const eventIndex = events.findIndex(e => e.id === id);

  try {
    const { error: dbErr } = await supabase.from('events').delete().eq('id', id);
    if (dbErr) {
      console.error('Supabase deleteEvent error:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Supabase database error: ' + dbErr.message });
    }
  } catch (e) {
    console.error('Supabase deleteEvent exception:', e.message);
    return res.status(500).json({ success: false, message: 'Database exception: ' + e.message });
  }

  if (eventIndex !== -1) {
    events.splice(eventIndex, 1);
    saveEventsData(events);
  }

  res.json({ success: true, message: 'Event deleted successfully from live database and storage' });
};

// ==================== SPONSOR MANAGEMENT ====================
exports.getSponsors = async (req, res) => {
  try {
    const { data: dbSponsors, error } = await supabase.from('sponsors').select('*').order('display_order', { ascending: true });
    if (!error && Array.isArray(dbSponsors) && dbSponsors.length > 0) {
      return res.json({ success: true, data: dbSponsors.map(dbToSponsor) });
    }
  } catch (e) {
    console.warn('Supabase getSponsors fallback:', e.message);
  }

  const sponsors = getSponsorsData();
  sponsors.sort((a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999));
  res.json({ success: true, data: sponsors });
};

exports.getSponsorById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: dbSponsor, error } = await supabase.from('sponsors').select('*').eq('id', id).single();
    if (!error && dbSponsor) {
      return res.json({ success: true, data: dbToSponsor(dbSponsor) });
    }
  } catch (e) {
    console.warn('Supabase getSponsorById fallback:', e.message);
  }

  const sponsors = getSponsorsData();
  const sponsor = sponsors.find(s => s.id === id);
  if (!sponsor) {
    return res.status(404).json({ success: false, message: 'Sponsor not found' });
  }
  res.json({ success: true, data: sponsor });
};

exports.createSponsor = async (req, res) => {
  const {
    name,
    companyName,
    logo,
    description,
    website,
    locationUrl,
    contactName,
    contactEmail,
    contactPhone,
    category,
    displayOrder,
    isActive
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Sponsor name is required' });
  }

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
    return res.status(400).json({ success: false, message: 'Valid contact email address is required' });
  }

  const sponsors = getSponsorsData();
  const now = new Date().toISOString();
  const cleanLogo = logo ? saveBase64ImageIfPresent(logo.trim(), 'sponsor') : '';
  const newSponsor = {
    id: `sponsor-${Date.now()}`,
    name: name.trim(),
    companyName: companyName ? companyName.trim() : '',
    logo: cleanLogo,
    description: description ? description.trim() : '',
    website: website ? website.trim() : '',
    locationUrl: locationUrl ? locationUrl.trim() : '',
    contactName: contactName ? contactName.trim() : '',
    contactEmail: contactEmail ? contactEmail.trim().toLowerCase() : '',
    contactPhone: contactPhone ? contactPhone.trim() : '',
    category: category || 'Gold Sponsor',
    displayOrder: displayOrder !== undefined && displayOrder !== '' ? Number(displayOrder) : sponsors.length + 1,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    createdAt: now,
    updatedAt: now
  };

  try {
    const dbPayload = sponsorToDb(newSponsor);
    const { error: dbErr } = await supabase.from('sponsors').insert([dbPayload]);
    if (dbErr) {
      console.error('Supabase createSponsor error:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Supabase database error: ' + dbErr.message });
    }
  } catch (e) {
    console.error('Supabase createSponsor exception:', e.message);
    return res.status(500).json({ success: false, message: 'Database exception: ' + e.message });
  }

  sponsors.push(newSponsor);
  saveSponsorsData(sponsors);

  res.status(201).json({ success: true, message: 'Sponsor created successfully in live database', data: newSponsor });
};

exports.updateSponsor = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    companyName,
    logo,
    description,
    website,
    locationUrl,
    contactName,
    contactEmail,
    contactPhone,
    category,
    displayOrder,
    isActive
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Sponsor name is required' });
  }

  const sponsors = getSponsorsData();
  const index = sponsors.findIndex(s => s.id === id);

  const cleanLogo = logo !== undefined ? saveBase64ImageIfPresent(logo.trim(), 'sponsor') : undefined;

  const updatedSponsor = {
    id,
    name: name.trim(),
    companyName: companyName !== undefined ? companyName.trim() : (sponsors[index]?.companyName || ''),
    logo: cleanLogo !== undefined ? cleanLogo : (sponsors[index]?.logo || ''),
    description: description !== undefined ? description.trim() : (sponsors[index]?.description || ''),
    website: website !== undefined ? website.trim() : (sponsors[index]?.website || ''),
    locationUrl: locationUrl !== undefined ? locationUrl.trim() : (sponsors[index]?.locationUrl || ''),
    contactName: contactName !== undefined ? contactName.trim() : (sponsors[index]?.contactName || ''),
    contactEmail: contactEmail !== undefined ? contactEmail.trim().toLowerCase() : (sponsors[index]?.contactEmail || ''),
    contactPhone: contactPhone !== undefined ? contactPhone.trim() : (sponsors[index]?.contactPhone || ''),
    category: category || (sponsors[index]?.category || 'Gold Sponsor'),
    displayOrder: displayOrder !== undefined && displayOrder !== '' ? Number(displayOrder) : (sponsors[index]?.displayOrder || 1),
    isActive: isActive !== undefined ? Boolean(isActive) : (sponsors[index]?.isActive !== false),
    updatedAt: new Date().toISOString()
  };

  try {
    const dbPayload = sponsorToDb(updatedSponsor);
    const { error: dbErr } = await supabase.from('sponsors').upsert([dbPayload], { onConflict: 'id' });
    if (dbErr) {
      console.error('Supabase updateSponsor error:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Supabase database error: ' + dbErr.message });
    }
  } catch (e) {
    console.error('Supabase updateSponsor exception:', e.message);
    return res.status(500).json({ success: false, message: 'Database exception: ' + e.message });
  }

  if (index !== -1) {
    sponsors[index] = updatedSponsor;
    saveSponsorsData(sponsors);
  }

  res.json({ success: true, message: 'Sponsor updated successfully in live database', data: updatedSponsor });
};

exports.toggleSponsorStatus = async (req, res) => {
  const { id } = req.params;
  const sponsors = getSponsorsData();
  const sponsor = sponsors.find(s => s.id === id);

  let newStatus = true;
  try {
    const { data: dbSponsor } = await supabase.from('sponsors').select('is_active').eq('id', id).single();
    if (dbSponsor) {
      newStatus = !dbSponsor.is_active;
    } else if (sponsor) {
      newStatus = !sponsor.isActive;
    }
    const { error: dbErr } = await supabase.from('sponsors').update({ is_active: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    if (dbErr) {
      console.error('Supabase toggleSponsorStatus error:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Supabase database error: ' + dbErr.message });
    }
  } catch (e) {
    console.error('Supabase toggleSponsorStatus exception:', e.message);
    return res.status(500).json({ success: false, message: 'Database exception: ' + e.message });
  }

  if (sponsor) {
    sponsor.isActive = newStatus;
    sponsor.updatedAt = new Date().toISOString();
    saveSponsorsData(sponsors);
  }

  res.json({ 
    success: true, 
    message: `Sponsor marked as ${newStatus ? 'Active' : 'Inactive'} in live database`, 
    data: { id, isActive: newStatus } 
  });
};

exports.deleteSponsor = async (req, res) => {
  const { id } = req.params;
  const sponsors = getSponsorsData();
  const index = sponsors.findIndex(s => s.id === id);

  try {
    const { error: dbErr } = await supabase.from('sponsors').delete().eq('id', id);
    if (dbErr) {
      console.error('Supabase deleteSponsor error:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Supabase database error: ' + dbErr.message });
    }
  } catch (e) {
    console.error('Supabase deleteSponsor exception:', e.message);
    return res.status(500).json({ success: false, message: 'Database exception: ' + e.message });
  }

  if (index !== -1) {
    sponsors.splice(index, 1);
    saveSponsorsData(sponsors);
  }

  res.json({ success: true, message: 'Sponsor deleted successfully from live database' });
};

// ==================== LOGO / EVENT IMAGE UPLOAD ====================
exports.uploadLogo = async (req, res) => {
  try {
    const { imageBase64, fileName, type } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    if (imageBase64.startsWith('http://') || imageBase64.startsWith('https://') || imageBase64.startsWith('/events/') || imageBase64.startsWith('/sponsors/') || imageBase64.startsWith('/assets/') || imageBase64.startsWith('/uploads/')) {
      return res.json({ success: true, url: imageBase64, fileName: fileName || 'external-image' });
    }

    const prefix = type === 'venue' ? 'venue' : (type === 'sponsor' ? 'sponsor' : 'event');
    const cleanUrl = saveBase64ImageIfPresent(imageBase64, prefix);

    return res.json({
      success: true,
      message: 'Image uploaded and stored in assets successfully',
      url: cleanUrl,
      fileName: fileName || cleanUrl.split('/').pop()
    });

  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ success: false, message: 'Failed to process image upload' });
  }
};

// ==================== COORDINATOR MANAGEMENT ====================
exports.getCoordinators = async (req, res) => {
  try {
    const { data: dbCoords, error } = await supabase.from('coordinators').select('*').order('display_order', { ascending: true });
    if (!error && Array.isArray(dbCoords) && dbCoords.length > 0) {
      return res.json({ success: true, data: dbCoords.map(dbToCoordinator) });
    }
  } catch (e) {
    console.warn('Supabase getCoordinators fallback:', e.message);
  }

  const coordinators = getCoordinatorsData();
  coordinators.sort((a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999));
  res.json({ success: true, data: coordinators });
};

exports.getCoordinatorById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: dbCoord, error } = await supabase.from('coordinators').select('*').eq('id', id).single();
    if (!error && dbCoord) {
      return res.json({ success: true, data: dbToCoordinator(dbCoord) });
    }
  } catch (e) {
    console.warn('Supabase getCoordinatorById fallback:', e.message);
  }

  const coordinators = getCoordinatorsData();
  const coordinator = coordinators.find(c => c.id === id);
  if (!coordinator) {
    return res.status(404).json({ success: false, message: 'Coordinator not found' });
  }
  res.json({ success: true, data: coordinator });
};

exports.createCoordinator = async (req, res) => {
  const {
    name,
    phone,
    whatsapp,
    email,
    department,
    year,
    role,
    game,
    assignedEvents,
    displayOrder,
    isActive
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Full name is required' });
  }

  if (!phone || !phone.trim() || !/^[6-9]\d{9}$/.test(phone.trim().replace(/\s+/g, ''))) {
    return res.status(400).json({ success: false, message: 'Valid 10-digit Indian phone number is required (e.g. 9876543210)' });
  }

  if (!Array.isArray(assignedEvents) || assignedEvents.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one assigned event is required' });
  }

  const coordinators = getCoordinatorsData();
  const now = new Date().toISOString();
  const cleanPhone = phone.trim().replace(/\s+/g, '');

  const newCoordinator = {
    id: `coord-${Date.now()}`,
    name: name.trim(),
    phone: cleanPhone,
    whatsapp: whatsapp ? whatsapp.trim().replace(/\s+/g, '') : cleanPhone,
    email: email ? email.trim().toLowerCase() : '',
    department: department ? department.trim() : 'CSE',
    year: year ? year.trim() : '3rd Year',
    role: role || 'Lead Coordinator',
    game: game ? String(game).trim() : '',
    assignedEvents: assignedEvents.filter(e => e && typeof e === 'string' && e.trim() && !e.startsWith('game:')),
    displayOrder: displayOrder !== undefined && displayOrder !== '' ? Number(displayOrder) : coordinators.length + 1,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    createdAt: now,
    updatedAt: now
  };

  try {
    const dbPayload = coordinatorToDb(newCoordinator);
    const { error: dbErr } = await supabase.from('coordinators').insert([dbPayload]);
    if (dbErr) {
      console.error('Supabase createCoordinator error:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Supabase database error: ' + dbErr.message });
    }
  } catch (e) {
    console.error('Supabase createCoordinator exception:', e.message);
    return res.status(500).json({ success: false, message: 'Database exception: ' + e.message });
  }

  coordinators.push(newCoordinator);
  saveCoordinatorsData(coordinators);

  // Sync with matching login user account if it exists
  try {
    const users = getUsersData();
    const cNameLower = newCoordinator.name.toLowerCase().trim();
    let userUpdated = false;
    users.forEach(u => {
      const uName = String(u.username || '').toLowerCase().trim();
      if (uName === cNameLower || (cNameLower.length >= 3 && (uName.includes(cNameLower) || cNameLower.includes(uName.split(' ')[0])))) {
        u.assignedEvents = newCoordinator.assignedEvents;
        u.assigned_events = newCoordinator.assignedEvents;
        u.eventId = newCoordinator.assignedEvents[0] || null;
        u.event_id = newCoordinator.assignedEvents[0] || null;
        userUpdated = true;
      }
    });
    if (userUpdated) {
      saveUsersData(users);
      const matchedU = users.find(u => {
        const uName = String(u.username || '').toLowerCase().trim();
        return uName === cNameLower || (cNameLower.length >= 3 && (uName.includes(cNameLower) || cNameLower.includes(uName.split(' ')[0])));
      });
      if (matchedU) {
        await supabase.from('users').update({
          assigned_events: newCoordinator.assignedEvents,
          updated_at: new Date().toISOString()
        }).ilike('username', matchedU.username);
      }
    }
  } catch (_) {}

  res.status(201).json({ success: true, message: 'Student coordinator created successfully in live database', data: newCoordinator });
};

exports.updateCoordinator = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    phone,
    whatsapp,
    email,
    department,
    year,
    role,
    game,
    assignedEvents,
    displayOrder,
    isActive
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Full name is required' });
  }

  const coordinators = getCoordinatorsData();
  const index = coordinators.findIndex(c => c.id === id);

  const cleanPhone = phone ? phone.trim().replace(/\s+/g, '') : (coordinators[index]?.phone || '');
  const updatedCoordinator = {
    id,
    name: name.trim(),
    phone: cleanPhone,
    whatsapp: whatsapp !== undefined ? whatsapp.trim().replace(/\s+/g, '') : (coordinators[index]?.whatsapp || cleanPhone),
    email: email !== undefined ? email.trim().toLowerCase() : (coordinators[index]?.email || ''),
    department: department !== undefined ? department.trim() : (coordinators[index]?.department || 'CSE'),
    year: year !== undefined ? year.trim() : (coordinators[index]?.year || '3rd Year'),
    role: role || (coordinators[index]?.role || 'Lead Coordinator'),
    game: game !== undefined ? (game ? String(game).trim() : '') : (coordinators[index]?.game || ''),
    assignedEvents: Array.isArray(assignedEvents) ? assignedEvents.filter(e => e && typeof e === 'string' && e.trim() && !e.startsWith('game:')) : (coordinators[index]?.assignedEvents || []),
    displayOrder: displayOrder !== undefined && displayOrder !== '' ? Number(displayOrder) : (coordinators[index]?.displayOrder || 1),
    isActive: isActive !== undefined ? Boolean(isActive) : (coordinators[index]?.isActive !== false),
    updatedAt: new Date().toISOString()
  };

  try {
    const dbPayload = coordinatorToDb(updatedCoordinator);
    const { error: dbErr } = await supabase.from('coordinators').upsert([dbPayload], { onConflict: 'id' });
    if (dbErr) {
      console.error('Supabase updateCoordinator error:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Supabase database error: ' + dbErr.message });
    }
  } catch (e) {
    console.error('Supabase updateCoordinator exception:', e.message);
    return res.status(500).json({ success: false, message: 'Database exception: ' + e.message });
  }

  if (index !== -1) {
    coordinators[index] = updatedCoordinator;
    saveCoordinatorsData(coordinators);
  }

  // Sync with matching login user account if it exists
  try {
    const users = getUsersData();
    const cNameLower = updatedCoordinator.name.toLowerCase().trim();
    let userUpdated = false;
    users.forEach(u => {
      const uName = String(u.username || '').toLowerCase().trim();
      if (uName === cNameLower || (cNameLower.length >= 3 && (uName.includes(cNameLower) || cNameLower.includes(uName.split(' ')[0])))) {
        u.assignedEvents = updatedCoordinator.assignedEvents;
        u.assigned_events = updatedCoordinator.assignedEvents;
        u.eventId = updatedCoordinator.assignedEvents[0] || null;
        u.event_id = updatedCoordinator.assignedEvents[0] || null;
        userUpdated = true;
      }
    });
    if (userUpdated) {
      saveUsersData(users);
      const matchedU = users.find(u => {
        const uName = String(u.username || '').toLowerCase().trim();
        return uName === cNameLower || (cNameLower.length >= 3 && (uName.includes(cNameLower) || cNameLower.includes(uName.split(' ')[0])));
      });
      if (matchedU) {
        await supabase.from('users').update({
          assigned_events: updatedCoordinator.assignedEvents,
          updated_at: new Date().toISOString()
        }).ilike('username', matchedU.username);
      }
    }
  } catch (_) {}

  res.json({ success: true, message: 'Coordinator updated successfully in live database', data: updatedCoordinator });
};

exports.toggleCoordinatorStatus = async (req, res) => {
  const { id } = req.params;
  const coordinators = getCoordinatorsData();
  const coordinator = coordinators.find(c => c.id === id);

  let newStatus = true;
  try {
    const { data: dbCoord } = await supabase.from('coordinators').select('is_active').eq('id', id).single();
    if (dbCoord) {
      newStatus = !dbCoord.is_active;
    } else if (coordinator) {
      newStatus = !coordinator.isActive;
    }
    const { error: dbErr } = await supabase.from('coordinators').update({ is_active: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    if (dbErr) {
      console.error('Supabase toggleCoordinatorStatus error:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Supabase database error: ' + dbErr.message });
    }
  } catch (e) {
    console.error('Supabase toggleCoordinatorStatus exception:', e.message);
    return res.status(500).json({ success: false, message: 'Database exception: ' + e.message });
  }

  if (coordinator) {
    coordinator.isActive = newStatus;
    coordinator.updatedAt = new Date().toISOString();
    saveCoordinatorsData(coordinators);
  }

  res.json({ 
    success: true, 
    message: `Coordinator marked as ${newStatus ? 'Active' : 'Inactive'} in live database`, 
    data: { id, isActive: newStatus } 
  });
};

exports.deleteCoordinator = async (req, res) => {
  const { id } = req.params;
  const coordinators = getCoordinatorsData();
  const index = coordinators.findIndex(c => c.id === id);

  try {
    const { error: dbErr } = await supabase.from('coordinators').delete().eq('id', id);
    if (dbErr) {
      console.error('Supabase deleteCoordinator error:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Supabase database error: ' + dbErr.message });
    }
  } catch (e) {
    console.error('Supabase deleteCoordinator exception:', e.message);
    return res.status(500).json({ success: false, message: 'Database exception: ' + e.message });
  }

  if (index !== -1) {
    coordinators.splice(index, 1);
    saveCoordinatorsData(coordinators);
  }

  res.json({ success: true, message: 'Coordinator deleted successfully from live database' });
};

// ==================== REGISTRATION MANAGEMENT ====================
exports.deleteRegistration = async (req, res) => {
  const userRole = String(req.user?.role || '').toLowerCase();
  if (userRole !== 'superadmin' && userRole !== 'admin' && !userRole.includes('verif')) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const { id } = req.params;
  const normId = String(id || '').trim();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normId);

  try {
    let targetUUID = isUUID ? normId : null;
    let targetTicketCode = !isUUID ? normId : null;

    // 1. Look up registration in Supabase to resolve both exact UUID & ticket_code
    try {
      const query = isUUID
        ? supabase.from('registrations').select('id, ticket_code').eq('id', normId).maybeSingle()
        : supabase.from('registrations').select('id, ticket_code').ilike('ticket_code', normId).maybeSingle();
      const { data: matched } = await query;
      if (matched) {
        targetUUID = matched.id;
        targetTicketCode = matched.ticket_code;
      }
    } catch (findErr) {
      console.warn('Supabase lookup before delete note:', findErr.message);
    }

    // 2. Delete linked members from registration_members table in Supabase live
    try {
      if (targetUUID) {
        await supabase.from('registration_members').delete().eq('registration_id', targetUUID);
      }
      if (targetTicketCode) {
        await supabase.from('registration_members').delete().ilike('ticket_code', targetTicketCode);
      }
      if (isUUID) {
        await supabase.from('registration_members').delete().eq('registration_id', normId);
      } else {
        await supabase.from('registration_members').delete().ilike('ticket_code', normId);
      }
    } catch (memErr) {
      console.warn('Supabase delete registration_members note:', memErr.message);
    }

    // 3. Delete registration from registrations table in Supabase live
    try {
      if (targetUUID) {
        await supabase.from('registrations').delete().eq('id', targetUUID);
      }
      if (targetTicketCode) {
        await supabase.from('registrations').delete().ilike('ticket_code', targetTicketCode);
      }
      if (isUUID) {
        await supabase.from('registrations').delete().eq('id', normId);
      } else {
        await supabase.from('registrations').delete().ilike('ticket_code', normId);
      }
    } catch (supaErr) {
      console.warn('Supabase delete registration note:', supaErr.message);
    }

    // 4. Broadcast real-time WebSocket event to all connected clients
    try {
      const { broadcastRegistrationUpdate } = require('../config/websocket');
      broadcastRegistrationUpdate('DELETE', {
        id: targetUUID || normId,
        registrationId: targetUUID || normId,
        ticket_code: targetTicketCode || normId,
        ticketCode: targetTicketCode || normId
      });
    } catch (wsErr) {
      console.warn('WebSocket broadcast error on delete:', wsErr.message);
    }

    return res.json({ 
      success: true, 
      message: 'Registration and linked members deleted successfully from live database',
      deletedId: targetUUID || normId,
      deletedTicketCode: targetTicketCode || normId
    });
  } catch (err) {
    console.error('Error in deleteRegistration:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete registration' });
  }
};

// ==================== PARTICIPANT & UTR REGISTRATION VERIFICATION ====================
exports.verifyRegistration = async (req, res) => {
  const { id } = req.params;
  const { 
    isVerified, 
    status, 
    action, 
    flagReason, 
    reason 
  } = req.body;

  const operatorName = req.user?.username || req.user?.role || 'Admin';
  const normId = String(id || '').trim();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normId);

  // Determine target state
  let newStatus = 'pending';
  if (action === 'admit') {
    newStatus = 'verified';
  } else if (action === 'unadmit') {
    newStatus = 'verified'; // keeps registration verified
  } else if (status === 'verified' || action === 'verify' || isVerified === true) {
    newStatus = 'verified';
  } else if (status === 'flagged' || action === 'flag' || req.body.isFlagged === true) {
    newStatus = 'flagged';
  } else if (status === 'pending' || action === 'unverify' || action === 'unflag' || isVerified === false) {
    newStatus = 'pending';
  }

  // Guard against admitting or verifying a flagged registration
  if ((action === 'admit' || action === 'verify' || isVerified === true) && action !== 'unflag' && status !== 'flagged') {
    try {
      const chkQuery = isUUID
        ? supabase.from('registrations').select('is_flagged, flag_reason, verification_status').eq('id', normId).maybeSingle()
        : supabase.from('registrations').select('is_flagged, flag_reason, verification_status').ilike('ticket_code', normId).maybeSingle();
      const { data: chkData } = await chkQuery;
      if (chkData && (chkData.is_flagged === true || chkData.verification_status === 'flagged')) {
        return res.status(400).json({
          success: false,
          message: `Cannot admit participant. Ticket is FLAGGED in Registration Verification: "${chkData.flag_reason || 'Flagged for investigation'}"`
        });
      }
    } catch (chkErr) {
      console.warn('Flag check warning:', chkErr.message);
    }
  }

  const isNowVerified = newStatus === 'verified';
  const isNowFlagged = newStatus === 'flagged';
  const nowIso = new Date().toISOString();
  const noteReason = flagReason || reason || 'Flagged for UTR review';

  const verifiedAt = isNowVerified ? nowIso : null;
  const verifiedBy = isNowVerified ? operatorName : null;
  const flaggedAt = isNowFlagged ? nowIso : null;
  const flaggedBy = isNowFlagged ? operatorName : null;
  const finalFlagReason = isNowFlagged ? noteReason : null;
  const targetAttendance = req.body.attendance_status || (action === 'unadmit' ? 'pending' : (isNowVerified ? 'verified' : 'pending'));

  try {
    const updatePayload = {
      is_verified: isNowVerified,
      verified_at: verifiedAt,
      verified_by: verifiedBy,
      attendance_status: targetAttendance,
      verification_status: newStatus,
      is_flagged: isNowFlagged,
      flag_reason: finalFlagReason,
      flagged_at: flaggedAt,
      flagged_by: flaggedBy
    };

    const query = isUUID
      ? supabase.from('registrations').update(updatePayload).eq('id', normId)
      : supabase.from('registrations').update(updatePayload).ilike('ticket_code', normId);

    const { data: dbData, error: supaErr } = await query.select('*, registration_members(*)');
    let updatedRecord = (Array.isArray(dbData) && dbData.length > 0) ? dbData[0] : null;

    if (supaErr) {
      console.warn('Supabase verifyRegistration column fallback:', supaErr.message);
      const fallbackPayload = {
        is_verified: isNowVerified,
        verified_at: verifiedAt,
        verified_by: verifiedBy,
        attendance_status: isNowVerified ? 'verified' : 'pending'
      };
      const fbQuery = isUUID
        ? supabase.from('registrations').update(fallbackPayload).eq('id', normId)
        : supabase.from('registrations').update(fallbackPayload).ilike('ticket_code', normId);
      const { data: fbData } = await fbQuery.select('*, registration_members(*)');
      if (Array.isArray(fbData) && fbData.length > 0) updatedRecord = fbData[0];
    }

    if (!updatedRecord) {
      updatedRecord = {
        id: normId,
        ticket_code: normId,
        ticketCode: normId,
        is_verified: isNowVerified,
        isVerified: isNowVerified,
        is_flagged: isNowFlagged,
        isFlagged: isNowFlagged,
        verification_status: newStatus,
        verificationStatus: newStatus,
        attendance_status: targetAttendance,
        attendanceStatus: targetAttendance,
        verified_at: verifiedAt,
        verified_by: verifiedBy,
        flagged_at: flaggedAt,
        flagged_by: flaggedBy,
        flag_reason: finalFlagReason,
        flagReason: finalFlagReason
      };
    }

    // Broadcast WebSocket real-time update
    try {
      const { broadcastRegistrationUpdate } = require('../config/websocket');
      broadcastRegistrationUpdate('UPDATE', updatedRecord);
    } catch (wsErr) {}

    let statusMsg = 'Participant verified and payment confirmed successfully!';
    if (isNowFlagged) statusMsg = 'Registration flagged for UTR / payment investigation.';
    else if (action === 'admit') statusMsg = 'Participant successfully admitted to event!';
    else if (action === 'unadmit') statusMsg = 'Participant admission reset to pending.';
    else if (!isNowVerified) statusMsg = 'Registration verification status reset to pending.';

    return res.json({
      success: true,
      message: statusMsg,
      data: updatedRecord
    });
  } catch (err) {
    console.error('Error in verifyRegistration:', err);
    return res.status(500).json({ success: false, message: 'Failed to update verification status' });
  }
};

exports.updateRegistrationVerification = exports.verifyRegistration;

// ==================== HOMEPAGE STUDENT COORDINATOR TEAMS ============================
exports.getHomepageCoordinators = async (req, res) => {
  try {
    try {
      const { data: dbTeams, error } = await supabase.from('homepage_coordinators').select('*').order('display_order', { ascending: true });
      if (!error && Array.isArray(dbTeams) && dbTeams.length > 0) {
        return res.json({ success: true, data: dbTeams.map(dbToHomepageTeam) });
      }
    } catch (e) {
      console.warn('Supabase getHomepageCoordinators fallback:', e.message);
    }
    const teams = getHomepageCoordinatorsData();
    teams.sort((a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999));
    res.json({ success: true, data: teams });
  } catch (err) {
    console.error('Error in getHomepageCoordinators:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch homepage coordinator teams' });
  }
};

exports.getHomepageCoordinatorById = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      const { data: dbTeam, error } = await supabase.from('homepage_coordinators').select('*').eq('id', id).single();
      if (!error && dbTeam) {
        return res.json({ success: true, data: dbToHomepageTeam(dbTeam) });
      }
    } catch (e) {
      console.warn('Supabase getHomepageCoordinatorById fallback:', e.message);
    }
    const teams = getHomepageCoordinatorsData();
    const team = teams.find(t => t.id === id);
    if (!team) return res.status(404).json({ success: false, message: 'Homepage team not found' });
    res.json({ success: true, data: team });
  } catch (err) {
    console.error('Error in getHomepageCoordinatorById:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch team details' });
  }
};

exports.createHomepageCoordinator = async (req, res) => {
  try {
    const { role, tag, iconName, tier, desc, members, names, displayOrder, isActive } = req.body;
    if (!role || !role.trim()) {
      return res.status(400).json({ success: false, message: 'Team title / role is required' });
    }

    const teams = getHomepageCoordinatorsData();
    const id = req.body.id && req.body.id.trim()
      ? req.body.id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-')
      : `team-${Date.now()}`;

    // Normalize members
    let normalizedMembers = [];
    if (Array.isArray(members) && members.length > 0) {
      normalizedMembers = members
        .map(m => typeof m === 'string' ? { name: m.trim() } : { name: m.name ? m.name.trim() : '' })
        .filter(m => m.name.length > 0);
    } else if (Array.isArray(names) && names.length > 0) {
      normalizedMembers = names
        .filter(n => typeof n === 'string' && n.trim().length > 0)
        .map(n => ({ name: n.trim() }));
    }

    const newTeam = {
      id,
      role: role.trim(),
      tag: (tag || 'TEAM').trim(),
      iconName: iconName || 'Users',
      tier: tier || 'emerald',
      desc: (desc || '').trim(),
      members: normalizedMembers,
      names: normalizedMembers.map(m => m.name),
      displayOrder: displayOrder !== undefined && displayOrder !== '' ? Number(displayOrder) : teams.length + 1,
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Supabase if available
    try {
      const dbPayload = homepageTeamToDb(newTeam);
      const { error: dbErr } = await supabase.from('homepage_coordinators').insert([dbPayload]);
      if (dbErr) console.error('Supabase createHomepageCoordinator error:', dbErr.message);
    } catch (e) {
      console.error('Supabase createHomepageCoordinator exception:', e.message);
    }

    // Save to local file & sync frontend
    teams.push(newTeam);
    saveHomepageCoordinatorsData(teams);

    res.status(201).json({ success: true, message: 'Homepage coordinator team created successfully', data: newTeam });
  } catch (err) {
    console.error('Error in createHomepageCoordinator:', err);
    res.status(500).json({ success: false, message: 'Failed to create homepage coordinator team' });
  }
};

exports.updateHomepageCoordinator = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, tag, iconName, tier, desc, members, names, displayOrder, isActive } = req.body;

    const teams = getHomepageCoordinatorsData();
    const index = teams.findIndex(t => t.id === id);

    let normalizedMembers = undefined;
    if (Array.isArray(members)) {
      normalizedMembers = members
        .map(m => typeof m === 'string' ? { name: m.trim() } : { name: m.name ? m.name.trim() : '' })
        .filter(m => m.name.length > 0);
    } else if (Array.isArray(names)) {
      normalizedMembers = names
        .filter(n => typeof n === 'string' && n.trim().length > 0)
        .map(n => ({ name: n.trim() }));
    }

    const existingTeam = index !== -1 ? teams[index] : {};
    const updatedTeam = {
      ...existingTeam,
      id,
      role: role !== undefined ? role.trim() : existingTeam.role,
      tag: tag !== undefined ? tag.trim() : (existingTeam.tag || 'TEAM'),
      iconName: iconName !== undefined ? iconName : (existingTeam.iconName || 'Users'),
      tier: tier !== undefined ? tier : (existingTeam.tier || 'emerald'),
      desc: desc !== undefined ? desc.trim() : (existingTeam.desc || ''),
      members: normalizedMembers !== undefined ? normalizedMembers : (existingTeam.members || []),
      names: normalizedMembers !== undefined ? normalizedMembers.map(m => m.name) : (existingTeam.names || []),
      displayOrder: displayOrder !== undefined && displayOrder !== '' ? Number(displayOrder) : (existingTeam.displayOrder || 999),
      isActive: isActive !== undefined ? Boolean(isActive) : (existingTeam.isActive !== false),
      updatedAt: new Date().toISOString()
    };

    // Update in Supabase
    try {
      const dbPayload = homepageTeamToDb(updatedTeam);
      const { error: dbErr } = await supabase.from('homepage_coordinators').upsert([dbPayload]);
      if (dbErr) console.error('Supabase updateHomepageCoordinator error:', dbErr.message);
    } catch (e) {
      console.error('Supabase updateHomepageCoordinator exception:', e.message);
    }

    // Update in local file
    if (index !== -1) {
      teams[index] = updatedTeam;
    } else {
      teams.push(updatedTeam);
    }
    saveHomepageCoordinatorsData(teams);

    res.json({ success: true, message: 'Homepage coordinator team updated successfully', data: updatedTeam });
  } catch (err) {
    console.error('Error in updateHomepageCoordinator:', err);
    res.status(500).json({ success: false, message: 'Failed to update homepage coordinator team' });
  }
};

exports.toggleHomepageCoordinatorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const teams = getHomepageCoordinatorsData();
    const index = teams.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Homepage team not found' });
    }

    const newStatus = teams[index].isActive === false ? true : false;
    teams[index].isActive = newStatus;
    teams[index].updatedAt = new Date().toISOString();

    try {
      await supabase.from('homepage_coordinators').update({ is_active: newStatus, updated_at: teams[index].updatedAt }).eq('id', id);
    } catch (e) {
      console.error('Supabase toggle status error:', e.message);
    }

    saveHomepageCoordinatorsData(teams);
    res.json({
      success: true,
      message: `Team "${teams[index].role}" is now ${newStatus ? 'visible on' : 'hidden from'} the homepage`,
      data: teams[index]
    });
  } catch (err) {
    console.error('Error in toggleHomepageCoordinatorStatus:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle homepage team status' });
  }
};

exports.deleteHomepageCoordinator = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await supabase.from('homepage_coordinators').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteHomepageCoordinator fallback:', e.message);
    }

    let teams = getHomepageCoordinatorsData();
    const initialLen = teams.length;
    teams = teams.filter(t => t.id !== id);
    if (teams.length !== initialLen) {
      saveHomepageCoordinatorsData(teams);
    }

    res.json({ success: true, message: 'Homepage coordinator team deleted successfully' });
  } catch (err) {
    console.error('Error in deleteHomepageCoordinator:', err);
    res.status(500).json({ success: false, message: 'Failed to delete homepage coordinator team' });
  }
};

// ==================== REGISTRATION ACCESS CONTROL (CLOSE RG) ====================
exports.getAdminRegistrationStatus = async (req, res) => {
  try {
    let settings = getSettingsData();
    try {
      const { data: dbSettings, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'general')
        .maybeSingle();

      if (dbSettings && !error) {
        settings = {
          isRegistrationClosed: Boolean(dbSettings.is_registration_closed),
          closedReason: dbSettings.closed_reason || settings.closedReason || 'ONLINE REGISTRATIONS ARE CLOSED',
          closedAt: dbSettings.closed_at || settings.closedAt || null,
          closedBy: dbSettings.closed_by || settings.closedBy || null,
          onSpotNotice: dbSettings.on_spot_notice || settings.onSpotNotice || 'ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM',
          updatedAt: dbSettings.updated_at || new Date().toISOString()
        };
        saveSettingsData(settings);
      }
    } catch (dbErr) {
      console.warn('Supabase fetch settings warning:', dbErr.message);
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (err) {
    console.error('Error in getAdminRegistrationStatus:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch registration status' });
  }
};

exports.updateRegistrationStatus = async (req, res) => {
  try {
    const { isRegistrationClosed, closedReason, onSpotNotice } = req.body;
    const current = getSettingsData();
    const shouldClose = Boolean(isRegistrationClosed);

    const updated = {
      ...current,
      isRegistrationClosed: shouldClose,
      closedReason: typeof closedReason === 'string' && closedReason.trim() ? closedReason.trim() : (current.closedReason || 'ONLINE REGISTRATIONS ARE CLOSED'),
      onSpotNotice: typeof onSpotNotice === 'string' && onSpotNotice.trim() ? onSpotNotice.trim() : (current.onSpotNotice || 'ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM'),
      closedAt: shouldClose ? (current.isRegistrationClosed ? current.closedAt : new Date().toISOString()) : null,
      closedBy: shouldClose ? (req.user?.username || 'admin') : null,
      updatedAt: new Date().toISOString()
    };

    // 1. Save locally immediately
    saveSettingsData(updated);

    // 2. Persist to Supabase live database
    try {
      const dbPayload = {
        id: 'general',
        is_registration_closed: updated.isRegistrationClosed,
        closed_reason: updated.closedReason,
        on_spot_notice: updated.onSpotNotice,
        closed_at: updated.closedAt,
        closed_by: updated.closedBy,
        updated_at: updated.updatedAt
      };
      const { error: dbErr } = await supabase
        .from('settings')
        .upsert([dbPayload], { onConflict: 'id' });

      if (dbErr) {
        console.warn('Supabase updateRegistrationStatus warning:', dbErr.message);
      }
    } catch (dbEx) {
      console.warn('Supabase settings upsert exception:', dbEx.message);
    }

    // 3. Broadcast real-time update via WebSocket to all connected clients
    try {
      broadcastRegistrationUpdate('REGISTRATION_STATUS_UPDATED', updated);
    } catch (wsErr) {
      console.warn('WS Broadcast error:', wsErr.message);
    }

    res.json({
      success: true,
      message: updated.isRegistrationClosed 
        ? 'Registrations have been closed across all symposium events.' 
        : 'Registrations have been re-opened successfully.',
      data: updated
    });
  } catch (err) {
    console.error('Error in updateRegistrationStatus:', err);
    res.status(500).json({ success: false, message: 'Failed to update registration status' });
  }
};

