// No se requiere JS para el fondo dividido; placeholder.

// --- SISTEMA DE COBRO MANUAL ---
function mostrarMensajeCobro() {
  if (!window.BILLING_GATE_CONFIG) return;
  const { expirationDate, graceDays } = window.BILLING_GATE_CONFIG;
  const hoy = new Date();
  const exp = new Date(expirationDate + 'T23:59:59');
  const diffMs = exp - hoy;
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  let mensaje = '';
  let tipo = '';
  if (diffDias >= 0) {
    // Activo
    return; // No mostrar mensaje
  } else if (diffDias >= -graceDays) {
    // En gracia
    const fechaLimite = new Date(exp);
    fechaLimite.setDate(exp.getDate() + graceDays);
    mensaje = `Tu período de pago ha expirado. Estás en tus días de gracia. Tienes hasta el ${fechaLimite.toLocaleDateString()} para cancelar tu mensualidad.`;
    tipo = 'gracia';
  } else {
    // Vencido
    mensaje = 'El período de gracia ha finalizado. Por favor, contacta para regularizar tu pago y reactivar la página.';
    tipo = 'vencido';
  }
  // Crear e insertar el mensaje en la página
  const aviso = document.createElement('div');
  aviso.className = 'mensaje-cobro ' + tipo;
  aviso.textContent = mensaje;
  document.body.prepend(aviso);
}

// Banner disabled: leave mostrarMensajeCobro available but do not auto-insert on load.
// document.addEventListener('DOMContentLoaded', mostrarMensajeCobro);
document.addEventListener('DOMContentLoaded', () => {
  // Alternar modo de foto de fondo basado en la variable CSS
  function applyBgPhotoMode(){
    const root = document.documentElement;
    const url = getComputedStyle(root).getPropertyValue('--bg-photo-url').trim();
    const bgEl = document.querySelector('.bg-photo');
    const bgStyle = bgEl ? getComputedStyle(bgEl) : null;
    const imgVal = bgStyle ? bgStyle.backgroundImage : 'none';
    const opVal = bgStyle ? parseFloat(bgStyle.opacity || '0') : 0;
    const hasUrl = url && url !== 'none' && url.includes('url(');
    const hasImg = imgVal && imgVal !== 'none';
    const visible = (hasUrl || hasImg) && opVal > 0.02; // treat near-zero opacity as disabled
    document.body.classList.toggle('has-bg-photo', visible);
  }
  applyBgPhotoMode();

  // Auto-fit en móvil: mantener el mismo layout en distintas resoluciones
  // reduciendo (scale) el contenido si no cabe en alto.
  const root = document.documentElement;
  const posterEl = document.querySelector('.poster');
  const posterContentEl = document.querySelector('.poster-content');
  const isMobileCoarse = () => {
    try{
      return window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    }catch(e){
      return false;
    }
  };

  function applyContentFitScale(){
    if (!posterEl || !posterContentEl) return;

    const coarse = isMobileCoarse();

    const vv = window.visualViewport;
    const viewportW = (vv && vv.width) ? vv.width : window.innerWidth;
    const viewportH = (vv && vv.height) ? vv.height : window.innerHeight;
    const posterStyle = getComputedStyle(posterEl);
    const padTop = parseFloat(posterStyle.paddingTop || '0') || 0;
    const padBottom = parseFloat(posterStyle.paddingBottom || '0') || 0;
    const padLeft = parseFloat(posterStyle.paddingLeft || '0') || 0;
    const padRight = parseFloat(posterStyle.paddingRight || '0') || 0;
    const availableW = Math.max(1, viewportW - padLeft - padRight - 6);
    const availableH = Math.max(1, viewportH - padTop - padBottom - 6);

    // Medir el tamaño real del contenido en pantalla. Para evitar que el propio scale
    // afecte la medición, forzar temporalmente scale=1.
    const prevScale = getComputedStyle(root).getPropertyValue('--content-scale').trim();
    root.style.setProperty('--content-scale', '1');

    const elementsToMeasure = [
      posterContentEl,
      ...Array.from(document.querySelectorAll('.car-emoji')),
      ...Array.from(document.querySelectorAll('.brand-title-img, .footer-title-img')),
      ...Array.from(document.querySelectorAll('.ctas'))
    ].filter(Boolean);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of elementsToMeasure) {
      const r = el.getBoundingClientRect();
      if (!r || !isFinite(r.left) || !isFinite(r.top)) continue;
      minX = Math.min(minX, r.left);
      minY = Math.min(minY, r.top);
      maxX = Math.max(maxX, r.right);
      maxY = Math.max(maxY, r.bottom);
    }

    // Capturar offsets base (a scale=1) para mantener el solape de CTAs aunque haya scale.
    let baseGreenMtPx = null;
    let baseBlueMtPx = null;
    try{
      const g = document.querySelector('.icon-green');
      const b = document.querySelector('.icon-blue');
      if (g) baseGreenMtPx = parseFloat(getComputedStyle(g).marginTop || '0');
      if (b) baseBlueMtPx = parseFloat(getComputedStyle(b).marginTop || '0');
    }catch(e){
      // ignore
    }

    // Restaurar el scale previo antes de aplicar el nuevo.
    if (prevScale) root.style.setProperty('--content-scale', prevScale);
    else root.style.removeProperty('--content-scale');

    // Si no se pudo medir, no tocar.
    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) return;

    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);

    // En móvil (touch) ajustar por ancho y alto (una sola pantalla).
    // En escritorio, ajustar solo por ancho para mantener composición y permitir scroll vertical.
    let scale = coarse
      ? Math.min(1, availableW / contentW, availableH / contentH)
      : Math.min(1, availableW / contentW);

    // Límites: en móvil aceptamos más reducción, en escritorio mantener legible.
    scale = Math.max(coarse ? 0.5 : 0.72, scale);
    root.style.setProperty('--content-scale', scale.toFixed(3));

    // Ajustar márgenes de solape de CTAs en función del scale.
    // Si no lo hacemos, al reducir el contenido (scale<1) el solape se “afloja”
    // y en iPhone 8 el azul puede separarse del verde.
    if (baseGreenMtPx !== null && isFinite(baseGreenMtPx)) {
      root.style.setProperty('--cta-green-mt', `${(baseGreenMtPx / scale).toFixed(1)}px`);
    }
    if (baseBlueMtPx !== null && isFinite(baseBlueMtPx)) {
      root.style.setProperty('--cta-blue-mt', `${(baseBlueMtPx / scale).toFixed(1)}px`);
    }

    // En pantallas bajas (ej. iPhone 8) el ajuste anterior puede hacer que el azul
    // cubra demasiado al verde. Relajar el solape solo lo necesario para que el verde
    // quede visible, sin cambiar el z-index (azul sigue encima visualmente).
    try{
      const green = document.querySelector('.cta-green .icon-green');
      const blue = document.querySelector('.cta-blue .icon-blue');
      if (green && blue) {
        const greenRect = () => green.getBoundingClientRect();
        const blueRect = () => blue.getBoundingClientRect();

        const getBlueMt = () => {
          const v = getComputedStyle(root).getPropertyValue('--cta-blue-mt').trim();
          const n = parseFloat(v);
          if (isFinite(n)) return n;
          return parseFloat(getComputedStyle(blue).marginTop || '0') || 0;
        };

        const setBlueMt = (px) => root.style.setProperty('--cta-blue-mt', `${px.toFixed(1)}px`);

        // Objetivo: al menos ~35% del alto del verde visible (no cubierto verticalmente por el azul).
        const minVisibleRatio = 0.35;
        const maxIters = 18;
        const step = 10 / scale; // px antes de scale

        for (let i = 0; i < maxIters; i++) {
          const g = greenRect();
          const b = blueRect();
          const gH = Math.max(1, g.height);

          const overlapTop = Math.max(g.top, b.top);
          const overlapBottom = Math.min(g.bottom, b.bottom);
          const overlapH = Math.max(0, overlapBottom - overlapTop);
          const visibleH = Math.max(0, gH - overlapH);

          if (visibleH / gH >= minVisibleRatio) break;

          // Empujar el azul hacia abajo: hacer su margin-top menos negativo.
          const cur = getBlueMt();
          setBlueMt(cur + step);
        }
      }
    }catch(e){
      // ignore
    }
  }

  // Pixel-perfect para CTAs: un PNG con transparencia no debe “robar” el toque
  // si el usuario está tocando una zona transparente (ej: parte superior del azul).
  const imgCanvases = new WeakMap();
  const getCanvasForImg = (img) => {
    let canvas = imgCanvases.get(img);
    if (!canvas) {
      canvas = document.createElement('canvas');
      imgCanvases.set(img, canvas);
    }
    return canvas;
  };

  const redrawImgCanvas = (img) => {
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const canvas = getCanvasForImg(img);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas._lastSize = '';
    }
    const sizeKey = `${w}x${h}`;
    if (canvas._lastSize === sizeKey) return;
    const ctx = canvas.getContext && canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    try{
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas._lastSize = sizeKey;
    }catch(err){
      // ignorar
    }
  };

  const isOpaqueAtImg = (img, clientX, clientY) => {
    if (!img) return false;
    const rect = img.getBoundingClientRect();
    if (!rect) return false;
    const x = Math.floor(clientX - rect.left);
    const y = Math.floor(clientY - rect.top);
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return false;
    const canvas = getCanvasForImg(img);
    redrawImgCanvas(img);
    const ctx = canvas.getContext && canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return true;
    try{
      const d = ctx.getImageData(x, y, 1, 1).data;
      return d[3] > 10;
    }catch(err){
      return true;
    }
  };

  const ctasEl = document.querySelector('.ctas');
  if (ctasEl) {
    ctasEl.addEventListener('click', (e) => {
      const links = Array.from(ctasEl.querySelectorAll('a.cta-link'));
      if (!links.length) return;

      // Ordenar por z-index (visual): mayor primero
      const ordered = links
        .map((link) => ({
          link,
          z: parseInt((getComputedStyle(link).zIndex || '0'), 10) || 0,
          img: link.querySelector('img')
        }))
        .sort((a, b) => b.z - a.z);

      for (const item of ordered) {
        const href = item.link && item.link.getAttribute && item.link.getAttribute('href');
        if (!href || href === '#') continue;
        const img = item.img;
        if (!img) continue;
        if (isOpaqueAtImg(img, e.clientX, e.clientY)) {
          e.preventDefault();
          e.stopPropagation();
          // Navegar al CTA cuyo píxel tocado es opaco
          const target = item.link && item.link.getAttribute ? item.link.getAttribute('target') : null;
          if (target === '_blank') {
            const w = window.open(href, '_blank', 'noopener,noreferrer');
            try { if (w) w.opener = null; } catch (e) {}
          } else {
            window.location.assign(href);
          }
          return;
        }
      }
      // Si todo fue transparente, no hacer nada.
    }, true);
  }
  // Mapear hotspots a botones para que hover y clic funcionen cuando se superponen
  // Mapear hotspots a imágenes de íconos (los botones fueron reemplazados por imágenes simples)
  const map = [
    {hot: '.hotspot-red', btn: '.icon-red'},
    {hot: '.hotspot-green', btn: '.icon-green'},
    {hot: '.hotspot-blue', btn: '.icon-blue'}
  ];

  // lienzos usados para pruebas de impacto píxel-perfect (indexados por selector de botón)
  const canvases = new Map();

  map.forEach(pair => {
    const hot = document.querySelector(pair.hot);
    const btn = document.querySelector(pair.btn); // now the image element
    if (!hot || !btn) return;

    const handleAction = (el) => {
      // Si el elemento es un ancla/imagen con href o data-href, navegar a él.
      const href = (el && el.getAttribute) ? (el.getAttribute('href') || (el.dataset && el.dataset.href)) : null;
      if (!href || href === '#') return;

      // Respetar target="_blank" (importante para wa.me y enlaces externos en iOS/Android).
      let target = null;
      try {
        if (el && el.getAttribute) target = el.getAttribute('target');
        if (!target && el && el.closest) {
          const a = el.closest('a');
          if (a && a.getAttribute) target = a.getAttribute('target');
        }
      } catch (e) {
        // ignore
      }

      if (target === '_blank') {
        const w = window.open(href, '_blank', 'noopener,noreferrer');
        try { if (w) w.opener = null; } catch (e) {}
        return;
      }

      window.location.assign(href);
    };

    // Hover píxel-perfect: dibujar la imagen del botón en un canvas fuera de pantalla
    const img = (btn.tagName === 'IMG') ? btn : btn.querySelector && btn.querySelector('img');
    const canvas = document.createElement('canvas');
    canvases.set(pair.btn, canvas);
    if (img && !img.complete) {
      img.addEventListener('load', () => redrawCanvases && redrawCanvases(), {once:true});
    }

    // Rastrear estado de hover para agregar/quitar la clase solo cuando cambia
    let isHovering = false;

    const isOpaqueAt = (clientX, clientY) => {
      // Si no tenemos la imagen del botón o el canvas, usar una
      // prueba conservadora de área de contorno: solo el 30% superior de la imagen
      // se considera clicable. Esto evita tratar toda la imagen como clicable
      // cuando las pruebas de píxeles no están disponibles (p. ej., CORS).
      const rect = img ? img.getBoundingClientRect() : null;
      if (!img || !canvases.has(pair.btn) || !rect) {
        // Alternativa: si no podemos hacer prueba por píxeles, considerar todo
        // el rectángulo delimitador como activo para que funcionen los clics en zonas visibles.
        if (!rect) return false;
        const xx = Math.floor(clientX - rect.left);
        const yy = Math.floor(clientY - rect.top);
        return (xx >= 0 && yy >= 0 && xx < rect.width && yy < rect.height);
      }
      const x = Math.floor(clientX - rect.left);
      const y = Math.floor(clientY - rect.top);
      const c = canvases.get(pair.btn);
      const ctx = c.getContext && c.getContext('2d', { willReadFrequently: true });
      // Si no podemos acceder al contexto 2D del canvas, usar la prueba del 30% superior
      if (!ctx) {
        // Si el canvas está contaminado o el contexto no está disponible, aceptar todo el
        // rectángulo delimitador para no bloquear clics en partes visibles del ícono.
        return (x >= 0 && y >= 0 && x < rect.width && y < rect.height);
      }
      if (x < 0 || y < 0 || x >= c.width || y >= c.height) return false;
      try {
        const d = ctx.getImageData(x, y, 1, 1).data;
        return d[3] > 10; // alpha > ~4%
      } catch (err) {
        // Si getImageData falla (canvas contaminado), aceptar el rectángulo
        // delimitador completo para que las partes visibles del ícono sigan siendo clicables.
        return (x >= 0 && y >= 0 && x < rect.width && y < rect.height);
      }
    };

    hot.addEventListener('mousemove', (e) => {
      const ok = isOpaqueAt(e.clientX, e.clientY);
      if (ok && !isHovering) {
        isHovering = true;
        console.log('hotspot pixel enter ->', pair.hot);
        btn.classList.add('hover');
        // sin vibración en hover: Chrome/Safari requieren un gesto del usuario
      } else if (!ok && isHovering) {
        isHovering = false;
        console.log('hotspot pixel leave ->', pair.hot);
        btn.classList.remove('hover');
      }
    });

    hot.addEventListener('mouseleave', () => {
      if (isHovering) {
        isHovering = false;
        btn.classList.remove('hover');
      }
    });

    // Prevenir el comportamiento por defecto en hotspot e ícono y manejar la navegación explícitamente
    hot.addEventListener('click', (e) => {
      e.preventDefault();
      // vibrar solo con un gesto explícito del usuario (clic/toque)
      try{ if (navigator.vibrate) navigator.vibrate(20); }catch(e){}
      if (isOpaqueAt(e.clientX, e.clientY)) {
        console.log('hotspot clicked ->', pair.hot, '-> forwarding to hotspot href');
        // Usar el propio href del hotspot para la navegación (anclas en el DOM)
        handleAction(hot);
      } else {
        console.log('hotspot click ignored (transparent) ->', pair.hot);
      }
    });
    btn.addEventListener('mouseenter', () => console.log('icon mouseenter ->', pair.btn));
    btn.addEventListener('mouseleave', () => console.log('icon mouseleave ->', pair.btn));
    btn.addEventListener('click', (e) => {
      // Si está dentro de un CTA real, el handler de .ctas (captura) decide por píxel.
      const link = btn.closest && btn.closest('a.cta-link');
      if (link && link.getAttribute && link.getAttribute('href')) return;

      e.preventDefault();
      // vibrar solo con un gesto explícito del usuario (clic/toque)
      try{ if (navigator.vibrate) navigator.vibrate(20); }catch(e){}

      const ok = isOpaqueAt(e.clientX, e.clientY);
      const link2 = btn.closest && btn.closest('a.cta-link');

      if (ok) {
        console.log('icon clicked ->', pair.btn);
        // Prioridad: link real del CTA; si no existe, usar el href del hotspot (legacy)
        const target = (link2 && link2.getAttribute && link2.getAttribute('href') && link2.getAttribute('href') !== '#')
          ? link2
          : ((hot && hot.getAttribute && hot.getAttribute('href') && hot.getAttribute('href') !== '#') ? hot : btn);
        handleAction(target);
        return;
      }

      // Si el punto es transparente, NO dispares este botón.
      // En su lugar, intenta “pasar” el toque al botón que esté debajo.
      console.log('icon click ignored (transparent) ->', pair.btn);
      if (link2 && typeof document.elementFromPoint === 'function') {
        const prev = link2.style.pointerEvents;
        link2.style.pointerEvents = 'none';
        const under = document.elementFromPoint(e.clientX, e.clientY);
        link2.style.pointerEvents = prev;

        const underLink = under && under.closest ? under.closest('a.cta-link') : null;
        if (underLink && underLink !== link2 && underLink.getAttribute && underLink.getAttribute('href')) {
          handleAction(underLink);
        }
      }
    });
  });

    // Dibujar cada imagen de botón en su canvas fuera de pantalla al tamaño mostrado.
    function redrawCanvases(){
      map.forEach(pair => {
        const btn = document.querySelector(pair.btn);
        if (!btn) return;
        const img = (btn && btn.tagName === 'IMG') ? btn : (btn.querySelector && btn.querySelector('img'));
        if (!img || !canvases.has(pair.btn)) return;
        const rect = img.getBoundingClientRect();
        const c = canvases.get(pair.btn);
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        const sizeKey = `${w}x${h}`;
        if (c.width !== w || c.height !== h) {
          c.width = w;
          c.height = h;
        }
        const ctx = c.getContext && c.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        // Evitar redibujar si ya se dibujó a este tamaño
        if (c._lastSize === sizeKey) return;
        try{
          ctx.clearRect(0,0,c.width,c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          c._lastSize = sizeKey;
        }catch(err){
          // ignorar errores de origen cruzado u otros errores de dibujo
        }
      });
    }

    // Posicionar los hotspots para que coincidan con los botones. El hotspot azul
    // se limitará al 30% superior de su imagen de botón.
    function positionHotspots(){
      const hotspotsParent = document.querySelector('.hotspots');
      if (!hotspotsParent) return;
      const parentRect = hotspotsParent.getBoundingClientRect();
      map.forEach(pair => {
        const hot = document.querySelector(pair.hot);
        const btn = document.querySelector(pair.btn);
        if (!hot || !btn) return;
        const img = (btn.tagName === 'IMG') ? btn : (btn.querySelector && btn.querySelector('img'));
        const btnRect = img ? img.getBoundingClientRect() : btn.getBoundingClientRect();
        const top = Math.round(btnRect.top - parentRect.top);
        const left = Math.round(btnRect.left - parentRect.left);
        const width = Math.round(btnRect.width);
        let height = Math.round(btnRect.height);
        // Posicionar hotspots relativos a su contenedor para que sigan los cambios de diseño
        hot.style.position = 'absolute';
        hot.style.top = `${top}px`;
        hot.style.left = `${left}px`;
        hot.style.width = `${width}px`;
        hot.style.height = `${height}px`;
        hot.style.transform = 'none';
        hot.style.marginLeft = '0';
      });
    }

    // dibujo inicial, posicionar hotspots y solo en resize (sin manejador de scroll)
    applyContentFitScale();
    redrawCanvases();
    positionHotspots();
    // Alinear la división del degradado con la posición del carro para que la línea quede debajo del carro
    function alignSplitToCar(){
      const car = document.querySelector('.car');
      if (!car) return;
      const rect = car.getBoundingClientRect();

      // colocar la división un poco debajo de la base del carro para mantener la línea entre carro y CTAs
      // usar una separación menor para que la línea quede más cerca del carro (elevada)
      const gap = Math.max(6, Math.round(rect.height * 0.02));
      const split = Math.round(rect.bottom + gap);
      document.documentElement.style.setProperty('--split', `${split}px`);
    }
    alignSplitToCar();
    
    let resizeTick = false;
    window.addEventListener('resize', () => {
      if (resizeTick) return;
      resizeTick = true;
      requestAnimationFrame(() => {
        applyContentFitScale();
        redrawCanvases();
        positionHotspots();
        alignSplitToCar();
        resizeTick = false;
      });
    }, {passive:true});

    // Mantener alineada la división cuando la página haga scroll o cambie la orientación del dispositivo.
    let scrollTick = false;
    window.addEventListener('scroll', () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => {
        positionHotspots();
        alignSplitToCar();
        scrollTick = false;
      });
    }, {passive:true});

    window.addEventListener('orientationchange', () => {
      requestAnimationFrame(() => {
        applyContentFitScale();
        redrawCanvases();
        positionHotspots();
        alignSplitToCar();
      });
    });

    // Mantener los hotspots sincronizados con los íconos animados a una tasa limitada
    (function startHotspotSync(){
      let last = 0;
      function loop(now){
        if (!last || (now - last) > 80) { // ~12 fps de actualizaciones
          try{ positionHotspots(); }catch(e){}
          last = now;
        }
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    }());

    // Asegurar la alineación después de que todas las imágenes carguen (la imagen del carro puede cambiar el diseño)
    window.addEventListener('load', () => {
      requestAnimationFrame(() => {
        applyContentFitScale();
        redrawCanvases();
        positionHotspots();
        alignSplitToCar();
        applyBgPhotoMode();
      });
    });

  // Reclamo eliminado — no hay imagen de reclamo que verificar

});
