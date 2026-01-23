// Billing gate loader disabled: no-op to remove client-side blocking.
(function () {
  // Intentional no-op to disable the billing gate on this site.
  // To re-enable, restore the original loader behavior.
  if (typeof console !== 'undefined' && console.info) {
    console.info('billing-gate-loader: disabled by site admin');
  }
})();
