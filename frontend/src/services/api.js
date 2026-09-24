import { getApiUrl } from '../config/api';

export async function createPaymentOrder(payload) {
  const response = await fetch(getApiUrl('/api/payment/create-order'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function verifyPaymentAndRegister(payload) {
  const response = await fetch(getApiUrl('/api/payment/verify-and-register'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function submitRegistration(payload) {
  try {
    const response = await fetch(getApiUrl('/api/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process registration on server');
    }

    return {
      success: true,
      data: data.registration || data.ticketData,
    };
  } catch (error) {
    console.warn('[Registration API] Server unreachable or returned error:', error.message);
    
    // Offline fallback
    const year = '2026';
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const fallbackId = `ELQ26-${year}-${randomCode}`;
    const now = new Date();

    const fallbackRecord = {
      registrationId: fallbackId,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      whatsapp: payload.whatsapp || null,
      college: payload.college,
      department: payload.department,
      year: payload.year,
      eventId: payload.eventId,
      eventName: payload.eventName,
      eventCategory: payload.eventCategory,
      isTeam: payload.isTeam,
      teamName: payload.teamName || null,
      teamMembers: payload.teamMembers || [],
      participantCount: 1 + (payload.teamMembers ? payload.teamMembers.length : 0),
      feePerHead: payload.feePerHead,
      totalAmount: payload.totalFee,
      feeFormula: payload.feeFormula,
      registrationStatus: 'CONFIRMED',
      paymentStatus: 'PENDING',
      paymentMethod: 'UPI_QR',
      createdAt: now.toISOString(),
      createdAtFormatted: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      isOfflineFallback: true,
    };

    return {
      success: true,
      data: fallbackRecord,
      warning: 'Stored locally as backend server was offline. Please ensure backend is running to persist to database.'
    };
  }
}

import defaultEvents from '../data/events.js';
import defaultSponsorsObj from '../data/sponsors.js';
import coordinatorsData from '../data/coordinator.js';
import { normalizeEvent } from '../utils/eventUtils.js';

const flatDefaultSponsors = Array.isArray(defaultSponsorsObj)
  ? defaultSponsorsObj
  : [
      ...(defaultSponsorsObj?.elite || []),
      ...(defaultSponsorsObj?.premium || []),
      ...(defaultSponsorsObj?.standard || []),
    ];

// ==================== PUBLIC SPONSOR & COORDINATOR APIS ====================

let inMemorySponsorsCache = flatDefaultSponsors;
let pendingSponsorsPromise = null;

export function groupSponsorsByTier(list) {
  if (!Array.isArray(list)) return { elite: [], premium: [], standard: [] };
  const elite = [];
  const premium = [];
  const standard = [];

  list.forEach((s) => {
    const cat = (s.category || s.tag || '').toLowerCase();
    if (cat.includes('elite') || cat.includes('title')) {
      elite.push(s);
    } else if (cat.includes('premium') || cat.includes('gold') || cat.includes('silver')) {
      premium.push(s);
    } else {
      standard.push(s);
    }
  });

  return { elite, premium, standard };
}

export function getCachedSponsors() {
  if (inMemorySponsorsCache && Array.isArray(inMemorySponsorsCache) && inMemorySponsorsCache.length > 0) {
    return inMemorySponsorsCache;
  }
  try {
    const raw = sessionStorage.getItem('eloquence_db_sponsors');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemorySponsorsCache = parsed;
        return parsed;
      }
    }
  } catch (_) {}
  inMemorySponsorsCache = flatDefaultSponsors;
  return flatDefaultSponsors;
}

export function setCachedSponsors(sponsorsList) {
  if (Array.isArray(sponsorsList) && sponsorsList.length > 0) {
    inMemorySponsorsCache = sponsorsList;
    try {
      sessionStorage.setItem('eloquence_db_sponsors', JSON.stringify(sponsorsList));
    } catch (_) {}
  }
}

export async function fetchSponsorsData() {
  if (pendingSponsorsPromise) return pendingSponsorsPromise;

  pendingSponsorsPromise = (async () => {
    try {
      const res = await fetch(getApiUrl('/api/sponsors'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setCachedSponsors(result.data);
        return result.data;
      }
    } catch (err) {
      console.warn('Error fetching sponsors from DB:', err);
    } finally {
      pendingSponsorsPromise = null;
    }
    return getCachedSponsors();
  })();

  return pendingSponsorsPromise;
}

export async function fetchActiveSponsors() {
  return await fetchSponsorsData();
}

export async function fetchActiveCoordinators() {
  try {
    const res = await fetch(getApiUrl('/api/coordinators'));
    const data = await res.json();
    if (data.success) return data.data;
    return [];
  } catch (err) {
    console.warn('Failed to fetch coordinators from server, using fallback', err);
    return null;
  }
}

export async function fetchCoordinatorsByEvent(eventId) {
  try {
    const res = await fetch(getApiUrl(`/api/coordinators/event/${encodeURIComponent(eventId)}`));
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) return data.data;
  } catch (err) {
    console.warn(`Failed to fetch coordinators for event ${eventId}:`, err);
  }
  return coordinatorsData[eventId]?.coordinators || [];
}

// ==================== ADMIN APIS (AUTH REQUIRED) ====================

export async function fetchAdminSponsors(token) {
  const res = await fetch(getApiUrl('/api/admin/sponsors'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function createSponsor(sponsorData, token) {
  const res = await fetch(getApiUrl('/api/admin/sponsors'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(sponsorData)
  });
  return res.json();
}

export async function updateSponsor(id, sponsorData, token) {
  const res = await fetch(getApiUrl(`/api/admin/sponsors/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(sponsorData)
  });
  return res.json();
}

export async function toggleSponsorStatus(id, token) {
  const res = await fetch(getApiUrl(`/api/admin/sponsors/${id}/toggle`), {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function deleteSponsor(id, token) {
  const res = await fetch(getApiUrl(`/api/admin/sponsors/${id}`), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function uploadSponsorLogo(imageBase64, fileName, token) {
  const res = await fetch(getApiUrl('/api/admin/upload'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ imageBase64, fileName, type: 'sponsor' })
  });
  return res.json();
}

export async function fetchAdminCoordinators(token) {
  const res = await fetch(getApiUrl('/api/admin/coordinators'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function createCoordinator(coordData, token) {
  const res = await fetch(getApiUrl('/api/admin/coordinators'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(coordData)
  });
  return res.json();
}

export async function updateCoordinator(id, coordData, token) {
  const res = await fetch(getApiUrl(`/api/admin/coordinators/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(coordData)
  });
  return res.json();
}

export async function toggleCoordinatorStatus(id, token) {
  const res = await fetch(getApiUrl(`/api/admin/coordinators/${id}/toggle`), {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function deleteCoordinator(id, token) {
  const res = await fetch(getApiUrl(`/api/admin/coordinators/${id}`), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

// ==================== HOMEPAGE STUDENT COORDINATOR TEAMS APIS ====================

export async function fetchPublicHomepageCoordinators() {
  try {
    const res = await fetch(getApiUrl('/api/homepage-coordinators'));
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) return data.data;
    return null;
  } catch (err) {
    console.warn('Failed to fetch public homepage coordinators from server:', err);
    return null;
  }
}

export async function fetchAdminHomepageCoordinators(token) {
  const res = await fetch(getApiUrl('/api/admin/homepage-coordinators'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function createHomepageCoordinatorTeam(teamData, token) {
  const res = await fetch(getApiUrl('/api/admin/homepage-coordinators'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(teamData)
  });
  return res.json();
}

export async function updateHomepageCoordinatorTeam(id, teamData, token) {
  const res = await fetch(getApiUrl(`/api/admin/homepage-coordinators/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(teamData)
  });
  return res.json();
}

export async function toggleHomepageCoordinatorTeam(id, token) {
  const res = await fetch(getApiUrl(`/api/admin/homepage-coordinators/${id}/toggle`), {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function deleteHomepageCoordinatorTeam(id, token) {
  const res = await fetch(getApiUrl(`/api/admin/homepage-coordinators/${id}`), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

// ==================== REGISTRATION STATUS (CLOSE RG) APIS ====================

let cachedRegistrationStatus = null;
let registrationStatusPromise = null;
let lastStatusFetchTime = 0;
const STATUS_CACHE_TTL = 30000; // 30 seconds

export function setCachedRegistrationStatus(data) {
  if (data) {
    cachedRegistrationStatus = { success: true, ...data };
    lastStatusFetchTime = Date.now();
  }
}

export async function fetchRegistrationStatus(force = false) {
  const now = Date.now();
  if (!force && cachedRegistrationStatus && (now - lastStatusFetchTime < STATUS_CACHE_TTL)) {
    return cachedRegistrationStatus;
  }

  if (registrationStatusPromise) {
    return registrationStatusPromise;
  }

  registrationStatusPromise = (async () => {
    try {
      const res = await fetch(getApiUrl('/api/registration-status'));
      const data = await res.json();
      if (data && data.success) {
        cachedRegistrationStatus = data;
        lastStatusFetchTime = Date.now();
        return data;
      }
      return cachedRegistrationStatus || {
        success: true,
        isRegistrationClosed: false,
        closedReason: '',
        onSpotNotice: ''
      };
    } catch (err) {
      return cachedRegistrationStatus || {
        success: true,
        isRegistrationClosed: false,
        closedReason: '',
        onSpotNotice: ''
      };
    } finally {
      registrationStatusPromise = null;
    }
  })();

  return registrationStatusPromise;
}

export async function fetchAdminRegistrationStatus(token) {
  const res = await fetch(getApiUrl('/api/admin/registration-status'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function updateRegistrationStatus(token, payload) {
  const res = await fetch(getApiUrl('/api/admin/registration-status'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return res.json();
}

// ==================== EVENTS CACHING & FETCHING ====================
function getStoredEventsCache() {
  if (typeof window === 'undefined') return defaultEvents.map(normalizeEvent);
  try {
    const raw = localStorage.getItem('eloquence_db_events_v3') || sessionStorage.getItem('eloquence_db_events_v3');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeEvent);
      }
    }
  } catch (_) {}
  return defaultEvents.map(normalizeEvent);
}

let inMemoryEventsCache = getStoredEventsCache();
let lastEventsFetchTime = inMemoryEventsCache && inMemoryEventsCache.length > 0 ? Date.now() : 0;
let pendingEventsPromise = null;
const CLIENT_EVENTS_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes client freshness

export function getCachedEvents() {
  if (inMemoryEventsCache && Array.isArray(inMemoryEventsCache) && inMemoryEventsCache.length > 0) {
    return inMemoryEventsCache.map(normalizeEvent);
  }
  inMemoryEventsCache = getStoredEventsCache();
  return inMemoryEventsCache;
}

export function setCachedEvents(events) {
  if (Array.isArray(events) && events.length > 0) {
    const normalized = events.map(normalizeEvent);
    inMemoryEventsCache = normalized;
    lastEventsFetchTime = Date.now();
    try {
      localStorage.setItem('eloquence_db_events_v3', JSON.stringify(normalized));
      sessionStorage.setItem('eloquence_db_events_v3', JSON.stringify(normalized));
      localStorage.removeItem('eloquence_db_events');
      sessionStorage.removeItem('eloquence_db_events');
    } catch (_) {}
  }
}

export async function fetchEventsData(force = false) {
  // If data is in memory and fresh, return immediately without duplicate HTTP calls
  if (!force && inMemoryEventsCache && inMemoryEventsCache.length > 0 && (Date.now() - lastEventsFetchTime < CLIENT_EVENTS_CACHE_TTL_MS)) {
    return inMemoryEventsCache;
  }

  if (pendingEventsPromise && !force) return pendingEventsPromise;

  pendingEventsPromise = (async () => {
    try {
      const res = await fetch(getApiUrl('/api/events'), {
        cache: force ? 'no-store' : 'default'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const sorted = [...result.data].sort((a, b) => {
          if (a.category !== b.category) {
            return a.category === 'technical' ? -1 : 1;
          }
          return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
        }).map(e => {
          const fallbackCoords = coordinatorsData[e.id]?.coordinators || [];
          return normalizeEvent({
            ...e,
            coordinators: (Array.isArray(e.coordinators) && e.coordinators.length > 0)
              ? e.coordinators
              : fallbackCoords
          });
        });
        setCachedEvents(sorted);
        return sorted;
      }
    } catch (err) {
      console.warn('Error fetching events from DB:', err);
    } finally {
      pendingEventsPromise = null;
    }
    return getCachedEvents();
  })();

  return pendingEventsPromise;
}

export async function fetchEventWinners(eventId = null) {
  try {
    const url = eventId ? getApiUrl(`/api/winners/${encodeURIComponent(eventId)}`) : getApiUrl('/api/winners');
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) return data.data;
    return [];
  } catch (err) {
    console.warn('Error fetching winners:', err);
    return [];
  }
}

export async function submitEventWinners(winnerPayload) {
  const res = await fetch(getApiUrl('/api/winners'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(winnerPayload)
  });
  return res.json();
}

export async function updateEventCoordinatorDetails(eventId, detailsPayload, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(getApiUrl(`/api/events/${encodeURIComponent(eventId)}/coordinator-update`), {
    method: 'PUT',
    headers,
    body: JSON.stringify(detailsPayload)
  });
  return res.json();
}

export async function fetchEventAllocations(token) {
  const res = await fetch(getApiUrl('/api/admin/event-allocations'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function updateEventAllocation(allocationData, token) {
  const res = await fetch(getApiUrl('/api/admin/event-allocations'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(allocationData)
  });
  return res.json();
}

/**
 * Uploads a payment screenshot for a given registration ID / ticket code
 */
export async function uploadPaymentScreenshot(registrationId, file) {
  const formData = new FormData();
  formData.append('screenshot', file);
  const res = await fetch(getApiUrl(`/api/registrations/${encodeURIComponent(registrationId)}/payment-screenshot`), {
    method: 'POST',
    body: formData
  });
  return res.json();
}

/**
 * Fetches the temporary signed URL for a registration's payment screenshot (Admin only)
 * If screenshotPath is provided, backend generates signed URL directly without querying database
 */
export async function getPaymentScreenshot(registrationId, token, screenshotPath = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const query = screenshotPath ? `?path=${encodeURIComponent(screenshotPath)}` : '';
  const res = await fetch(getApiUrl(`/api/admin/registrations/${encodeURIComponent(registrationId)}/payment-screenshot${query}`), {
    headers
  });
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('image/')) {
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    return { success: true, url: blobUrl, signedUrl: blobUrl };
  }
  return res.json();
}

/**
 * Updates payment status (VERIFIED | REJECTED | PENDING) for a registration (Admin only)
 */
export async function updateRegistrationPaymentStatus(registrationId, status, token, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(getApiUrl(`/api/admin/registrations/${encodeURIComponent(registrationId)}/payment-status`), {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      status,
      action: status?.toLowerCase(),
      reason: options.reason || null,
      flagReason: options.flagReason || options.reason || null
    })
  });
  return res.json();
}

/**
 * Imports one or more official participant pass PDFs and extracts details to save in database
 */
export async function importPassPdf(files, autoSave = true, token = null) {
  const formData = new FormData();
  const fileList = Array.isArray(files) ? files : [files];
  for (const f of fileList) {
    formData.append('pdf', f);
  }
  formData.append('autoSave', String(autoSave));

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(getApiUrl(`/api/registrations/import-pdf?autoSave=${autoSave}`), {
    method: 'POST',
    headers,
    body: formData
  });
  return res.json();
}

/**
 * Saves a list of imported registrations directly to the database
 */
export async function saveImportedRegistrations(registrations, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(getApiUrl('/api/registrations/save-imported'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ registrations })
  });
  return res.json();
}





