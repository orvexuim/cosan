/**
 * COSMAN — Supabase Frontend Client
 * Lightweight browser client for direct Supabase access
 * (auth sessions, realtime, public queries)
 * 
 * Project: https://zgnvxjsuthyugktryycj.supabase.co
 */

// ── Config ────────────────────────────────────────
const SUPABASE_URL    = 'https://zgnvxjsuthyugktryycj.supabase.co';
const SUPABASE_ANON   = window.__COSMAN_SUPABASE_KEY__ || '';  // injected by Vercel env

// ── Thin Supabase REST client (no npm needed) ─────
window.supabase = {

  _headers() {
    const token = localStorage.getItem('cosman_supabase_token');
    return {
      'apikey':        SUPABASE_ANON,
      'Content-Type':  'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : { 'Authorization': `Bearer ${SUPABASE_ANON}` }),
    };
  },

  // ── Auth ──────────────────────────────────────
  auth: {
    async signUp(email, password) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: window.supabase._headers(),
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.access_token) localStorage.setItem('cosman_supabase_token', data.access_token);
      return data;
    },

    async signIn(email, password) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: window.supabase._headers(),
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.access_token) localStorage.setItem('cosman_supabase_token', data.access_token);
      return data;
    },

    async signOut() {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: window.supabase._headers(),
      });
      localStorage.removeItem('cosman_supabase_token');
    },

    getUser() {
      const token = localStorage.getItem('cosman_supabase_token');
      if (!token) return null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { id: payload.sub, email: payload.email, role: payload.role };
      } catch { return null; }
    },

    isLoggedIn() { return !!localStorage.getItem('cosman_supabase_token'); },
  },

  // ── Database (REST) ───────────────────────────
  from(table) {
    const base = `${SUPABASE_URL}/rest/v1/${table}`;
    return {
      async select(columns = '*', filter = '') {
        const url = `${base}?select=${columns}${filter ? '&' + filter : ''}`;
        const res = await fetch(url, { headers: window.supabase._headers() });
        return res.json();
      },
      async insert(data) {
        const res = await fetch(base, {
          method: 'POST',
          headers: { ...window.supabase._headers(), 'Prefer': 'return=representation' },
          body: JSON.stringify(data),
        });
        return res.json();
      },
      async update(data, filter) {
        const res = await fetch(`${base}?${filter}`, {
          method: 'PATCH',
          headers: { ...window.supabase._headers(), 'Prefer': 'return=representation' },
          body: JSON.stringify(data),
        });
        return res.json();
      },
      async delete(filter) {
        const res = await fetch(`${base}?${filter}`, {
          method: 'DELETE',
          headers: window.supabase._headers(),
        });
        return res.ok;
      },
    };
  },
};

console.log('[COSMAN] Supabase client ready →', SUPABASE_URL);
