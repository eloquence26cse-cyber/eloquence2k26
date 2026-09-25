const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

const DATA_DIR = path.join(__dirname, '../data');

function camelToSnakeKey(key) {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function convertObjectKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertObjectKeys);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = camelToSnakeKey(key);
      acc[snakeKey] = convertObjectKeys(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

async function syncTable(tableName, jsonFileName, idField = 'id', sanitizeFn = null) {
  const filePath = path.join(DATA_DIR, jsonFileName);
  if (!fs.existsSync(filePath)) {
    console.log(`[SYNC] Skipping ${tableName}: ${jsonFileName} not found.`);
    return;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    let items = JSON.parse(raw || '[]');
    if (!Array.isArray(items) || items.length === 0) {
      console.log(`[SYNC] No records in ${jsonFileName}.`);
      return;
    }

    console.log(`[SYNC] Syncing ${items.length} records into table '${tableName}'...`);

    // Check table existence
    const { error: testError } = await supabase.from(tableName).select('*').limit(1);
    if (testError) {
      console.error(`❌ Table '${tableName}' error:`, testError.message);
      return;
    }

    let successCount = 0;
    for (let item of items) {
      let convertedItem = convertObjectKeys(item);
      if (sanitizeFn) {
        convertedItem = sanitizeFn(convertedItem);
      }
      const { error } = await supabase.from(tableName).upsert([convertedItem], { onConflict: idField });
      if (error) {
        console.warn(`⚠️ Warning item in '${tableName}' (${item[idField] || 'no-id'}):`, error.message);
      } else {
        successCount++;
      }
    }
    console.log(`✅ Table '${tableName}': synced ${successCount}/${items.length} records.`);
  } catch (err) {
    console.error(`❌ Failed syncing '${tableName}':`, err.message);
  }
}

async function runSync() {
  console.log("==================================================");
  console.log(" ELOQUENCE '26 SUPABASE LIVE SYNC & DIAGNOSTIC ");
  console.log("==================================================");
  console.log("Target Database URL:", process.env.SUPABASE_URL);

  const tables = [
    'events',
    'registrations',
    'registration_members',
    'offline_registrations',
    'offline_registration_members',
    'coordinators',
    'sponsors',
    'users',
    'roles',
    'dispatches',
    'search_logs'
  ];
  console.log("\n--- Checking Table Accessibility ---");
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`❌ Table '${t}' is MISSING or restricted: ${error.message}`);
    } else {
      console.log(`✅ Table '${t}' is LIVE & accessible.`);
    }
  }

  console.log("\n--- Data Sync Status ---");

  // Sync events
  await syncTable('events', 'events.json', 'id', (item) => {
    delete item.coordinators;
    return item;
  });

  // Sync coordinators
  await syncTable('coordinators', 'coordinators.json', 'id');

  // Sync offline registrations & members
  console.log("\n--- Syncing Offline Registrations & Members ---");
  try {
    const offFilePath = path.join(DATA_DIR, 'offline_registrations.json');
    let localOff = [];
    if (fs.existsSync(offFilePath)) {
      localOff = JSON.parse(fs.readFileSync(offFilePath, 'utf-8') || '[]');
    }

    // Pull current from Supabase
    const { data: supaOff, error: offErr } = await supabase
      .from('offline_registrations')
      .select('*, offline_registration_members(*)');

    if (offErr) {
      console.error("❌ Failed to query Supabase offline_registrations:", offErr.message);
    } else {
      console.log(`✅ Supabase offline_registrations table currently has ${supaOff.length} live records.`);
      
      // Upsert any missing local records into Supabase
      let pushed = 0;
      for (const rec of localOff) {
        const ticket = rec.ticket_code || rec.ticketCode;
        if (!ticket) continue;
        const exists = supaOff.some(r => r.ticket_code === ticket || (rec.id && r.id === rec.id));
        if (!exists) {
          const { data: insData, error: insErr } = await supabase.from('offline_registrations').insert([{
            ticket_code: ticket,
            event_id: rec.event_id || rec.eventId || 'tech-01',
            full_name: rec.full_name || rec.fullName || 'Participant',
            email: rec.email || '',
            phone: rec.phone || '',
            college: rec.college || '',
            department: rec.department || '',
            year: rec.year || '',
            team_name: rec.team_name || rec.teamName || null,
            members_count: Number(rec.members_count || rec.membersCount || 1),
            total_fee: Number(rec.total_fee || rec.totalFee || 0),
            payment_status: 'PAID',
            registration_status: 'CONFIRMED',
            payment_method: 'ON_SITE_DESK'
          }]).select('id');

          if (!insErr && insData && insData[0]) {
            pushed++;
            const regId = insData[0].id;
            const members = rec.team_members || rec.teamMembers || [];
            if (Array.isArray(members) && members.length > 0) {
              const memsToIns = members.map((m, idx) => ({
                registration_id: regId,
                ticket_code: ticket,
                member_number: idx + 2,
                member_name: typeof m === 'string' ? m : (m.fullName || m.name || 'Member'),
                email: typeof m === 'object' ? m.email : null,
                phone: typeof m === 'object' ? m.phone : null
              }));
              await supabase.from('offline_registration_members').insert(memsToIns);
            }
          }
        }
      }

      // Re-fetch and update local cache
      const { data: refreshed } = await supabase.from('offline_registrations').select('*, offline_registration_members(*)');
      if (refreshed) {
        fs.writeFileSync(offFilePath, JSON.stringify(refreshed, null, 2), 'utf-8');
        console.log(`✅ Synced ${refreshed.length} offline records to local data/offline_registrations.json.`);
      }
    }
  } catch (syncOffErr) {
    console.warn("⚠️ Offline registrations sync warning:", syncOffErr.message);
  }

  await syncTable('sponsors', 'sponsors.json', 'id');
  await syncTable('users', 'users.json', 'id');
  await syncTable('roles', 'roles.json', 'id');

  console.log("\n==================================================");
  console.log(" DIAGNOSTIC COMPLETE ");
  console.log("==================================================");
}

runSync();
