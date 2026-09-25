const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');

const DATA_DIR = path.join(__dirname, '../data');

async function syncTableData() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('[Supabase Sync] Supabase credentials not set. Running in local mode.');
    return;
  }

  console.log('[Supabase Sync] Checking and syncing live tables with Supabase...');

  // 1. Sync Events (Pull live from DB, or seed only if table is empty)
  try {
    const eventsFile = path.join(DATA_DIR, 'events.json');
    const { data: dbEvents, error: dbErr } = await supabase.from('events').select('*').order('id', { ascending: true });

    if (!dbErr && Array.isArray(dbEvents) && dbEvents.length > 0) {
      // Supabase is the source of truth: sync live DB data to local file
      fs.writeFileSync(eventsFile, JSON.stringify(dbEvents, null, 2), 'utf-8');
      console.log(`[Supabase Sync] Pulled ${dbEvents.length} live events from Supabase to local cache.`);
    } else if (fs.existsSync(eventsFile) && (!dbEvents || dbEvents.length === 0)) {
      // Only seed Supabase if DB table is completely empty
      const events = JSON.parse(fs.readFileSync(eventsFile, 'utf-8') || '[]');
      for (const e of events) {
        const payload = {
          id: e.id,
          number: e.number,
          name: e.name,
          alias: e.alias,
          subtitle: e.subtitle,
          category: e.category,
          team_size: e.teamSize || e.team_size,
          min_members: e.minMembers || e.min_members || 1,
          max_members: e.maxMembers || e.max_members || 1,
          fee: e.fee,
          fee_per_head: e.feePerHead || e.fee_per_head || 0,
          fee_type: e.feeType || e.fee_type || 'per_head',
          is_team: e.isTeam !== false && e.is_team !== false,
          tag: e.tag,
          venue: e.venue,
          venue_image: e.venueImage || e.venue_image || '',
          timing: e.timing,
          description: e.description,
          image: e.image || '',
          rules: e.rules || [],
          rounds: e.rounds || [],
          guidelines: e.guidelines || [],
          highlights: e.highlights || []
        };
        await supabase.from('events').upsert(payload, { onConflict: 'id' });
      }
      console.log(`[Supabase Sync] Seeded ${events.length} initial events to Supabase.`);
    }
  } catch (err) {
    console.warn('[Supabase Sync] Events sync note:', err.message);
  }

  // 2. Sync Roles & Users
  try {
    const rolesFile = path.join(DATA_DIR, 'roles.json');
    if (fs.existsSync(rolesFile)) {
      const roles = JSON.parse(fs.readFileSync(rolesFile, 'utf-8') || '[]');
      for (const r of roles) {
        await supabase.from('roles').upsert({
          id: r.id,
          name: r.name,
          description: r.description || '',
          permissions: r.permissions || []
        }, { onConflict: 'id' });
      }
    }

    const usersFile = path.join(DATA_DIR, 'users.json');
    const { data: dbUsers, error: dbUsersErr } = await supabase.from('users').select('*').order('id', { ascending: true });
    if (!dbUsersErr && Array.isArray(dbUsers) && dbUsers.length > 0) {
      fs.writeFileSync(usersFile, JSON.stringify(dbUsers, null, 2), 'utf-8');
      console.log(`[Supabase Sync] Pulled ${dbUsers.length} live users from Supabase to local cache.`);
    } else if (fs.existsSync(usersFile) && (!dbUsers || dbUsers.length === 0)) {
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8') || '[]');
      for (const u of users) {
        const assignedEvts = Array.isArray(u.assigned_events) ? u.assigned_events : (Array.isArray(u.assignedEvents) ? u.assignedEvents : (u.eventId || u.event_id ? [u.eventId || u.event_id] : []));
        await supabase.from('users').upsert({
          id: u.id,
          username: u.username,
          password: u.password,
          role: u.role,
          assigned_events: assignedEvts,
          is_active: u.isActive !== false && u.is_active !== false
        }, { onConflict: 'id' });
      }
      console.log(`[Supabase Sync] Seeded ${users.length} initial users to Supabase.`);
    }
  } catch (err) {
    console.warn('[Supabase Sync] Users/Roles sync note:', err.message);
  }

  // 3. Sync Coordinators (Pull live from DB, or seed only if table is empty)
  try {
    const coordsFile = path.join(DATA_DIR, 'coordinators.json');
    const { data: dbCoords, error: dbErr } = await supabase.from('coordinators').select('*').order('display_order', { ascending: true });
    if (!dbErr && Array.isArray(dbCoords) && dbCoords.length > 0) {
      fs.writeFileSync(coordsFile, JSON.stringify(dbCoords, null, 2), 'utf-8');
    } else if (fs.existsSync(coordsFile) && (!dbCoords || dbCoords.length === 0)) {
      const coords = JSON.parse(fs.readFileSync(coordsFile, 'utf-8') || '[]');
      for (const c of coords) {
        await supabase.from('coordinators').upsert({
          id: c.id,
          name: c.name,
          phone: c.phone || '',
          whatsapp: c.whatsapp || '',
          email: c.email || '',
          role: c.role || '',
          department: c.department || '',
          year: c.year || '',
          assigned_events: c.assignedEvents || [],
          is_active: c.isActive !== false,
          display_order: c.displayOrder || 1
        }, { onConflict: 'id' });
      }
    }
  } catch (err) {
    console.warn('[Supabase Sync] Coordinators sync note:', err.message);
  }

  // 4. Sync Homepage Coordinators (Pull live from DB, or seed only if table is empty)
  try {
    const hpFile = path.join(DATA_DIR, 'homepage_coordinators.json');
    const { data: dbHp, error: dbErr } = await supabase.from('homepage_coordinators').select('*').order('display_order', { ascending: true });
    if (!dbErr && Array.isArray(dbHp) && dbHp.length > 0) {
      fs.writeFileSync(hpFile, JSON.stringify(dbHp, null, 2), 'utf-8');
    } else if (fs.existsSync(hpFile) && (!dbHp || dbHp.length === 0)) {
      const hp = JSON.parse(fs.readFileSync(hpFile, 'utf-8') || '[]');
      for (const t of hp) {
        await supabase.from('homepage_coordinators').upsert({
          id: t.id,
          role: t.role,
          tag: t.tag,
          desc_text: t.desc || t.desc_text || '',
          icon: t.icon || 'Users',
          color: t.color || 'from-blue-500 to-cyan-500',
          members: t.members || [],
          is_active: t.isActive !== false,
          display_order: t.displayOrder || 1
        }, { onConflict: 'id' });
      }
    }
  } catch (err) {
    console.warn('[Supabase Sync] Homepage teams sync note:', err.message);
  }

  // 5. Sync Sponsors (Pull live from DB, or seed only if table is empty)
  try {
    const spFile = path.join(DATA_DIR, 'sponsors.json');
    const { data: dbSp, error: dbErr } = await supabase.from('sponsors').select('*').order('display_order', { ascending: true });
    if (!dbErr && Array.isArray(dbSp) && dbSp.length > 0) {
      fs.writeFileSync(spFile, JSON.stringify(dbSp, null, 2), 'utf-8');
    } else if (fs.existsSync(spFile) && (!dbSp || dbSp.length === 0)) {
      const sponsors = JSON.parse(fs.readFileSync(spFile, 'utf-8') || '[]');
      for (const s of sponsors) {
        await supabase.from('sponsors').upsert({
          id: s.id,
          name: s.name,
          company_name: s.companyName || s.name || '',
          logo: s.logo || '',
          description: s.description || '',
          website: s.website || '',
          location_url: s.locationUrl || '',
          contact_name: s.contactName || '',
          contact_email: s.contactEmail || '',
          contact_phone: s.contactPhone || '',
          category: s.category || 'Gold Sponsor',
          display_order: s.displayOrder || 1,
          is_active: s.isActive !== false
        }, { onConflict: 'id' });
      }
    }
  } catch (err) {
    console.warn('[Supabase Sync] Sponsors sync note:', err.message);
  }

  // 6. Sync Settings (Pull live from DB, or seed only if table is empty)
  try {
    const settingsFile = path.join(DATA_DIR, 'settings.json');
    const { data: dbSettings, error: dbErr } = await supabase.from('settings').select('*').eq('id', 'general').maybeSingle();
    if (!dbErr && dbSettings) {
      const st = {
        isRegistrationClosed: Boolean(dbSettings.is_registration_closed),
        closedReason: dbSettings.closed_reason || 'ONLINE REGISTRATIONS ARE CLOSED',
        onSpotNotice: dbSettings.on_spot_notice || 'ON SPOT REGISTRATIONS WILL BE OPENED TOMORROW ON 9:00 AM',
        closedAt: dbSettings.closed_at || null,
        closedBy: dbSettings.closed_by || null,
        updatedAt: dbSettings.updated_at || new Date().toISOString()
      };
      fs.writeFileSync(settingsFile, JSON.stringify(st, null, 2), 'utf-8');
    } else if (fs.existsSync(settingsFile) && !dbSettings) {
      const st = JSON.parse(fs.readFileSync(settingsFile, 'utf-8') || '{}');
      await supabase.from('settings').upsert({
        id: 'general',
        is_registration_closed: Boolean(st.isRegistrationClosed),
        closed_reason: st.closedReason || '',
        on_spot_notice: st.onSpotNotice || '',
        closed_at: st.closedAt || null,
        closed_by: st.closedBy || null,
        updated_at: st.updatedAt || new Date().toISOString()
      }, { onConflict: 'id' });
    }
  } catch (err) {}

  console.log('[Supabase Sync] Supabase sync completed.');
}

module.exports = { syncTableData };
