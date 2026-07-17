/**
 * COSMAN — Frontend Configuration
 * Connects the static frontend to the Node.js backend API.
 * In production: set window.COSMAN_API_URL via environment injection (Vercel env vars).
 */
(function () {
  const isProd = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';

  window.COSMAN_CONFIG = {
    // Backend API base URL — override with VERCEL_ENV injection or replace manually
    API_URL: isProd
      ? (window.__COSMAN_API_URL__ || 'https://api.cosman.com')
      : 'http://localhost:5000',

    // WhatsApp order number
    WHATSAPP: '+212600000000',

    // Google Analytics
    GTAG_ID: window.__COSMAN_GTAG__ || '',

    // Feature flags
    FEATURES: {
      whatsappOrder:  true,
      cashOnDelivery: true,
      reviews:        true,
      wishlist:       true,
    },
  };

  // Expose a thin fetch wrapper pre-configured with the API base
  window.cosmanFetch = async function (path, opts = {}) {
    const url = window.COSMAN_CONFIG.API_URL + path;
    const defaults = {
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('cosman_token')
          ? { Authorization: 'Bearer ' + localStorage.getItem('cosman_token') }
          : {}),
      },
    };
    const res = await fetch(url, { ...defaults, ...opts, headers: { ...defaults.headers, ...(opts.headers || {}) } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'API error');
    }
    return res.json();
  };

  console.log('[COSMAN] Config loaded — API:', window.COSMAN_CONFIG.API_URL);
})();
