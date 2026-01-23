(function () {
  var cfg = window.PWCB || {};
  var appId = String(cfg.appId || '').trim();
  var gateUrl = String(cfg.gateUrl || '').trim();
  var registryUrl = String(cfg.registryUrl || '').trim();

  if (!appId || !gateUrl || !registryUrl) {
    // Config incompleta: no hacemos nada.
    return;
  }

  var s = document.createElement('script');
  s.src = gateUrl;
  s.async = true;
  s.setAttribute('data-app-id', appId);
  s.setAttribute('data-registry', registryUrl);
  document.head.appendChild(s);
})();
