import defaultEvents from '../data/events.js';

/**
 * Master Event Team Specification Dictionary
 * Canonical source of truth for maximum and minimum members, team status, and fees.
 */
export const EVENT_TEAM_SPECS = {
  'tech-01': {
    isTeam: true,
    minMembers: 1,
    maxMembers: 3,
    teamSize: 'Max of 3 members',
    feePerHead: 100,
    feeType: 'per_head'
  },
  'tech-02': {
    isTeam: true,
    minMembers: 1,
    maxMembers: 2,
    teamSize: 'Individual / Team of 2',
    feePerHead: 50,
    feeType: 'per_head'
  },
  'tech-03': {
    isTeam: true,
    minMembers: 1,
    maxMembers: 2,
    teamSize: 'Individual / Team of 2',
    feePerHead: 50,
    feeType: 'per_head'
  },
  'tech-04': {
    isTeam: true,
    minMembers: 1,
    maxMembers: 2,
    teamSize: 'Individual / Team of 2',
    feePerHead: 50,
    feeType: 'per_head'
  },
  'tech-05': {
    isTeam: false,
    minMembers: 1,
    maxMembers: 1,
    teamSize: 'Individual',
    feePerHead: 50,
    feeType: 'per_head'
  },
  'tech-06': {
    isTeam: false,
    minMembers: 1,
    maxMembers: 1,
    teamSize: 'Individual',
    feePerHead: 50,
    feeType: 'per_head'
  },
  'nontech-01': {
    isTeam: false,
    minMembers: 1,
    maxMembers: 1,
    teamSize: 'Individual',
    feePerHead: 50,
    feeType: 'per_head'
  },
  'nontech-02': {
    isTeam: true,
    minMembers: 1,
    maxMembers: 3,
    teamSize: 'Max of 3 members',
    feePerHead: 50,
    feeType: 'per_head'
  },
  'nontech-03': {
    isTeam: true,
    minMembers: 2,
    maxMembers: 4,
    teamSize: 'Max of 4 members',
    feePerHead: 50,
    feeType: 'per_head'
  },
  'nontech-04': {
    isTeam: false,
    minMembers: 1,
    maxMembers: 1,
    teamSize: 'Individual',
    feePerHead: 50,
    feeType: 'per_head'
  },
  'nontech-05': {
    isTeam: true,
    minMembers: 4,
    maxMembers: 4,
    teamSize: 'Only Squad Match (4 Players)',
    feePerHead: 50,
    feeType: 'per_squad'
  },
  'nontech-06': {
    isTeam: false,
    minMembers: 1,
    maxMembers: 1,
    teamSize: 'Individual only',
    feePerHead: 50,
    feeType: 'per_head'
  },
  'nontech-07': {
    isTeam: true,
    minMembers: 5,
    maxMembers: 5,
    teamSize: 'Team of 5 Members',
    feePerHead: 50,
    feeType: 'per_team'
  }
};

/**
 * Normalizes any format of event ID (spaces, underscores, hyphens, prefixes)
 * e.g., 'tech 01', 'tech_01', 'tech-01', 'non-tech_02' -> 'tech-01', 'nontech-02'
 */
export function normalizeEventId(rawId) {
  if (!rawId || typeof rawId !== 'string') return '';
  let id = decodeURIComponent(rawId).trim().toLowerCase();

  // Normalize delimiters to hyphens
  id = id.replace(/[\s_]+/g, '-').replace(/-+/g, '-');

  // Convert non-tech to nontech
  if (id.startsWith('non-tech')) {
    id = id.replace('non-tech', 'nontech');
  }

  // Handle tech1 -> tech-01, tech01 -> tech-01
  id = id.replace(/^(tech|nontech)(\d)$/, '$1-0$2');
  id = id.replace(/^(tech|nontech)(\d{2})$/, '$1-$2');

  return id;
}

/**
 * Ensures an event object is 100% normalized with both camelCase and snake_case properties,
 * guaranteed team status, correct min/max member counts, and team sizes.
 */
export function normalizeEvent(e) {
  if (!e || typeof e !== 'object') return null;

  const normId = normalizeEventId(e.id || '');
  const spec = EVENT_TEAM_SPECS[normId] || EVENT_TEAM_SPECS[e.id] || null;

  // Resolve isTeam
  let isTeam = false;
  if (spec) {
    isTeam = spec.isTeam;
  } else if (e.isTeam !== undefined) {
    isTeam = Boolean(e.isTeam);
  } else if (e.is_team !== undefined) {
    isTeam = Boolean(e.is_team);
  } else if (e.maxMembers !== undefined || e.max_members !== undefined) {
    isTeam = Number(e.maxMembers || e.max_members) > 1;
  } else if (e.teamSize || e.team_size) {
    const s = String(e.teamSize || e.team_size).toLowerCase();
    isTeam = s.includes('team') || s.includes('squad') || s.includes('max') || s.includes('2') || s.includes('3') || s.includes('4') || s.includes('5');
  }

  // Resolve maxMembers
  let maxMembers = spec?.maxMembers || Number(e.maxMembers || e.max_members) || (isTeam ? 3 : 1);
  let minMembers = spec?.minMembers || Number(e.minMembers || e.min_members) || 1;

  // Resolve teamSize display text
  let teamSize = (e.teamSize && String(e.teamSize).trim()) || (e.team_size && String(e.team_size).trim()) || spec?.teamSize;
  if (!teamSize) {
    if (!isTeam || maxMembers <= 1) {
      teamSize = 'Individual';
    } else if (minMembers === maxMembers) {
      teamSize = `${maxMembers} Players / Squad`;
    } else {
      teamSize = `Max of ${maxMembers} members`;
    }
  }

  // Resolve fees - NEVER allow feePerHead to be 0 or falsy
  const candidateFee = Number(e.feePerHead || e.fee_per_head || 0);
  const feePerHead = candidateFee > 0 ? candidateFee : (spec?.feePerHead || (normId === 'tech-01' ? 100 : 50));
  const feeType = e.feeType || e.fee_type || spec?.feeType || 'per_head';

  return {
    ...e,
    id: e.id || normId,
    name: e.name || spec?.name || 'Symposium Event',
    alias: e.alias || e.name || 'Symposium Event',
    category: e.category || (normId.startsWith('tech') ? 'technical' : 'non-technical'),
    isTeam,
    is_team: isTeam,
    minMembers,
    min_members: minMembers,
    maxMembers,
    max_members: maxMembers,
    teamSize,
    team_size: teamSize,
    fee: e.fee || (feeType === 'per_squad' || feeType === 'per_team' ? `₹${feePerHead * maxMembers} per team` : `₹${feePerHead} per head`),
    feePerHead,
    fee_per_head: feePerHead,
    feeType,
    fee_type: feeType
  };
}

/**
 * Searches for an event in eventsList with comprehensive matching:
 * 1. Normalized ID (supports 'tech 01', 'tech_01', 'tech-01', 'non-tech_05', etc.)
 * 2. Event Number & Category match
 * 3. Exact or substring Name & Alias match ('SLIDE CRAFT', 'Slide Craft', 'PPT Presentation')
 * 4. Fallback search in defaultEvents catalog
 */
export function findEvent(eventsList, targetIdOrName) {
  if (!targetIdOrName) return null;

  const raw = String(targetIdOrName).trim();
  const normalized = normalizeEventId(raw);
  const rawLower = raw.toLowerCase();

  const searchPool = (Array.isArray(eventsList) && eventsList.length > 0)
    ? eventsList
    : defaultEvents;

  // 1. Direct or normalized ID match
  let found = searchPool.find((e) => {
    if (!e) return false;
    const eNorm = normalizeEventId(e.id || '');
    return (
      e.id === raw ||
      e.id?.toLowerCase() === rawLower ||
      eNorm === normalized ||
      (normalized && eNorm === normalized)
    );
  });
  if (found) return normalizeEvent(found);

  // 2. Category + number matching (e.g. '01' + 'technical' or 'tech-01')
  found = searchPool.find((e) => {
    if (!e) return false;
    const num = String(e.number || '').trim().padStart(2, '0');
    const cat = String(e.category || '').toLowerCase();
    if (normalized === `tech-${num}` && cat === 'technical') return true;
    if (normalized === `nontech-${num}` && cat === 'non-technical') return true;
    return false;
  });
  if (found) return normalizeEvent(found);

  // 3. Name or alias matching
  found = searchPool.find((e) => {
    if (!e) return false;
    const nameLower = String(e.name || '').toLowerCase().trim();
    const aliasLower = String(e.alias || '').toLowerCase().trim();
    return (
      nameLower === rawLower ||
      aliasLower === rawLower ||
      (rawLower.length >= 4 && (nameLower.includes(rawLower) || aliasLower.includes(rawLower))) ||
      (nameLower.length >= 4 && rawLower.includes(nameLower)) ||
      (aliasLower.length >= 4 && rawLower.includes(aliasLower))
    );
  });
  if (found) return normalizeEvent(found);

  // 4. If searchPool was dynamic eventsList, check defaultEvents as fallback
  if (searchPool !== defaultEvents) {
    const fallbackMatch = findEvent(defaultEvents, targetIdOrName);
    if (fallbackMatch) return fallbackMatch;
  }

  return null;
}
