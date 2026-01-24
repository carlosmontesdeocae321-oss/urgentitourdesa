// Billing gate loader: injecta gate.js a menos que window.PWCB_DISABLE === true
(function () {
  try {
    var cfg = window.PWCB || {};
    if (typeof console !== 'undefined' && console.info) console.info('billing-gate-loader: start', cfg);
    if (cfg.disable === true || (window.PWCB_DISABLE === true)) {
      if (typeof console !== 'undefined' && console.info) console.info('billing-gate-loader: disabled by site config');
      return;
    }

    var appId = String(cfg.appId || '').trim();
    var gateUrl = String(cfg.gateUrl || '').trim();
    var registryUrl = String(cfg.registryUrl || '').trim();

    if (!appId || !gateUrl || !registryUrl) {
      if (typeof console !== 'undefined' && console.info) console.info('billing-gate-loader: missing PWCB config', {appId:appId, gateUrl:gateUrl, registryUrl:registryUrl});
      return;
    }

    var s = document.createElement('script');
    s.src = gateUrl;
    s.async = true;
    s.setAttribute('data-app-id', appId);
    s.setAttribute('data-registry', registryUrl);
    // allow optional poll interval from config
    if (typeof cfg.pollIntervalMs === 'number' && cfg.pollIntervalMs > 0) {
      s.setAttribute('data-poll-interval-ms', String(cfg.pollIntervalMs));
    }
    if (typeof console !== 'undefined' && console.info) console.info('billing-gate-loader: injecting gate.js', {src: s.src, appId: appId, registry: registryUrl});
    document.head.appendChild(s);
  } catch (e) {
    if (typeof console !== 'undefined' && console.error) console.error('billing-gate-loader error', e);
  }
})();
