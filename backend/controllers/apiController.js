const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const supabase = require('../config/supabase');
const { saveBase64ImageIfPresent } = require('../utils/imageStorage');

let razorpayClient = null;
function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return null;
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }
  return razorpayClient;
}

// Persistent Data Storage Path
const DATA_DIR = path.join(__dirname, '../data');
const SPONSORS_FILE = path.join(DATA_DIR, 'sponsors.json');
const COORDINATORS_FILE = path.join(DATA_DIR, 'coordinators.json');
const HOMEPAGE_COORDINATORS_FILE = path.join(DATA_DIR, 'homepage_coordinators.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
    isRegistrationClosed: false,
    closedReason: 'Registrations for ELOQUENCE 2026 are officially closed. Thank you for your overwhelming interest!',
    closedAt: null,
    closedBy: null,
    updatedAt: new Date().toISOString()
  }, null, 2), 'utf-8');
}

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return {
        isRegistrationClosed: false,
        closedReason: 'Registrations for ELOQUENCE 2026 are officially closed. Thank you for your overwhelming interest!',
        closedAt: null,
        closedBy: null
      };
    }
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
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

function writeSettings(data) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing settings file:', err);
    return false;
  }
}

function readSponsors() {
  try {
    const raw = fs.readFileSync(SPONSORS_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

function readCoordinators() {
  try {
    const raw = fs.readFileSync(COORDINATORS_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

function readHomepageCoordinators() {
  try {
    const raw = fs.readFileSync(HOMEPAGE_COORDINATORS_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

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
      const localCoords = readCoordinators();
      const match = localCoords.find(lc => lc.id === c.id);
      if (match && match.game) game = match.game;
    } catch (_) {}
  }
  if (!game && events.some(e => String(e).toLowerCase().includes('nontech-05'))) {
    const n = String(c.name || '').toLowerCase();
    if (n.includes('bala') || n.includes('suresh')) game = 'Free Fire';
    else if (n.includes('adnan') || n.includes('zaid')) game = 'BGMI';
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

  let resolvedTier = t.tier;
  if (!resolvedTier || resolvedTier === 'emerald') {
    try {
      const localTeams = readHomepageCoordinators();
      const localMatch = localTeams.find(lt => lt.id === t.id);
      if (localMatch && localMatch.tier) {
        resolvedTier = localMatch.tier;
      }
    } catch (_) {}
  }
  if (!resolvedTier) {
    if (t.id === 'web-team') resolvedTier = 'cyan';
    else if (t.color && ['cyan', 'emerald', 'gold', 'purple', 'crimson', 'orange'].includes(t.color)) resolvedTier = t.color;
    else resolvedTier = 'emerald';
  }

  return {
    id: t.id,
    role: t.role || '',
    tag: t.tag || 'TEAM',
    iconName: t.icon_name || t.iconName || t.icon || 'Users',
    tier: resolvedTier,
    desc: t.description || t.desc || t.desc_text || '',
    members: normalizedMembers,
    names: normalizedMembers.map(m => m.name),
    displayOrder: Number(t.display_order ?? t.displayOrder ?? 999),
    isActive: t.is_active !== false && t.isActive !== false,
    createdAt: t.created_at || t.createdAt,
    updatedAt: t.updated_at || t.updatedAt
  };
};

const EVENT_TEAM_RULES = {
  'tech-01': { isTeam: true, minMembers: 1, maxMembers: 3, teamSize: 'Max of 3 members', feePerHead: 100, feeType: 'per_head' },
  'tech-02': { isTeam: true, minMembers: 1, maxMembers: 2, teamSize: 'Individual / Team of 2', feePerHead: 50, feeType: 'per_head' },
  'tech-03': { isTeam: true, minMembers: 1, maxMembers: 2, teamSize: 'Individual / Team of 2', feePerHead: 50, feeType: 'per_head' },
  'tech-04': { isTeam: true, minMembers: 1, maxMembers: 2, teamSize: 'Individual / Team of 2', feePerHead: 50, feeType: 'per_head' },
  'tech-05': { isTeam: false, minMembers: 1, maxMembers: 1, teamSize: 'Individual', feePerHead: 50, feeType: 'per_head' },
  'tech-06': { isTeam: false, minMembers: 1, maxMembers: 1, teamSize: 'Individual', feePerHead: 50, feeType: 'per_head' },
  'nontech-01': { isTeam: false, minMembers: 1, maxMembers: 1, teamSize: 'Individual', feePerHead: 50, feeType: 'per_head' },
  'nontech-02': { isTeam: true, minMembers: 1, maxMembers: 3, teamSize: 'Max of 3 members', feePerHead: 50, feeType: 'per_head' },
  'nontech-03': { isTeam: true, minMembers: 2, maxMembers: 4, teamSize: 'Max of 4 members', feePerHead: 50, feeType: 'per_head' },
  'nontech-04': { isTeam: false, minMembers: 1, maxMembers: 1, teamSize: 'Individual', feePerHead: 50, feeType: 'per_head' },
  'nontech-05': { isTeam: true, minMembers: 4, maxMembers: 4, teamSize: 'Only Squad Match (4 Players)', feePerHead: 50, feeType: 'per_squad' },
  'nontech-06': { isTeam: false, minMembers: 1, maxMembers: 1, teamSize: 'Individual only', feePerHead: 50, feeType: 'per_head' },
  'nontech-07': { isTeam: true, minMembers: 5, maxMembers: 5, teamSize: 'Team of 5 Members', feePerHead: 50, feeType: 'per_team' }
};

const dbToEvent = (e) => {
  const normId = String(e.id || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  const rule = EVENT_TEAM_RULES[normId] || EVENT_TEAM_RULES[e.id] || null;

  let isTeam = false;
  if (rule) {
    isTeam = rule.isTeam;
  } else if (e.is_team !== undefined) {
    isTeam = Boolean(e.is_team);
  } else if (e.isTeam !== undefined) {
    isTeam = Boolean(e.isTeam);
  } else if (e.max_members !== undefined || e.maxMembers !== undefined) {
    isTeam = Number(e.max_members || e.maxMembers) > 1;
  }

  const minMembers = Number(e.min_members ?? e.minMembers ?? (rule ? rule.minMembers : 1));
  const maxMembers = Number(e.max_members ?? e.maxMembers ?? (rule ? rule.maxMembers : (isTeam ? 3 : 1)));
  const teamSize = e.team_size || e.teamSize || (rule ? rule.teamSize : (isTeam ? `Max of ${maxMembers} members` : 'Individual'));
  const rawFee = Number(e.fee_per_head ?? e.feePerHead ?? 0);
  const feePerHead = rawFee > 0 ? rawFee : (rule ? rule.feePerHead : (normId === 'tech-01' ? 100 : 50));
  const feeType = e.fee_type || e.feeType || (rule ? rule.feeType : 'per_head');

  return {
    id: e.id,
    number: e.number,
    name: e.name,
    alias: e.alias || e.name,
    subtitle: e.subtitle,
    category: e.category,
    teamSize: teamSize,
    team_size: teamSize,
    minMembers: minMembers,
    min_members: minMembers,
    maxMembers: maxMembers,
    max_members: maxMembers,
    fee: e.fee || (feeType === 'per_squad' || feeType === 'per_team' ? `₹${feePerHead * maxMembers} per team` : `₹${feePerHead} per head`),
    feePerHead: feePerHead,
    fee_per_head: feePerHead,
    feeType: feeType,
    fee_type: feeType,
    isTeam: isTeam,
    is_team: isTeam,
    tag: e.tag,
    venue: e.venue,
    venueImage: e.venue_image || e.venueImage || '',
    venue_image: e.venue_image || e.venueImage || '',
    timing: e.timing,
    description: e.description,
    image: e.image || '',
    rules: e.rules,
    rounds: e.rounds,
    guidelines: e.guidelines,
    highlights: e.highlights,
    createdAt: e.created_at || e.createdAt,
    updatedAt: e.updated_at || e.updatedAt
  };
};

// ── Ultra-Fast Server In-Memory Cache with Background Sync ────────────────
let inMemoryEvents = null;
let lastEventsSyncTime = 0;
let inFlightEventsPromise = null;

let inMemorySponsors = null;
let lastSponsorsSyncTime = 0;
let inFlightSponsorsPromise = null;

let inMemoryCoordinators = null;
let lastCoordinatorsSyncTime = 0;
let inFlightCoordinatorsPromise = null;

let inMemoryHomepageTeams = null;
let lastHomepageTeamsSyncTime = 0;
let inFlightHomepageTeamsPromise = null;

let inMemorySettings = null;
let lastSettingsSyncTime = 0;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL for public read-only static data
const SETTINGS_CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL for registration status

function initServerMemoryCache() {
  try {
    const eventsFile = path.join(DATA_DIR, 'events.json');
    if (fs.existsSync(eventsFile)) {
      const parsed = JSON.parse(fs.readFileSync(eventsFile, 'utf-8') || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryEvents = parsed;
        lastEventsSyncTime = Date.now();
      }
    }
  } catch (_) {}

  try {
    const sponsors = readSponsors();
    const active = sponsors.map(dbToSponsor).filter(s => s.isActive !== false);
    active.sort((a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999));
    if (active.length > 0) {
      inMemorySponsors = active;
      lastSponsorsSyncTime = Date.now();
    }
  } catch (_) {}

  try {
    const coords = readCoordinators();
    const active = coords.map(dbToCoordinator).filter(c => c.isActive !== false);
    active.sort((a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999));
    if (active.length > 0) {
      inMemoryCoordinators = active;
      lastCoordinatorsSyncTime = Date.now();
    }
  } catch (_) {}

  try {
    const hp = readHomepageCoordinators();
    const active = hp.map(dbToHomepageTeam).filter(t => t.isActive !== false);
    active.sort((a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999));
    if (active.length > 0) {
      inMemoryHomepageTeams = active;
      lastHomepageTeamsSyncTime = Date.now();
    }
  } catch (_) {}

  try {
    const st = readSettings();
    if (st) {
      inMemorySettings = st;
      lastSettingsSyncTime = Date.now();
    }
  } catch (_) {}
}

initServerMemoryCache();

exports.invalidateEventsCache = () => {
  inMemoryEvents = null;
  lastEventsSyncTime = 0;
  inFlightEventsPromise = null;
};
exports.invalidateSponsorsCache = () => {
  inMemorySponsors = null;
  lastSponsorsSyncTime = 0;
  inFlightSponsorsPromise = null;
};
exports.invalidateCoordinatorsCache = () => {
  inMemoryCoordinators = null;
  lastCoordinatorsSyncTime = 0;
  inFlightCoordinatorsPromise = null;
};
exports.invalidateHomepageTeamsCache = () => {
  inMemoryHomepageTeams = null;
  lastHomepageTeamsSyncTime = 0;
  inFlightHomepageTeamsPromise = null;
};
exports.invalidateSettingsCache = () => {
  inMemorySettings = null;
  lastSettingsSyncTime = 0;
};

exports.getStatus = (req, res) => {
  res.json({
    success: true,
    message: 'API is working properly'
  });
};

exports.getRegistrationStatus = async (req, res) => {
  const now = Date.now();
  if (inMemorySettings && (now - lastSettingsSyncTime < SETTINGS_CACHE_TTL_MS)) {
    return res.json({
      success: true,
      data: inMemorySettings,
      isRegistrationClosed: Boolean(inMemorySettings.isRegistrationClosed),
      closedReason: inMemorySettings.closedReason || 'ONLINE REGISTRATIONS ARE CLOSED',
      onSpotNotice: inMemorySettings.onSpotNotice || 'ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM',
      closedAt: inMemorySettings.closedAt || null
    });
  }

  try {
    let settings = inMemorySettings || readSettings();
    try {
      const { data: dbSettings, error } = await supabase
        .from('settings')
        .select('id, is_registration_closed, closed_reason, closed_at, closed_by, on_spot_notice, updated_at')
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
        writeSettings(settings);
      }
    } catch (dbErr) {
      // Non-blocking fallback to local settings
    }

    inMemorySettings = settings;
    lastSettingsSyncTime = Date.now();

    res.json({
      success: true,
      data: settings,
      isRegistrationClosed: Boolean(settings.isRegistrationClosed),
      closedReason: settings.closedReason || 'ONLINE REGISTRATIONS ARE CLOSED',
      onSpotNotice: settings.onSpotNotice || 'ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM',
      closedAt: settings.closedAt || null
    });
  } catch (err) {
    console.error('Error reading registration status:', err);
    res.status(500).json({ success: false, message: 'Failed to read registration status' });
  }
};



// ── Razorpay Payment Gateway Integration ──────────────────────────────────────

exports.createPaymentOrder = async (req, res) => {
  try {
    const settings = readSettings();
    if (settings.isRegistrationClosed) {
      return res.status(403).json({
        success: false,
        message: settings.closedReason || 'Registrations for ELOQUENCE 2026 are officially closed. No new registrations are accepted.'
      });
    }

    const { currentEvent, fields, totalFee, game } = req.body;

    if (!currentEvent || !fields) {
      return res.status(400).json({
        success: false,
        message: 'Missing event details or participant registration form fields.'
      });
    }

    const amountInRupees = Number(totalFee);
    if (isNaN(amountInRupees) || amountInRupees <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration fee amount.'
      });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay keys are not configured on the backend server.'
      });
    }

    const amountInPaise = Math.round(amountInRupees * 100);
    const shortReceipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.floor(100 + Math.random() * 900)}`;

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: shortReceipt,
      notes: {
        eventId: currentEvent.id || '',
        eventName: currentEvent.name || '',
        fullName: fields.fullName || '',
        email: fields.email || '',
        phone: fields.phone || '',
        game: game || ''
      }
    };

    const order = await razorpay.orders.create(options);

    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('[Razorpay createPaymentOrder Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create Razorpay payment order',
      errorDetails: err.message || err.toString()
    });
  }
};

exports.verifyPaymentAndRegister = async (req, res) => {
  const settings = readSettings();
  if (settings.isRegistrationClosed) {
    return res.status(403).json({
      success: false,
      message: settings.closedReason || 'Registrations for ELOQUENCE 2026 are officially closed. No new registrations are accepted.'
    });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    currentEvent,
    fields,
    totalFee,
    game,
    paymentMethod
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'Missing Razorpay payment verification credentials (order ID, payment ID, or signature).'
    });
  }

  if (!currentEvent || !fields) {
    return res.status(400).json({
      success: false,
      message: 'Missing registration details for payment verification.'
    });
  }

  // 1. Verify Razorpay HMAC SHA256 Signature
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(500).json({
      success: false,
      message: 'Server missing Razorpay secret key for verification.'
    });
  }

  const hmac = crypto.createHmac('sha256', keySecret);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature !== razorpay_signature) {
    console.error('[Razorpay Signature Mismatch]', {
      generated: generatedSignature,
      received: razorpay_signature
    });
    return res.status(400).json({
      success: false,
      message: 'Payment verification failed: Invalid transaction signature.'
    });
  }

  // 2. Generate unique Ticket Code
  const eventCat = currentEvent.category === 'technical' ? 'TCH' : 'NT';
  const ticketCode = `ELQ26-${eventCat}-${Math.floor(10000 + Math.random() * 90000)}`;
  let registrationId = crypto.randomUUID ? crypto.randomUUID() : `reg-${Date.now()}`;

  try {
    // Ensure event exists in Supabase events table
    try {
      const { data: existingEv } = await supabase
        .from('events')
        .select('id')
        .eq('id', currentEvent.id)
        .maybeSingle();

      if (!existingEv) {
        await supabase.from('events').insert([{
          id: currentEvent.id,
          number: '99',
          name: currentEvent.name,
          category: currentEvent.category,
          team_size: currentEvent.teamSize || 'Individual',
          min_members: currentEvent.minMembers || 1,
          max_members: currentEvent.maxMembers || 1,
          fee_type: currentEvent.feeType || 'per_head',
          fee_per_head: currentEvent.feePerHead || 50
        }]);
      }
    } catch (eEv) {
      console.warn('Supabase event auto-sync warning:', eEv.message);
    }

    const validTeamMembers = (fields.teamMembers || [])
      .filter(m => (typeof m === 'string' ? m.trim().length > 0 : (m?.name && m.name.trim().length > 0)));

    // 3. Insert into Supabase registrations table
    const paymentMeta = {
      venue: currentEvent.venue || 'CSE Department Labs',
      payment_method: paymentMethod || 'RAZORPAY',
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    };
    const venueSnapshotStr = JSON.stringify(paymentMeta);

    // Supabase requires registration_status: 'active' and non-null college/dept/year
    const regPayload = {
      event_id: currentEvent.id,
      ticket_code: ticketCode,
      team_name: fields.teamName || null,
      full_name: fields.fullName,
      email: fields.email,
      phone: fields.phone,
      college: fields.college || 'C. Abdul Hakeem College of Engg & Tech',
      department: fields.department || 'CSE',
      year: fields.year || '3rd Year',
      members_count: 1 + validTeamMembers.length,
      total_fee: totalFee,
      payment_status: 'paid',
      registration_status: 'active',
      venue_snapshot: venueSnapshotStr,
      timing_snapshot: currentEvent.timing || '10:00 AM – 1:00 PM'
    };

    try {
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .insert([regPayload])
        .select('id');

      if (regError) {
        console.warn('Supabase registration insert warning:', regError.message);
      } else if (regData && regData[0]) {
        registrationId = regData[0].id;
      }
    } catch (dbErr) {
      console.error('Supabase registration insert exception:', dbErr.message);
    }

    // Insert team members if any
    if (registrationId && validTeamMembers.length > 0) {
      try {
        const membersToInsert = validTeamMembers.map((member, idx) => ({
          registration_id: registrationId,
          member_number: idx + 2,
          member_name: (typeof member === 'string' ? member : (member.name || '')).trim()
        }));

        await supabase.from('registration_members').insert(membersToInsert);
      } catch (memErr) {
        console.warn('Registration members insert warning:', memErr.message);
      }
    }

    // Build structured ticket data for frontend
    const ticketData = {
      ticketCode,
      registrationId: ticketCode,
      eventId: currentEvent.id,
      event_id: currentEvent.id,
      eventName: currentEvent.name,
      category: currentEvent.category,
      eventCategory: currentEvent.category,
      leadName: fields.fullName,
      fullName: fields.fullName,
      college: fields.college,
      department: fields.department,
      email: fields.email,
      phone: fields.phone,
      year: fields.year,
      teamName: fields.teamName || null,
      isTeam: Boolean(currentEvent.isTeam),
      membersCount: 1 + validTeamMembers.length,
      participantCount: 1 + validTeamMembers.length,
      teamMembersList: validTeamMembers.map(m => typeof m === 'string' ? m : (m?.name || '')),
      totalFee,
      totalAmount: totalFee,
      paymentStatus: 'PAID',
      payment_status: 'paid',
      registrationStatus: 'ACTIVE',
      registration_status: 'active',
      paymentMethod: paymentMethod === 'RAZORPAY_UPI' ? 'RAZORPAY_UPI' : (paymentMethod || 'RAZORPAY'),
      payment_method: paymentMethod === 'RAZORPAY_UPI' ? 'RAZORPAY_UPI' : (paymentMethod || 'RAZORPAY'),
      razorpayPaymentId: razorpay_payment_id,
      razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpay_order_id,
      venue: currentEvent.venue || 'CSE Department Labs',
      timing: currentEvent.timing || '10:00 AM – 1:00 PM',
      game: game || null,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      createdAt: new Date().toISOString()
    };

    // Broadcast real-time event via WebSocket
    try {
      const { broadcastRegistrationUpdate } = require('../config/websocket');
      broadcastRegistrationUpdate('CREATE', ticketData);
    } catch (wsErr) {
      console.warn('[WebSocket Broadcast]:', wsErr.message);
    }

    return res.json({
      success: true,
      message: 'Payment verified and registration confirmed successfully',
      ticketData
    });
  } catch (err) {
    console.error('Payment verification registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete registration after payment verification',
      errorDetails: err.message || err.toString()
    });
  }
};

exports.registerEvent = async (req, res) => {
  const settings = readSettings();
  if (settings.isRegistrationClosed) {
    return res.status(403).json({
      success: false,
      message: settings.closedReason || 'Registrations for ELOQUENCE 2026 are officially closed. No new registrations are accepted.'
    });
  }

  let currentEvent = req.body.currentEvent;
  if (typeof currentEvent === 'string') {
    try { currentEvent = JSON.parse(currentEvent); } catch (e) {}
  }
  let fields = req.body.fields;
  if (typeof fields === 'string') {
    try { fields = JSON.parse(fields); } catch (e) {}
  }
  const game = req.body.game;
  
  if (!currentEvent || !fields) {
    return res.status(400).json({ success: false, message: 'Missing required data' });
  }

  // Extract and normalize UPI UTR / Transaction Reference
  const rawUtr = (fields && (fields.upiUtr || fields.transactionId || fields.utr)) || req.body.upiUtr || req.body.transactionId || '';
  const cleanUtr = typeof rawUtr === 'string' ? rawUtr.trim() : '';

  // Enforce single-use UTR constraint: Each UTR number can only be used once (checked live in Supabase)
  if (cleanUtr) {
    try {
      const { data: supaMatches } = await supabase
        .from('registrations')
        .select('id, ticket_code, razorpay_payment_id')
        .ilike('razorpay_payment_id', cleanUtr)
        .limit(1);

      if (Array.isArray(supaMatches) && supaMatches.length > 0) {
        return res.status(400).json({
          success: false,
          message: `This UPI UTR / Transaction Reference number "${cleanUtr}" has already been registered. Each UTR number can only be used once.`
        });
      }
    } catch (supaErr) {
      console.warn('[UTR Duplicate Check] Supabase check note:', supaErr.message);
    }
  }

  // Generate unique ticket code & UUID
  const catPrefix = (currentEvent.category || '').toLowerCase() === 'technical' ? 'TCH' : 'NT';
  const ticketCode = `ELQ26-${catPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;
  const registrationId = crypto.randomUUID ? crypto.randomUUID() : `reg-${Date.now()}`;

  const rawTeamMembers = fields.teamMembers || req.body.teamMembers || [];
  const validTeamMembers = (Array.isArray(rawTeamMembers) ? rawTeamMembers : [])
    .filter(m => {
      if (!m) return false;
      if (typeof m === 'string') return m.trim().length > 0;
      const n = m.fullName || m.name || '';
      return typeof n === 'string' && n.trim().length > 0;
    })
    .map(m => {
      if (typeof m === 'string') {
        return {
          fullName: m.trim(),
          name: m.trim(),
          phone: '',
          email: '',
          college: fields.college || '',
          department: fields.department || '',
          year: fields.year || ''
        };
      }
      const memberName = (m.fullName || m.name || '').trim();
      return {
        fullName: memberName,
        name: memberName,
        email: m.email || '',
        phone: m.phone || '',
        whatsapp: m.whatsapp || m.phone || '',
        college: m.college || fields.college || '',
        department: m.department || fields.department || '',
        year: m.year || fields.year || ''
      };
    });

  // Calculate fee strictly proportional to participants (never 0)
  const normEventId = String((currentEvent && currentEvent.id) || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  const eventRule = EVENT_TEAM_RULES[normEventId] || null;
  const canonicalPerHead = eventRule ? eventRule.feePerHead : (normEventId === 'tech-01' ? 100 : 50);
  const totalMemberCount = 1 + validTeamMembers.length;
  const expectedTotalFee = totalMemberCount * canonicalPerHead;
  const clientFee = Number(req.body.totalFee) || 0;
  const finalTotalFee = clientFee > 0 ? clientFee : expectedTotalFee;
  const paymentMethod = req.body.paymentMethod || (fields && fields.paymentMethod) || 'UPI_QR';
  const isOfflineDesk = String(paymentMethod || '').toUpperCase() === 'ON_SITE_DESK' || req.body.isOffline === true || (fields && fields.isOffline === true);

  // Security enforcement: All online web registrations require verification, on-site desk entries are verified on spot
  const initialVerificationStatus = isOfflineDesk ? 'verified' : 'pending';
  const initialPaymentStatus = isOfflineDesk ? 'PAID' : 'PENDING';

  // Handle payment screenshot if file was uploaded or path passed
  let screenshotPath = (fields && (fields.paymentScreenshotPath || fields.payment_screenshot_path)) || req.body.paymentScreenshotPath || req.body.payment_screenshot_path || null;
  if (req.file) {
    try {
      const { validateScreenshot, uploadScreenshot } = require('../utils/screenshotStorage');
      const val = validateScreenshot(req.file);
      if (val.valid) {
        const uploadRes = await uploadScreenshot(ticketCode, req.file.buffer);
        if (uploadRes && uploadRes.path) {
          screenshotPath = uploadRes.path;
        }
      } else {
        console.warn('[Register Screenshot Validation Notice]', val.error);
      }
    } catch (uploadErr) {
      console.warn('[Screenshot Upload in Register]', uploadErr.message);
    }
  }

  const paymentMeta = {
    venue: currentEvent.venue || 'CSE Department Labs',
    payment_method: paymentMethod,
    game: game || null,
    upi_utr: cleanUtr || null,
    transaction_id: cleanUtr || null,
    payment_screenshot_path: screenshotPath,
    verification_status: initialVerificationStatus,
    payment_status: initialPaymentStatus,
    team_members: validTeamMembers
  };
  const venueSnapshotStr = JSON.stringify(paymentMeta);

  // Prepare registration ticket data payload
  const ticketData = {
    ticketCode,
    registrationId,
    id: registrationId,
    eventName: currentEvent.name,
    eventId: currentEvent.id,
    category: currentEvent.category,
    leadName: fields.fullName,
    fullName: fields.fullName,
    college: fields.college,
    department: fields.department,
    email: fields.email,
    phone: fields.phone,
    year: fields.year,
    isTeam: Boolean(currentEvent.isTeam || currentEvent.is_team || (eventRule && eventRule.isTeam)),
    teamName: fields.teamName || null,
    membersCount: totalMemberCount,
    teamMembersList: validTeamMembers.map(m => m.fullName || m.name),
    teamMembers: validTeamMembers,
    totalFee: finalTotalFee,
    totalAmount: finalTotalFee,
    paymentStatus: initialPaymentStatus,
    payment_status: initialPaymentStatus,
    paymentMethod: paymentMethod,
    payment_method: paymentMethod,
    upiUtr: cleanUtr || null,
    transactionId: cleanUtr || null,
    paymentScreenshotPath: screenshotPath,
    payment_screenshot_path: screenshotPath,
    verificationStatus: initialVerificationStatus,
    verification_status: initialVerificationStatus,
    isVerified: false,
    isFlagged: false,
    registrationStatus: 'active',
    venue: currentEvent.venue,
    timing: currentEvent.timing,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    createdAt: new Date().toISOString()
  };

  // 1. Persist directly to Supabase Database live tables
  try {
    // Ensure event exists in DB before registration foreign key constraint
    const { data: existingEv } = await supabase.from('events').select('id').eq('id', currentEvent.id).maybeSingle();
    if (!existingEv) {
      await supabase.from('events').insert([{
        id: currentEvent.id,
        number: '99',
        name: currentEvent.name,
        category: currentEvent.category,
        team_size: currentEvent.teamSize || 'Individual',
        min_members: currentEvent.minMembers || 1,
        max_members: currentEvent.maxMembers || 1,
        fee_type: currentEvent.feeType || 'per_head',
        fee_per_head: currentEvent.feePerHead || 50
      }]);
    }

    if (isOfflineDesk) {
      // ── STORE IN SEPARATE TABLE: public.offline_registrations ──
      let offlineInsertPayload = {
        event_id: currentEvent.id,
        ticket_code: ticketCode,
        team_name: fields.teamName || null,
        full_name: fields.fullName,
        email: fields.email || `${fields.fullName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'participant'}@onsite.cahcet.edu`,
        phone: fields.phone,
        whatsapp: fields.whatsapp || fields.phone,
        college: fields.college || 'C. Abdul Hakeem College of Engg & Tech',
        department: fields.department || 'CSE',
        year: fields.year || '3rd Year',
        members_count: 1 + validTeamMembers.length,
        team_members: validTeamMembers,
        total_fee: finalTotalFee,
        payment_status: 'PAID',
        registration_status: 'CONFIRMED',
        payment_method: 'ON_SITE_DESK',
        venue_snapshot: venueSnapshotStr,
        timing_snapshot: currentEvent.timing || '10:00 AM – 1:00 PM',
        onsite_unique_id: fields.onsiteUniqueId || ticketCode,
        is_verified: false,
        attendance_status: 'pending'
      };

      let dbRegId = null;
      try {
        let { data: offData, error: offError } = await supabase
          .from('offline_registrations')
          .insert([offlineInsertPayload])
          .select('id');

        if (!offError && offData && offData[0]) {
          dbRegId = offData[0].id;
          if (validTeamMembers.length > 0) {
            await insertOfflineMembersHelper(dbRegId, ticketCode, validTeamMembers);
          }
        } else if (offError) {
          console.warn('[Offline Regs Supabase Note]:', offError.message);
        }
      } catch (supaOffErr) {
        console.warn('[Offline Regs Supabase Exception]:', supaOffErr.message);
      }

      // Always persist to local cache/storage file as well
      const localOffList = readOfflineRegistrations();
      const localOffItem = {
        ...offlineInsertPayload,
        id: dbRegId || registrationId,
        registrationId: dbRegId || registrationId,
        eventName: currentEvent.name,
        category: currentEvent.category,
        venue: currentEvent.venue,
        timing: currentEvent.timing
      };
      localOffList.unshift(localOffItem);
      writeOfflineRegistrations(localOffList);

      ticketData.id = dbRegId || registrationId;
      ticketData.registrationId = dbRegId || registrationId;
    } else {
      // ── STORE IN ONLINE TABLE: public.registrations ──
      let regInsertPayload = {
        event_id: currentEvent.id,
        ticket_code: ticketCode,
        team_name: fields.teamName || null,
        full_name: fields.fullName,
        email: fields.email,
        phone: fields.phone,
        college: fields.college || 'C. Abdul Hakeem College of Engg & Tech',
        department: fields.department || 'CSE',
        year: fields.year || '3rd Year',
        members_count: 1 + validTeamMembers.length,
        total_fee: finalTotalFee,
        payment_status: initialPaymentStatus,
        registration_status: 'confirmed',
        payment_method: paymentMethod || 'UPI_QR',
        razorpay_payment_id: cleanUtr || null,
        upi_utr: cleanUtr || null,
        verification_status: initialVerificationStatus,
        venue_snapshot: venueSnapshotStr,
        timing_snapshot: currentEvent.timing || '10:00 AM – 1:00 PM',
        is_verified: false
      };

      let { data: regData, error: regError } = await supabase
        .from('registrations')
        .insert([regInsertPayload])
        .select('id');

      if (regError) {
        console.warn('[Supabase Registration Warning]:', regError.message);
        // If error occurs due to columns not in table schema, fallback without them
        if (regError.message && (regError.message.includes('upi_utr') || regError.message.includes('verification_status') || regError.message.includes('payment_screenshot_path'))) {
          delete regInsertPayload.upi_utr;
          delete regInsertPayload.verification_status;
          delete regInsertPayload.payment_screenshot_path;
          const fbRes = await supabase.from('registrations').insert([regInsertPayload]).select('id');
          regData = fbRes.data;
          regError = fbRes.error;
        }
      }

      if (regError) {
        console.error('[Supabase Registration Error]:', regError.message);
        return res.status(500).json({
          success: false,
          message: 'Database error saving registration: ' + (regError.message || 'Unknown database error')
        });
      }

      if (regData && regData[0]) {
        const dbRegId = regData[0].id;
        ticketData.id = dbRegId;
        ticketData.registrationId = dbRegId;

        if (validTeamMembers.length > 0) {
          const membersToInsert = validTeamMembers.map((member, idx) => ({
            registration_id: dbRegId,
            member_number: idx + 2,
            member_name: (typeof member === 'string' ? member : (member.name || '')).trim()
          }));

          const { error: membersErr } = await supabase.from('registration_members').insert(membersToInsert);
          if (membersErr) {
            console.warn('[Registration Members Insert Warning]:', membersErr.message);
          }
        }
      }
    }
  } catch (dbEx) {
    console.error('[Supabase Registration Exception]:', dbEx);
    return res.status(500).json({
      success: false,
      message: 'Failed to record registration: ' + (dbEx.message || 'Internal server error')
    });
  }

  // 3. Broadcast real-time event via WebSocket to all dashboards and clients
  try {
    const { broadcastRegistrationUpdate } = require('../config/websocket');
    broadcastRegistrationUpdate('CREATE', ticketData);
  } catch (wsErr) {
    console.warn('[WebSocket Broadcast]:', wsErr.message);
  }

  // 4. Return successful ticket response
  return res.json({
    success: true,
    message: 'Registration successful',
    ticketData
  });
};

exports.uploadPaymentScreenshot = async (req, res) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'Please select a screenshot file to upload' });
  }

  const { validateScreenshot, uploadScreenshot } = require('../utils/screenshotStorage');
  const validation = validateScreenshot(file);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.error });
  }

  const normId = String(id || '').trim();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normId);

  try {
    let reg = null;
    // Retry up to 3 attempts with brief backoff to prevent read-after-write replication delay
    for (let attempt = 0; attempt < 3; attempt++) {
      const query = isUUID
        ? supabase.from('registrations').select('*').eq('id', normId).maybeSingle()
        : supabase.from('registrations').select('*').ilike('ticket_code', normId).maybeSingle();

      const { data, error: fetchErr } = await query;
      if (fetchErr) {
        console.warn('Fetch registration for screenshot upload warning:', fetchErr.message);
      }
      if (data) {
        reg = data;
        break;
      }
      // Alternate lookup if UUID check was ambiguous
      const altQuery = isUUID
        ? supabase.from('registrations').select('*').ilike('ticket_code', normId).maybeSingle()
        : supabase.from('registrations').select('*').eq('id', normId).maybeSingle();
      const { data: altData } = await altQuery;
      if (altData) {
        reg = altData;
        break;
      }
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 300));
      }
    }

    if (!reg) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    const regId = reg.id || normId;
    const ticketCode = reg.ticket_code || normId;
    const existingScreenshotPath = reg.payment_screenshot_path;

    // Upload with Sharp compression and duplicate cleanup
    const uploadRes = await uploadScreenshot(ticketCode, file.buffer, existingScreenshotPath);
    const screenshotPath = uploadRes.path;

    // Update database record and venue_snapshot
    let venueSnapshotObj = {};
    if (reg.venue_snapshot) {
      try {
        venueSnapshotObj = typeof reg.venue_snapshot === 'string' ? JSON.parse(reg.venue_snapshot) : reg.venue_snapshot;
      } catch (e) {}
    }
    venueSnapshotObj.payment_screenshot_path = screenshotPath;
    const updatedVenueSnapshot = JSON.stringify(venueSnapshotObj);

    const updatePayload = {
      payment_screenshot_path: screenshotPath,
      venue_snapshot: updatedVenueSnapshot
    };

    let { data: updatedData, error: updateErr } = await (isUUID
      ? supabase.from('registrations').update(updatePayload).eq('id', normId)
      : supabase.from('registrations').update(updatePayload).ilike('ticket_code', normId)
    ).select('*, registration_members(*)');

    if (updateErr && updateErr.message && updateErr.message.includes('payment_screenshot_path')) {
      const fbUpdate = await (isUUID
        ? supabase.from('registrations').update({ venue_snapshot: updatedVenueSnapshot }).eq('id', normId)
        : supabase.from('registrations').update({ venue_snapshot: updatedVenueSnapshot }).ilike('ticket_code', normId)
      ).select('*, registration_members(*)');
      updatedData = fbUpdate.data;
    }

    const updatedRecord = (Array.isArray(updatedData) && updatedData.length > 0) ? updatedData[0] : {
      ...reg,
      payment_screenshot_path: screenshotPath,
      paymentScreenshotPath: screenshotPath
    };

    // Broadcast WebSocket update
    try {
      const { broadcastRegistrationUpdate } = require('../config/websocket');
      broadcastRegistrationUpdate('UPDATE', updatedRecord);
    } catch (wsErr) {}

    return res.json({
      success: true,
      message: 'Payment screenshot uploaded and compressed successfully',
      path: screenshotPath,
      size: uploadRes.size,
      ticketCode
    });
  } catch (err) {
    console.error('Error in uploadPaymentScreenshot:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload payment screenshot: ' + (err.message || err.toString()) });
  }
};

exports.getHealth = (req, res) => {
  res.json({
    status: 'OK',
    service: "ELOQUENCE'26 Registration API",
    timestamp: new Date().toISOString()
  });
};

const EVENT_SELECT_COLUMNS = 'id, number, name, alias, subtitle, category, team_size, min_members, max_members, fee, fee_per_head, fee_type, is_team, tag, venue, venue_image, timing, description, image, rules, rounds, guidelines, highlights, created_at, updated_at';

const getEventCoordinatorsList = (eventId) => {
  if (!eventId) return [];
  const evLower = String(eventId).toLowerCase().trim();
  const rawCoords = (inMemoryCoordinators && inMemoryCoordinators.length > 0)
    ? inMemoryCoordinators
    : readCoordinators();

  return rawCoords
    .map(c => (c && Array.isArray(c.assignedEvents) ? c : dbToCoordinator(c)))
    .filter(c => {
      if (c.isActive === false && c.is_active === false) return false;
      const assigned = Array.isArray(c.assignedEvents)
        ? c.assignedEvents
        : (Array.isArray(c.assigned_events) ? c.assigned_events : []);
      return assigned.some(e => String(e).toLowerCase().trim() === evLower);
    })
    .sort((a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999));
};

const attachCoordinatorsToEvents = (events) => {
  if (!Array.isArray(events)) return events;
  return events.map(ev => ({
    ...ev,
    coordinators: (Array.isArray(ev.coordinators) && ev.coordinators.length > 0)
      ? ev.coordinators
      : getEventCoordinatorsList(ev.id)
  }));
};

exports.getPublicEvents = async (req, res) => {
  const now = Date.now();

  // 1. If in-memory cache is available and fresh, serve instantly (< 1ms, 0 DB egress)
  if (inMemoryEvents && inMemoryEvents.length > 0 && (now - lastEventsSyncTime < CACHE_TTL_MS)) {
    return res.json({ success: true, data: attachCoordinatorsToEvents(inMemoryEvents) });
  }

  // 2. Load from local file if memory cache is not yet set
  let localEvents = inMemoryEvents || [];
  if (localEvents.length === 0) {
    try {
      const eventsFile = path.join(DATA_DIR, 'events.json');
      if (fs.existsSync(eventsFile)) {
        localEvents = JSON.parse(fs.readFileSync(eventsFile, 'utf-8') || '[]');
      }
    } catch (e) {}
  }

  // 3. Serve local/cached data immediately to ensure zero UI latency
  if (localEvents.length > 0) {
    inMemoryEvents = attachCoordinatorsToEvents(localEvents.map(dbToEvent));
    res.json({ success: true, data: inMemoryEvents });

    // Deduplicated background sync with Supabase only if cache expired
    if (!inFlightEventsPromise && (now - lastEventsSyncTime >= CACHE_TTL_MS)) {
      inFlightEventsPromise = (async () => {
        try {
          const { data: dbEvents, error } = await supabase
            .from('events')
            .select(EVENT_SELECT_COLUMNS)
            .order('id', { ascending: true });

          if (!error && Array.isArray(dbEvents) && dbEvents.length > 0) {
            const merged = dbEvents.map(dbToEvent).map(e => {
              const local = localEvents.find(l => l.id === e.id);
              return {
                ...e,
                venueImage: e.venueImage || (local ? (local.venueImage || local.venue_image) : '') || ''
              };
            });
            inMemoryEvents = attachCoordinatorsToEvents(merged);
            lastEventsSyncTime = Date.now();
          }
        } catch (err) {
          // Keep current in-memory cache on network hiccups
        } finally {
          inFlightEventsPromise = null;
        }
      })();
    }
    return;
  }

  // 4. Cold start fallback if no local file exists
  try {
    const { data: dbEvents, error } = await supabase
      .from('events')
      .select(EVENT_SELECT_COLUMNS)
      .order('id', { ascending: true });

    if (!error && Array.isArray(dbEvents) && dbEvents.length > 0) {
      const merged = dbEvents.map(dbToEvent);
      inMemoryEvents = attachCoordinatorsToEvents(merged);
      lastEventsSyncTime = Date.now();
      return res.json({ success: true, data: inMemoryEvents });
    }
  } catch (e) {
    console.warn('Supabase getPublicEvents fallback:', e.message);
  }

  inMemoryEvents = attachCoordinatorsToEvents(localEvents);
  res.json({ success: true, data: inMemoryEvents });
};

// Helper to enrich a database registration with parsed venue_snapshot metadata (Razorpay info)
const enrichRegistrationRecord = (r) => {
  if (!r) return r;
  const copy = { ...r };

  // Harmonize camelCase and snake_case defaults
  copy.fullName = copy.full_name || copy.fullName || 'Anonymous';
  copy.ticketCode = copy.ticket_code || copy.ticketCode || copy.registrationId || copy.id;
  copy.registrationId = copy.ticketCode;
  copy.eventId = copy.event_id || copy.eventId;
  copy.event_id = copy.eventId;

  // If Supabase joined events relation is present
  if (copy.events && typeof copy.events === 'object') {
    copy.eventName = copy.events.name || copy.events.alias || copy.eventName;
    copy.event_name = copy.eventName;
    copy.category = copy.events.category || copy.category;
    copy.eventCategory = copy.category;
  }

  // Resolve event metadata from catalog if not present
  const evId = String(copy.eventId || '').trim().toLowerCase();
  let evList = inMemoryEvents || [];
  if (evList.length === 0) {
    try {
      const eventsFile = path.join(DATA_DIR, 'events.json');
      if (fs.existsSync(eventsFile)) {
        evList = JSON.parse(fs.readFileSync(eventsFile, 'utf-8') || '[]');
        inMemoryEvents = evList;
      }
    } catch (e) {}
  }
  const foundEvt = evList.find(e => {
    const eId = String(e.id || '').trim().toLowerCase();
    const eNum = String(e.number || '').trim().toLowerCase();
    const eName = String(e.name || '').trim().toLowerCase();
    const eAlias = String(e.alias || '').trim().toLowerCase();
    return evId && (eId === evId || eNum === evId || eName === evId || eAlias === evId);
  });

  copy.eventName = copy.eventName || copy.event_name || foundEvt?.name || foundEvt?.alias || (evId ? `Event (${evId})` : 'Symposium Event');
  copy.event_name = copy.eventName;
  copy.category = copy.category || copy.eventCategory || foundEvt?.category || (String(copy.ticketCode || '').includes('TCH') ? 'technical' : (String(copy.ticketCode || '').includes('NTC') ? 'non-technical' : 'technical'));
  copy.eventCategory = copy.category;

  copy.teamName = copy.team_name || copy.teamName;
  copy.totalAmount = Number(copy.total_fee || copy.totalAmount || copy.total_fee || 0);
  copy.totalFee = copy.totalAmount;
  copy.paymentStatus = (copy.payment_status || copy.paymentStatus || 'PENDING').toUpperCase();
  copy.registrationStatus = (copy.registration_status || copy.registrationStatus || 'ACTIVE').toUpperCase();
  copy.paymentMethod = copy.payment_method || copy.paymentMethod || 'ONLINE';

  copy.is_verified = Boolean(copy.is_verified || copy.isVerified || copy.attendance_status === 'verified' || copy.attendanceStatus === 'verified');
  copy.isVerified = copy.is_verified;
  copy.attendance_status = copy.attendance_status || copy.attendanceStatus || 'pending';
  copy.attendanceStatus = copy.attendance_status;
  copy.verified_at = copy.verified_at || copy.verifiedAt || null;
  copy.verifiedAt = copy.verified_at;
  copy.verified_by = copy.verified_by || copy.verifiedBy || null;
  copy.verifiedBy = copy.verified_by;

  if (copy.venue_snapshot && typeof copy.venue_snapshot === 'string' && copy.venue_snapshot.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(copy.venue_snapshot);
      if (parsed.eventName || parsed.event_name) {
        copy.eventName = copy.eventName || parsed.eventName || parsed.event_name;
        copy.event_name = copy.eventName;
      }
      if (parsed.eventId || parsed.event_id) {
        copy.eventId = copy.eventId || parsed.eventId || parsed.event_id;
        copy.event_id = copy.eventId;
      }
      if (parsed.category || parsed.eventCategory) {
        copy.category = copy.category || parsed.category || parsed.eventCategory;
        copy.eventCategory = copy.category;
      }
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
      if (parsed.upi_utr || parsed.upiUtr) {
        copy.upi_utr = parsed.upi_utr || parsed.upiUtr;
        copy.upiUtr = copy.upi_utr;
      }
      if (parsed.transaction_id || parsed.transactionId) {
        copy.transaction_id = parsed.transaction_id || parsed.transactionId;
        copy.transactionId = copy.transaction_id;
      }
      if (parsed.verification_status || parsed.verificationStatus) {
        copy.verification_status = parsed.verification_status || parsed.verificationStatus;
        copy.verificationStatus = copy.verification_status;
      }
      if (parsed.flag_reason || parsed.flagReason) {
        copy.flag_reason = parsed.flag_reason || parsed.flagReason;
        copy.flagReason = copy.flag_reason;
      }
      if (parsed.payment_screenshot_path || parsed.paymentScreenshotPath) {
        copy.payment_screenshot_path = copy.payment_screenshot_path || parsed.payment_screenshot_path || parsed.paymentScreenshotPath;
      }
      if (parsed.venue) {
        copy.venue = parsed.venue;
      }
      if (Array.isArray(parsed.team_members) && parsed.team_members.length > 0 && (!copy.teamMembers || copy.teamMembers.length === 0)) {
        copy.teamMembers = parsed.team_members;
        copy.teamMembersList = parsed.team_members.map(m => typeof m === 'string' ? m : (m.fullName || m.name || ''));
      }
    } catch (e) {
      // Not JSON or parse error, keep venue_snapshot as venue string
    }
  }

  // Normalize payment screenshot path
  copy.payment_screenshot_path = copy.payment_screenshot_path || copy.paymentScreenshotPath || null;
  copy.paymentScreenshotPath = copy.payment_screenshot_path;

  // Map joined registration_members or offline_registration_members table if present
  const joinedMembers = (Array.isArray(copy.registration_members) && copy.registration_members.length > 0)
    ? copy.registration_members
    : ((Array.isArray(copy.offline_registration_members) && copy.offline_registration_members.length > 0)
        ? copy.offline_registration_members
        : ((Array.isArray(copy.offline_registrations_member) && copy.offline_registrations_member.length > 0)
            ? copy.offline_registrations_member
            : null));

  if (joinedMembers && joinedMembers.length > 0) {
    if (!copy.teamMembers || copy.teamMembers.length === 0) {
      copy.teamMembers = joinedMembers.map((m, idx) => ({
        memberNumber: m.member_number || idx + 2,
        fullName: m.member_name || m.name || m.fullName || `Member ${idx + 2}`,
        name: m.member_name || m.name || m.fullName || `Member ${idx + 2}`,
        email: m.email || '',
        phone: m.phone || '',
        whatsapp: m.whatsapp || m.phone || '',
        college: m.college || copy.college || '',
        department: m.department || copy.department || '',
        year: m.year || copy.year || ''
      }));
    }
    if (!copy.teamMembersList || copy.teamMembersList.length === 0) {
      copy.teamMembersList = joinedMembers.map(m => m.member_name || m.name || m.fullName || '');
    }
  }

  // Standardize UTR / Reference number resolution
  const resolvedUtr = copy.upiUtr || copy.upi_utr || copy.transactionId || copy.transaction_id || 
    ((copy.paymentMethod === 'UPI_QR' || copy.payment_method === 'UPI_QR' || (!copy.razorpayPaymentId?.startsWith('pay_') && copy.razorpayPaymentId)) ? (copy.razorpayPaymentId || copy.razorpay_payment_id) : null);
  
  if (resolvedUtr) {
    copy.upiUtr = String(resolvedUtr).trim();
    copy.upi_utr = copy.upiUtr;
    copy.transactionId = copy.transactionId || copy.upiUtr;
  }

  // Harmonize flag status and verification status
  const isFlagged = Boolean(copy.is_flagged || copy.isFlagged || copy.verification_status === 'flagged' || copy.verificationStatus === 'flagged');
  copy.is_flagged = isFlagged;
  copy.isFlagged = isFlagged;
  copy.flagReason = copy.flag_reason || copy.flagReason || null;
  copy.flag_reason = copy.flagReason;
  copy.flaggedAt = copy.flagged_at || copy.flaggedAt || null;
  copy.flaggedBy = copy.flagged_by || copy.flaggedBy || null;

  if (isFlagged) {
    copy.is_verified = false;
    copy.isVerified = false;
    copy.verificationStatus = 'flagged';
    copy.verification_status = 'flagged';
    copy.payment_status = 'REJECTED';
    copy.paymentStatus = 'REJECTED';
  } else if (copy.is_verified) {
    copy.verificationStatus = 'verified';
    copy.verification_status = 'verified';
    copy.payment_status = 'VERIFIED';
    copy.paymentStatus = 'VERIFIED';
  } else {
    copy.verificationStatus = copy.verification_status || copy.verificationStatus || 'pending';
    copy.verification_status = copy.verificationStatus;
    copy.payment_status = (copy.payment_status || copy.paymentStatus || 'PENDING').toUpperCase();
    copy.paymentStatus = copy.payment_status;
  }

  // Extract or infer esports game for Battle of Champions (FREE FIRE or BGMI)
  let detectedGame = copy.game || copy.game_name || copy.gameName || '';
  if (!detectedGame && copy.venue_snapshot && typeof copy.venue_snapshot === 'string' && copy.venue_snapshot.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(copy.venue_snapshot);
      if (parsed.game) detectedGame = parsed.game;
    } catch (_) {}
  }
  if (!detectedGame) {
    const combinedStr = `${copy.teamName || ''} ${copy.eventName || ''} ${copy.notes || ''}`.toUpperCase();
    if (combinedStr.includes('BGMI')) {
      detectedGame = 'BGMI';
    } else if (combinedStr.includes('FREE FIRE') || combinedStr.includes('FREEFIRE') || combinedStr.includes('FF')) {
      detectedGame = 'FREE FIRE';
    }
  }
  const isEsports = String(copy.eventId || '').toLowerCase() === 'nontech-05' || String(copy.eventName || '').toUpperCase().includes('BATTLE OF CHAMPIONS');
  if (isEsports && !detectedGame) {
    detectedGame = 'FREE FIRE';
  }
  copy.game = detectedGame ? (detectedGame.toUpperCase().includes('BGMI') ? 'BGMI' : 'FREE FIRE') : null;

  return copy;
};

const SPONSOR_SELECT_COLUMNS = 'id, name, company_name, logo, description, website, location_url, contact_name, contact_email, contact_phone, category, display_order, is_active, created_at, updated_at';
const COORDINATOR_SELECT_COLUMNS = 'id, name, phone, whatsapp, email, role, department, year, assigned_events, is_active, display_order, game, created_at, updated_at';
const HP_COORDINATOR_SELECT_COLUMNS = 'id, role, tag, icon, color, tier, desc_text, members, display_order, is_active, created_at, updated_at';
const REGISTRATION_EVENT_FIELDS = 'events(id, name, alias, category, fee, fee_per_head, fee_type, venue, timing)';

exports.getRegistrations = async (req, res) => {
  try {
    const { eventId, category, status } = req.query;

    let query = supabase
      .from('registrations')
      .select(`*, ${REGISTRATION_EVENT_FIELDS}, registration_members(*)`)
      .order('created_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: dbData, error: dbError } = await query;
    if (dbError) {
      console.error('Supabase getRegistrations error:', dbError.message);
      return res.status(500).json({ success: false, error: 'Database error: ' + dbError.message });
    }

    let allRegistrations = (dbData || []).map(enrichRegistrationRecord);

    // Apply optional category and status query filters
    if (category) {
      allRegistrations = allRegistrations.filter(r => {
        const cat = r.eventCategory || r.category || '';
        return cat.toLowerCase() === category.toLowerCase();
      });
    }
    if (status) {
      allRegistrations = allRegistrations.filter(r => {
        const st = r.payment_status || r.paymentStatus || r.registration_status || r.registrationStatus || '';
        return st.toLowerCase() === status.toLowerCase();
      });
    }

    return res.json({
      success: true,
      count: allRegistrations.length,
      registrations: allRegistrations
    });
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve registrations' });
  }
};

exports.getRegistrationById = async (req, res) => {
  try {
    const id = req.params.id;
    const normId = String(id || '').trim();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normId);

    const query = isUUID
      ? supabase.from('registrations').select(`*, ${REGISTRATION_EVENT_FIELDS}, registration_members(*)`).eq('id', normId).maybeSingle()
      : supabase.from('registrations').select(`*, ${REGISTRATION_EVENT_FIELDS}, registration_members(*)`).ilike('ticket_code', normId).maybeSingle();

    const { data, error } = await query;

    if (error) {
      console.error('Supabase getRegistrationById error:', error.message);
      return res.status(500).json({ success: false, error: 'Database error: ' + error.message });
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Registration record not found' });
    }

    return res.json(enrichRegistrationRecord(data));
  } catch (err) {
    console.error('Error fetching registration:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve registration' });
  }
};

// ==================== PUBLIC SPONSOR ENDPOINTS ====================
exports.getActiveSponsors = async (req, res) => {
  const now = Date.now();
  if (inMemorySponsors && inMemorySponsors.length > 0 && (now - lastSponsorsSyncTime < CACHE_TTL_MS)) {
    return res.json({ success: true, count: inMemorySponsors.length, data: inMemorySponsors });
  }

  const localSponsors = inMemorySponsors || (() => {
    const sponsors = readSponsors();
    const active = sponsors.filter(s => s.isActive !== false);
    active.sort((a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999));
    return active;
  })();

  if (localSponsors.length > 0) {
    inMemorySponsors = localSponsors;
    res.json({ success: true, count: localSponsors.length, data: localSponsors });

    // Deduplicated background sync
    if (!inFlightSponsorsPromise && (now - lastSponsorsSyncTime >= CACHE_TTL_MS)) {
      inFlightSponsorsPromise = (async () => {
        try {
          const { data: dbSponsors, error } = await supabase
            .from('sponsors')
            .select(SPONSOR_SELECT_COLUMNS)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          if (!error && Array.isArray(dbSponsors) && dbSponsors.length > 0) {
            inMemorySponsors = dbSponsors.map(dbToSponsor);
            lastSponsorsSyncTime = Date.now();
          }
        } catch (_) {} finally {
          inFlightSponsorsPromise = null;
        }
      })();
    }
    return;
  }

  try {
    const { data: dbSponsors, error } = await supabase
      .from('sponsors')
      .select(SPONSOR_SELECT_COLUMNS)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(dbSponsors) && dbSponsors.length > 0) {
      const active = dbSponsors.map(dbToSponsor);
      inMemorySponsors = active;
      lastSponsorsSyncTime = Date.now();
      return res.json({ success: true, count: active.length, data: active });
    }
  } catch (e) {
    console.warn('Supabase getActiveSponsors fallback:', e.message);
  }

  inMemorySponsors = localSponsors;
  res.json({ success: true, count: localSponsors.length, data: localSponsors });
};

exports.getPublicSponsorById = async (req, res) => {
  try {
    if (inMemorySponsors && inMemorySponsors.length > 0) {
      const found = inMemorySponsors.find(s => s.id === req.params.id);
      if (found) return res.json({ success: true, data: found });
    }

    const sponsors = readSponsors();
    const sponsor = sponsors.find(s => s.id === req.params.id && s.isActive !== false);
    if (sponsor) {
      return res.json({ success: true, data: sponsor });
    }

    try {
      const { data: dbSponsor, error } = await supabase
        .from('sponsors')
        .select(SPONSOR_SELECT_COLUMNS)
        .eq('id', req.params.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && dbSponsor) {
        return res.json({ success: true, data: dbToSponsor(dbSponsor) });
      }
    } catch (e) {
      console.warn('Supabase getPublicSponsorById fallback:', e.message);
    }

    return res.status(404).json({ success: false, message: 'Sponsor not found' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching sponsor' });
  }
};

// ==================== PUBLIC COORDINATOR ENDPOINTS ====================
exports.getActiveCoordinators = async (req, res) => {
  const now = Date.now();
  if (inMemoryCoordinators && inMemoryCoordinators.length > 0 && (now - lastCoordinatorsSyncTime < CACHE_TTL_MS)) {
    return res.json({ success: true, count: inMemoryCoordinators.length, data: inMemoryCoordinators });
  }

  const localCoords = (inMemoryCoordinators && inMemoryCoordinators.length > 0)
    ? inMemoryCoordinators
    : (() => {
        const coordinators = readCoordinators();
        const active = coordinators.map(dbToCoordinator).filter(c => c.isActive !== false);
        active.sort((a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999));
        return active;
      })();

  if (localCoords.length > 0) {
    inMemoryCoordinators = localCoords;
    res.json({ success: true, count: localCoords.length, data: localCoords });

    // Deduplicated background sync
    if (!inFlightCoordinatorsPromise && (now - lastCoordinatorsSyncTime >= CACHE_TTL_MS)) {
      inFlightCoordinatorsPromise = (async () => {
        try {
          const { data: dbCoords, error } = await supabase
            .from('coordinators')
            .select(COORDINATOR_SELECT_COLUMNS)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          if (!error && Array.isArray(dbCoords) && dbCoords.length > 0) {
            inMemoryCoordinators = dbCoords.map(dbToCoordinator);
            lastCoordinatorsSyncTime = Date.now();
          }
        } catch (_) {} finally {
          inFlightCoordinatorsPromise = null;
        }
      })();
    }
    return;
  }

  try {
    const { data: dbCoords, error } = await supabase
      .from('coordinators')
      .select(COORDINATOR_SELECT_COLUMNS)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(dbCoords) && dbCoords.length > 0) {
      const active = dbCoords.map(dbToCoordinator);
      inMemoryCoordinators = active;
      lastCoordinatorsSyncTime = Date.now();
      return res.json({ success: true, count: active.length, data: active });
    }
  } catch (e) {
    console.warn('Supabase getActiveCoordinators fallback:', e.message);
  }

  inMemoryCoordinators = localCoords;
  res.json({ success: true, count: localCoords.length, data: localCoords });
};

exports.getCoordinatorsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { role, game } = req.query;
    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    let matching = getEventCoordinatorsList(eventId);

    if (role) {
      const rLower = role.toLowerCase().trim();
      matching = matching.filter(c => {
        const cRole = String(c.role || '').toLowerCase();
        return cRole.includes(rLower);
      });
    }

    if (game) {
      const gLower = game.toLowerCase().trim();
      matching = matching.filter(c => {
        const cGame = String(c.game || '').toLowerCase().trim();
        if (cGame.includes('both')) return true;
        if (gLower.includes('free') || gLower.includes('fire')) {
          return cGame.includes('fire') || cGame.includes('free');
        }
        if (gLower.includes('bgmi')) {
          return cGame.includes('bgmi');
        }
        return cGame.includes(gLower);
      });
    }

    matching.sort((a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999));

    res.json({
      success: true,
      eventId,
      count: matching.length,
      data: matching
    });
  } catch (err) {
    console.error('Error fetching event coordinators:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch coordinators for event' });
  }
};

// ==================== PUBLIC STUDENT COORDINATORS (LEADERSHIP) ====================
exports.getStudentCoordinators = async (req, res) => {
  try {
    const fallbackPath = path.join(DATA_DIR, 'studentCoordinators.json');
    if (fs.existsSync(fallbackPath)) {
      const raw = fs.readFileSync(fallbackPath, 'utf-8');
      return res.json({ success: true, data: JSON.parse(raw) });
    }
    const hpTeams = readHomepageCoordinators();
    if (hpTeams && hpTeams.length > 0) {
      return res.json({ success: true, data: hpTeams.filter(t => t.isActive !== false) });
    }
  } catch (err) {}

  res.json({ success: true, data: [] });
};

// ==================== PUBLIC HOMEPAGE STUDENT COORDINATORS ====================
exports.getPublicHomepageCoordinators = async (req, res) => {
  const now = Date.now();
  if (inMemoryHomepageTeams && inMemoryHomepageTeams.length > 0 && (now - lastHomepageTeamsSyncTime < CACHE_TTL_MS)) {
    return res.json({ success: true, count: inMemoryHomepageTeams.length, data: inMemoryHomepageTeams });
  }

  const localTeams = inMemoryHomepageTeams || (() => {
    const teams = readHomepageCoordinators();
    const active = teams.filter(t => t.isActive !== false);
    active.sort((a, b) => (Number(a.displayOrder) || 999) - (Number(b.displayOrder) || 999));
    return active;
  })();

  if (localTeams.length > 0) {
    inMemoryHomepageTeams = localTeams;
    res.json({ success: true, count: localTeams.length, data: localTeams });

    // Deduplicated background sync
    if (!inFlightHomepageTeamsPromise && (now - lastHomepageTeamsSyncTime >= CACHE_TTL_MS)) {
      inFlightHomepageTeamsPromise = (async () => {
        try {
          const { data: dbTeams, error } = await supabase
            .from('homepage_coordinators')
            .select(HP_COORDINATOR_SELECT_COLUMNS)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          if (!error && Array.isArray(dbTeams) && dbTeams.length > 0) {
            inMemoryHomepageTeams = dbTeams.map(dbToHomepageTeam);
            lastHomepageTeamsSyncTime = Date.now();
          }
        } catch (_) {} finally {
          inFlightHomepageTeamsPromise = null;
        }
      })();
    }
    return;
  }

  try {
    const { data: dbTeams, error } = await supabase
      .from('homepage_coordinators')
      .select(HP_COORDINATOR_SELECT_COLUMNS)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(dbTeams) && dbTeams.length > 0) {
      const active = dbTeams.map(dbToHomepageTeam);
      inMemoryHomepageTeams = active;
      lastHomepageTeamsSyncTime = Date.now();
      return res.json({ success: true, count: active.length, data: active });
    }
  } catch (e) {
    console.warn('Supabase getPublicHomepageCoordinators fallback:', e.message);
  }

  inMemoryHomepageTeams = localTeams;
  res.json({ success: true, count: localTeams.length, data: localTeams });
};

// ── Participant List Dispatch (Supabase Live) ──────────────────────────────────────────────────
const DISPATCHES_FILE = path.join(DATA_DIR, 'dispatches.json');

function readDispatches() {
  try {
    const raw = fs.readFileSync(DISPATCHES_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

function writeDispatches(data) {
  try {
    fs.writeFileSync(DISPATCHES_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
}

const dbToDispatch = (d) => {
  let coordName = d.coordinator_name || d.coordinatorName || '';
  let coordUsername = d.coordinator_username || d.coordinatorUsername || null;

  if (!coordUsername && coordName.includes('(@')) {
    const match = coordName.match(/\(@([^)]+)\)/);
    if (match) coordUsername = match[1];
  }

  return {
    id: String(d.id),
    eventId: d.event_id || d.eventId,
    eventName: d.event_name || d.eventName,
    coordinatorId: d.coordinator_id || d.coordinatorId || null,
    coordinatorName: coordName,
    coordinatorUsername: coordUsername || coordName,
    dispatchedBy: d.dispatched_by || d.dispatchedBy || 'Admin',
    sentAt: d.sent_at || d.sentAt || d.created_at || new Date().toISOString()
  };
};

exports.sendParticipantList = async (req, res) => {
  try {
    const { eventId, eventName, coordinatorId, coordinatorName, coordinatorUsername, gameScope, dispatchScope, registrationType } = req.body;
    if (!eventId || !coordinatorName) {
      return res.status(400).json({ success: false, message: 'Event ID and Coordinator Name are required' });
    }

    const dispatchId = Date.now().toString();
    const now = new Date().toISOString();

    const scopeType = (registrationType || dispatchScope || 'ALL').toUpperCase();
    let scopeSuffix = '';
    if (scopeType === 'OFFLINE') {
      scopeSuffix = ' [OFFLINE DESK]';
    } else if (scopeType === 'ONLINE') {
      scopeSuffix = ' [ONLINE]';
    }

    let formattedEventName = (gameScope && gameScope !== 'ALL')
      ? `${eventName || eventId} (${gameScope})`
      : (eventName || eventId);

    if (scopeSuffix) {
      formattedEventName = `${formattedEventName}${scopeSuffix}`;
    }

    // Format display string with username so it fits existing Supabase schema
    const displayCoordName = coordinatorUsername && coordinatorUsername !== coordinatorName && !coordinatorName.includes(`@${coordinatorUsername}`)
      ? `${coordinatorName} (@${coordinatorUsername})`
      : coordinatorName;

    const dbPayload = {
      id: dispatchId,
      event_id: eventId,
      event_name: formattedEventName,
      coordinator_name: displayCoordName,
      dispatched_by: 'Admin',
      sent_at: now
    };

    let dispatchData = null;
    try {
      const { data, error } = await supabase.from('dispatches').insert([dbPayload]).select();
      if (!error && data && data.length > 0) {
        dispatchData = dbToDispatch(data[0]);
      } else if (error) {
        console.warn('Supabase dispatches insert error:', error.message);
      }
    } catch (dbErr) {
      console.warn('Supabase sendParticipantList fallback:', dbErr.message);
    }

    const formatted = dispatchData || dbToDispatch({
      ...dbPayload,
      coordinator_username: coordinatorUsername
    });

    // Sync to local file (prepend to top of history)
    let dispatches = readDispatches();
    dispatches = [formatted, ...dispatches.filter(d => d.id !== formatted.id)];
    writeDispatches(dispatches);

    res.json({
      success: true,
      message: `Participant list for "${eventName || eventId}" sent to ${displayCoordName} successfully in database!`,
      dispatch: formatted
    });
  } catch (err) {
    console.error('Error sending participant list:', err);
    res.status(500).json({ success: false, message: 'Failed to send participant list' });
  }
};

exports.getDispatches = async (req, res) => {
  try {
    try {
      const { data, error } = await supabase.from('dispatches').select('*').order('sent_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json({ success: true, data: data.map(dbToDispatch) });
      }
    } catch (e) {
      console.warn('Supabase getDispatches fallback:', e.message);
    }

    const dispatches = readDispatches();
    res.json({ success: true, data: dispatches });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch dispatches' });
  }
};

exports.updateDispatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinatorName, eventName } = req.body;
    const updatePayload = { updated_at: new Date().toISOString() };
    if (coordinatorName) updatePayload.coordinator_name = coordinatorName;
    if (eventName) updatePayload.event_name = eventName;

    try {
      await supabase.from('dispatches').update(updatePayload).eq('id', id);
    } catch (dbErr) {
      console.warn('Supabase updateDispatch fallback:', dbErr.message);
    }

    let dispatches = readDispatches();
    const index = dispatches.findIndex(d => d.id === id);
    if (index !== -1) {
      if (coordinatorName) dispatches[index].coordinatorName = coordinatorName;
      if (eventName) dispatches[index].eventName = eventName;
      dispatches[index].updatedAt = new Date().toISOString();
      writeDispatches(dispatches);
    }

    res.json({ success: true, message: 'Sent dispatch updated successfully in database', data: { id, ...updatePayload } });
  } catch (err) {
    console.error('Error updating dispatch:', err);
    res.status(500).json({ success: false, message: 'Failed to update dispatch' });
  }
};

exports.deleteDispatch = async (req, res) => {
  try {
    const { id } = req.params;

    try {
      await supabase.from('dispatches').delete().eq('id', id);
    } catch (dbErr) {
      console.warn('Supabase deleteDispatch fallback:', dbErr.message);
    }

    let dispatches = readDispatches();
    dispatches = dispatches.filter(d => d.id !== id);
    writeDispatches(dispatches);

    res.json({ success: true, message: 'Dispatched list deleted and revoked successfully' });
  } catch (err) {
    console.error('Error deleting dispatch:', err);
    res.status(500).json({ success: false, message: 'Failed to delete dispatch' });
  }
};

// ── Event Winners & Certificate Handlers ──────────────────────────────
const WINNERS_FILE = path.join(DATA_DIR, 'event_winners.json');
if (!fs.existsSync(WINNERS_FILE)) {
  fs.writeFileSync(WINNERS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

function readWinners() {
  try {
    if (!fs.existsSync(WINNERS_FILE)) return [];
    const raw = fs.readFileSync(WINNERS_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

function writeWinners(list) {
  try {
    fs.writeFileSync(WINNERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error writing winners file:', err.message);
  }
}

exports.getEventWinners = async (req, res) => {
  try {
    const { eventId } = req.params;
    let list = [];
    try {
      let query = supabase.from('event_winners').select('*');
      if (eventId) query = query.eq('event_id', eventId);
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        list = data;
      }
    } catch (dbErr) {
      console.warn('Supabase getEventWinners fallback:', dbErr.message);
    }

    if (list.length === 0) {
      const local = readWinners();
      list = eventId ? local.filter(w => w.eventId === eventId) : local;
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    console.error('Error fetching event winners:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch event winners' });
  }
};

exports.submitEventWinners = async (req, res) => {
  try {
    const {
      eventId,
      eventName,
      eventCategory,
      submittedBy,
      firstPlace,
      secondPlace,
      thirdPlace,
      specialMentions,
      notes
    } = req.body;

    if (!eventId || !firstPlace?.name) {
      return res.status(400).json({ success: false, message: 'Event ID and 1st Place winner details are required' });
    }

    const winnerRecord = {
      id: `winner-${eventId}-${Date.now()}`,
      eventId,
      eventName: eventName || eventId,
      eventCategory: eventCategory || 'technical',
      submittedBy: submittedBy || 'Event Coordinator',
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      firstPlace: firstPlace || null,
      secondPlace: secondPlace || null,
      thirdPlace: thirdPlace || null,
      specialMentions: Array.isArray(specialMentions) ? specialMentions : [],
      notes: notes || '',
      updatedAt: new Date().toISOString()
    };

    // Save to Supabase if available
    try {
      await supabase.from('event_winners').upsert([{
        id: winnerRecord.id,
        event_id: winnerRecord.eventId,
        event_name: winnerRecord.eventName,
        event_category: winnerRecord.eventCategory,
        submitted_by: winnerRecord.submittedBy,
        first_place: JSON.stringify(winnerRecord.firstPlace),
        second_place: JSON.stringify(winnerRecord.secondPlace),
        third_place: JSON.stringify(winnerRecord.thirdPlace),
        special_mentions: JSON.stringify(winnerRecord.specialMentions),
        notes: winnerRecord.notes,
        status: winnerRecord.status,
        updated_at: winnerRecord.updatedAt
      }], { onConflict: 'id' });
    } catch (dbErr) {
      console.warn('Supabase submitEventWinners fallback:', dbErr.message);
    }

    // Save locally
    let winnersList = readWinners();
    // Replace any previous submission for this event or append
    const existingIndex = winnersList.findIndex(w => w.eventId === eventId);
    if (existingIndex !== -1) {
      winnersList[existingIndex] = winnerRecord;
    } else {
      winnersList.push(winnerRecord);
    }
    writeWinners(winnersList);

    res.json({
      success: true,
      message: `Winner list for "${winnerRecord.eventName}" submitted successfully to the Certificate Team!`,
      data: winnerRecord
    });
  } catch (err) {
    console.error('Error submitting event winners:', err);
    res.status(500).json({ success: false, message: 'Failed to submit event winners' });
  }
};

exports.updateEventCoordinatorDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { rounds, rules, venue, time, timing, conductorNotes, venueImage, venue_image, description, subtitle } = req.body;
    const finalTiming = (timing !== undefined && timing !== '') ? timing : time;
    const rawVenueImage = venueImage !== undefined ? venueImage : venue_image;
    const finalVenueImage = rawVenueImage !== undefined ? saveBase64ImageIfPresent(rawVenueImage, 'venue') : undefined;

    const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
    let events = [];
    if (fs.existsSync(EVENTS_FILE)) {
      events = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf-8') || '[]');
    }

    const idx = events.findIndex(e => String(e.id || '').toLowerCase() === String(id || '').toLowerCase());
    if (idx !== -1) {
      if (Array.isArray(rounds)) events[idx].rounds = rounds;
      if (Array.isArray(rules)) events[idx].rules = rules;
      if (venue !== undefined) events[idx].venue = venue.trim();
      if (finalTiming !== undefined) {
        events[idx].timing = typeof finalTiming === 'string' ? finalTiming.trim() : finalTiming;
        events[idx].time = events[idx].timing;
      }
      if (conductorNotes !== undefined) events[idx].conductorNotes = conductorNotes;
      if (description !== undefined) events[idx].description = description.trim();
      if (subtitle !== undefined) events[idx].subtitle = subtitle.trim();
      if (finalVenueImage !== undefined) {
        events[idx].venueImage = finalVenueImage ? finalVenueImage.trim() : '';
        events[idx].venue_image = finalVenueImage ? finalVenueImage.trim() : '';
      }
      events[idx].updatedAt = new Date().toISOString();
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
    }

    // 1. Immediately invalidate & update in-memory cache
    exports.invalidateEventsCache();
    if (idx !== -1 && Array.isArray(inMemoryEvents)) {
      const memIdx = inMemoryEvents.findIndex(e => String(e.id || '').toLowerCase() === String(id || '').toLowerCase());
      if (memIdx !== -1) {
        inMemoryEvents[memIdx] = { ...inMemoryEvents[memIdx], ...events[idx] };
      }
    }

    // 2. Persist to Supabase events table with correct schema columns ('timing', NOT 'time')
    try {
      const { data: existingDbEvent } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
      const currentEv = idx !== -1 ? events[idx] : {};
      const dbPayload = {
        id,
        number: (existingDbEvent && existingDbEvent.number) ? existingDbEvent.number : (currentEv.number || '01'),
        ...(existingDbEvent || {}),
        updated_at: new Date().toISOString()
      };
      if (Array.isArray(rounds)) dbPayload.rounds = rounds;
      if (Array.isArray(rules)) dbPayload.rules = rules;
      if (venue !== undefined) dbPayload.venue = venue.trim();
      if (finalTiming !== undefined) dbPayload.timing = typeof finalTiming === 'string' ? finalTiming.trim() : finalTiming;
      if (description !== undefined) dbPayload.description = description.trim();
      if (subtitle !== undefined) dbPayload.subtitle = subtitle.trim();
      if (finalVenueImage !== undefined) dbPayload.venue_image = finalVenueImage ? finalVenueImage.trim() : '';

      let { error: dbErr } = await supabase.from('events').upsert(dbPayload, { onConflict: 'id' });
      if (dbErr && dbErr.code === 'PGRST204') {
        delete dbPayload.venue_image;
        const retryRes = await supabase.from('events').upsert(dbPayload, { onConflict: 'id' });
        dbErr = retryRes.error;
      }
      if (dbErr) {
        console.warn('Supabase updateEventCoordinatorDetails upsert error:', dbErr.message);
      } else {
        console.log(`[Supabase] Event ${id} rules & details successfully synced by coordinator`);
      }
    } catch (dbErr) {
      console.warn('Supabase update event coordinator details exception:', dbErr.message);
    }

    // 3. Broadcast real-time WebSocket event to all connected dashboards and public pages
    try {
      const { broadcastRegistrationUpdate } = require('../config/websocket');
      if (broadcastRegistrationUpdate) {
        broadcastRegistrationUpdate('EVENT_UPDATED', idx !== -1 ? events[idx] : { id, rounds, rules, venue, timing: finalTiming });
      }
    } catch (_) {}

    res.json({
      success: true,
      message: 'Event venue, rounds, and rules updated successfully!',
      data: idx !== -1 ? events[idx] : { id, rounds, rules, venue, timing: finalTiming, venueImage: finalVenueImage }
    });
  } catch (err) {
    console.error('Error updating event coordinator details:', err);
    res.status(500).json({ success: false, message: 'Failed to update event details' });
  }
};

// ==================== CERTIFICATES DB CONTROLLERS ====================
const CERTIFICATES_FILE = path.join(DATA_DIR, 'certificates.json');
const readCertificates = () => {
  try {
    return JSON.parse(fs.readFileSync(CERTIFICATES_FILE, 'utf-8') || '[]');
  } catch (e) {
    return [];
  }
};
const writeCertificates = (data) => {
  try {
    fs.writeFileSync(CERTIFICATES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {}
};

exports.getCertificates = async (req, res) => {
  try {
    try {
      const { data, error } = await supabase.from('certificates').select('*').order('issued_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        return res.json({ success: true, count: data.length, data });
      }
    } catch (e) {}
    const local = readCertificates();
    res.json({ success: true, count: local.length, data: local });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
  }
};

exports.createCertificate = async (req, res) => {
  try {
    const cert = {
      id: req.body.id || Date.now().toString(),
      ticket_code: req.body.ticket_code || req.body.ticketCode,
      participant_name: req.body.participant_name || req.body.participantName,
      college: req.body.college || 'CAHCET',
      event_id: req.body.event_id || req.body.eventId,
      event_name: req.body.event_name || req.body.eventName,
      position: req.body.position || 'Participant',
      certificate_url: req.body.certificate_url || req.body.certificateUrl || null,
      issued_by: req.body.issued_by || req.body.issuedBy || 'Admin',
      issued_at: new Date().toISOString()
    };

    try {
      await supabase.from('certificates').insert([cert]);
    } catch (e) {}

    const local = readCertificates();
    local.unshift(cert);
    writeCertificates(local);

    res.json({ success: true, message: 'Certificate record created successfully in DB', data: cert });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create certificate' });
  }
};

exports.deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await supabase.from('certificates').delete().eq('id', id);
    } catch (e) {}

    let local = readCertificates();
    local = local.filter(c => c.id !== id);
    writeCertificates(local);

    res.json({ success: true, message: 'Certificate record deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete certificate' });
  }
};

// ==================== ATTENDANCE LOGS DB CONTROLLERS ====================
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance_logs.json');
const readAttendanceLogs = () => {
  try {
    return JSON.parse(fs.readFileSync(ATTENDANCE_FILE, 'utf-8') || '[]');
  } catch (e) {
    return [];
  }
};
const writeAttendanceLogs = (data) => {
  try {
    fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {}
};

exports.getAttendanceLogs = async (req, res) => {
  try {
    const { eventId } = req.query;
    try {
      let query = supabase.from('attendance_logs').select('*').order('check_in_time', { ascending: false });
      if (eventId) query = query.eq('event_id', eventId);
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return res.json({ success: true, count: data.length, data });
      }
    } catch (e) {}

    let local = readAttendanceLogs();
    if (eventId) local = local.filter(l => l.event_id === eventId || l.eventId === eventId);
    res.json({ success: true, count: local.length, data: local });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance logs' });
  }
};

exports.createAttendanceLog = async (req, res) => {
  try {
    const log = {
      id: req.body.id || Date.now().toString(),
      ticket_code: req.body.ticket_code || req.body.ticketCode,
      event_id: req.body.event_id || req.body.eventId,
      event_name: req.body.event_name || req.body.eventName,
      participant_name: req.body.participant_name || req.body.participantName,
      verified_by: req.body.verified_by || req.body.verifiedBy || 'Event Coordinator',
      check_in_time: new Date().toISOString(),
      status: req.body.status || 'PRESENT',
      method: req.body.method || 'QR_SCAN'
    };

    try {
      await supabase.from('attendance_logs').insert([log]);
    } catch (e) {}

    const local = readAttendanceLogs();
    local.unshift(log);
    writeAttendanceLogs(local);

    res.json({ success: true, message: 'Attendance check-in logged in DB', data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to log attendance' });
  }
};

// ==================== EVENT SCORES DB CONTROLLERS ====================
const SCORES_FILE = path.join(DATA_DIR, 'event_scores.json');
const readScores = () => {
  try {
    return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf-8') || '[]');
  } catch (e) {
    return [];
  }
};
const writeScores = (data) => {
  try {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {}
};

exports.getEventScores = async (req, res) => {
  try {
    const { eventId } = req.query;
    try {
      let query = supabase.from('event_scores').select('*').order('total_score', { ascending: false });
      if (eventId) query = query.eq('event_id', eventId);
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return res.json({ success: true, count: data.length, data });
      }
    } catch (e) {}

    let local = readScores();
    if (eventId) local = local.filter(s => s.event_id === eventId || s.eventId === eventId);
    res.json({ success: true, count: local.length, data: local });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch event scores' });
  }
};

exports.createEventScore = async (req, res) => {
  try {
    const scoreItem = {
      id: req.body.id || Date.now().toString(),
      event_id: req.body.event_id || req.body.eventId,
      event_name: req.body.event_name || req.body.eventName,
      ticket_code: req.body.ticket_code || req.body.ticketCode,
      participant_name: req.body.participant_name || req.body.participantName,
      team_name: req.body.team_name || req.body.teamName || null,
      round_number: Number(req.body.round_number || req.body.roundNumber || 1),
      criteria_1_score: Number(req.body.criteria_1_score || req.body.criteria1 || 0),
      criteria_2_score: Number(req.body.criteria_2_score || req.body.criteria2 || 0),
      criteria_3_score: Number(req.body.criteria_3_score || req.body.criteria3 || 0),
      total_score: Number(req.body.total_score || req.body.totalScore || 0),
      evaluator_name: req.body.evaluator_name || req.body.evaluatorName || 'Lead Evaluator',
      comments: req.body.comments || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await supabase.from('event_scores').insert([scoreItem]);
    } catch (e) {}

    const local = readScores();
    local.unshift(scoreItem);
    writeScores(local);

    res.json({ success: true, message: 'Score record saved successfully in DB', data: scoreItem });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create score record' });
  }
};

exports.updateEventScore = async (req, res) => {
  try {
    const { id } = req.params;
    const updatePayload = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    try {
      await supabase.from('event_scores').update(updatePayload).eq('id', id);
    } catch (e) {}

    const local = readScores();
    const idx = local.findIndex(s => s.id === id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updatePayload };
      writeScores(local);
    }

    res.json({ success: true, message: 'Score updated successfully in DB', data: updatePayload });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update score record' });
  }
};

exports.deleteEventScore = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await supabase.from('event_scores').delete().eq('id', id);
    } catch (e) {}

    let local = readScores();
    local = local.filter(s => s.id !== id);
    writeScores(local);

    res.json({ success: true, message: 'Score record deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete score record' });
  }
};

// ==================== OFFLINE REGISTRATIONS SEPARATE TABLE CONTROLLERS ====================
const OFFLINE_REG_FILE = path.join(DATA_DIR, 'offline_registrations.json');

const readOfflineRegistrations = () => {
  try {
    if (!fs.existsSync(OFFLINE_REG_FILE)) {
      fs.writeFileSync(OFFLINE_REG_FILE, '[]', 'utf-8');
      return [];
    }
    return JSON.parse(fs.readFileSync(OFFLINE_REG_FILE, 'utf-8') || '[]');
  } catch (e) {
    return [];
  }
};

const writeOfflineRegistrations = (data) => {
  try {
    fs.writeFileSync(OFFLINE_REG_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Offline Regs Local Write Warning]:', e.message);
  }
};

// Helper: Insert secondary team members into Supabase offline_registration_members (or alias offline_registrations_member)
async function insertOfflineMembersHelper(dbRegId, ticketCode, membersList) {
  if (!Array.isArray(membersList) || membersList.length === 0) return [];
  const validRecords = membersList.map((m, idx) => {
    const isObj = typeof m === 'object' && m !== null;
    const name = (isObj ? (m.fullName || m.name || m.member_name || '') : String(m)).trim();
    if (!name) return null;
    return {
      registration_id: dbRegId,
      ticket_code: ticketCode,
      member_number: idx + 2,
      member_name: name,
      email: isObj ? (m.email || null) : null,
      phone: isObj ? (m.phone || null) : null,
      college: isObj ? (m.college || null) : null,
      department: isObj ? (m.department || null) : null,
      year: isObj ? (m.year || null) : null
    };
  }).filter(Boolean);

  if (validRecords.length === 0) return [];

  try {
    // 1. Insert into public.offline_registration_members
    const { data: d1, error: e1 } = await supabase.from('offline_registration_members').insert(validRecords).select('*');
    if (e1) {
      console.warn('[Supabase offline_registration_members Notice]:', e1.message);
      // Fallback: try singular table name public.offline_registrations_member
      const { data: d2, error: e2 } = await supabase.from('offline_registrations_member').insert(validRecords).select('*');
      if (e2) {
        console.warn('[Supabase offline_registrations_member Notice]:', e2.message);
      }
      return d2 || validRecords;
    }
    return d1 || validRecords;
  } catch (err) {
    console.warn('[Offline Members Insert Exception]:', err.message);
    return validRecords;
  }
}

// Helper: Save single offline registration record to Supabase & local cache
async function saveOfflineRegistrationRecord(rec) {
  let fields = rec.fields || rec;
  let currentEvent = rec.currentEvent || {};
  const eventId = rec.eventId || rec.event_id || currentEvent.id || fields.eventId || 'tech-01';

  // Ensure event exists in DB before registration foreign key constraint
  try {
    const { data: existingEv } = await supabase.from('events').select('id').eq('id', eventId).maybeSingle();
    if (!existingEv) {
      await supabase.from('events').insert([{
        id: eventId,
        number: '99',
        name: rec.eventName || currentEvent.name || 'Symposium Event',
        category: rec.category || currentEvent.category || 'technical',
        team_size: (fields.teamName || rec.teamName) ? 'Team' : 'Individual',
        min_members: 1,
        max_members: 10,
        fee_type: 'per_head',
        fee_per_head: 50
      }]);
    }
  } catch (eEv) {
    console.warn('[Offline Event Ensure Notice]:', eEv.message);
  }

  const fullName = (fields.fullName || fields.teamName || rec.fullName || rec.teamName || rec.name || 'Participant').trim();
  const phone = (fields.phone || rec.phone || '').trim();
  const email = (fields.email || rec.email || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'participant'}@onsite.cahcet.edu`).trim();
  const college = fields.college || rec.college || 'C. Abdul Hakeem College of Engineering & Technology';
  const department = fields.department || rec.department || 'CSE';
  const year = fields.year || rec.year || '3rd Year';
  const teamName = fields.teamName || rec.teamName || rec.team_name || null;
  const totalFee = Number(rec.totalFee || rec.total_fee || rec.fee || fields.totalFee || currentEvent.feePerHead || 50);

  const rawMembers = fields.teamMembers || rec.teamMembers || rec.team_members || [];
  const validMembers = (Array.isArray(rawMembers) ? rawMembers : [])
    .filter(m => (typeof m === 'string' ? m.trim().length > 0 : (m && (m.fullName || m.name || m.member_name))));

  const ticketCode = rec.ticketCode || rec.ticket_code || fields.onsiteUniqueId || rec.onsiteUniqueId || rec.id || `ONSITE-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const venueSnapshot = JSON.stringify({
    venue: currentEvent.venue || rec.venue || 'CSE Dept Labs',
    payment_method: 'ON_SITE_DESK',
    timing: currentEvent.timing || rec.timing || '10:00 AM',
    team_members: validMembers,
    imported_from_paper: true,
    file_name: rec.fileName || null,
    imported_at: new Date().toISOString()
  });

  const offlinePayload = {
    ticket_code: ticketCode,
    event_id: eventId,
    full_name: fullName,
    email: email,
    phone: phone || '9876543210',
    whatsapp: fields.whatsapp || rec.whatsapp || phone || '9876543210',
    college: college,
    department: department,
    year: year,
    team_name: teamName,
    members_count: Math.max(1, 1 + validMembers.length),
    team_members: validMembers,
    total_fee: totalFee,
    payment_status: 'PAID',
    registration_status: 'CONFIRMED',
    payment_method: 'ON_SITE_DESK',
    venue_snapshot: venueSnapshot,
    timing_snapshot: currentEvent.timing || rec.timing || '10:00 AM – 1:00 PM',
    onsite_unique_id: fields.onsiteUniqueId || rec.onsiteUniqueId || rec.id || ticketCode,
    is_verified: true,
    attendance_status: 'pending',
    updated_at: new Date().toISOString()
  };

  let dbRegId = null;
  // Check if ticket already exists in offline_registrations
  let { data: existingRow } = await supabase.from('offline_registrations').select('id').eq('ticket_code', ticketCode).maybeSingle();

  if (existingRow && existingRow.id) {
    dbRegId = existingRow.id;
    await supabase.from('offline_registrations').update(offlinePayload).eq('id', dbRegId);
    // Delete existing members and re-insert
    try {
      await supabase.from('offline_registration_members').delete().eq('registration_id', dbRegId);
      await supabase.from('offline_registrations_member').delete().eq('registration_id', dbRegId);
    } catch (eDel) {}
  } else {
    offlinePayload.created_at = new Date().toISOString();
    const { data: insData, error: insErr } = await supabase.from('offline_registrations').insert([offlinePayload]).select('id');
    if (!insErr && insData && insData[0]) {
      dbRegId = insData[0].id;
    } else if (insErr) {
      console.warn('[Offline Reg Insert Note]:', insErr.message);
    }
  }

  // Insert secondary members into offline_registration_members table
  if (dbRegId && validMembers.length > 0) {
    await insertOfflineMembersHelper(dbRegId, ticketCode, validMembers);
  }

  // Also update local cache
  const localList = readOfflineRegistrations();
  const existingIdx = localList.findIndex(r => r.ticket_code === ticketCode || r.ticketCode === ticketCode || (dbRegId && r.id === dbRegId));
  const savedItem = {
    ...offlinePayload,
    id: dbRegId || ticketCode,
    registrationId: dbRegId || ticketCode,
    eventName: rec.eventName || currentEvent.name || 'Symposium Event',
    category: rec.category || currentEvent.category || 'technical'
  };

  if (existingIdx !== -1) {
    localList[existingIdx] = savedItem;
  } else {
    localList.unshift(savedItem);
  }
  writeOfflineRegistrations(localList);

  try {
    const { broadcastRegistrationUpdate } = require('../config/websocket');
    broadcastRegistrationUpdate('CREATE_OFFLINE', savedItem);
  } catch (eWs) {}

  return savedItem;
}

exports.getOfflineRegistrations = async (req, res) => {
  try {
    const { eventId, category, status } = req.query;
    let offlineList = [];
    let fromDb = false;

    try {
      let query = supabase
        .from('offline_registrations')
        .select(`*, ${REGISTRATION_EVENT_FIELDS}, offline_registration_members(*)`)
        .order('created_at', { ascending: false });

      if (eventId) query = query.eq('event_id', eventId);

      const { data: dbData, error: dbError } = await query;
      if (!dbError && Array.isArray(dbData)) {
        offlineList = dbData;
        fromDb = true;
        // Keep local cache in sync
        writeOfflineRegistrations(dbData);
      } else if (dbError) {
        console.warn('[Supabase Offline Regs Query Note]:', dbError.message);
      }
    } catch (e) {
      console.warn('[Offline Regs DB Query Exception]:', e.message);
    }

    if (!fromDb) {
      offlineList = readOfflineRegistrations();
      if (eventId) {
        offlineList = offlineList.filter(r => (r.event_id || r.eventId) === eventId);
      }
    }

    let enriched = (offlineList || []).map(r => {
      const copy = enrichRegistrationRecord(r);
      copy.payment_method = 'ON_SITE_DESK';
      copy.paymentMethod = 'ON_SITE_DESK';
      copy.isOffline = true;
      return copy;
    });

    if (category) {
      enriched = enriched.filter(r => (r.eventCategory || r.category || '').toLowerCase() === category.toLowerCase());
    }
    if (status) {
      enriched = enriched.filter(r => (r.payment_status || r.paymentStatus || r.registration_status || '').toLowerCase() === status.toLowerCase());
    }

    return res.json({
      success: true,
      count: enriched.length,
      data: enriched,
      registrations: enriched
    });
  } catch (err) {
    console.error('getOfflineRegistrations error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve offline registrations' });
  }
};

exports.getOfflineRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const normId = String(id).trim();

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normId);
      let query = supabase.from('offline_registrations').select(`*, ${REGISTRATION_EVENT_FIELDS}, offline_registration_members(*)`);
      if (isUUID) {
        query = query.eq('id', normId).maybeSingle();
      } else {
        query = query.ilike('ticket_code', normId).maybeSingle();
      }
      const { data, error } = await query;
      if (!error && data) {
        const copy = enrichRegistrationRecord(data);
        copy.payment_method = 'ON_SITE_DESK';
        copy.paymentMethod = 'ON_SITE_DESK';
        return res.json({ success: true, data: copy });
      }
    } catch (e) {}

    const local = readOfflineRegistrations();
    const found = local.find(r => r.id === normId || r.ticket_code === normId || r.ticketCode === normId);
    if (found) {
      const copy = enrichRegistrationRecord(found);
      copy.payment_method = 'ON_SITE_DESK';
      copy.paymentMethod = 'ON_SITE_DESK';
      return res.json({ success: true, data: copy });
    }

    return res.status(404).json({ success: false, message: 'Offline registration record not found' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch offline registration' });
  }
};

exports.createOfflineRegistration = async (req, res) => {
  try {
    let currentEvent = req.body.currentEvent || {};
    if (typeof currentEvent === 'string') {
      try { currentEvent = JSON.parse(currentEvent); } catch (e) {}
    }
    let fields = req.body.fields || req.body;
    if (typeof fields === 'string') {
      try { fields = JSON.parse(fields); } catch (e) {}
    }

    const eventId = currentEvent.id || fields.eventId || req.body.eventId;
    const fullName = (fields.fullName || fields.name || req.body.fullName || 'Participant').trim();
    const phone = (fields.phone || req.body.phone || '').trim();
    const email = (fields.email || req.body.email || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'participant'}@onsite.cahcet.edu`).trim();
    const college = fields.college || req.body.college || 'C. Abdul Hakeem College of Engineering & Technology';
    const department = fields.department || req.body.department || 'CSE';
    const year = fields.year || req.body.year || '3rd Year';
    const teamName = fields.teamName || req.body.teamName || null;
    const totalFee = Number(req.body.totalFee || fields.totalFee || currentEvent.feePerHead || 50);

    const rawMembers = fields.teamMembers || req.body.teamMembers || [];
    const validMembers = (Array.isArray(rawMembers) ? rawMembers : [])
      .filter(m => (typeof m === 'string' ? m.trim().length > 0 : (m && (m.fullName || m.name))))
      .map(m => typeof m === 'string' ? m.trim() : (m.fullName || m.name || '').trim());

    const catPrefix = (currentEvent.category || '').toLowerCase() === 'technical' ? 'TCH' : 'NT';
    const ticketCode = fields.onsiteUniqueId || req.body.onsiteUniqueId || `ELQ26-${catPrefix}-OFF${Math.floor(1000 + Math.random() * 9000)}`;

    const venueSnapshot = JSON.stringify({
      venue: currentEvent.venue || 'CSE Dept Labs',
      payment_method: 'ON_SITE_DESK',
      timing: currentEvent.timing || '10:00 AM',
      team_members: validMembers
    });

    const offlineRecord = {
      ticket_code: ticketCode,
      event_id: eventId || null,
      full_name: fullName,
      email: email,
      phone: phone,
      whatsapp: fields.whatsapp || phone,
      college: college,
      department: department,
      year: year,
      team_name: teamName,
      members_count: 1 + validMembers.length,
      team_members: validMembers,
      total_fee: totalFee,
      payment_status: 'PAID',
      registration_status: 'CONFIRMED',
      payment_method: 'ON_SITE_DESK',
      venue_snapshot: venueSnapshot,
      timing_snapshot: currentEvent.timing || '10:00 AM – 1:00 PM',
      onsite_unique_id: fields.onsiteUniqueId || ticketCode,
      is_verified: false,
      attendance_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let dbRegId = null;
    try {
      const { data: dbData, error: dbErr } = await supabase
        .from('offline_registrations')
        .insert([offlineRecord])
        .select('id');

      if (!dbErr && dbData && dbData[0]) {
        dbRegId = dbData[0].id;
        if (validMembers.length > 0) {
          await insertOfflineMembersHelper(dbRegId, ticketCode, validMembers);
        }
      } else if (dbErr) {
        console.warn('[Supabase offline_registrations insert note]:', dbErr.message);
      }
    } catch (e) {
      console.warn('[Supabase offline_registrations exception]:', e.message);
    }

    const localList = readOfflineRegistrations();
    const finalRecord = {
      ...offlineRecord,
      id: dbRegId || ticketCode,
      registrationId: dbRegId || ticketCode,
      eventName: currentEvent.name || 'Symposium Event',
      category: currentEvent.category || 'technical'
    };
    localList.unshift(finalRecord);
    writeOfflineRegistrations(localList);

    // Broadcast WebSocket
    try {
      const { broadcastRegistrationUpdate } = require('../config/websocket');
      broadcastRegistrationUpdate('CREATE_OFFLINE', finalRecord);
    } catch (e) {}

    return res.json({
      success: true,
      message: 'Offline registration recorded in separate table',
      ticketData: finalRecord,
      data: finalRecord
    });
  } catch (err) {
    console.error('createOfflineRegistration error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create offline registration' });
  }
};

// ── BATCH / SINGLE IMPORT OF OFFLINE DESK REGISTRATIONS ─────────────────────────
exports.importOfflineRegistrations = async (req, res) => {
  try {
    let records = req.body.registrations || req.body.records || req.body.data || (Array.isArray(req.body) ? req.body : [req.body]);
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No offline registration records provided to import' });
    }

    const savedRecords = [];
    const errors = [];

    for (const rec of records) {
      try {
        const result = await saveOfflineRegistrationRecord(rec);
        savedRecords.push(result);
      } catch (err) {
        errors.push({ ticketCode: rec.ticketCode || rec.id || rec.ticket_code, error: err.message });
      }
    }

    return res.json({
      success: true,
      message: `Successfully linked & saved ${savedRecords.length} offline registration(s) into Supabase offline_registrations and offline_registration_members tables.`,
      savedCount: savedRecords.length,
      saved: savedRecords,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('importOfflineRegistrations error:', err);
    return res.status(500).json({ success: false, message: 'Failed to import offline registrations: ' + err.message });
  }
};

// ── BIDIRECTIONAL SYNC WITH SUPABASE ──────────────────────────────────────────
exports.syncOfflineRegistrationsWithSupabase = async (req, res) => {
  try {
    // 1. Fetch live records from Supabase
    const { data: supaData, error: supaErr } = await supabase
      .from('offline_registrations')
      .select(`*, ${REGISTRATION_EVENT_FIELDS}, offline_registration_members(*)`)
      .order('created_at', { ascending: false });

    if (supaErr) {
      console.error('[Offline Sync] Supabase query error:', supaErr.message);
      return res.status(500).json({ success: false, message: 'Supabase error: ' + supaErr.message });
    }

    const dbRecords = Array.isArray(supaData) ? supaData : [];

    // 2. Push any local offline records that are missing from Supabase
    const localRecords = readOfflineRegistrations();
    let pushedCount = 0;

    for (const local of localRecords) {
      const ticket = local.ticket_code || local.ticketCode;
      const existsInDb = dbRecords.some(r => r.ticket_code === ticket || (local.id && r.id === local.id));
      if (!existsInDb && ticket) {
        try {
          await saveOfflineRegistrationRecord(local);
          pushedCount++;
        } catch (ePush) {
          console.warn('[Offline Sync Push Note]:', ePush.message);
        }
      }
    }

    // 3. Re-query Supabase to get the complete current state
    const { data: finalDb } = await supabase
      .from('offline_registrations')
      .select(`*, ${REGISTRATION_EVENT_FIELDS}, offline_registration_members(*)`)
      .order('created_at', { ascending: false });

    const finalRecords = Array.isArray(finalDb) ? finalDb : dbRecords;
    writeOfflineRegistrations(finalRecords);

    return res.json({
      success: true,
      message: `Synchronized ${finalRecords.length} offline registration(s) with Supabase (offline_registrations & offline_registration_members).`,
      count: finalRecords.length,
      pushedCount,
      data: finalRecords
    });
  } catch (err) {
    console.error('syncOfflineRegistrationsWithSupabase error:', err);
    return res.status(500).json({ success: false, message: 'Sync failed: ' + err.message });
  }
};

exports.updateOfflineRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const updatePayload = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      if (isUUID) {
        await supabase.from('offline_registrations').update(updatePayload).eq('id', id);
      } else {
        await supabase.from('offline_registrations').update(updatePayload).ilike('ticket_code', id);
      }
    } catch (e) {}

    const local = readOfflineRegistrations();
    const idx = local.findIndex(r => r.id === id || r.ticket_code === id || r.ticketCode === id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updatePayload };
      writeOfflineRegistrations(local);
    }

    return res.json({ success: true, message: 'Offline registration updated successfully', data: updatePayload });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update offline registration' });
  }
};

exports.deleteOfflineRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const normId = String(id).trim();

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normId);
      if (isUUID) {
        await supabase.from('offline_registrations').delete().eq('id', normId);
        await supabase.from('offline_registration_members').delete().eq('registration_id', normId);
        try { await supabase.from('offline_registrations_member').delete().eq('registration_id', normId); } catch (e) {}
      } else {
        await supabase.from('offline_registrations').delete().ilike('ticket_code', normId);
        await supabase.from('offline_registration_members').delete().ilike('ticket_code', normId);
        try { await supabase.from('offline_registrations_member').delete().ilike('ticket_code', normId); } catch (e) {}
      }
    } catch (e) {}

    let local = readOfflineRegistrations();
    local = local.filter(r => r.id !== normId && r.ticket_code !== normId && r.ticketCode !== normId);
    writeOfflineRegistrations(local);

    return res.json({ success: true, message: 'Offline registration record removed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete offline registration' });
  }
};

exports.readOfflineRegistrations = readOfflineRegistrations;
exports.writeOfflineRegistrations = writeOfflineRegistrations;
exports.enrichRegistrationRecord = enrichRegistrationRecord;
exports.insertOfflineMembersHelper = insertOfflineMembersHelper;
exports.saveOfflineRegistrationRecord = saveOfflineRegistrationRecord;

