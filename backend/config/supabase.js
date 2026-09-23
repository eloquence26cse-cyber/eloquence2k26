const fs = require('fs');
const path = require('path');

const envPath = fs.existsSync(path.join(__dirname, '../.env'))
  ? path.join(__dirname, '../.env')
  : path.join(__dirname, '../env');
require('dotenv').config({ path: envPath, quiet: true });

const { createClient } = require("@supabase/supabase-js");


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env['SUPABASE_anon-key'];

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('[Supabase] Warning: SUPABASE_URL or API key is missing in backend/.env. Supabase operations will fall back to local data.');
  const createDummyChain = () => {
    const target = {
      then: (resolve) => resolve({ data: null, error: new Error('Supabase not configured') }),
      catch: (reject) => Promise.resolve({ data: null, error: new Error('Supabase not configured') }).catch(reject),
    };
    return new Proxy(target, {
      get(t, prop) {
        if (prop === 'then' || prop === 'catch') return t[prop];
        return () => createDummyChain();
      }
    });
  };
  supabase = {
    from: () => createDummyChain(),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
    }
  };
}

module.exports = supabase;
