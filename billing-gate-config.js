// Configuración del bloqueo suave (cliente-side)
//
// 1) Publica tu proyecto de cobros (paginawebcobro) en un dominio/URL.
// 2) Reemplaza las URLs aquí.
//
// Ejemplo GitHub Pages:
//   gateUrl:     "https://tuusuario.github.io/paginawebcobro/gate.js"
//   registryUrl: "https://tuusuario.github.io/paginawebcobro/data/apps.json"
//
// Nota: esto NO es seguridad real, es un bloqueo visual.

window.PWCB = {
  appId: 'urgentitourdesa',
  // Para pruebas locales: apunta al servidor local de paginawebcobro
  // En producción: URLs apuntando a tu GitHub Pages (reemplazadas automáticamente)
  // Publica `appwebcobro` en GitHub Pages para que estas rutas sirvan los archivos.
  gateUrl: 'https://carlosmontesdeocae321-oss.github.io/appwebcobro/gate.js',
  registryUrl: 'https://carlosmontesdeocae321-oss.github.io/appwebcobro/data/apps.json',
  // Para pruebas locales descomenta las siguientes líneas y ajusta el puerto si hace falta:
  // gateUrl: 'http://localhost:8090/gate.js',
  // registryUrl: 'http://localhost:8090/data/apps.json',
  // Intervalo de polling en ms (0 para desactivar). Ajustable para pruebas.
  pollIntervalMs: 5000,
};

// Configuración de cobro para el cliente
// Actualiza manualmente la fecha de expiración cada mes
window.BILLING_GATE_CONFIG = {
//  expirationDate: '2026-01-31', // Fecha límite de pago (YYYY-MM-DD)
  graceDays: 3 // Días de gracia después de la expiración
};
